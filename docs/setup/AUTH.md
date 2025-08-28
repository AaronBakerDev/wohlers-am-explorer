Auth Implementation: Supabase + Next.js App Router

## ⚠️ AUTH TEMPORARILY DISABLED (TODO: Re-enable for production)
Authentication has been disabled for development purposes. To re-enable:
1. Restore original middleware.ts auth checks (currently commented out)
2. Remove auto-redirect from src/app/page.tsx to /dashboard
3. Remove "Bypass Auth (Dev Mode)" button from login page
4. Restore auth checks in src/lib/user/client.ts (currently returns mock data)

What's included
- Email/password auth with signup, login, password reset
- Social login (Google; GitHub planned)
- Protected routes via middleware with session refresh (@supabase/ssr)
- User profiles (name, avatar, role)
- User preferences (theme, default filters, export prefs)
- Saved searches (name + JSON query)
- RBAC gates: analytics requires premium/admin

Environment
- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
- Configure OAuth providers in Supabase Dashboard → Authentication → Providers.
  - Google and GitHub: set redirect URL to `https://<your-domain>/auth/callback`
  - For local dev: `http://localhost:3000/auth/callback`

Database & Policies
- Apply SQL from `sql-migrations/20250812_auth_profiles_preferences.sql` in Supabase SQL editor.
- Optionally create public storage bucket `avatars` (Dashboard → Storage) for avatar uploads.

Key routes
- `/login`, `/register`, `/forgot-password`, `/reset-password`
- `/auth/callback` (handles Supabase code exchange and profile bootstrap)
- Protected: `/dashboard`, `/map`, `/data-table`, `/analytics`
- Account/Profile: `/account/profile` (name, avatar upload, theme, logout)

Notes
- Password reset uses Supabase’s magic link flow: we send `redirectTo` to `/auth/callback?next=/reset-password`, then update password on that page.
- RBAC: user `role` is stored on `profiles.role` (`basic` default). Upgrade by updating the row.
- Theme preference is stored but not forcibly applied yet; wire it into a theme provider if desired.
