import { test, expect } from '@playwright/test'

test.describe('Quotes Benchmark Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/quotes-benchmark')
  })

  test('page loads successfully', async ({ page }) => {
    // Check page title and header
    await expect(page.locator('h1')).toContainText('Quotes Benchmark')
    await expect(page.locator('text=Compare and analyze pricing')).toBeVisible()
  })

  test('displays statistics cards', async ({ page }) => {
    // Check for stats cards
    await expect(page.locator('text=Total Quotes')).toBeVisible()
    await expect(page.locator('text=Average Price')).toBeVisible()
    await expect(page.locator('text=Price Range')).toBeVisible()
    await expect(page.locator('text=Median Price')).toBeVisible()
    await expect(page.locator('text=Avg Lead Time')).toBeVisible()
  })

  test('process filter works', async ({ page }) => {
    // Find and click process filter
    const processFilter = page.locator('button').filter({ hasText: /All Processes|Select process/ }).first()
    if (await processFilter.isVisible()) {
      await processFilter.click()
      
      // Check that options appear
      const options = page.locator('[role="option"]')
      await expect(options.first()).toBeVisible()
    }
  })

  test('material filter works', async ({ page }) => {
    // Find and click material filter
    const materialFilter = page.locator('button').filter({ hasText: /All Materials|Select material/ }).first()
    if (await materialFilter.isVisible()) {
      await materialFilter.click()
      
      // Check that options appear
      const options = page.locator('[role="option"]')
      await expect(options.first()).toBeVisible()
    }
  })

  test('view mode tabs work', async ({ page }) => {
    // Check for view mode tabs
    const tableTab = page.locator('button:has-text("Table View")')
    const scatterTab = page.locator('button:has-text("Scatter Plot")')
    const comparisonTab = page.locator('button:has-text("Process Comparison")')
    
    // Test scatter plot view
    if (await scatterTab.isVisible()) {
      await scatterTab.click()
      await expect(scatterTab).toHaveAttribute('data-state', 'active')
      
      // Check for scatter chart or empty state
      const hasScatter = await page.locator('.recharts-scatter').count() > 0
      const hasEmpty = await page.locator('text=/No data/i').count() > 0
      expect(hasScatter || hasEmpty).toBeTruthy()
    }
    
    // Test comparison view
    if (await comparisonTab.isVisible()) {
      await comparisonTab.click()
      await expect(comparisonTab).toHaveAttribute('data-state', 'active')
      
      // Check for bar chart or empty state
      const hasBar = await page.locator('.recharts-bar').count() > 0
      const hasEmpty = await page.locator('text=/No.*data/i').count() > 0
      expect(hasBar || hasEmpty).toBeTruthy()
    }
    
    // Return to table view
    if (await tableTab.isVisible()) {
      await tableTab.click()
      await expect(tableTab).toHaveAttribute('data-state', 'active')
    }
  })

  test('table view displays data or empty state', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000)
    
    // Check for either table data or empty state
    const hasTable = await page.locator('table').count() > 0
    const hasEmptyState = await page.locator('text=/No pricing/i').count() > 0
    
    expect(hasTable || hasEmptyState).toBeTruthy()
    
    if (hasTable) {
      // Check table headers
      const headers = ['Company', 'Location', 'Process', 'Material', 'Quantity', 'Price', 'Lead Time']
      for (const header of headers) {
        const headerElement = page.locator(`th:has-text("${header}")`)
        if (await headerElement.count() > 0) {
          await expect(headerElement.first()).toBeVisible()
        }
      }
    }
  })

  test('export buttons are present', async ({ page }) => {
    // Check for CSV and JSON export buttons
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible()
    await expect(page.locator('button:has-text("Export JSON")')).toBeVisible()
    
    // Check for PNG export buttons when in chart views
    const scatterTab = page.locator('button:has-text("Scatter Plot")')
    if (await scatterTab.isVisible()) {
      await scatterTab.click()
      await page.waitForTimeout(500)
      
      const exportPngButton = page.locator('button:has-text("Export PNG")')
      if (await exportPngButton.count() > 0) {
        await expect(exportPngButton.first()).toBeVisible()
      }
    }
  })

  test('country filter works', async ({ page }) => {
    // Find and click country filter
    const countryFilter = page.locator('button').filter({ hasText: /All Countries|Select country/ }).first()
    if (await countryFilter.isVisible()) {
      await countryFilter.click()
      
      // Check that options appear
      const options = page.locator('[role="option"]')
      if (await options.count() > 0) {
        await expect(options.first()).toBeVisible()
      }
    }
  })

  test('responsive layout works', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)
    
    // Header should still be visible
    await expect(page.locator('h1:has-text("Quotes Benchmark")')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)
    
    // Check statistics cards are visible
    const statsCard = page.locator('text=Total Quotes').first()
    await expect(statsCard).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(500)
    
    // Verify full layout with filters
    await expect(page.locator('h1:has-text("Quotes Benchmark")')).toBeVisible()
  })
})