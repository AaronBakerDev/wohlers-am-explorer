import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Gather very lightweight runtime info (Node runtime)
    const now = Date.now()
    const uptimeSec = typeof process !== 'undefined' && typeof process.uptime === 'function'
      ? Math.round(process.uptime())
      : null
    const mem = typeof process !== 'undefined' && typeof (process as any).memoryUsage === 'function'
      ? (process as any).memoryUsage()
      : null

    const payload: Record<string, unknown> = {
      timestamp: now,
      uptimeSec,
    }
    if (mem) {
      payload.memory = {
        rss: (mem.rss ?? 0) as number,
        heapTotal: (mem.heapTotal ?? 0) as number,
        heapUsed: (mem.heapUsed ?? 0) as number,
        external: (mem.external ?? 0) as number,
      }
    }

    return NextResponse.json(payload, {
      headers: {
        'cache-control': 'no-store',
      },
    })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unexpected error' },
      { status: 500 },
    )
  }
}

