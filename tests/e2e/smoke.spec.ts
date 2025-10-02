import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/Linguamate|expo-app/i);
    
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to Learn tab', async ({ page }) => {
    await page.goto('/');
    
    const learnTab = page.getByRole('link', { name: /learn/i }).first();
    if (await learnTab.isVisible()) {
      await learnTab.click();
      await expect(page).toHaveURL(/.*learn/);
    }
  });

  test('should navigate to Lessons tab', async ({ page }) => {
    await page.goto('/');
    
    const lessonsTab = page.getByRole('link', { name: /lessons/i }).first();
    if (await lessonsTab.isVisible()) {
      await lessonsTab.click();
      await expect(page).toHaveURL(/.*lessons/);
    }
  });

  test('should navigate to Profile tab', async ({ page }) => {
    await page.goto('/');
    
    const profileTab = page.getByRole('link', { name: /profile/i }).first();
    if (await profileTab.isVisible()) {
      await profileTab.click();
      await expect(page).toHaveURL(/.*profile/);
    }
  });

  test('should have no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors.filter(e => !e.includes('Warning'))).toHaveLength(0);
  });
});
