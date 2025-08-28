// Centralized Supabase env validation
// Ensures we fail fast with clear errors if misconfigured

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isPlaceholder = (v?: string | null) =>
    !v || v.trim() === '' || /your-(project-url|anon-key)-here/.test(v)

  if (isPlaceholder(url) || isPlaceholder(anonKey)) {
    throw new Error(
      'Supabase not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    )
  }

  // Validate URL format to avoid: Failed to construct 'URL': Invalid URL
  try {
    new URL(url as string)
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: ${url}. Expected full https URL from Supabase project settings.`
    )
  }

  return { url: url as string, anonKey: anonKey as string }
}
