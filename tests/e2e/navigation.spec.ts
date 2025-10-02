import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('can navigate between tabs', async ({ page }) => {
    await page.goto('/');
    
    const tabs = ['learn', 'lessons', 'modules', 'chat', 'profile'];
    
    for (const tab of tabs) {
      const tabLink = page.getByRole('link', { name: new RegExp(tab, 'i') });
      if (await tabLink.isVisible()) {
        await tabLink.click();
        await expect(page).toHaveURL(new RegExp(tab));
      }
    }
  });
});
