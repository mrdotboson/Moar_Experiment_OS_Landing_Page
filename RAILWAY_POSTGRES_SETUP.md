# Railway PostgreSQL Setup Guide

## Step 1: Add PostgreSQL Database to Railway

1. Go to your Railway project dashboard
2. Click **"New"** button
3. Select **"Database"** → **"Add PostgreSQL"**
4. Railway will automatically create the database
5. Wait for it to provision (takes ~30 seconds)

## Step 2: Get Connection String

1. Click on the PostgreSQL service you just created
2. Go to the **"Variables"** tab
3. Find **`DATABASE_URL`** - this is your connection string
4. Copy it (it looks like: `postgresql://user:password@host:port/database`)

## Step 3: Set Environment Variable

1. Go to your main app service in Railway
2. Click on the service → **"Variables"** tab
3. Click **"New Variable"**
4. Add:
   - **Name:** `DATABASE_URL`
   - **Value:** Paste the connection string from Step 2
5. Click **"Add"**

**For local development**, add to your `.env.local`:
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

## Step 4: Create Database Table

The table will be created automatically on first API call, but you can also create it manually:

1. In Railway, click on your PostgreSQL service
2. Click **"Query"** tab (or use Railway's built-in database viewer)
3. Run this SQL:

```sql
CREATE TABLE IF NOT EXISTS early_access_signups (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  telegram VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_email ON early_access_signups(email);

-- Create index for date queries
CREATE INDEX IF NOT EXISTS idx_created_at ON early_access_signups(created_at);
```

## Step 5: Test the Integration

1. Start your dev server: `npm run dev`
2. Open the Early Access modal
3. Submit an email
4. Check Railway PostgreSQL → Query tab to see the data

## Step 6: View Your Data

### Option 1: Railway's Built-in Viewer
1. Click on PostgreSQL service
2. Go to **"Data"** or **"Query"** tab
3. Run: `SELECT * FROM early_access_signups ORDER BY created_at DESC;`

### Option 2: Use a Database Client
- **TablePlus** (Mac/Windows) - Recommended
- **pgAdmin** (Free, cross-platform)
- **DBeaver** (Free, cross-platform)

Connection details are in your Railway PostgreSQL service → Variables tab.

## Security Best Practices

✅ **Already Implemented:**
- Input validation and sanitization
- Rate limiting (5 requests/minute per IP)
- Email format validation
- Secure error handling

✅ **Railway Security:**
- Database is private (not publicly accessible)
- Connection string is encrypted in Railway
- Automatic backups (Railway handles this)
- SSL connections by default

## Exporting Data

### Export to CSV:
```sql
-- In Railway Query tab or database client
COPY (
  SELECT email, telegram, created_at 
  FROM early_access_signups 
  ORDER BY created_at DESC
) TO STDOUT WITH CSV HEADER;
```

### Or use Railway CLI:
```bash
railway connect postgres
# Then run SQL queries
```

## Troubleshooting

**"Connection refused"**
- Check that DATABASE_URL is set correctly
- Verify PostgreSQL service is running in Railway

**"Table doesn't exist"**
- The table is created automatically on first API call
- Or run the CREATE TABLE SQL manually

**"Too many connections"**
- Railway PostgreSQL free tier has connection limits
- The code uses connection pooling to manage this

## Cost

Railway PostgreSQL pricing:
- **Hobby plan:** ~$5/month (512MB storage)
- **Pro plan:** ~$20/month (10GB storage)

For early access signups, Hobby plan is more than enough!

## Next Steps

1. ✅ Add PostgreSQL to Railway
2. ✅ Set DATABASE_URL environment variable
3. ✅ Test the form submission
4. ✅ Verify data in Railway dashboard

The API route is already updated to use PostgreSQL! 🚀



