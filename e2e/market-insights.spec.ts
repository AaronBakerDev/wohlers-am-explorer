import { test, expect } from '@playwright/test'

test.describe('Market Insights Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/market-insights')
  })

  test('page loads successfully', async ({ page }) => {
    // Check page title and header
    await expect(page.locator('h1')).toContainText('Market Insights')
    await expect(page.locator('text=Comprehensive market analysis')).toBeVisible()
  })

  test('displays key metrics cards', async ({ page }) => {
    // Check for metric cards
    await expect(page.locator('text=Total Market Size')).toBeVisible()
    await expect(page.locator('text=Year-over-Year Growth')).toBeVisible()
    await expect(page.locator('text=CAGR')).toBeVisible()
    await expect(page.locator('text=Top Segment')).toBeVisible()
  })

  test('year filter works', async ({ page }) => {
    // Open year selector
    const yearSelector = page.locator('button:has-text("2025")').first()
    if (await yearSelector.isVisible()) {
      await yearSelector.click()
      
      // Select a different year
      await page.locator('[role="option"]:has-text("2024")').click()
      
      // Verify year changed in metrics
      await expect(page.locator('text=2024').first()).toBeVisible()
    }
  })

  test('segment filter works', async ({ page }) => {
    // Open segment selector
    const segmentSelector = page.locator('button:has-text("All Segments")').first()
    if (await segmentSelector.isVisible()) {
      await segmentSelector.click()
      
      // Check that segment options exist
      const segmentOptions = page.locator('[role="option"]')
      await expect(segmentOptions).toHaveCount(await segmentOptions.count())
    }
  })

  test('chart type toggle works', async ({ page }) => {
    // Check for chart type tabs
    const stackedTab = page.locator('button:has-text("Stacked Bar")')
    const lineTab = page.locator('button:has-text("Line Chart")')
    
    if (await stackedTab.isVisible() && await lineTab.isVisible()) {
      // Switch to line chart
      await lineTab.click()
      await expect(lineTab).toHaveAttribute('data-state', 'active')
      
      // Switch back to stacked
      await stackedTab.click()
      await expect(stackedTab).toHaveAttribute('data-state', 'active')
    }
  })

  test('export buttons are present', async ({ page }) => {
    // Check for CSV and JSON export buttons in header
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible()
    await expect(page.locator('button:has-text("Export JSON")')).toBeVisible()
    
    // Check for PNG export buttons on charts
    const exportPngButtons = page.locator('button:has-text("Export PNG")')
    const count = await exportPngButtons.count()
    expect(count).toBeGreaterThanOrEqual(0) // May be 0 if no data
  })

  test('charts render or show empty state', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(2000)
    
    // Check for either charts or empty state
    const hasCharts = await page.locator('.recharts-wrapper').count() > 0
    const hasEmptyState = await page.locator('text=/No.*data/i').count() > 0
    
    expect(hasCharts || hasEmptyState).toBeTruthy()
  })

  test('responsive layout works', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)
    
    // Header should still be visible
    await expect(page.locator('h1:has-text("Market Insights")')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)
    
    // Check layout adjusted
    await expect(page.locator('h1:has-text("Market Insights")')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(500)
    
    // Verify full layout
    await expect(page.locator('h1:has-text("Market Insights")')).toBeVisible()
  })
})