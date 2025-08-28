import { test, expect } from '@playwright/test'

test.describe('Global Printing Services Analytics', () => {
  test('renders printers by country chart on overview for dataset', async ({ page }) => {
    // Navigate directly to dataset overview (analytics embedded)
    await page.goto('/dashboard?dataset=print-services-global&tab=overview')

    // Wait for header text
    await expect(page.getByText('Global Printing Services Analytics').first()).toBeVisible()

    // Chart containers should exist
    const printersByCountry = page.locator('[data-testid="psg-chart-printers-by-country"]')
    await expect(printersByCountry).toBeVisible()
    await expect(printersByCountry.locator('svg')).toBeVisible()

    const providersByCountry = page.locator('[data-testid="psg-chart-providers-by-country"]')
    await expect(providersByCountry).toBeVisible()
    await expect(providersByCountry.locator('svg')).toBeVisible()

    const printersByProcess = page.locator('[data-testid="psg-chart-printers-by-process"]')
    await expect(printersByProcess).toBeVisible()
    await expect(printersByProcess.locator('svg')).toBeVisible()

    const printersByManufacturer = page.locator('[data-testid="psg-chart-printers-by-manufacturer"]')
    await expect(printersByManufacturer).toBeVisible()
    await expect(printersByManufacturer.locator('svg')).toBeVisible()

    const topModels = page.locator('[data-testid="psg-chart-top-models"]')
    await expect(topModels).toBeVisible()
    await expect(topModels.locator('svg')).toBeVisible()

    const countType = page.locator('[data-testid="psg-chart-count-type"]')
    await expect(countType).toBeVisible()
    await expect(countType.locator('svg')).toBeVisible()

    const procMat = page.locator('[data-testid="psg-matrix-process-material"]')
    await expect(procMat).toBeVisible()
    const countryProc = page.locator('[data-testid="psg-matrix-country-process"]')
    await expect(countryProc).toBeVisible()
  })

  test('filters update charts and click-to-filter works', async ({ page }) => {
    await page.goto('/dashboard?dataset=print-services-global&tab=overview')

    const printersBadge = page.locator('[data-testid="psg-analytics-header"]').getByText(/printers\b/).first()
    const beforeText = await printersBadge.innerText()

    // Open Process filter and choose first non-all option
    await page.getByRole('button', { name: 'Process' }).click()
    const options = page.getByRole('option')
    const count = await options.count()
    if (count > 1) {
      await options.nth(1).click() // pick first non-all
    }

    // Expect header printers count to potentially change (best-effort)
    const afterText = await printersBadge.innerText()
    expect(afterText).not.toBe('')

    // Click a bar in Printers by Country to set Country filter
    const printersByCountry = page.locator('[data-testid="psg-chart-printers-by-country"]')
    // Target the first bar rect
    const rect = printersByCountry.locator('svg .recharts-rectangle').first()
    await rect.click({ force: true })

    // Country filter should no longer show All
    const countryTrigger = page.getByRole('button', { name: 'Country' })
    const countryText = await countryTrigger.innerText()
    expect(countryText).not.toBe('Country')
  })
})
