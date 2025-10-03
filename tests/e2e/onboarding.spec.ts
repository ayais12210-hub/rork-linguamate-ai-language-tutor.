import { test, expect } from '@playwright/test';

test.describe('Onboarding E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
  });

  test('should complete onboarding flow', async ({ page }) => {
    const languageSelector = page.getByRole('button', { name: /select language/i });
    await languageSelector.click();

    const punjabi = page.getByText(/punjabi/i).first();
    await punjabi.click();

    const difficultyBeginner = page.getByRole('button', { name: /beginner/i });
    await difficultyBeginner.click();

    const nextButton = page.getByRole('button', { name: /next|continue/i });
    await nextButton.click();

    await expect(page).toHaveURL(/learn|home|dashboard/);
  });

  test('should save preferences', async ({ page }) => {
    const languageSelector = page.getByRole('button', { name: /select language/i });
    await languageSelector.click();

    const punjabi = page.getByText(/punjabi/i).first();
    await punjabi.click();

    const saveButton = page.getByRole('button', { name: /save|continue/i });
    await saveButton.click();

    await page.reload();

    await expect(page.getByText(/punjabi/i)).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    const nextButton = page.getByRole('button', { name: /next|continue/i });
    await nextButton.click();

    await expect(page.getByText(/required|select/i)).toBeVisible();
  });

  test('should allow skipping optional steps', async ({ page }) => {
    const skipButton = page.getByRole('button', { name: /skip/i });
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await expect(page).toHaveURL(/learn|home|dashboard/);
    }
  });
});
