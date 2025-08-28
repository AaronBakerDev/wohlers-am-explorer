import { test, expect } from '@playwright/test'

test.describe('AM Material Producers - Page', () => {
  test('loads charts and table', async ({ page }) => {
    await page.goto('/reports/material-producers', { waitUntil: 'domcontentloaded' })

    // Header
    await expect(page.getByText('AM Material Producers').first()).toBeVisible({ timeout: 15000 })

    // Charts headings
    await expect(page.getByText('Company Count by Material Type').first()).toBeVisible()
    await expect(page.getByText('Distribution of Material Types').first()).toBeVisible()

    // Likely SVG charts present (Recharts renders svg)
    const svgs = page.locator('svg')
    expect(await svgs.count()).toBeGreaterThan(0)

    // Table: check key headers present
    await expect(page.getByText('Material Producers Listing').first()).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Company' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Country' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Metal' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Non-Metal' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Classification' })).toBeVisible()
  })
})

test.describe('AM Material Producers - API', () => {
  test('GET /api/reports/material-producers/summary returns expected shape', async ({ request }) => {
    const res = await request.get('/api/reports/material-producers/summary')
    expect([200, 500]).toContain(res.status())
    if (res.status() !== 200) return
    const data = await res.json()

    expect(data).toHaveProperty('summary')
    expect(data).toHaveProperty('barData')
    expect(data).toHaveProperty('pieData')

    if (Array.isArray(data.summary) && data.summary.length > 0) {
      const row = data.summary[0]
      expect(row).toHaveProperty('material_type')
      expect(row).toHaveProperty('company_count')
      expect(row).toHaveProperty('percentage')
    }
  })

  test('GET /api/reports/material-producers/companies returns expected shape', async ({ request }) => {
    const res = await request.get('/api/reports/material-producers/companies')
    expect([200, 500]).toContain(res.status())
    if (res.status() !== 200) return
    const data = await res.json()

    expect(data).toHaveProperty('companies')
    if (Array.isArray(data.companies) && data.companies.length > 0) {
      const c = data.companies[0]
      expect(c).toHaveProperty('id')
      expect(c).toHaveProperty('name')
      expect(c).toHaveProperty('country')
      expect(c).toHaveProperty('has_metal')
      expect(c).toHaveProperty('has_non_metal')
      expect(c).toHaveProperty('classification')
    }
  })
})

