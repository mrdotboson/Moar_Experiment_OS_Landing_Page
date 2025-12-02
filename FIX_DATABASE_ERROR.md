# Fix Database Setup Error

## Quick Fix Steps

The error "Database setup error. Please try again later." means the `DATABASE_URL` environment variable is not set or the database connection is failing.

### Step 1: Check if PostgreSQL is Added to Railway

1. Go to your Railway project: https://railway.app
2. Check if you have a **PostgreSQL** service in your project
3. If not, click **"New"** → **"Database"** → **"Add PostgreSQL"**
4. Wait ~30 seconds for it to provision

### Step 2: Get the DATABASE_URL

1. Click on your **PostgreSQL** service in Railway
2. Go to the **"Variables"** tab
3. Find **`DATABASE_URL`** (it looks like: `postgresql://user:password@host:port/database`)
4. **Copy the entire connection string**

### Step 3: Set DATABASE_URL in Your App Service

1. In Railway, click on your **main app service** (not the PostgreSQL service)
2. Go to **"Variables"** tab
3. Click **"New Variable"**
4. Add:
   - **Name:** `DATABASE_URL`
   - **Value:** Paste the connection string from Step 2
5. Click **"Add"**

### Step 4: Redeploy

1. Railway will automatically redeploy when you add the variable
2. Or manually trigger a redeploy if needed
3. Wait for deployment to complete

### Step 5: Test

1. Open your app
2. Try submitting the Early Access form again
3. The error should be gone!

## Common Issues

**"Database connection error"**
- Check that `DATABASE_URL` is set correctly
- Verify PostgreSQL service is running (green status in Railway)
- Make sure you copied the entire connection string

**"Database not configured"**
- `DATABASE_URL` is missing from your app service variables
- Follow Step 3 above

**"Database authentication failed"**
- The connection string might be incorrect
- Get a fresh `DATABASE_URL` from PostgreSQL service → Variables tab

## For Local Development

Create a `.env.local` file in your project root:

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

**Never commit `.env.local` to git!** It's already in `.gitignore`.

## Still Having Issues?

1. Check Railway logs: App service → **"Deployments"** → Click latest deployment → **"View Logs"**
2. Look for database connection errors
3. Verify the PostgreSQL service is running (should show green/active status)



