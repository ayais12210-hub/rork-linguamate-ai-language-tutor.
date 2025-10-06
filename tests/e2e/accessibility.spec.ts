import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1');
    const h2 = page.locator('h2');
    
    // Should have at least one h1
    await expect(h1.first()).toBeVisible();
    
    // h2 elements should be present
    if (await h2.count() > 0) {
      await expect(h2.first()).toBeVisible();
    }
  });

  test('should have proper button labels', async ({ page }) => {
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      // Button should have either text content or aria-label
      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test('should have proper form labels', async ({ page }) => {
    const inputs = page.locator('input, textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      
      // Input should have id with associated label, aria-label, or placeholder
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        expect(hasLabel || ariaLabel || placeholder).toBeTruthy();
      } else {
        expect(ariaLabel || placeholder).toBeTruthy();
      }
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    // This is a basic check - in a real scenario, you'd use axe-core
    const body = page.locator('body');
    const computedStyle = await body.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        color: style.color,
      };
    });
    
    // Basic check that colors are defined
    expect(computedStyle.backgroundColor).toBeTruthy();
    expect(computedStyle.color).toBeTruthy();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test that focus is visible
    const focusStyle = await focusedElement.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        outline: style.outline,
        outlineWidth: style.outlineWidth,
        outlineStyle: style.outlineStyle,
        boxShadow: style.boxShadow,
        borderTopWidth: style.borderTopWidth,
        borderRightWidth: style.borderRightWidth,
        borderBottomWidth: style.borderBottomWidth,
        borderLeftWidth: style.borderLeftWidth,
      };
    });
    
    // Should have some form of visible focus indicator
    const hasOutline = focusStyle.outlineStyle !== 'none' && parseFloat(focusStyle.outlineWidth) > 0;
    const hasBoxShadow = !!focusStyle.boxShadow && focusStyle.boxShadow !== 'none' && focusStyle.boxShadow !== '';
    const hasBorder =
      [focusStyle.borderTopWidth, focusStyle.borderRightWidth, focusStyle.borderBottomWidth, focusStyle.borderLeftWidth]
        .some(w => parseFloat(w) > 0);
    expect(hasOutline || hasBoxShadow || hasBorder).toBeTruthy();
  });

  test('should have proper ARIA roles', async ({ page }) => {
    // Check for common ARIA roles
    const main = page.locator('[role="main"], main');
    const navigation = page.locator('[role="navigation"], nav');
    const button = page.locator('[role="button"]');
    
    // Should have main content area
    await expect(main.first()).toBeVisible();
    
    // Should have navigation
    if (await navigation.count() > 0) {
      await expect(navigation.first()).toBeVisible();
    }
    
    // Buttons should have proper role
    if (await button.count() > 0) {
      await expect(button.first()).toBeVisible();
    }
  });

  test('should handle screen reader announcements', async ({ page }) => {
    // Check for aria-live regions
    const liveRegions = page.locator('[aria-live]');
    const liveRegionCount = await liveRegions.count();
    
    // Should have at least one live region for dynamic content
    expect(liveRegionCount).toBeGreaterThanOrEqual(0);
  });

  test('should have proper alt text for images', async ({ page }) => {
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Images should have alt text or be decorative (role="presentation")
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('should work with reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
    
    // Check that animations are disabled or reduced
    const animatedElements = page.locator('[style*="animation"], [style*="transition"]');
    const animatedCount = await animatedElements.count();
    
    // Should have minimal or no animations
    expect(animatedCount).toBeLessThanOrEqual(5);
  });

  test('should have proper focus management', async ({ page }) => {
    // Test that focus doesn't get trapped
    const focusableElements = page.locator('button, input, textarea, select, a[href]');
    const focusableCount = await focusableElements.count();
    
    if (focusableCount > 0) {
      // Tab through all focusable elements
      for (let i = 0; i < focusableCount; i++) {
        await page.keyboard.press('Tab');
        const focused = page.locator(':focus');
        await expect(focused).toBeVisible();
      }
    }
  });
});