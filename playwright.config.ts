import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  reporter: [['html', { open: 'never' }]],
  webServer: {
    command: 'npm run start-web',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
