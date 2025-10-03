import { test, expect } from '@playwright/test';

test.describe('Translator E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/translator');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full translation workflow', async ({ page }) => {
    const inputField = page.getByPlaceholder(/enter text/i);
    await inputField.fill('Hello');

    const translateButton = page.getByRole('button', { name: /translate/i });
    await translateButton.click();

    await expect(page.locator('[data-testid="translation-result"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should copy translated text to clipboard', async ({ page }) => {
    await page.evaluate(() => navigator.clipboard.writeText(''));

    const inputField = page.getByPlaceholder(/enter text/i);
    await inputField.fill('Hello');

    const translateButton = page.getByRole('button', { name: /translate/i });
    await translateButton.click();

    await page.waitForTimeout(2000);

    const copyButton = page.getByRole('button', { name: /copy/i }).first();
    await copyButton.click();

    await expect(page.getByText(/copied/i)).toBeVisible({ timeout: 3000 });
  });

  test('should paste text from clipboard', async ({ page }) => {
    await page.evaluate(() => navigator.clipboard.writeText('Test text'));

    const pasteButton = page.getByRole('button', { name: /paste/i });
    await pasteButton.click();

    const inputField = page.getByPlaceholder(/enter text/i);
    await expect(inputField).toHaveValue('Test text');
  });

  test('should clear input text', async ({ page }) => {
    const inputField = page.getByPlaceholder(/enter text/i);
    await inputField.fill('Test text to clear');

    const clearButton = page.getByRole('button', { name: /clear/i });
    await clearButton.click();

    await expect(inputField).toHaveValue('');
  });

  test('should play audio pronunciation', async ({ page }) => {
    const inputField = page.getByPlaceholder(/enter text/i);
    await inputField.fill('Hello');

    const translateButton = page.getByRole('button', { name: /translate/i });
    await translateButton.click();

    await page.waitForTimeout(2000);

    const audioButton = page.getByRole('button', { name: /play audio|sound/i }).first();
    await audioButton.click();

    await page.waitForTimeout(1000);
  });

  test('should show AI coach insights', async ({ page }) => {
    const inputField = page.getByPlaceholder(/enter text/i);
    await inputField.fill('Hello');

    const translateButton = page.getByRole('button', { name: /translate/i });
    await translateButton.click();

    await page.waitForTimeout(2000);

    await expect(
      page.getByText(/pronunciation|meaning|structure|usage/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should handle speech-to-text input', async ({ page }) => {
    await page.context().grantPermissions(['microphone']);

    const sttButton = page.getByRole('button', { name: /speech to text|microphone/i });
    await sttButton.click();

    await page.waitForTimeout(1000);

    await sttButton.click();

    await expect(page.getByPlaceholder(/enter text/i)).not.toHaveValue('');
  });

  test('should switch between languages', async ({ page }) => {
    const languageSelector = page.locator('[data-testid="language-selector"]').first();
    await languageSelector.click();

    const punjabi = page.getByText(/punjabi/i);
    await punjabi.click();

    await expect(languageSelector).toContainText(/punjabi/i);
  });

  test('should show suggestions below input', async ({ page }) => {
    const inputField = page.getByPlaceholder(/enter text/i);
    await inputField.fill('H');

    await expect(page.locator('[data-testid="suggestions"]')).toBeVisible({ timeout: 3000 });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.route('**/api/**', (route) => route.abort());

    const inputField = page.getByPlaceholder(/enter text/i);
    await inputField.fill('Hello');

    const translateButton = page.getByRole('button', { name: /translate/i });
    await translateButton.click();

    await expect(page.getByText(/error|offline|failed/i)).toBeVisible({ timeout: 5000 });
  });
});
