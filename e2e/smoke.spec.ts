import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

const ARTIFACTS_DIR = path.resolve(process.cwd(), 'e2e-artifacts');

async function ensureArtifactsDir() {
  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
}

test.describe('Smoke - Directory, Profile, Map', () => {
  test.beforeAll(async () => {
    await ensureArtifactsDir();
  });

  test('Directory: loads, filters, and captures screenshot', async ({ page }) => {
    await page.goto('/companies', { waitUntil: 'domcontentloaded' });

    // Wait for table to render or the Results header to appear
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });

    // Search by name
    const search = page.locator('input#search');
    if (await search.isVisible()) {
      await search.fill('Form');
    }

    // Toggle "Has funding" if checkbox exists
    const hasFunding = page.locator('#hasFunding');
    if (await hasFunding.count()) {
      await hasFunding.check().catch(() => {});
    }

    // Give it a moment to refresh data
    await page.waitForTimeout(800);

    // Take screenshot
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'directory.png'), fullPage: true });
  });

  test('Profile: renders company profile or not found and captures screenshot', async ({ page }) => {
    // We don't know a specific company id is guaranteed, but the profile page handles "Company not found".
    await page.goto('/companies/1', { waitUntil: 'domcontentloaded' });

    // Wait for either content or the not found message
    const profileHeader = page.getByRole('heading', { level: 1 });
    await expect(profileHeader).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'profile.png'), fullPage: true });
  });

  test('Map: loads Leaflet, toggles clustering, and captures screenshots', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'domcontentloaded' });

    // Wait for Leaflet container to be present
    const leafletContainer = page.locator('.leaflet-container');
    await expect(leafletContainer).toBeVisible({ timeout: 15000 });

    // Initial screenshot
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'map_default.png'), fullPage: true });

    // Try toggling clusters (button switches text between "Disable Clusters" and "Enable Clusters")
    const clustersDisable = page.getByRole('button', { name: /Disable Clusters/i });
    const clustersEnable = page.getByRole('button', { name: /Enable Clusters/i });

    if (await clustersDisable.isVisible().catch(() => false)) {
      await clustersDisable.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'map_no_clusters.png'), fullPage: true });
      // Re-enable
      if (await clustersEnable.isVisible().catch(() => false)) {
        await clustersEnable.click();
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'map_clusters.png'), fullPage: true });
      }
    } else if (await clustersEnable.isVisible().catch(() => false)) {
      await clustersEnable.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'map_clusters.png'), fullPage: true });
    }

    // Apply a basic search to demonstrate filter screenshot
    const searchBox = page.getByPlaceholder('Search companies or locations...');
    if (await searchBox.isVisible().catch(() => false)) {
      await searchBox.fill('Boston');
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'map_filtered.png'), fullPage: true });
    }
  });
});
