# 🚨 VERCEL DEPLOYMENT FIXES

## Issues Found:

1. **Wrong Supabase Key**: Your `.env.local` has `service_role` key, but Vercel needs `anon` key
2. **Mock Data Enabled**: `NEXT_PUBLIC_USE_MOCKS=true` is preventing real data access
3. **Missing Environment Variables**: Vercel environment not configured

## 🔧 IMMEDIATE FIXES:

### 1. Fix Vercel Environment Variables

Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

Add these **exact** variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://trxudkgkbhylmcnqaqmm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyeHVka2drYmh5bG1jbnFlhcW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjU3MTMsImV4cCI6MjA2NTY0MTcxM30.yHr0p6_O46NVZ6W5Be75JM5Xn4WKu8dBZIm8ocPbq-Q
NEXT_PUBLIC_USE_MOCKS=false
NEXT_PUBLIC_DATA_SOURCE=supabase
```

✅ **CORRECT ANON KEY**: The key above is the correct anon key for your project.
- Go to [Supabase Dashboard](https://app.supabase.com) 
- Select your project
- Settings → API → `anon public` key (NOT service_role)

### 2. Fix Local Environment

Update your `.env.local`:

```bash
# Replace the service_role key with anon key
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_ACTUAL_ANON_KEY>

# Disable mocks for production
NEXT_PUBLIC_USE_MOCKS=false
```

### 3. Get Correct Supabase Keys

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select project: `trxudkgkbhylmcnqaqmm`
3. Go to **Settings** → **API**
4. Copy the **`anon public`** key (NOT service_role)
5. Use that key in both local `.env.local` and Vercel environment

### 4. Redeploy

After setting Vercel environment variables:
```bash
# Trigger new deployment
git add .
git commit -m "fix: configure Supabase environment for production"
git push origin main
```

## 🔍 Verification Steps:

1. **Check Vercel Environment**: Project Settings → Environment Variables should show all 4 variables
2. **Check Build Logs**: Deployment should not show Supabase config errors
3. **Test API**: Visit `https://your-app.vercel.app/api/market-data/am-market-revenue-2024` should return data, not 401

## 🚨 Security Note:

- The `anon` key is safe to expose in frontend (public)
- The `service_role` key should NEVER be in frontend environment variables
- Your current service_role key in `.env.local` should be removed or renamed to avoid confusion

## Quick Fix Commands:

```bash
# 1. Update local env
echo "NEXT_PUBLIC_USE_MOCKS=false" >> .env.local

# 2. Test locally
npm run dev
# Visit http://localhost:3000/market-data/am-market-revenue-2024

# 3. If local works, the issue is just Vercel env variables
```