/**
 * Client-safe feature flags used to gate optional UI.
 *
 * Saved Searches:
 * - Hidden by default per product guidance (Aug 2025).
 * - To enable, set `NEXT_PUBLIC_ENABLE_SAVED_SEARCHES` to `true` or `1`
 *   in `.env.local` and restart the dev server/build.
 */
export const ENABLE_SAVED_SEARCHES = (() => {
  const v = (process.env.NEXT_PUBLIC_ENABLE_SAVED_SEARCHES || '').toString().trim().toLowerCase()
  return v === '1' || v === 'true'
})()
