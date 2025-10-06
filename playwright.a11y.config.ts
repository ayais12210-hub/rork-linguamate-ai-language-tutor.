import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/a11y',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-a11y',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  reporter: [
    ['html', { outputFolder: 'reports/a11y', open: 'never' }],
    ['json', { outputFile: 'reports/a11y/results.json' }],
  ],
  webServer: {
    command: 'npm run start-web',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
