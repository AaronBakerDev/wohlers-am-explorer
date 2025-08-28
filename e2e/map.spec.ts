import { test, expect } from '@playwright/test'

// Smoke test: the Leaflet map should mount and handle simple interactions
// without throwing the classic _leaflet_pos / getPosition errors.

test('map page loads without Leaflet pane errors', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  await page.goto('/map')

  // Wait for Leaflet to initialize
  await page.waitForSelector('.leaflet-container', { timeout: 15000 })

  const map = page.locator('.leaflet-container')

  // Basic interactions that previously could trigger transition races
  await map.click({ position: { x: 200, y: 200 } })
  await map.dblclick({ position: { x: 220, y: 220 } })
  await page.waitForTimeout(500)

  // Assert we didn't emit the common transition error
  const paneErrors = consoleErrors.filter(
    (t) => t.includes('_leaflet_pos') || t.includes('getPosition') || t.includes('_getMapPanePos')
  )
  expect(paneErrors).toEqual([])
})
