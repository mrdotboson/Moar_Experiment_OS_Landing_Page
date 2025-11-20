# Google Sheets Integration Setup (Alternative Method)

Since service account key creation is disabled, we'll use **Google Apps Script** instead. This is actually simpler and doesn't require service account keys!

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it something like "Sentient Early Access Signups"
4. Add headers in row 1: `Timestamp`, `Email`, `Telegram`

## Step 2: Create Google Apps Script

1. In your Google Sheet, click **Extensions** > **Apps Script**
2. Delete any default code
3. Paste this code:

```javascript
function doPost(e) {
  try {
    // Security: Verify secret token
    const SECRET_TOKEN = 'YOUR_SECRET_TOKEN_HERE'; // Change this to a random string
    const data = JSON.parse(e.postData.contents);
    
    // Verify token
    if (data.token !== SECRET_TOKEN) {
      return ContentService.createTextOutput(JSON.stringify({error: 'Unauthorized'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Validate email format
    const email = (data.email || '').trim();
    if (!email || !email.includes('@')) {
      return ContentService.createTextOutput(JSON.stringify({error: 'Invalid email'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Sanitize inputs
    const telegram = (data.telegram || '').trim().slice(0, 100);
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const timestamp = new Date();
    
    // Append the new row
    sheet.appendRow([timestamp, email, telegram]);
    
    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: 'Server error'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Click **Save** (floppy disk icon) or press `Cmd+S` / `Ctrl+S`
5. Give your project a name (e.g., "Early Access Handler")

## Step 3: Deploy as Web App

1. Click **Deploy** > **New deployment**
2. Click the gear icon (⚙️) next to "Select type" and choose **Web app**
3. Fill in the details:
   - **Description**: "Early Access Form Handler" (optional)
   - **Execute as**: "Me" (your account)
   - **Who has access**: "Anyone" (this allows your Next.js app to call it)
4. Click **Deploy**
5. **IMPORTANT**: Copy the **Web App URL** - it will look like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```
6. Click **Authorize access** if prompted and allow permissions

## Step 4: Set Environment Variables

Add these to your `.env.local` file:

```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR-SCRIPT-ID/exec
GOOGLE_APPS_SCRIPT_SECRET=your-random-secret-token-here
```

**Important:**
- Replace `YOUR-SCRIPT-ID` with the actual URL from Step 3
- Replace `your-random-secret-token-here` with a strong random string (e.g., use a password generator)
- **Use the same secret token** in both the Apps Script code (Step 2) and this environment variable
- Keep this secret secure - never commit it to git

## Step 5: Update Your API Route

The API route has been updated to use Google Apps Script instead of service account keys. No changes needed if you're using the latest version!

## Testing

1. Start your dev server: `npm run dev`
2. Open the Early Access modal
3. Submit an email
4. Check your Google Sheet - you should see the new row!

## Security Note

The web app URL is public, but it only accepts POST requests with the correct format. For additional security, you can:
- Add a simple token check in the Apps Script
- Use Google Apps Script's built-in authentication

## Troubleshooting

- **"Script function not found"**: Make sure the function is named `doPost` exactly
- **"Permission denied"**: Make sure "Who has access" is set to "Anyone"
- **"Failed to submit"**: Check the Apps Script execution logs (View > Executions)

