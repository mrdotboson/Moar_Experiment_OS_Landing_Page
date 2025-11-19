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
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : undefined,
})

// Initialize database table on first use
async function ensureTableExists() {
  const client = await pool.connect()
  try {
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
  } finally {
    client.release()
  }
}

// Initialize table on module load (only runs once)
let tableInitialized = false
if (!tableInitialized) {
  ensureTableExists().catch(console.error)
  tableInitialized = true
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

    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not set')
      return NextResponse.json(
        { error: 'Database not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // Ensure table exists (in case it wasn't created yet)
    try {
      await ensureTableExists()
    } catch (tableError: any) {
      console.error('Table creation error:', tableError)
      return NextResponse.json(
        { error: 'Database setup error. Please try again later.' },
        { status: 500 }
      )
    }

    // Insert into database using parameterized query (prevents SQL injection)
    const client = await pool.connect()
    try {
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
      client.release()
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
