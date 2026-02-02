# Clerk-Convex Webhook Setup Guide

## What You've Built

Your webhook integration allows Clerk to automatically notify Convex when a user purchases or cancels a Pro plan subscription.

## Setup Checklist

### ✅ Files Created
- [x] `app/api/clerk/webhook/route.ts` - Next.js webhook endpoint
- [x] `convex/http.ts` - Convex HTTP router
- [x] `convex/users.ts` - Added `updateUserPlan` mutation
- [x] `convex/schema.ts` - Added `clerkId` field and index

### 📋 Required Next Steps

#### 1. Set Environment Variables

Add these to your `.env.local` file:

```bash
# Generate a random secret for webhook security
CONVEX_WEBHOOK_SECRET=<generate-random-string>

# Get this from Clerk Dashboard after creating webhook
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**To generate CONVEX_WEBHOOK_SECRET:**
```bash
# On macOS/Linux:
openssl rand -hex 32

# On Windows (PowerShell):
-join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
```

#### 2. Deploy to Convex

Run this to deploy your Convex functions:
```bash
npx convex dev
```

Then set the CONVEX_WEBHOOK_SECRET in Convex Dashboard:
1. Go to Convex Dashboard → Settings → Environment Variables
2. Add: `CONVEX_WEBHOOK_SECRET` = `<your-generated-secret>`

#### 3. Configure Clerk Webhook

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Navigate to **Webhooks** in the sidebar
4. Click **Add Endpoint**
5. Enter your webhook URL:
   ```
   https://your-app.vercel.app/api/clerk/webhook
   ```
   Or for local testing:
   ```
   https://<your-ngrok-url>/api/clerk/webhook
   ```

6. Subscribe to these events:
   - [x] `subscription.created`
   - [x] `subscription.updated`
   - [x] `subscription.deleted`
   - [x] `user.updated` (optional, for manual plan changes)

7. Copy the **Signing Secret** and add it to your `.env.local`:
   ```
   CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

#### 4. Test the Integration

**Option A: Local Testing with ngrok**

1. Install ngrok: `npm install -g ngrok`
2. Run your Next.js app: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Use the ngrok URL in Clerk webhook settings
5. Test by creating a subscription in your app

**Option B: Production Testing**

1. Deploy to Vercel/your hosting platform
2. Use your production URL in Clerk webhook settings
3. Test with a real subscription purchase

#### 5. Verify Webhook is Working

Check these places for confirmation:

1. **Clerk Dashboard** → Webhooks → Click your endpoint → View "Recent Events"
   - Should show successful 200 responses

2. **Your App Logs** (Vercel/local terminal)
   ```
   [Webhook] Received event: subscription.created
   [Webhook] Subscription subscription.created: status=active, plan=pro
   [Webhook] Convex update result: { success: true }
   ```

3. **Convex Dashboard** → Logs
   ```
   Updated user user@example.com to pro plan
   ```

4. **Convex Dashboard** → Data → users table
   - User's `plan` field should change from "free" to "pro"

## How It Works

1. **User clicks "Upgrade to Pro"** → Clerk PricingTable opens
2. **User completes payment** → Clerk processes subscription
3. **Clerk fires webhook** → Calls your `/api/clerk/webhook` endpoint
4. **Your webhook verifies** → Confirms it's really from Clerk
5. **Webhook calls Convex** → HTTP endpoint at `/clerk-webhook`
6. **Convex updates database** → User's plan changes to "pro"
7. **User sees Pro features** → Changes reflect immediately

## Troubleshooting

### Webhook returns 401 Unauthorized
- Check `CLERK_WEBHOOK_SECRET` matches Clerk Dashboard
- Verify environment variables are loaded

### Webhook returns 500 from Convex
- Check `CONVEX_WEBHOOK_SECRET` is set in both places
- Verify Convex deployment is live: `npx convex dev`
- Check Convex logs for errors

### Plan not updating in Convex
- Verify user has `clerkId` field populated (new users will have it automatically)
- For existing users, they need to log out and back in to get `clerkId` saved
- Check Clerk webhook is sending correct event types
- View webhook payload in Clerk Dashboard → Webhooks → Recent Events

### Testing Locally
Use ngrok to expose your localhost and point Clerk webhook to it:
```bash
ngrok http 3000
# Use the https URL in Clerk webhook settings
```

## Security Notes

✅ Webhook signature verification prevents unauthorized requests
✅ Convex HTTP endpoint requires webhook secret header
✅ Internal mutations can't be called from client
✅ All changes are server-side only

## Next Enhancement (Optional)

Consider adding these for better user experience:

1. **Email notifications** when plan changes
2. **Admin dashboard** to manually adjust user plans
3. **Usage tracking** for Pro features
4. **Grace period** before downgrading canceled subscriptions
