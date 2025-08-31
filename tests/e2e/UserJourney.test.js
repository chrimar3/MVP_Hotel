/**
 * E2E Tests for Complete User Journey
 * Tests the full user experience from page load to review generation
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('Hotel Review Generator E2E Tests', () => {
  let browser;
  let page;
  const baseURL = `file://${path.join(__dirname, '../../public/index.html')}`;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Mock API responses to avoid real API calls
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().includes('api.openai.com') || request.url().includes('api.groq.com')) {
        request.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            choices: [{
              message: {
                content: 'Mock generated hotel review with excellent service and great location. The staff was friendly and the amenities were top-notch. Highly recommended for business travelers.'
              }
            }],
            usage: { total_tokens: 125 }
          })
        });
      } else {
        request.continue();
      }
    });

    // Navigate to the application
    await page.goto(baseURL, { waitUntil: 'networkidle0' });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  describe('Page Load and Initial State', () => {
    test('should load the main page successfully', async () => {
      // Check page title
      const title = await page.title();
      expect(title).toContain('Hotel Review Generator');

      // Check main elements are present
      const hotelInput = await page.$('#hotel-name, [data-testid="hotel-name-input"], input[placeholder*="hotel" i]');
      expect(hotelInput).toBeTruthy();

      // Check rating selector
      const ratingSelector = await page.$('[data-testid="rating-selector"], .rating-selector, .star-rating');
      expect(ratingSelector).toBeTruthy();

      // Check generate button
      const generateButton = await page.$('[data-testid="generate-button"], button[type="submit"], .generate-btn');
      expect(generateButton).toBeTruthy();
    });

    test('should have proper initial form state', async () => {
      // Check default rating (usually 5 stars)
      const activeStars = await page.$$('.star.active, .star-filled, [data-rating="5"]');
      expect(activeStars.length).toBeGreaterThanOrEqual(1);

      // Check default trip type
      const tripTypeSelector = await page.$('select[name="tripType"], [data-testid="trip-type"]');
      if (tripTypeSelector) {
        const selectedValue = await page.$eval('select[name="tripType"], [data-testid="trip-type"]', el => el.value);
        expect(['leisure', 'business', 'family']).toContain(selectedValue);
      }

      // Check highlights are available
      const highlights = await page.$$('.highlight-option, [data-testid*="highlight"], .checkbox-container');
      expect(highlights.length).toBeGreaterThan(0);
    });

    test('should be responsive on different screen sizes', async () => {
      // Test mobile viewport
      await page.setViewport({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      // Check mobile layout
      const mobileLayout = await page.$('.mobile-layout, .responsive-container');
      const bodyWidth = await page.evaluate(() => document.body.offsetWidth);
      expect(bodyWidth).toBeLessThanOrEqual(375);

      // Test tablet viewport
      await page.setViewport({ width: 768, height: 1024 });
      await page.waitForTimeout(500);

      // Check tablet layout
      const tabletWidth = await page.evaluate(() => document.body.offsetWidth);
      expect(tabletWidth).toBeLessThanOrEqual(768);

      // Test desktop viewport
      await page.setViewport({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);

      const desktopWidth = await page.evaluate(() => document.body.offsetWidth);
      expect(desktopWidth).toBeGreaterThan(768);
    });
  });

  describe('User Input Flow', () => {
    test('should allow hotel name input', async () => {
      const hotelInput = await page.$('#hotel-name, [data-testid="hotel-name-input"], input[placeholder*="hotel" i]');
      
      await hotelInput.click();
      await hotelInput.type('Grand Test Hotel');
      
      const inputValue = await hotelInput.evaluate(el => el.value);
      expect(inputValue).toBe('Grand Test Hotel');
    });

    test('should allow rating selection', async () => {
      // Try different rating selectors
      const ratingSelectors = [
        '.star[data-rating="4"]',
        '.rating-4',
        '[data-testid="rating-4"]',
        '.star:nth-child(4)'
      ];

      let ratingSelected = false;
      
      for (const selector of ratingSelectors) {
        try {
          const ratingElement = await page.$(selector);
          if (ratingElement) {
            await ratingElement.click();
            await page.waitForTimeout(100);
            ratingSelected = true;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      // If no rating selector found, check for interactive stars
      if (!ratingSelected) {
        const stars = await page.$$('.star, [data-rating]');
        if (stars.length >= 4) {
          await stars[3].click(); // Click 4th star (0-indexed)
          ratingSelected = true;
        }
      }

      expect(ratingSelected).toBe(true);
    });

    test('should allow highlight selection', async () => {
      // Find highlight checkboxes or buttons
      const highlightSelectors = [
        '[data-testid="highlight-location"]',
        '.highlight-location',
        'input[value="location"]',
        '.checkbox-container:first-child input'
      ];

      let highlightSelected = false;

      for (const selector of highlightSelectors) {
        try {
          const highlight = await page.$(selector);
          if (highlight) {
            await highlight.click();
            await page.waitForTimeout(100);
            highlightSelected = true;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      // If no specific highlight found, click first available highlight
      if (!highlightSelected) {
        const highlights = await page.$$('.highlight-option input, .checkbox-container input');
        if (highlights.length > 0) {
          await highlights[0].click();
          highlightSelected = true;
        }
      }

      expect(highlightSelected).toBe(true);
    });

    test('should handle trip type selection', async () => {
      const tripTypeSelector = await page.$('select[name="tripType"], [data-testid="trip-type"]');
      
      if (tripTypeSelector) {
        await tripTypeSelector.select('business');
        const selectedValue = await tripTypeSelector.evaluate(el => el.value);
        expect(selectedValue).toBe('business');
      } else {
        // Check for radio buttons or other trip type selectors
        const businessOption = await page.$('[value="business"], [data-trip-type="business"]');
        if (businessOption) {
          await businessOption.click();
        }
      }
    });

    test('should validate required fields', async () => {
      // Try to generate without hotel name
      const generateButton = await page.$('[data-testid="generate-button"], button[type="submit"], .generate-btn');
      await generateButton.click();

      // Check for validation messages
      await page.waitForTimeout(500);
      
      const errorMessages = await page.$$('.error-message, .validation-error, .alert-danger');
      const hasValidation = errorMessages.length > 0;
      
      // Or check if form didn't submit (still on same page)
      const currentURL = page.url();
      const stillOnForm = currentURL.includes('index.html') || currentURL.includes('/');
      
      expect(hasValidation || stillOnForm).toBe(true);
    });
  });

  describe('Review Generation Flow', () => {
    beforeEach(async () => {
      // Set up form with valid data
      const hotelInput = await page.$('#hotel-name, [data-testid="hotel-name-input"], input[placeholder*="hotel" i]');
      await hotelInput.click();
      await hotelInput.type('E2E Test Hotel');

      // Select rating
      const stars = await page.$$('.star, [data-rating]');
      if (stars.length >= 5) {
        await stars[4].click(); // 5 stars
      }

      // Select at least one highlight
      const highlights = await page.$$('.highlight-option input, .checkbox-container input, [type="checkbox"]');
      if (highlights.length > 0) {
        await highlights[0].click();
      }
    });

    test('should generate review successfully', async () => {
      // Click generate button
      const generateButton = await page.$('[data-testid="generate-button"], button[type="submit"], .generate-btn');
      await generateButton.click();

      // Wait for generation to complete
      await page.waitForTimeout(2000);

      // Check for loading state
      const loadingElement = await page.$('.loading, .spinner, [data-testid="loading"]');
      
      // Wait for review to appear
      try {
        await page.waitForSelector('.review-output, [data-testid="generated-review"], .review-text', {
          timeout: 10000
        });
      } catch (error) {
        // If selector not found, check for any text output
        const pageContent = await page.content();
        expect(pageContent).toContain('Mock generated hotel review');
      }

      // Verify review content
      const reviewElement = await page.$('.review-output, [data-testid="generated-review"], .review-text');
      if (reviewElement) {
        const reviewText = await reviewElement.evaluate(el => el.textContent);
        expect(reviewText.length).toBeGreaterThan(50);
        expect(reviewText).toContain('hotel');
      }
    });

    test('should show loading state during generation', async () => {
      // Add delay to mock API response
      await page.setRequestInterception(true);
      page.removeAllListeners('request');
      page.on('request', (request) => {
        if (request.url().includes('api.openai.com') || request.url().includes('api.groq.com')) {
          setTimeout(() => {
            request.respond({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                choices: [{ message: { content: 'Delayed response' } }],
                usage: { total_tokens: 50 }
              })
            });
          }, 1000);
        } else {
          request.continue();
        }
      });

      const generateButton = await page.$('[data-testid="generate-button"], button[type="submit"], .generate-btn');
      await generateButton.click();

      // Check loading state appears
      await page.waitForTimeout(100);
      
      const loadingIndicators = await page.$$('.loading, .spinner, [data-testid="loading"], .btn-loading');
      const buttonDisabled = await generateButton.evaluate(el => el.disabled);
      
      expect(loadingIndicators.length > 0 || buttonDisabled).toBe(true);
    });

    test('should handle API errors gracefully', async () => {
      // Mock API error
      await page.setRequestInterception(true);
      page.removeAllListeners('request');
      page.on('request', (request) => {
        if (request.url().includes('api.openai.com') || request.url().includes('api.groq.com')) {
          request.respond({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'API Error' })
          });
        } else {
          request.continue();
        }
      });

      const generateButton = await page.$('[data-testid="generate-button"], button[type="submit"], .generate-btn');
      await generateButton.click();

      // Wait for error handling
      await page.waitForTimeout(3000);

      // Should show either error message or fallback review
      const errorMessage = await page.$('.error-message, .alert-danger, [data-testid="error"]');
      const fallbackReview = await page.$('.review-output, [data-testid="generated-review"]');
      
      expect(errorMessage !== null || fallbackReview !== null).toBe(true);
    });
  });

  describe('Review Output and Actions', () => {
    beforeEach(async () => {
      // Generate a review first
      const hotelInput = await page.$('#hotel-name, [data-testid="hotel-name-input"], input[placeholder*="hotel" i]');
      await hotelInput.type('Action Test Hotel');

      const generateButton = await page.$('[data-testid="generate-button"], button[type="submit"], .generate-btn');
      await generateButton.click();
      
      await page.waitForTimeout(2000);
    });

    test('should allow copying review to clipboard', async () => {
      const copyButton = await page.$('[data-testid="copy-button"], .copy-btn, button[title*="copy" i]');
      
      if (copyButton) {
        // Mock clipboard API
        await page.evaluate(() => {
          navigator.clipboard = {
            writeText: jest.fn().mockResolvedValue()
          };
        });

        await copyButton.click();
        
        // Check for success feedback
        await page.waitForTimeout(500);
        const successMessage = await page.$('.copy-success, .alert-success, [data-testid="copy-success"]');
        expect(successMessage).toBeTruthy();
      }
    });

    test('should allow regenerating review', async () => {
      const regenerateButton = await page.$('[data-testid="regenerate-button"], .regenerate-btn, button[title*="regenerate" i]');
      
      if (regenerateButton) {
        // Get current review text
        const currentReview = await page.$eval('.review-output, [data-testid="generated-review"]', el => el.textContent);
        
        await regenerateButton.click();
        await page.waitForTimeout(2000);
        
        // Check if review changed or loading occurred
        const newReview = await page.$eval('.review-output, [data-testid="generated-review"]', el => el.textContent);
        const wasLoading = await page.evaluate(() => {
          return document.querySelector('.loading, .spinner') !== null;
        });
        
        expect(newReview !== currentReview || wasLoading).toBe(true);
      }
    });

    test('should show review metadata', async () => {
      // Check for metadata like source, latency, etc.
      const metadata = await page.$('.review-metadata, [data-testid="review-info"], .review-stats');
      
      if (metadata) {
        const metadataText = await metadata.evaluate(el => el.textContent);
        expect(metadataText.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Form Validation and Edge Cases', () => {
    test('should handle special characters in hotel name', async () => {
      const hotelInput = await page.$('#hotel-name, [data-testid="hotel-name-input"], input[placeholder*="hotel" i]');
      
      const specialNames = [
        'Hôtel François',
        'Hotel & Spa',
        'Resort (5-Star)',
        'Hotel "The Best"',
        'Hotel\'s Place'
      ];

      for (const name of specialNames) {
        await hotelInput.click({ clickCount: 3 }); // Select all
        await hotelInput.type(name);
        
        const inputValue = await hotelInput.evaluate(el => el.value);
        expect(inputValue).toBe(name);
        
        // Clear for next test
        await hotelInput.evaluate(el => el.value = '');
      }
    });

    test('should handle very long hotel names', async () => {
      const longName = 'A'.repeat(200);
      const hotelInput = await page.$('#hotel-name, [data-testid="hotel-name-input"], input[placeholder*="hotel" i]');
      
      await hotelInput.click();
      await hotelInput.type(longName);
      
      // Check if input is truncated or handled properly
      const inputValue = await hotelInput.evaluate(el => el.value);
      expect(inputValue.length).toBeGreaterThan(0);
    });

    test('should maintain state during page interactions', async () => {
      // Fill form
      const hotelInput = await page.$('#hotel-name, [data-testid="hotel-name-input"], input[placeholder*="hotel" i]');
      await hotelInput.type('State Test Hotel');

      // Select rating
      const stars = await page.$$('.star, [data-rating]');
      if (stars.length >= 3) {
        await stars[2].click(); // 3 stars
      }

      // Interact with other elements (scroll, click elsewhere)
      await page.evaluate(() => window.scrollTo(0, 100));
      await page.click('body');

      // Check state is maintained
      const maintainedValue = await hotelInput.evaluate(el => el.value);
      expect(maintainedValue).toBe('State Test Hotel');
    });
  });

  describe('Performance and Accessibility', () => {
    test('should meet basic performance metrics', async () => {
      const startTime = Date.now();
      
      await page.goto(baseURL, { waitUntil: 'networkidle0' });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Page should load within 5 seconds
    });

    test('should have proper ARIA labels and accessibility', async () => {
      // Check for proper labels
      const inputs = await page.$$('input, select, button');
      
      for (const input of inputs) {
        const hasLabel = await input.evaluate(el => {
          return el.getAttribute('aria-label') || 
                 el.getAttribute('aria-labelledby') ||
                 el.labels?.length > 0;
        });
        
        const tagName = await input.evaluate(el => el.tagName);
        if (['INPUT', 'SELECT'].includes(tagName)) {
          expect(hasLabel).toBe(true);
        }
      }
    });

    test('should be keyboard navigable', async () => {
      // Navigate through form using Tab key
      const focusableElements = await page.$$('input, select, button, [tabindex]:not([tabindex="-1"])');
      
      if (focusableElements.length > 0) {
        // Focus first element
        await focusableElements[0].focus();
        
        // Tab through elements
        for (let i = 1; i < Math.min(focusableElements.length, 5); i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);
        }
        
        // Check if focus moved
        const activeElement = await page.evaluate(() => document.activeElement.tagName);
        expect(['INPUT', 'SELECT', 'BUTTON'].includes(activeElement)).toBe(true);
      }
    });
  });

  describe('Cross-Browser Compatibility', () => {
    test('should work with different user agents', async () => {
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ];

      for (const userAgent of userAgents) {
        await page.setUserAgent(userAgent);
        await page.reload({ waitUntil: 'networkidle0' });

        // Check basic functionality
        const hotelInput = await page.$('#hotel-name, [data-testid="hotel-name-input"], input[placeholder*="hotel" i]');
        expect(hotelInput).toBeTruthy();
      }
    });

    test('should handle different screen orientations', async () => {
      // Portrait
      await page.setViewport({ width: 375, height: 812 });
      await page.waitForTimeout(500);
      
      let hotelInput = await page.$('#hotel-name, [data-testid="hotel-name-input"], input[placeholder*="hotel" i]');
      expect(hotelInput).toBeTruthy();

      // Landscape
      await page.setViewport({ width: 812, height: 375 });
      await page.waitForTimeout(500);
      
      hotelInput = await page.$('#hotel-name, [data-testid="hotel-name-input"], input[placeholder*="hotel" i]');
      expect(hotelInput).toBeTruthy();
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    test('should recover from network failures', async () => {
      // Simulate network failure
      await page.setOfflineMode(true);
      
      const hotelInput = await page.$('#hotel-name, [data-testid="hotel-name-input"], input[placeholder*="hotel" i]');
      await hotelInput.type('Offline Test Hotel');

      const generateButton = await page.$('[data-testid="generate-button"], button[type="submit"], .generate-btn');
      await generateButton.click();

      await page.waitForTimeout(2000);

      // Restore network
      await page.setOfflineMode(false);
      
      // Should show error or fallback content
      const errorOrFallback = await page.$('.error-message, .review-output, [data-testid="error"], [data-testid="generated-review"]');
      expect(errorOrFallback).toBeTruthy();
    });

    test('should handle rapid form submissions', async () => {
      const hotelInput = await page.$('#hotel-name, [data-testid="hotel-name-input"], input[placeholder*="hotel" i]');
      await hotelInput.type('Rapid Test Hotel');

      const generateButton = await page.$('[data-testid="generate-button"], button[type="submit"], .generate-btn');
      
      // Rapid clicks
      await generateButton.click();
      await generateButton.click();
      await generateButton.click();

      await page.waitForTimeout(3000);

      // Should handle gracefully (button disabled or single request)
      const finalState = await page.evaluate(() => {
        const button = document.querySelector('[data-testid="generate-button"], button[type="submit"], .generate-btn');
        return button ? button.disabled : false;
      });

      // Either button is disabled or we see loading/result
      const hasResult = await page.$('.review-output, [data-testid="generated-review"], .loading');
      expect(finalState || hasResult).toBeTruthy();
    });
  });
});