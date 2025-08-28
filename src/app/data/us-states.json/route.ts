import { NextResponse } from 'next/server'

// Serve US states GeoJSON at a stable local path to avoid 404s in dev.
// Proxies a well-known public dataset and sets cache headers.

export const dynamic = 'force-dynamic'

const REMOTE = 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'

export async function GET() {
  try {
    const res = await fetch(REMOTE, { cache: 'force-cache' })
    if (!res.ok) {
      throw new Error(`Upstream fetch failed (${res.status})`)
    }
    const data = await res.json()
    return NextResponse.json(data, {
      headers: {
        'cache-control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400',
      },
    })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to load us-states GeoJSON' },
      { status: 502 },
    )
  }
}

