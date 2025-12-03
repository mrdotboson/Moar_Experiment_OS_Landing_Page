import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

// Email validation - RFC 5322 compliant
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email) && email.length <= 254
}

// Sanitize input to prevent injection
function sanitizeInput(input: string, maxLength: number): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
}

// Simple rate limiting check (in-memory, for production use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5 // Max 5 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  record.count++
  return true
}

// Initialize PostgreSQL connection pool
// Connection pooling helps manage database connections efficiently
// Note: Pool is created even if DATABASE_URL is not set yet (will fail on first connection attempt)
// Use DATABASE_PUBLIC_URL if available (for Railway), otherwise fall back to DATABASE_URL
const getConnectionString = () => {
  // Railway provides both DATABASE_URL (internal) and DATABASE_PUBLIC_URL (public)
  // Use public URL if internal fails, or if public is explicitly provided
  return process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL || ''
}

const pool = new Pool({
  connectionString: getConnectionString(),
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Connection timeout
  // Railway public connections need SSL with rejectUnauthorized: false
  // Internal connections (railway.internal) typically don't need SSL, but if DNS fails, use public URL
  ssl: (process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL)?.includes('railway') && 
       !(process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL)?.includes('railway.internal')
    ? { rejectUnauthorized: false }
    : (process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL)?.includes('railway')
    ? { rejectUnauthorized: false } // Use SSL for Railway public URLs
    : undefined,
})

// Initialize database table on first use
async function ensureTableExists() {
  // Check if DATABASE_URL or DATABASE_PUBLIC_URL is set
  const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL or DATABASE_PUBLIC_URL environment variable is not set')
  }

  let client
  try {
    client = await pool.connect()
    await client.query(`
      CREATE TABLE IF NOT EXISTS early_access_signups (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        telegram VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_email ON early_access_signups(email);
      CREATE INDEX IF NOT EXISTS idx_created_at ON early_access_signups(created_at);
    `)
  } catch (error: any) {
    // Re-throw with more context
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(`Database connection failed: ${error.message}. Please check your DATABASE_URL.`)
    }
    if (error.code === '28P01') {
      throw new Error('Database authentication failed. Please check your DATABASE_URL credentials.')
    }
    throw error
  } finally {
    if (client) {
      client.release()
    }
  }
}

// Initialize table lazily (only when needed, not at module load)
let tableInitialized = false
let tableInitializationPromise: Promise<void> | null = null

async function initializeTableIfNeeded() {
  if (tableInitialized) {
    return
  }
  if (tableInitializationPromise) {
    return tableInitializationPromise
  }
  tableInitializationPromise = ensureTableExists()
    .then(() => {
      tableInitialized = true
    })
    .catch((error) => {
      // Only log if we're not in build mode
      if (process.env.NODE_ENV !== 'production' || process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL) {
        console.error('Table initialization error:', error.message)
      }
      tableInitializationPromise = null
      throw error
    })
  return tableInitializationPromise
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { email, telegram } = await request.json()

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const trimmedEmail = sanitizeInput(email, 254)
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate and sanitize telegram (optional field)
    const trimmedTelegram = telegram && typeof telegram === 'string' 
      ? sanitizeInput(telegram, 100) 
      : null

    // Check if DATABASE_URL or DATABASE_PUBLIC_URL is configured
    // Log all DATABASE-related env vars for debugging (without values)
    const dbEnvVars = Object.keys(process.env).filter(k => k.includes('DATABASE'))
    const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL
    console.log('DATABASE-related env vars found:', dbEnvVars)
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('DATABASE_PUBLIC_URL exists:', !!process.env.DATABASE_PUBLIC_URL)
    console.log('Using connection string:', connectionString ? 'Yes' : 'No')
    
    if (!connectionString) {
      console.error('Neither DATABASE_URL nor DATABASE_PUBLIC_URL is set in environment variables')
      console.error('All env vars with DATABASE:', dbEnvVars)
      return NextResponse.json(
        { error: 'Database not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // Ensure table exists (in case it wasn't created yet)
    try {
      await initializeTableIfNeeded()
    } catch (tableError: any) {
      console.error('Table creation error:', {
        message: tableError.message,
        code: tableError.code,
        name: tableError.name,
      })
      
      // Provide more specific error messages
      if (tableError.message.includes('DATABASE_URL') || tableError.message.includes('not set')) {
        return NextResponse.json(
          { error: 'Database not configured. Please contact support.' },
          { status: 500 }
        )
      }
      if (tableError.message.includes('connection failed') || tableError.message.includes('authentication failed') || tableError.code === 'ECONNREFUSED' || tableError.code === 'ENOTFOUND') {
        return NextResponse.json(
          { error: 'Database connection error. Please check your configuration.' },
          { status: 503 }
        )
      }
      
      return NextResponse.json(
        { error: `Database setup error: ${tableError.message}. Please try again later.` },
        { status: 500 }
      )
    }

    // Insert into database using parameterized query (prevents SQL injection)
    let client
    try {
      client = await pool.connect()
      const result = await client.query(
        `INSERT INTO early_access_signups (email, telegram) 
         VALUES ($1, $2) 
         ON CONFLICT (email) DO NOTHING
         RETURNING id, email, telegram, created_at`,
        [trimmedEmail, trimmedTelegram]
      )

      // If no row was inserted, email already exists
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'This email is already registered' },
          { status: 409 } // Conflict status code
        )
      }

      return NextResponse.json({ 
        success: true,
        id: result.rows[0].id 
      })
    } catch (error: any) {
      // Handle database errors
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'This email is already registered' },
          { status: 409 }
        )
      }
      
      // Connection errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.error('Database connection error:', error.message)
        return NextResponse.json(
          { error: 'Database connection failed. Please try again later.' },
          { status: 503 }
        )
      }
      
      console.error('Database error:', {
        message: error.message,
        code: error.code,
      })
      
      return NextResponse.json(
        { error: 'Failed to submit. Please try again.' },
        { status: 500 }
      )
    } finally {
      if (client) {
        client.release()
      }
    }
  } catch (error: any) {
    // Log error without exposing sensitive details
    console.error('Error processing request:', {
      message: error.message,
      // Don't log full error object to prevent credential leakage
    })
    
    // Return generic error message to client
    return NextResponse.json(
      { error: 'Failed to submit. Please try again.' },
      { status: 500 }
    )
  }
}
