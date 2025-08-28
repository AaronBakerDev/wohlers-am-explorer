import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { dataset: string } }
) {
  try {
    const { dataset } = params
    const vendorUrl = new URL(request.url)
    vendorUrl.pathname = `/api/vendor-data/${dataset}`

    // Directly proxy to vendor-data (Supabase-only)
    const vendorResponse = await fetch(vendorUrl.toString())

    // Pass through status codes and JSON body
    const body = await vendorResponse.json().catch(() => ({ error: 'Invalid response from vendor-data route' }))
    return NextResponse.json(body, { status: vendorResponse.status })
  } catch (error) {
    console.error('Error loading market data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
