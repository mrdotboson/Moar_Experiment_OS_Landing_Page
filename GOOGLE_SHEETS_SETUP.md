# Google Sheets Integration Setup

This guide will help you set up the Google Sheets integration to collect Early Access signups.

**Important:** You do NOT need to deploy an application. You're just setting up API access credentials.

**Note:** If you see an error about "Service account key creation is disabled", see `ENABLE_SERVICE_ACCOUNT_KEYS.md` for instructions on how to enable it, or use the alternative Google Apps Script method in `GOOGLE_APPS_SCRIPT_SETUP.md`.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click "New Project"
4. Give it a name (e.g., "Sentient Early Access")
5. Click "Create"
6. Wait for it to be created, then select it from the dropdown

## Step 2: Enable Google Sheets API

1. In your project, go to "APIs & Services" > "Library" (in the left sidebar)
2. Search for "Google Sheets API"
3. Click on "Google Sheets API"
4. Click the "Enable" button
5. Wait for it to enable (takes a few seconds)

## Step 3: Create a Service Account

1. Go to "APIs & Services" > "Credentials" (in the left sidebar)
2. Click the "+ CREATE CREDENTIALS" button at the top
3. Select "Service account" from the dropdown
4. Give it a name (e.g., "sentient-early-access")
5. Click "Create and Continue"
6. Skip the optional steps (role, grant access) - just click "Done"

## Step 4: Create and Download Service Account Key

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the JSON file

## Step 5: Get Your Credentials

Open the downloaded JSON file. You'll need:
- `client_email` - This is your service account email
- `private_key` - This is the private key (keep it secure!)

## Step 6: Create a Google Sheet

1. Create a new Google Sheet
2. Add headers in row 1: `Timestamp`, `Email`, `Telegram`
3. Share the sheet with the service account email (from Step 4)
   - Click "Share" button
   - Paste the service account email
   - Give it "Editor" access
   - Click "Send"

## Step 7: Get Your Spreadsheet ID

From your Google Sheet URL:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```
Copy the `SPREADSHEET_ID` part.

## Step 8: Set Environment Variables

Create a `.env.local` file in your project root:

```env
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account-email@project-id.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id-here
```

**Security Best Practices for Confidential Data:**

✅ **Credential Storage:**
- The `PRIVATE_KEY` should include the `\n` characters (newlines) - they will be automatically handled
- **NEVER commit `.env.local` to git** - it's already in `.gitignore`
- For production (e.g., Railway, Vercel), use **secret environment variables** (not plain env vars)
- Use your platform's secret management system (Railway Secrets, Vercel Environment Variables with "Encrypted" toggle)

✅ **Service Account Security:**
- Limit service account permissions to **only the specific sheet** it needs access to
- Don't grant the service account access to your entire Google Drive
- Rotate keys periodically (every 90 days recommended)
- Monitor access logs in Google Cloud Console > IAM & Admin > Audit Logs

✅ **Security Features Implemented:**
- ✅ Input validation and sanitization (prevents injection attacks)
- ✅ Email format validation (RFC 5322 compliant)
- ✅ Rate limiting (5 requests per minute per IP - prevents abuse)
- ✅ Length limits (prevents DoS attacks)
- ✅ Control character removal (prevents malicious input)
- ✅ Secure error handling (no credential leakage in logs)
- ✅ Server-side only execution (keys never exposed to client)
- ✅ HTTPS only (enforced by Next.js in production)

✅ **Additional Recommendations:**
- Enable Google Cloud audit logging to track all access
- Set up alerts for unusual activity
- Consider adding IP whitelisting if you have a known set of sources
- Regularly review who has access to the Google Sheet

## Step 9: Test the Integration

1. Start your dev server: `npm run dev`
2. Open the Early Access modal
3. Submit an email
4. Check your Google Sheet - you should see the new row!

## Troubleshooting

- **"Server configuration error"**: Check that all environment variables are set
- **"Failed to submit"**: 
  - Verify the service account email has access to the sheet
  - Check that the Google Sheets API is enabled
  - Verify the spreadsheet ID is correct
- **Permission errors**: Make sure the service account email has "Editor" access to the sheet

