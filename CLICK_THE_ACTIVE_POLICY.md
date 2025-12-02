# Click the Active Policy (Green Checkmark) ✅

Perfect! You found the policies. Here's what to do:

## What You're Seeing

There are **TWO** policies with similar names:

1. **Row 1 (Inactive - Gray):**
   - ID: `iam.managed.disableServiceAccountKeyCreation`
   - Status: **Inactive** (gray circle)
   - ❌ Ignore this one - it's not blocking anything

2. **Row 2 (Active - Green):**
   - ID: `iam.disableServiceAccountKeyCreation`
   - Status: **Active** (green checkmark) 
   - ✅ **This is the one you need to edit!**

## What to Do

1. **Click on Row 2** - the one with the **green checkmark** and ID `iam.disableServiceAccountKeyCreation`
2. Click the **purple/blue link** that says "Disable service account key creation"
3. This will open the policy details page
4. Click **"Manage policy"** or **"Edit"** button
5. Change it to **"Not enforced"**
6. Click **Save**

## After You Save

1. Go back to your service account
2. Go to the **Keys** tab
3. Click **"Add Key"** → **"Create new key"** → **"JSON"**
4. You should now be able to download the key file!

The active policy (green checkmark) is the one blocking you - that's the one to change! 🎯



