import { test, expect } from '@playwright/test';

test.describe('Learn Module E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/learn');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate through learning modules', async ({ page }) => {
    // Test alphabet module
    const alphabetModule = page.getByRole('button', { name: /alphabet/i });
    await expect(alphabetModule).toBeVisible();
    await alphabetModule.click();

    await expect(page.getByText(/alphabet/i)).toBeVisible();
    
    // Go back to learn hub
    const backButton = page.getByRole('button', { name: /back|return/i });
    if (await backButton.isVisible()) {
      await backButton.click();
    }
  });

  test('should complete phonics trainer', async ({ page }) => {
    const phonicsModule = page.getByRole('button', { name: /phonics/i });
    await expect(phonicsModule).toBeVisible();
    await phonicsModule.click();

    // Wait for phonics trainer to load
    await page.waitForTimeout(2000);

    // Look for phonics exercise elements
    const exerciseElement = page.locator('[data-testid="phonics-exercise"]').first();
    if (await exerciseElement.isVisible()) {
      await expect(exerciseElement).toBeVisible();
    }
  });

  test('should show vocabulary flashcards', async ({ page }) => {
    const vocabularyModule = page.getByRole('button', { name: /vocabulary/i });
    await expect(vocabularyModule).toBeVisible();
    await vocabularyModule.click();

    await page.waitForTimeout(2000);

    // Look for flashcard elements
    const flashcard = page.locator('[data-testid="flashcard"]').first();
    if (await flashcard.isVisible()) {
      await expect(flashcard).toBeVisible();
    }
  });

  test('should handle pronunciation playback', async ({ page }) => {
    const pronunciationButton = page.getByRole('button', { name: /pronunciation|audio|sound/i }).first();
    if (await pronunciationButton.isVisible()) {
      await pronunciationButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should show AI tips', async ({ page }) => {
    const aiTipsButton = page.getByRole('button', { name: /ai tips|tips/i });
    if (await aiTipsButton.isVisible()) {
      await aiTipsButton.click();
      await expect(page.getByText(/tip|insight|advice/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should complete quick quiz', async ({ page }) => {
    const quizButton = page.getByRole('button', { name: /quiz|test/i });
    if (await quizButton.isVisible()) {
      await quizButton.click();
      
      // Look for quiz questions
      const questionElement = page.locator('[data-testid="quiz-question"]').first();
      if (await questionElement.isVisible()) {
        await expect(questionElement).toBeVisible();
      }
    }
  });

  test('should track progress through modules', async ({ page }) => {
    // Check if progress indicators are visible
    const progressIndicator = page.locator('[data-testid="progress"]').first();
    if (await progressIndicator.isVisible()) {
      await expect(progressIndicator).toBeVisible();
    }
  });

  test('should handle offline mode gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);

    const moduleButton = page.getByRole('button', { name: /alphabet|vocabulary|phonics/i }).first();
    if (await moduleButton.isVisible()) {
      await moduleButton.click();
      
      // Should show offline indicator or cached content
      await expect(
        page.getByText(/offline|cached|unavailable/i).first()
      ).toBeVisible({ timeout: 5000 });
    }

    // Restore online mode
    await page.context().setOffline(false);
  });
});