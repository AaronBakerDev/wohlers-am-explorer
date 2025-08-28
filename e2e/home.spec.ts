import { test, expect } from '@playwright/test';

test('home page loads and shows hero content', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'AM Market Explorer' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
});

