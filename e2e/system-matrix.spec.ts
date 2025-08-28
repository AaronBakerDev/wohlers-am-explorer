import { test, expect } from '@playwright/test'

test.describe('System Matrix report', () => {
  test('loads, filters, and exports CSV', async ({ page, context }) => {
    // Navigate directly to the matrix tab
    await page.goto('/dashboard?tab=matrix')

    // Wait for matrix to load
    await expect(page.getByText('Loading system manufacturers…')).toHaveCount(0, { timeout: 15000 })

    // Verify core columns render
    await expect(page.getByText('Types of AM Processes')).toBeVisible()
    await expect(page.getByText('Material')).toBeVisible()

    // Capture initial company count badge if present
    const countBadge = page.getByText(/companies$/)
    const initialCountText = (await countBadge.first().isVisible()) ? await countBadge.first().innerText() : ''

    // Apply Country filter: choose United States if available, otherwise first option
    await page.getByRole('button', { name: /^Country/ }).click()
    const usOption = page.getByRole('menuitemcheckbox', { name: 'United States' })
    let chosenCountry = 'United States'
    if (await usOption.count()) {
      await usOption.first().click()
    } else {
      const firstCountry = page.getByRole('menuitemcheckbox').first()
      chosenCountry = await firstCountry.innerText()
      await firstCountry.click()
    }

    // First row should match chosen country (if there is at least one row)
    const firstCountryCell = page.locator('table tbody tr').first().locator('td').first()
    if (await page.locator('table tbody tr').count() > 0) {
      await expect(firstCountryCell).toContainText(chosenCountry)
    }

    // Apply a Process filter: select the first available process
    await page.getByRole('button', { name: /^Process/ }).click()
    const firstProcess = page.getByRole('menuitemcheckbox').first()
    const chosenProcess = await firstProcess.innerText()
    await firstProcess.click()

    // Apply a Material filter: select the first available material
    await page.getByRole('button', { name: /^Material/ }).click()
    const firstMaterial = page.getByRole('menuitemcheckbox').first()
    const chosenMaterial = await firstMaterial.innerText()
    await firstMaterial.click()

    // After filters, ensure table shows either rows or empty state
    const rowsCount = await page.locator('table tbody tr').count()
    if (rowsCount === 0) {
      await expect(page.getByText('No results. Adjust filters or search query.')).toBeVisible()
    } else {
      await expect(page.locator('table tbody tr').first()).toBeVisible()
    }

    // Trigger CSV export and verify a download occurs
    const [ download ] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /^Export/ }).click().then(() =>
        page.getByRole('button', { name: /CSV \(\.csv\)/ }).click()
      ),
    ])
    const suggested = download.suggestedFilename()
    expect(suggested).toMatch(/system-manufacturers-matrix_.*\.csv$/)

    // Basic sanity on count badge change (optional, non-fatal if badge missing)
    if (initialCountText) {
      const afterText = await countBadge.first().innerText()
      expect(afterText).not.toEqual(initialCountText)
    }
  })
})
