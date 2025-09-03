import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Route cleanups / redirects
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/admin/print-services') || pathname.startsWith('/admin/am-systems')) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/company-data'
    return NextResponse.redirect(url)
  }

  // AUTH DISABLED - Simply pass through all other requests
  return NextResponse.next({ request })
  
  /* ORIGINAL AUTH CODE - COMMENTED OUT
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Check if user is authenticated
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/map', '/data-table', '/analytics', '/companies']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // If user is not signed in and trying to access protected routes, redirect to login
  if (!user && isProtectedRoute) {
    console.log('No user found, redirecting to login. User error:', userError)
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is signed in and trying to access auth pages, redirect to dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // Optional RBAC: restrict analytics to premium/admin (best-effort in middleware)
  if (user && request.nextUrl.pathname.startsWith('/analytics')) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()
      const role = (profile as any)?.role as string | undefined
      if (!role || (role !== 'premium' && role !== 'admin')) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/dashboard'
        redirectUrl.searchParams.set('notice', 'upgrade_required')
        return NextResponse.redirect(redirectUrl)
      }
    } catch {}
  }

  return supabaseResponse
  */
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
