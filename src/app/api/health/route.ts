import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'cache-control': 'no-store',
    },
  })
}

export async function GET() {
  try {
    const payload = {
      status: 'ok',
      timestamp: Date.now(),
    }
    return NextResponse.json(payload, {
      headers: { 'cache-control': 'no-store' },
    })
  } catch (e: unknown) {
    return NextResponse.json(
      { status: 'error', error: e instanceof Error ? e.message : 'Unexpected error' },
      { status: 500 },
    )
  }
}

