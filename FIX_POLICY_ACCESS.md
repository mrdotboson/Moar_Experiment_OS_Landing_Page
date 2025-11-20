# Fix: Can't Modify Policy Even With Organization Administrator

## The Problem

You have **Organization Administrator** role, but you need the specific **Organization Policy Administrator** role to edit organization policies. These are different roles!

## Solution: Add the Missing Role

### Step 1: Add Organization Policy Administrator Role

1. On the IAM page where you see your roles
2. Click the **pencil/edit icon** next to your email (`mrboson@moar.market`)
3. Click **"Add Another Role"** button
4. In the search box, type: `Organization Policy Administrator`
5. Select: **Organization Policy Administrator** (`roles/orgpolicy.policyAdmin`)
6. Click **Save**

### Step 2: Find the Correct Policy

The policy you're looking at is for **API key bindings**, but you need the policy for **service account keys**. They're different!

1. Go to **IAM & Admin** > **Organization Policies**
2. Search for: `iam.disableServiceAccountKeyCreation` (NOT the API key one)
3. This is the policy that blocks creating service account keys

### Step 3: Edit the Policy

1. Click on the `iam.disableServiceAccountKeyCreation` policy
2. Click **"Manage policy"** or **"Edit"**
3. Change it to **"Not enforced"**
4. Click **Save**

## Why This Happens

- **Organization Administrator** = Can manage organization resources, users, projects
- **Organization Policy Administrator** = Can edit organization policies (different permission!)

You need BOTH roles, or just the Policy Administrator role to edit policies.

## Alternative: If You Can't Add the Role

If you can't add the role yourself (maybe you need someone else with Owner role), ask them to:
1. Grant you the `Organization Policy Administrator` role, OR
2. Edit the policy for you

## Quick Check

After adding the role, refresh the page and try editing the policy again. You should now see the "Manage policy" button working!


