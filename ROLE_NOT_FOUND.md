# Role "Organization Policy Administrator" Not Found - Solutions

If the role doesn't appear when searching, try these solutions:

## Solution 1: Search by Role ID

Instead of searching for the name, try searching for the role ID:

1. In the role search box, type: `orgpolicy.policyAdmin`
2. Or try: `roles/orgpolicy.policyAdmin`
3. The role should appear

## Solution 2: Check if Role is Available

The role might not be available in your organization. Try:

1. Click "View all roles" or "Show all" if there's a button
2. Look in the "Organization" category
3. Scroll through the list manually

## Solution 3: Use Owner Role (If You Have It)

Since you have the **Owner** role, you might be able to:
1. Edit the policy directly without needing the Policy Admin role
2. Try going to **IAM & Admin** > **Organization Policies**
3. Search for: `iam.disableServiceAccountKeyCreation`
4. See if you can click "Manage policy" - Owner role sometimes has these permissions

## Solution 4: Grant Role via gcloud CLI

If you have Owner role and CLI access:

```bash
gcloud organizations add-iam-policy-binding ORGANIZATION_ID \
  --member="user:YOUR_EMAIL@moar.market" \
  --role="roles/orgpolicy.policyAdmin"
```

Replace:
- `ORGANIZATION_ID` with your organization ID
- `YOUR_EMAIL` with your email

## Solution 5: Alternative - Use Google Apps Script

If you can't get the role, use the Google Apps Script method instead:
- See `GOOGLE_APPS_SCRIPT_SETUP.md`
- No service account keys needed
- Works immediately

## Solution 6: Check Organization Settings

The role might be restricted. Check:
1. Go to **IAM & Admin** > **Organization Policies**
2. Look for policies that restrict role assignments
3. You might need an admin to grant it via CLI or another method

## Quick Test

Try this first:
1. Go directly to **IAM & Admin** > **Organization Policies**
2. Search for: `iam.disableServiceAccountKeyCreation`
3. Click on it
4. See if "Manage policy" button is clickable (Owner role might work)

If that doesn't work, the Google Apps Script method is your fastest path forward!


