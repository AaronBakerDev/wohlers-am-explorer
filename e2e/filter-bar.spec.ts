import { test, expect } from '@playwright/test'

test.describe('FilterBar integration', () => {
  test('Map Explorer shows FilterBar', async ({ page }) => {
    await page.goto('/map')
    await expect(page.getByTestId('filter-bar')).toBeVisible()
  })

  test('Data Table shows FilterBar', async ({ page }) => {
    await page.goto('/data-table')
    await expect(page.getByTestId('filter-bar')).toBeVisible()
  })

  test('Analytics shows FilterBar', async ({ page }) => {
    await page.goto('/analytics')
    await expect(page.getByTestId('filter-bar')).toBeVisible()
  })
})

