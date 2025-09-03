/**
 * E2E Performance Tests for Hotel Review Generator
 * Tests load times, responsiveness, and performance metrics
 */

const { test } = require('./fixtures/test-fixtures');
const { expect } = require('@playwright/test');

test.describe('Hotel Review Generator - Performance', () => {

  test('should meet performance benchmarks for page load', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate with performance timing
    await page.goto('/guest-feedback-portal-v7-modular.html', { 
      waitUntil: 'networkidle' 
    });
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Get performance entries
        const navigation = performance.getEntriesByType('navigation')[0];
        
        resolve({
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        });
      });
    });
    
    // DOM Content Loaded should be under 1.5 seconds
    expect(webVitals.domContentLoaded).toBeLessThan(1500);
    
    // First Contentful Paint should be under 2 seconds
    if (webVitals.firstContentfulPaint > 0) {
      expect(webVitals.firstContentfulPaint).toBeLessThan(2000);
    }
  });

  test('should handle form interactions with minimal latency', async ({ reviewPageWithMocking }) => {
    const interactions = [
      { action: 'fillHotelName', selector: '#hotelName', value: 'Performance Test Hotel' },
      { action: 'selectRating', selector: '[data-rating="5"]' },
      { action: 'selectHighlight', selector: '[data-highlight="location"]' },
      { action: 'selectTripType', selector: '[data-type="business"]' }
    ];

    for (const interaction of interactions) {
      const startTime = performance.now();
      
      switch (interaction.action) {
        case 'fillHotelName':
          await reviewPageWithMocking.page.fill(interaction.selector, interaction.value);
          break;
        case 'selectRating':
        case 'selectHighlight':
        case 'selectTripType':
          await reviewPageWithMocking.page.click(interaction.selector);
          break;
      }
      
      // Wait for any UI updates
      await reviewPageWithMocking.page.waitForTimeout(50);
      
      const interactionTime = performance.now() - startTime;
      
      // Each interaction should respond within 100ms
      expect(interactionTime).toBeLessThan(100);
    }
  });

  test('should generate review within acceptable time limits', async ({ reviewPageWithMocking }) => {
    // Setup form
    await reviewPageWithMocking.fillForm({
      name: 'Speed Test Hotel',
      rating: 4,
      highlights: ['service', 'location']
    });

    const startTime = performance.now();
    
    // Generate review
    await reviewPageWithMocking.generateReview();
    
    // Wait for review generation
    await reviewPageWithMocking.waitForReviewGeneration();
    
    const generationTime = performance.now() - startTime;
    
    // Review generation should complete within 5 seconds (including mocked API delay)
    expect(generationTime).toBeLessThan(5000);
  });

  test('should handle multiple rapid interactions without performance degradation', async ({ reviewPageWithMocking }) => {
    const iterations = 10;
    const timings = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      // Perform rapid highlight toggles
      await reviewPageWithMocking.toggleHighlight('location');
      await reviewPageWithMocking.page.waitForTimeout(10);
      await reviewPageWithMocking.toggleHighlight('location');
      
      const iterationTime = performance.now() - startTime;
      timings.push(iterationTime);
    }

    // Calculate average time
    const averageTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
    
    // Performance should remain consistent (average under 50ms)
    expect(averageTime).toBeLessThan(50);
    
    // No single interaction should take more than 100ms
    const maxTime = Math.max(...timings);
    expect(maxTime).toBeLessThan(100);
  });

  test('should maintain performance with large datasets', async ({ page }) => {
    // Inject a large dataset simulation
    await page.addInitScript(() => {
      // Simulate large statistics
      window.mockStats = {
        reviews: 10000,
        ratings: Array(10000).fill().map(() => Math.floor(Math.random() * 5) + 1)
      };
    });

    await page.goto('/guest-feedback-portal-v7-modular.html');
    await page.waitForLoadState('networkidle');

    const startTime = performance.now();
    
    // Perform operations that might involve statistics calculation
    await page.fill('#hotelName', 'Large Dataset Test');
    await page.click('[data-rating="5"]');
    await page.click('[data-highlight="location"]');
    
    const operationTime = performance.now() - startTime;
    
    // Operations should remain fast even with large datasets
    expect(operationTime).toBeLessThan(200);
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    // Start memory monitoring
    const initialMemory = await page.evaluate(() => {
      return performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize
      } : null;
    });

    if (initialMemory) {
      // Perform multiple review generations
      for (let i = 0; i < 5; i++) {
        await page.fill('#hotelName', `Memory Test Hotel ${i}`);
        await page.click(`[data-rating="${(i % 5) + 1}"]`);
        await page.click('[data-highlight="location"]');
        
        // Simulate review generation without actual API calls
        await page.evaluate(() => {
          const event = new CustomEvent('mockReviewGenerated', {
            detail: { review: 'Test review content for memory test' }
          });
          document.dispatchEvent(event);
        });
        
        await page.waitForTimeout(100);
      }

      const finalMemory = await page.evaluate(() => {
        return performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        } : null;
      });

      if (finalMemory) {
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        
        // Memory increase should be reasonable (less than 10MB)
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }
    }
  });

  test('should optimize resource loading', async ({ page }) => {
    // Monitor network requests
    const requests = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        resourceType: request.resourceType(),
        size: request.postDataBuffer()?.length || 0
      });
    });

    await page.goto('/guest-feedback-portal-v7-modular.html');
    await page.waitForLoadState('networkidle');

    // Check resource loading efficiency
    const cssRequests = requests.filter(r => r.resourceType === 'stylesheet');
    const jsRequests = requests.filter(r => r.resourceType === 'script');
    const imageRequests = requests.filter(r => r.resourceType === 'image');

    // Should not load excessive number of resources
    expect(cssRequests.length).toBeLessThan(10);
    expect(jsRequests.length).toBeLessThan(15);
    expect(imageRequests.length).toBeLessThan(20);

    // Total number of requests should be reasonable
    expect(requests.length).toBeLessThan(50);
  });

  test('should handle concurrent users simulation', async ({ browser }) => {
    const concurrentUsers = 5;
    const contexts = [];
    const pages = [];

    try {
      // Create multiple browser contexts to simulate concurrent users
      for (let i = 0; i < concurrentUsers; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
      }

      const startTime = performance.now();

      // Simulate concurrent user actions
      await Promise.all(pages.map(async (page, index) => {
        await page.goto('/guest-feedback-portal-v7-modular.html');
        await page.waitForLoadState('networkidle');
        
        await page.fill('#hotelName', `Concurrent Test Hotel ${index}`);
        await page.click(`[data-rating="${(index % 5) + 1}"]`);
        await page.click('[data-highlight="location"]');
      }));

      const concurrentLoadTime = performance.now() - startTime;

      // Concurrent operations should complete within reasonable time
      expect(concurrentLoadTime).toBeLessThan(10000);

    } finally {
      // Clean up contexts
      await Promise.all(contexts.map(context => context.close()));
    }
  });

  test('should maintain performance across different viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      const startTime = performance.now();
      
      await page.goto('/guest-feedback-portal-v7-modular.html');
      await page.waitForLoadState('networkidle');
      
      // Perform basic interactions
      await page.fill('#hotelName', `${viewport.name} Test Hotel`);
      await page.click('[data-rating="4"]');
      await page.click('[data-highlight="service"]');
      
      const viewportTime = performance.now() - startTime;
      
      // Each viewport should perform similarly (within 4 seconds)
      expect(viewportTime).toBeLessThan(4000);
    }
  });
});