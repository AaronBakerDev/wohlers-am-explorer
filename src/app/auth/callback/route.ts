import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Ensure profile row exists for the authenticated user
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: existing } = await supabase.from('profiles').select('user_id').eq('user_id', user.id).maybeSingle()
          if (!existing) {
            await supabase.from('profiles').insert({ user_id: user.id, full_name: user.user_metadata?.full_name ?? null, role: 'basic' })
          }
        }
      } catch {}
      // Force refresh the session and redirect
      const redirectResponse = NextResponse.redirect(`${origin}${next}`)
      return redirectResponse
    }
  }

  // Return to login if there was an error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
