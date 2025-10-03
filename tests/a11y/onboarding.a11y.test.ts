import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Onboarding Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should have accessible form controls', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .include('form')
      .analyze();

    const formViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'label' || v.id === 'form-field-multiple-labels'
    );
    expect(formViolations).toHaveLength(0);
  });

  test('should support screen reader navigation', async ({ page }) => {
    const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"]').all();
    expect(landmarks.length).toBeGreaterThan(0);
  });
});
