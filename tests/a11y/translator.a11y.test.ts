import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Translator Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/translator');
    await page.waitForLoadState('networkidle');
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper focus management', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should have accessible form labels', async ({ page }) => {
    const textInput = page.getByRole('textbox', { name: /enter text/i });
    await expect(textInput).toBeVisible();
  });

  test('should have accessible buttons with proper ARIA labels', async ({ page }) => {
    const translateButton = page.getByRole('button', { name: /translate/i });
    await expect(translateButton).toBeVisible();
    
    const copyButton = page.getByRole('button', { name: /copy/i });
    await expect(copyButton).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    const activeElement = await page.evaluate(() => document.activeElement?.getAttribute('role'));
    expect(activeElement).toBeTruthy();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('[data-testid="translator-container"]')
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );
    expect(contrastViolations).toHaveLength(0);
  });

  test('should announce dynamic content changes', async ({ page }) => {
    const liveRegion = page.locator('[aria-live]');
    await expect(liveRegion).toBeAttached();
  });
});
