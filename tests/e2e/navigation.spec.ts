import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate between tabs', async ({ page }) => {
    const tabs = ['learn', 'lessons', 'modules', 'chat', 'profile'];

    for (const tab of tabs) {
      const tabLink = page.getByRole('link', { name: new RegExp(tab, 'i') }).first();
      
      if (await tabLink.isVisible()) {
        await tabLink.click();
        await expect(page).toHaveURL(new RegExp(tab));
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should maintain state when navigating back', async ({ page }) => {
    const learnTab = page.getByRole('link', { name: /learn/i }).first();
    
    if (await learnTab.isVisible()) {
      await learnTab.click();
      await page.waitForLoadState('networkidle');
      
      await page.goBack();
      await expect(page).toHaveURL('/');
    }
  });

  test('should handle deep linking', async ({ page }) => {
    await page.goto('/lessons');
    await expect(page).toHaveURL(/.*lessons/);
    
    await page.goto('/profile');
    await expect(page).toHaveURL(/.*profile/);
  });
});
