/**
 * E2E Tests for Hotel Review Generation
 * Complete user journey testing with Playwright
 * Uses page objects and fixtures for maintainability
 */

const { test, TestDataFactory } = require('./fixtures/test-fixtures');
const { expect } = require('@playwright/test');

test.describe('Hotel Review Generator - Core Functionality', () => {

  test('should load the application correctly', async ({ reviewPage }) => {
    // Check main elements are present
    await expect(reviewPage.page.locator('h1')).toContainText('Hotel Review Generator');
    await expect(reviewPage.page.locator(reviewPage.selectors.hotelNameInput)).toBeVisible();
    await expect(reviewPage.page.locator(reviewPage.selectors.generateButton)).toBeVisible();
  });

  test('should generate review with valid input', async ({ reviewPageWithMocking }) => {
    const testData = TestDataFactory.getHotelData({
      name: 'E2E Test Hotel',
      rating: 5,
      tripType: 'leisure',
      highlights: ['location', 'service']
    });

    // Fill form
    await reviewPageWithMocking.fillForm(testData);
    
    // Generate review
    await reviewPageWithMocking.generateReview();
    
    // Wait for review to appear
    const reviewText = await reviewPageWithMocking.waitForReviewGeneration();
    
    // Verify review contains hotel name
    expect(reviewText).toContain('E2E Test Hotel');
    expect(reviewText.length).toBeGreaterThan(50);
  });

  test('should show validation error for missing hotel name', async ({ reviewPage }) => {
    // Try to generate without hotel name but with highlights
    await reviewPage.page.click(reviewPage.selectors.highlight('location'));
    await reviewPage.generateReview();
    
    // Check error message
    await expect(reviewPage.page.locator(reviewPage.selectors.errorMessage)).toBeVisible();
    const errorText = await reviewPage.getValidationError();
    expect(errorText.toLowerCase()).toContain('hotel name');
  });

  test('should show validation error for missing highlights', async ({ reviewPage }) => {
    // Enter hotel name but no highlights
    await reviewPage.page.fill(reviewPage.selectors.hotelNameInput, 'Test Hotel');
    await reviewPage.generateReview();
    
    // Check error message
    await expect(reviewPage.page.locator(reviewPage.selectors.errorMessage)).toBeVisible();
    const errorText = await reviewPage.getValidationError();
    expect(errorText.toLowerCase()).toContain('highlight');
  });
});

test.describe('Hotel Review Generator - User Interactions', () => {

  test('should copy review to clipboard', async ({ reviewPageWithMocking }) => {
    const testData = TestDataFactory.getHotelData({
      name: 'Copy Test Hotel',
      highlights: ['comfort']
    });

    // Generate a review
    await reviewPageWithMocking.fillForm(testData);
    await reviewPageWithMocking.generateReview();
    
    // Wait for review
    await reviewPageWithMocking.waitForReviewGeneration();
    
    // Copy to clipboard
    await reviewPageWithMocking.copyReview();
    
    // Check success message
    await expect(reviewPageWithMocking.page.locator(reviewPageWithMocking.selectors.successMessage)).toBeVisible();
    const successText = await reviewPageWithMocking.page.textContent(reviewPageWithMocking.selectors.successMessage);
    expect(successText.toLowerCase()).toContain('copied');
    
    // Verify clipboard content
    const clipboardText = await reviewPageWithMocking.page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('Copy Test Hotel');
  });

  test('should open platform links in new tabs', async ({ reviewPageWithMocking, context }) => {
    const testData = TestDataFactory.getHotelData({
      name: 'Platform Test Hotel',
      highlights: ['breakfast']
    });

    // Generate a review first
    await reviewPageWithMocking.fillForm(testData);
    await reviewPageWithMocking.generateReview();
    await reviewPageWithMocking.waitForReviewGeneration();
    
    // Test Booking.com button
    const [bookingPage] = await Promise.all([
      context.waitForEvent('page'),
      reviewPageWithMocking.page.click(reviewPageWithMocking.selectors.bookingButton)
    ]);
    expect(bookingPage.url()).toContain('booking.com');
    await bookingPage.close();
    
    // Test Google Maps button
    const [googlePage] = await Promise.all([
      context.waitForEvent('page'),
      reviewPageWithMocking.page.click(reviewPageWithMocking.selectors.googleButton)
    ]);
    expect(googlePage.url()).toContain('google.com/maps');
    await googlePage.close();
    
    // Test TripAdvisor button
    const [tripPage] = await Promise.all([
      context.waitForEvent('page'),
      reviewPageWithMocking.page.click(reviewPageWithMocking.selectors.tripAdvisorButton)
    ]);
    expect(tripPage.url()).toContain('tripadvisor.com');
    await tripPage.close();
  });

  test('should toggle highlights correctly', async ({ reviewPage }) => {
    const locationSelector = reviewPage.selectors.highlight('location');
    
    // Click to activate
    await reviewPage.toggleHighlight('location');
    await expect(reviewPage.page.locator(locationSelector)).toHaveClass(/active/);
    
    // Click to deactivate
    await reviewPage.toggleHighlight('location');
    await expect(reviewPage.page.locator(locationSelector)).not.toHaveClass(/active/);
    
    // Click to reactivate
    await reviewPage.toggleHighlight('location');
    await expect(reviewPage.page.locator(locationSelector)).toHaveClass(/active/);
  });
});

