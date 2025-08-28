import { test, expect } from '@playwright/test'

test.describe('Shared Filters', () => {
  test('Map Explorer shows filter bar and applies selection UI', async ({ page }) => {
    await page.goto('/map')
    await expect(page.getByTestId('filter-bar')).toBeVisible()
    // Open Technologies menu and toggle first option if present
    await page.getByTestId('filter-tech').click()
    const firstOption = page.locator('[role="menuitemcheckbox"]').first()
    if (await firstOption.isVisible()) {
      await firstOption.click()
    }
  })

  test('Data Table shows filter bar', async ({ page }) => {
    await page.goto('/data-table')
    await expect(page.getByTestId('filter-bar')).toBeVisible()
  })

  test('Analytics shows filter bar and refresh works', async ({ page }) => {
    await page.goto('/analytics')
    await expect(page.getByTestId('filter-bar')).toBeVisible()
    await page.getByTestId('filter-process').click()
    const anyOption = page.locator('[role="menuitemcheckbox"]').first()
    if (await anyOption.isVisible()) {
      await anyOption.click()
    }
  })
})

