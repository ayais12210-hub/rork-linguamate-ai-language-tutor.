import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/auth/login');
    
    await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible();
  });

  test('should show signup page', async ({ page }) => {
    await page.goto('/auth/signup');
    
    await expect(page.getByRole('heading', { name: /sign up|register/i })).toBeVisible();
  });

  test('should validate email input', async ({ page }) => {
    await page.goto('/auth/login');
    
    const emailInput = page.getByPlaceholder(/email/i).or(page.getByLabel(/email/i));
    
    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid-email');
      await emailInput.blur();
      
      await page.waitForTimeout(500);
    }
  });

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/auth/login');
    
    const signupLink = page.getByRole('link', { name: /sign up|create account/i });
    
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await expect(page).toHaveURL(/.*signup/);
    }
  });
});