test.describe('Hotel Review Generator - Statistics and State', () => {

  test('should update statistics after generation', async ({ reviewPageWithMocking }) => {
    // Check initial stats
    await expect(reviewPageWithMocking.page.locator(reviewPageWithMocking.selectors.statReviews)).toHaveText('0');
    
    // Generate first review
    const testData1 = TestDataFactory.getHotelData({
      name: 'Stats Test Hotel',
      rating: 5,
      highlights: ['wifi']
    });
    
    await reviewPageWithMocking.fillForm(testData1);
    await reviewPageWithMocking.generateReview();
    await reviewPageWithMocking.waitForReviewGeneration();
    
    // Check stats updated
    await expect(reviewPageWithMocking.page.locator(reviewPageWithMocking.selectors.statReviews)).toHaveText('1');
    await expect(reviewPageWithMocking.page.locator(reviewPageWithMocking.selectors.statRating)).toHaveText('5.0');
    
    // Generate second review with different rating
    await reviewPageWithMocking.page.click(reviewPageWithMocking.selectors.rating(3));
    await reviewPageWithMocking.generateReview();
    await reviewPageWithMocking.waitForReviewGeneration();
    
    // Check average rating
    await expect(reviewPageWithMocking.page.locator(reviewPageWithMocking.selectors.statReviews)).toHaveText('2');
    await expect(reviewPageWithMocking.page.locator(reviewPageWithMocking.selectors.statRating)).toHaveText('4.0'); // Average of 5 and 3
  });

  test('should handle URL parameters correctly', async ({ page }) => {
    // Navigate with URL parameters
    await page.goto('/guest-feedback-portal-v7-modular.html?source=booking&hotel=URL%20Param%20Hotel');
    await page.waitForLoadState('networkidle');
    
    // Check hotel name is pre-filled
    const hotelNameValue = await page.inputValue('#hotelName');
    expect(hotelNameValue).toBe('URL Param Hotel');
  });

  test('should persist statistics across page reloads', async ({ reviewPageWithMocking }) => {
    const testData = TestDataFactory.getHotelData({
      name: 'Persist Test Hotel',
      rating: 4,
      highlights: ['cleanliness']
    });

    // Generate a review
    await reviewPageWithMocking.fillForm(testData);
    await reviewPageWithMocking.generateReview();
    await reviewPageWithMocking.waitForReviewGeneration();
    
    const stats = await reviewPageWithMocking.getStatistics();
    expect(stats.reviews).toBe('1');
    expect(stats.rating).toBe('4.0');
    
    // Reload page
    await reviewPageWithMocking.page.reload();
    await reviewPageWithMocking.page.waitForLoadState('networkidle');
    
    // Check stats persisted
    const persistedStats = await reviewPageWithMocking.getStatistics();
    expect(persistedStats.reviews).toBe('1');
    expect(persistedStats.rating).toBe('4.0');
  });
});

