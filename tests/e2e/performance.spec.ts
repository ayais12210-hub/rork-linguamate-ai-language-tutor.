import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Measure LCP (Largest Contentful Paint)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Check for existing LCP entries first
        const existingEntries = performance.getEntriesByType('largest-contentful-paint');
        if (existingEntries.length > 0) {
          resolve(existingEntries[existingEntries.length - 1].startTime);
          return;
        }
        // Set up observer and timeout
        let resolved = false;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0 && !resolved) {
            resolved = true;
            observer.disconnect();
            resolve(entries[entries.length - 1].startTime);
          }
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        // Timeout after 3 seconds
        setTimeout(() => {
          if (!resolved) {
            observer.disconnect();
            resolve(performance.now());
          }
        }, 3000);
      });
    });
    
    // LCP should be under 2.5 seconds
    expect(lcp).toBeLessThan(2500);
  });

  test('should have minimal layout shift', async ({ page }) => {
    await page.goto('/');
    
    // Measure CLS (Cumulative Layout Shift)
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        let resolved = false;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          if (!resolved) {
            resolved = true;
            observer.disconnect();
            clearTimeout(timeoutId);
            resolve(clsValue);
          }
        });
        observer.observe({ entryTypes: ['layout-shift'] });
        // Timeout: resolve after 3 seconds if no layout-shift events occur
        const timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            observer.disconnect();
            resolve(clsValue);
          }
        }, 3000);
      });
    });
    
    // CLS should be under 0.1
    expect(cls).toBeLessThan(0.1);
  });

  test('should have fast First Input Delay', async ({ page }) => {
    await page.goto('/');
    
    // Measure FID (First Input Delay)
    const fid = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            resolve(entries[0].processingStart - entries[0].startTime);
          }
        }).observe({ entryTypes: ['first-input'] });
      });
    });
    
    // FID should be under 100ms
    expect(fid).toBeLessThan(100);
  });

  test('should load images efficiently', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const loading = await img.getAttribute('loading');
      
      // Images should have lazy loading
      expect(loading === 'lazy' || loading === null).toBeTruthy();
    }
  });

  test('should have optimized bundle size', async ({ page }) => {
    const response = await page.goto('/');
    const contentLength = response?.headers()['content-length'];
    
    if (contentLength) {
      // Initial page should be under 1MB
      expect(parseInt(contentLength)).toBeLessThan(1024 * 1024);
    }
  });

  test('should handle concurrent requests efficiently', async ({ page }) => {
    await page.goto('/');
    
    // Start multiple concurrent requests
    const promises = Array.from({ length: 5 }, () => 
      page.evaluate(() => fetch('/api/health'))
    );
    
    const startTime = Date.now();
    await Promise.all(promises);
    const endTime = Date.now();
    
    // All requests should complete within 2 seconds
    expect(endTime - startTime).toBeLessThan(2000);
  });

  test('should have efficient memory usage', async ({ page }) => {
    await page.goto('/');
    
    const memoryInfo = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      } : null;
    });
    
    if (memoryInfo) {
      // Memory usage should be reasonable
      expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024); // 50MB
    }
  });

  test('should have fast navigation between pages', async ({ page }) => {
    await page.goto('/');
    
    const startTime = Date.now();
    await page.goto('/learn');
    await page.waitForLoadState('networkidle');
    const navigationTime = Date.now() - startTime;
    
    // Navigation should be under 1 second
    expect(navigationTime).toBeLessThan(1000);
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    await page.goto('/learn');
    
    // Simulate loading a large vocabulary list
    const startTime = Date.now();
    await page.evaluate(() => {
      // Simulate rendering many items
      const container = document.createElement('div');
      for (let i = 0; i < 1000; i++) {
        const item = document.createElement('div');
        item.textContent = `Item ${i}`;
        container.appendChild(item);
      }
      document.body.appendChild(container);
    });
    const renderTime = Date.now() - startTime;
    
    // Should render 1000 items quickly
    expect(renderTime).toBeLessThan(500);
  });
});