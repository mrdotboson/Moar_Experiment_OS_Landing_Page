# How to Enable Service Account Key Creation

If you're seeing the error "Service account key creation is disabled", you need to modify the organization policy. Here's how:

## Option 1: Add Organization Policy Administrator Role

**Important:** Having "Organization Administrator" is NOT the same as "Organization Policy Administrator"! You need the specific policy admin role.

**Steps to add the role:**
1. Go to **IAM & Admin** > **IAM** (where you see your current roles)
2. Click the **pencil/edit icon** next to your email
3. Click **"Add Another Role"**
4. Search for: `Organization Policy Administrator`
5. Select: **Organization Policy Administrator** (`roles/orgpolicy.policyAdmin`)
6. Click **Save**
7. Refresh the page

**Then edit the policy:**
1. Make sure you're in the correct organization (check the organization dropdown at the top)
2. Navigate to **IAM & Admin** > **Organization Policies** (in the left sidebar)
3. **Important:** Search for: `iam.disableServiceAccountKeyCreation` 
   - (NOT `iam.managed.disableServiceAccountApiKeyCreation` - that's a different policy!)
4. Click on the policy
5. Click **Edit** (or **Manage Policy**)
6. Change the policy to:
   - **Not enforced** (to allow key creation)
   - OR **Custom** with rules that allow your specific use case
7. Click **Save**

**If you still can't add the role:**
- You may need someone with "Owner" role to grant it to you
- Or see Option 2 below

## Option 2: Request the Role or Policy Change (Most Common)

Since you're seeing the modal about needing permissions, you need to:

### Step 1: Find Who Has Admin Access

1. Go to **IAM & Admin** > **IAM**
2. Look for users with these roles:
   - `Organization Administrator` (`roles/resourcemanager.organizationAdmin`)
   - `Organization Policy Administrator` (`roles/orgpolicy.policyAdmin`)
   - `Owner` or `Organization Admin` on the organization

### Step 2: Contact Them

Send them this message:

```
Hi [Admin Name],

I need to create service account keys for a secure API integration (Google Sheets) 
for my project. However, the organization policy `iam.disableServiceAccountKeyCreation` 
is blocking this.

Could you either:
1. Grant me the "Organization Policy Administrator" role temporarily, OR
2. Disable/modify the `iam.disableServiceAccountKeyCreation` policy for my project

The project is: [Your Project Name]
Project ID: [Your Project ID]

This is for a production application handling user data, and service account keys 
are the recommended secure method according to Google's authentication guidelines.

Thanks!
```

### Step 3: Alternative - Request Project Exception

If they can't grant you the role, ask them to:
1. Create a policy exception for your specific project
2. Or add your project to an allowlist for service account key creation

## Option 3: Use a Different Google Account

If you're using a personal Google account (not an organization account), you might be able to:
1. Create a new Google Cloud project with your personal account
2. This project won't have the organization policy restrictions

## Option 4: Request Exception for Your Project

Some organizations allow exceptions. Ask your admin to:
1. Create a policy exception for your specific project
2. Or add your project to an allowlist

## Alternative: Use Google Apps Script (No Policy Issues)

If you can't change the policy, you can use the **Google Apps Script method** instead, which doesn't require service account keys. See `GOOGLE_APPS_SCRIPT_SETUP.md` for instructions.

## Checking Your Role

To check if you have the right permissions:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin** > **IAM**
3. Look for your email address
4. Check if you have the role: `Organization Policy Administrator` or `roles/orgpolicy.policyAdmin`

## Why This Policy Exists

This policy is often enabled for security reasons:
- Service account keys can be a security risk if leaked
- Organizations want to enforce key rotation
- It's part of Google's "Secure by Default" recommendations

However, when properly managed (stored securely, rotated regularly), service account keys are safe for server-to-server authentication.

