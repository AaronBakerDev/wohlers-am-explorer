import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dataset: string }> }
) {
  try {
    const { dataset } = await params
    
    // Import the vendor-data handler directly instead of making an HTTP call
    const { GET: vendorDataHandler } = await import('../vendor-data/[dataset]/route')
    
    // Call the vendor-data handler directly with the same request and params
    return await vendorDataHandler(request, { params })
  } catch (error) {
    console.error('Error loading market data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
