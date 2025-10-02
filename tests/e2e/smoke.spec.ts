import { test, expect } from '@playwright/test';

test('loads web app and shows landing UI', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});

test('navigates to lessons tab', async ({ page }) => {
  await page.goto('/');
  const lessonsTab = page.getByRole('link', { name: /lessons/i });
  if (await lessonsTab.isVisible()) {
    await lessonsTab.click();
    await expect(page).toHaveURL(/.*lessons/);
  }
});
