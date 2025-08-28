import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
    headless: true,
  },
  webServer: {
    command: process.env.CI ? 'npm run start' : 'PORT=3100 npm run dev',
    port: 3100,
    reuseExistingServer: false,
    timeout: 240_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