test.describe('Hotel Review Generator - Error Handling', () => {

  test('should handle network errors gracefully', async ({ reviewPage }) => {
    // Setup network failure
    await reviewPage.setupNetworkFailure();
    
    const testData = TestDataFactory.getHotelData({
      name: 'Network Error Hotel',
      highlights: ['location']
    });

    // Try to generate review
    await reviewPage.fillForm(testData);
    await reviewPage.generateReview();
    
    // Should fall back to template and still show review
    const reviewText = await reviewPage.waitForReviewGeneration();
    expect(reviewText).toContain('Network Error Hotel');
  });

  test('should handle API errors gracefully', async ({ reviewPage }) => {
    // Setup API error
    await reviewPage.setupApiError(500, 'Internal Server Error');
    
    const testData = TestDataFactory.getHotelData({
      name: 'API Error Hotel',
      highlights: ['service']
    });

    await reviewPage.fillForm(testData);
    await reviewPage.generateReview();
    
    // Should show either error message or fallback review
    await reviewPage.page.waitForTimeout(3000);
    
    const hasError = await reviewPage.hasValidationError();
    const hasPreview = await reviewPage.page.isVisible(reviewPage.selectors.previewSection);
    
    expect(hasError || hasPreview).toBe(true);
  });

  test('should handle rapid clicking gracefully', async ({ reviewPageWithMocking }) => {
    const testData = TestDataFactory.getHotelData({
      name: 'Rapid Test Hotel',
      highlights: ['amenities']
    });

    // Set up valid input
    await reviewPageWithMocking.fillForm(testData);
    
    // Click generate button multiple times rapidly
    await Promise.all([
      reviewPageWithMocking.page.click(reviewPageWithMocking.selectors.generateButton),
      reviewPageWithMocking.page.click(reviewPageWithMocking.selectors.generateButton),
      reviewPageWithMocking.page.click(reviewPageWithMocking.selectors.generateButton)
    ]);
    
    // Should still work and show only one review
    await reviewPageWithMocking.waitForReviewGeneration();
    
    // Loading should be hidden
    await expect(reviewPageWithMocking.page.locator(reviewPageWithMocking.selectors.loadingIndicator)).not.toBeVisible();
  });

  test('should sanitize user input', async ({ reviewPageWithMocking }) => {
    const testData = TestDataFactory.getHotelData({
      name: '<script>alert("XSS")</script>Hotel',
      highlights: ['value']
    });

    // Try to inject script tag
    await reviewPageWithMocking.fillForm(testData);
    await reviewPageWithMocking.generateReview();
    
    // Wait for review
    const reviewText = await reviewPageWithMocking.waitForReviewGeneration();
    
    // Check that script was sanitized
    expect(reviewText).not.toContain('<script>');
    expect(reviewText).toContain('Hotel');
  });
});

test.describe('Hotel Review Generator - Accessibility and Responsive Design', () => {

  test('should be responsive on mobile', async ({ reviewPageWithMocking }) => {
    // Set mobile viewport
    await reviewPageWithMocking.page.setViewportSize({ width: 390, height: 844 });
    
    // Check mobile layout
    await expect(reviewPageWithMocking.page.locator('.container')).toBeVisible();
    await expect(reviewPageWithMocking.page.locator(reviewPageWithMocking.selectors.hotelNameInput)).toBeVisible();
    
    // Test interaction on mobile
    const testData = TestDataFactory.getHotelData({
      name: 'Mobile Test Hotel',
      rating: 4,
      highlights: ['location']
    });

    await reviewPageWithMocking.fillForm(testData);
    await reviewPageWithMocking.generateReview();
    
    await reviewPageWithMocking.waitForReviewGeneration();
  });

  test('should show API status indicator', async ({ reviewPage }) => {
    // Check API status is displayed
    await expect(reviewPage.page.locator(reviewPage.selectors.llmStatus)).toBeVisible();
    await expect(reviewPage.page.locator(reviewPage.selectors.llmStatusText)).not.toBeEmpty();
    
    // Status should be either active, inactive, or fallback
    const statusClasses = await reviewPage.page.locator(reviewPage.selectors.llmStatus).getAttribute('class');
    expect(statusClasses).toMatch(/active|inactive|fallback/);
  });

  test('should handle special characters in hotel name', async ({ reviewPageWithMocking }) => {
    const specialNames = [
      'Hôtel François',
      'Hotel & Spa',
      'Resort (5-Star)',
      'Hotel "The Best"',
      'Hotel\'s Place'
    ];

    for (const name of specialNames) {
      const testData = TestDataFactory.getHotelData({
        name,
        highlights: ['service']
      });

      await reviewPageWithMocking.page.fill(reviewPageWithMocking.selectors.hotelNameInput, '');
      await reviewPageWithMocking.fillForm(testData);
      
      const inputValue = await reviewPageWithMocking.page.inputValue(reviewPageWithMocking.selectors.hotelNameInput);
      expect(inputValue).toBe(name);
    }
  });
});

test.describe('Hotel Review Generator - Cross-Browser Compatibility', () => {

  test('should work across different viewports', async ({ reviewPageWithMocking }) => {
    const viewports = [
      { width: 375, height: 812, name: 'Mobile Portrait' },
      { width: 812, height: 375, name: 'Mobile Landscape' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    const testData = TestDataFactory.getHotelData({
      name: 'Viewport Test Hotel',
      highlights: ['location']
    });

    for (const viewport of viewports) {
      await reviewPageWithMocking.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await reviewPageWithMocking.page.waitForTimeout(500);
      
      // Check basic functionality
      await expect(reviewPageWithMocking.page.locator(reviewPageWithMocking.selectors.hotelNameInput)).toBeVisible();
      await expect(reviewPageWithMocking.page.locator(reviewPageWithMocking.selectors.generateButton)).toBeVisible();
    }
  });
});