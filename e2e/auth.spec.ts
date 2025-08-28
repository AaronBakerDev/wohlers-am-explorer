import { test, expect } from '@playwright/test';

test('login page renders and allows mock sign-in', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await page.getByLabel('Email address').fill('test@example.com');
  await page.getByLabel('Password').fill('Password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});

test('register page renders and validates password rules', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Full name').fill('Test User');
  await page.getByLabel('Email address').fill('test@example.com');
  await page.getByLabel('Password').fill('Password123');
  await page.getByLabel('Confirm password').fill('Password123');
  await page.getByRole('checkbox', { name: /I agree to the/i }).check();
  await expect(page.getByRole('button', { name: 'Create account' })).toBeEnabled();
});

