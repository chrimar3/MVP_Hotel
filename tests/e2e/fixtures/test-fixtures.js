/**
 * Test Fixtures for Playwright E2E Tests
 * Provides reusable setup, page objects, and test data
 */

const { test: base } = require('@playwright/test');

/**
 * Test data factory for generating consistent test data
 */
class TestDataFactory {
  static getHotelData(overrides = {}) {
    return {
      name: 'Test Hotel',
      rating: 5,
      tripType: 'leisure',
      highlights: ['location', 'service'],
      ...overrides
    };
  }

  static getValidationTestCases() {
    return [
      {
        name: 'Empty hotel name',
        data: { name: '', highlights: ['location'] },
        expectedError: 'hotel name'
      },
      {
        name: 'No highlights selected',
        data: { name: 'Test Hotel', highlights: [] },
        expectedError: 'highlight'
      },
      {
        name: 'Special characters in hotel name',
        data: { name: 'Hôtel & Spa "The Best"', highlights: ['service'] },
        shouldPass: true
      }
    ];
  }

  static getMockApiResponse(overrides = {}) {
    return {
      choices: [{
        message: {
          content: 'Mock generated hotel review with excellent service and great location. The staff was friendly and the amenities were top-notch. Highly recommended for business travelers.'
        }
      }],
      usage: { total_tokens: 125 },
      ...overrides
    };
  }
}

/**
 * Page Object Model for the Hotel Review Generator
 */
class ReviewGeneratorPage {
  constructor(page) {
    this.page = page;
    
    // Element selectors
    this.selectors = {
      hotelNameInput: '#hotelName',
      generateButton: '#generateBtn',
      previewSection: '#previewSection',
      reviewText: '#reviewText',
      copyButton: '#copyBtn',
      errorMessage: '#errorMessage',
      successMessage: '#successMessage',
      loadingIndicator: '#loading',
      
      // Rating selectors
      rating: (rating) => `[data-rating="${rating}"]`,
      
      // Trip type selectors
      tripType: (type) => `[data-type="${type}"]`,
      
      // Highlight selectors
      highlight: (highlight) => `[data-highlight="${highlight}"]`,
      
      // Platform buttons
      bookingButton: '#bookingBtn',
      googleButton: '#googleBtn',
      tripAdvisorButton: '#tripBtn',
      
      // Statistics
      statReviews: '#statReviews',
      statRating: '#statRating',
      
      // API Status
      llmStatus: '#llmStatus',
      llmStatusText: '#llmStatusText'
    };
  }

  /**
   * Navigate to the application
   */
  async goto() {
    await this.page.goto('/review-generator.html');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill the hotel review form with provided data
   */
  async fillForm(data) {
    const { name, rating, tripType, highlights } = data;

    if (name) {
      await this.page.fill(this.selectors.hotelNameInput, name);
    }

    if (rating) {
      await this.page.click(this.selectors.rating(rating));
    }

    if (tripType) {
      await this.page.click(this.selectors.tripType(tripType));
    }

    if (highlights && highlights.length > 0) {
      for (const highlight of highlights) {
        await this.page.click(this.selectors.highlight(highlight));
      }
    }
  }

  /**
   * Generate a review by clicking the generate button
   */
  async generateReview() {
    await this.page.click(this.selectors.generateButton);
  }

  /**
   * Wait for review to be generated and return the text
   */
  async waitForReviewGeneration(timeout = 10000) {
    await this.page.waitForSelector(this.selectors.previewSection, { timeout });
    return await this.page.textContent(this.selectors.reviewText);
  }

  /**
   * Check if validation error is shown
   */
  async hasValidationError() {
    return await this.page.isVisible(this.selectors.errorMessage);
  }

  /**
   * Get validation error message
   */
  async getValidationError() {
    return await this.page.textContent(this.selectors.errorMessage);
  }

  /**
   * Copy review to clipboard
   */
  async copyReview() {
    await this.page.click(this.selectors.copyButton);
  }

  /**
   * Check if copy success message is shown
   */
  async hasCopySuccess() {
    return await this.page.isVisible(this.selectors.successMessage);
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    return {
      reviews: await this.page.textContent(this.selectors.statReviews),
      rating: await this.page.textContent(this.selectors.statRating)
    };
  }

  /**
   * Toggle a highlight button
   */
  async toggleHighlight(highlight) {
    await this.page.click(this.selectors.highlight(highlight));
  }

  /**
   * Check if highlight is active
   */
  async isHighlightActive(highlight) {
    const element = this.page.locator(this.selectors.highlight(highlight));
    const classes = await element.getAttribute('class');
    return classes.includes('active');
  }

  /**
   * Setup API mocking for tests
   */
  async setupApiMocking(mockResponse = null) {
    const response = mockResponse || TestDataFactory.getMockApiResponse();

    await this.page.route('**/api.openai.com/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });

    await this.page.route('**/api.groq.com/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Setup API error simulation
   */
  async setupApiError(statusCode = 500, errorMessage = 'API Error') {
    await this.page.route('**/api.openai.com/**', route => {
      route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify({ error: errorMessage })
      });
    });

    await this.page.route('**/api.groq.com/**', route => {
      route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify({ error: errorMessage })
      });
    });
  }

  /**
   * Setup network failure simulation
   */
  async setupNetworkFailure() {
    await this.page.route('**/api.openai.com/**', route => route.abort());
    await this.page.route('**/api.groq.com/**', route => route.abort());
  }
}

/**
 * Custom test fixture that provides the ReviewGeneratorPage
 */
const test = base.extend({
  reviewPage: async ({ page, context }, use) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    const reviewPage = new ReviewGeneratorPage(page);
    await reviewPage.goto();
    await use(reviewPage);
  },

  reviewPageWithMocking: async ({ page, context }, use) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    const reviewPage = new ReviewGeneratorPage(page);
    await reviewPage.setupApiMocking();
    await reviewPage.goto();
    await use(reviewPage);
  }
});

module.exports = {
  test,
  TestDataFactory,
  ReviewGeneratorPage
};