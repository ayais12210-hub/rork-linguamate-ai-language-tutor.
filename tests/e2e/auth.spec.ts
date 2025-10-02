import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('shows login page', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('body')).toBeVisible();
  });

  test('shows signup page', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page.locator('body')).toBeVisible();
  });
});
