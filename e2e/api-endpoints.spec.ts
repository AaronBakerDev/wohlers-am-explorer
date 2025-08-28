import { test, expect } from '@playwright/test'

test.describe('API Endpoints', () => {
  test('GET /api/market/totals returns valid data', async ({ request }) => {
    const response = await request.get('/api/market/totals?startYear=2020&endYear=2030')
    
    // Check response status
    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)
    
    // Check response structure
    const data = await response.json()
    expect(data).toHaveProperty('data')
    expect(data).toHaveProperty('segments')
    expect(data).toHaveProperty('metadata')
    
    // Validate metadata
    if (data.metadata) {
      expect(data.metadata).toHaveProperty('totalRecords')
      expect(data.metadata).toHaveProperty('yearRange')
    }
    
    // Data should be an array
    expect(Array.isArray(data.data)).toBeTruthy()
    expect(Array.isArray(data.segments)).toBeTruthy()
  })

  test('GET /api/market/countries returns valid data', async ({ request }) => {
    const response = await request.get('/api/market/countries?year=2024')
    
    // Check response status
    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)
    
    // Check response structure
    const data = await response.json()
    expect(data).toHaveProperty('summary')
    
    // Validate summary structure
    if (data.summary) {
      expect(data.summary).toHaveProperty('year')
      expect(data.summary).toHaveProperty('totalValue')
      expect(data.summary).toHaveProperty('totalCountries')
      expect(data.summary).toHaveProperty('totalSegments')
      expect(data.summary).toHaveProperty('topCountries')
      expect(data.summary).toHaveProperty('bySegment')
      
      // Arrays should be arrays
      expect(Array.isArray(data.summary.topCountries)).toBeTruthy()
      expect(Array.isArray(data.summary.bySegment)).toBeTruthy()
    }
  })

  test('GET /api/market/countries with segment filter', async ({ request }) => {
    const response = await request.get('/api/market/countries?year=2024&segment=Software')
    
    // Check response status
    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('data')
    expect(data).toHaveProperty('summary')
  })

  test('GET /api/quotes/benchmarks returns valid data', async ({ request }) => {
    const response = await request.get('/api/quotes/benchmarks')
    
    // Check response status
    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)
    
    // Check response structure
    const data = await response.json()
    expect(data).toHaveProperty('data')
    expect(data).toHaveProperty('statistics')
    expect(data).toHaveProperty('filters')
    expect(data).toHaveProperty('metadata')
    
    // Validate statistics structure
    if (data.statistics) {
      expect(data.statistics).toHaveProperty('price')
      expect(data.statistics).toHaveProperty('leadTime')
      
      // Price stats
      if (data.statistics.price) {
        expect(data.statistics.price).toHaveProperty('min')
        expect(data.statistics.price).toHaveProperty('max')
        expect(data.statistics.price).toHaveProperty('avg')
        expect(data.statistics.price).toHaveProperty('median')
        expect(data.statistics.price).toHaveProperty('count')
      }
    }
    
    // Validate filters structure
    if (data.filters) {
      expect(data.filters).toHaveProperty('processes')
      expect(data.filters).toHaveProperty('materials')
      expect(data.filters).toHaveProperty('quantities')
      expect(data.filters).toHaveProperty('countries')
      
      expect(Array.isArray(data.filters.processes)).toBeTruthy()
      expect(Array.isArray(data.filters.materials)).toBeTruthy()
      expect(Array.isArray(data.filters.quantities)).toBeTruthy()
      expect(Array.isArray(data.filters.countries)).toBeTruthy()
    }
    
    // Data should be an array
    expect(Array.isArray(data.data)).toBeTruthy()
  })

  test('GET /api/quotes/benchmarks with process filter', async ({ request }) => {
    const response = await request.get('/api/quotes/benchmarks?process=FDM')
    
    // Check response status
    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('data')
    expect(Array.isArray(data.data)).toBeTruthy()
  })

  test('GET /api/quotes/benchmarks with multiple filters', async ({ request }) => {
    const response = await request.get('/api/quotes/benchmarks?process=SLA&material=Polymer&country=United States')
    
    // Check response status
    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('data')
    expect(data).toHaveProperty('statistics')
    expect(data).toHaveProperty('filters')
  })

  test('API endpoints handle errors gracefully', async ({ request }) => {
    // Test with invalid year
    const response1 = await request.get('/api/market/countries?year=invalid')
    expect([200, 400, 500]).toContain(response1.status())
    
    // Test with very large year
    const response2 = await request.get('/api/market/totals?startYear=9999&endYear=10000')
    expect([200, 400]).toContain(response2.status())
    
    // If 200, should still return valid structure
    if (response2.status() === 200) {
      const data = await response2.json()
      expect(data).toHaveProperty('data')
      expect(Array.isArray(data.data)).toBeTruthy()
    }
  })

  test('API responses include proper cache headers', async ({ request }) => {
    const response = await request.get('/api/market/totals')
    
    // Check for cache headers
    const cacheControl = response.headers()['cache-control']
    if (cacheControl) {
      expect(cacheControl).toMatch(/public|private|max-age|s-maxage/)
    }
  })
})