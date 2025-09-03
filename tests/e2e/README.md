# E2E Testing with Playwright

This directory contains End-to-End tests for the Hotel Review Generator using Playwright test runner.

## Quick Start

### Install Dependencies
```bash
npm install
npx playwright install
```

### Run Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run with headed browser (visible)
npm run test:e2e:headed

# Debug tests interactively
npm run test:e2e:debug

# Open Playwright UI for test development
npm run test:e2e:ui

# View test reports
npm run test:e2e:report
```

## Test Structure

### Test Files
- `review-generation.spec.js` - Core functionality tests
- `accessibility.spec.js` - Accessibility and ARIA compliance tests  
- `performance.spec.js` - Performance benchmarks and load testing

### Fixtures and Page Objects
- `fixtures/test-fixtures.js` - Reusable test fixtures and page objects
  - `TestDataFactory` - Generates consistent test data
  - `ReviewGeneratorPage` - Page Object Model for main application

## Configuration

### Playwright Config (`playwright.config.js`)
- **Multi-browser testing**: Chromium, Firefox, WebKit
- **Mobile testing**: iOS Safari, Android Chrome
- **CI/CD integration**: GitHub Actions reporter
- **Screenshots/Videos**: On failure only
- **Traces**: On retry for debugging

### Test Categories

#### Core Functionality Tests
- Form validation and user interactions
- Review generation workflow
- Copy-to-clipboard functionality
- Platform navigation (Booking.com, TripAdvisor, etc.)
- Statistics tracking and persistence

#### Accessibility Tests
- Keyboard navigation
- Screen reader compatibility
- ARIA labels and roles
- Focus management
- High contrast support
- Text scaling (up to 200%)

#### Performance Tests
- Page load times (< 3 seconds)
- Form interaction latency (< 100ms)
- Review generation speed (< 5 seconds)
- Memory usage efficiency
- Concurrent user simulation
- Resource loading optimization

## Browser Support Matrix

| Browser | Desktop | Mobile | Accessibility | Performance |
|---------|---------|--------|---------------|-------------|
| Chromium | ✅ | ✅ | ✅ | ✅ |
| Firefox | ✅ | ❌ | ✅ | ✅ |
| WebKit | ✅ | ✅ | ✅ | ✅ |

## Test Data Management

### TestDataFactory Usage
```javascript
// Basic hotel data
const hotelData = TestDataFactory.getHotelData({
  name: 'Custom Hotel Name',
  rating: 5,
  highlights: ['location', 'service']
});

// Validation test cases
const validationCases = TestDataFactory.getValidationTestCases();

// Mock API responses
const mockResponse = TestDataFactory.getMockApiResponse({
  choices: [{ message: { content: 'Custom review content' } }]
});
```

### Page Object Usage
```javascript
const { test } = require('./fixtures/test-fixtures');

test('example test', async ({ reviewPageWithMocking }) => {
  // Form is pre-filled and API is mocked
  await reviewPageWithMocking.fillForm(testData);
  await reviewPageWithMocking.generateReview();
  const reviewText = await reviewPageWithMocking.waitForReviewGeneration();
  
  expect(reviewText).toContain('Expected content');
});
```

## CI/CD Integration

### GitHub Actions Workflow
The E2E tests run automatically on:
- Push to main/develop branches
- Pull requests to main
- Daily scheduled runs at 2 AM UTC

### Test Reports
- **HTML Report**: Interactive Playwright report with traces
- **JUnit XML**: For CI/CD integration
- **GitHub Comments**: PR comments with test summaries
- **Artifacts**: Screenshots, videos, and traces for failed tests

### Running in CI
```bash
# Install browsers with dependencies
npx playwright install --with-deps

# Run with CI-specific settings
npx playwright test --reporter=github
```

## Development Workflow

### Writing New Tests
1. Use the `test` fixture from `test-fixtures.js`
2. Leverage page objects for maintainable selectors
3. Include accessibility considerations
4. Add performance assertions where relevant

### Debugging Failed Tests
```bash
# Run specific test with debug mode
npx playwright test --debug review-generation.spec.js

# Run with headed browser to see what's happening
npx playwright test --headed --project=chromium

# Generate trace for analysis
npx playwright test --trace=on
```

### Test Development Best Practices

#### 1. Use Page Objects
```javascript
// Good - using page object
await reviewPage.fillForm(testData);

// Bad - direct selectors in test
await page.fill('#hotelName', 'Test Hotel');
```

#### 2. Wait for Proper States
```javascript
// Good - wait for specific condition
await reviewPage.waitForReviewGeneration();

// Bad - arbitrary timeout
await page.waitForTimeout(2000);
```

#### 3. Test Behavior, Not Implementation
```javascript
// Good - test user behavior
const reviewText = await reviewPage.waitForReviewGeneration();
expect(reviewText).toContain('Hotel Name');

// Bad - test internal implementation
expect(page.locator('.api-call-count')).toHaveText('1');
```

## Performance Benchmarks

### Load Time Targets
- Initial page load: < 3 seconds
- DOM Content Loaded: < 1.5 seconds  
- First Contentful Paint: < 2 seconds

### Interaction Targets
- Form interactions: < 100ms response
- Review generation: < 5 seconds total
- Memory increase per operation: < 10MB

### Resource Loading Limits
- CSS files: < 10 requests
- JavaScript files: < 15 requests
- Images: < 20 requests
- Total requests: < 50

## Troubleshooting

### Common Issues

#### Tests Failing Due to Server Not Starting
```bash
# Make sure dev server is not already running
pkill -f "http-server"

# Check port availability
lsof -i :3000
```

#### Browser Installation Issues
```bash
# Reinstall browsers
npx playwright install --force

# Install with system dependencies (Linux)
npx playwright install --with-deps
```

#### Flaky Tests
- Use proper waiting strategies (waitForSelector, waitForLoadState)
- Avoid hard-coded timeouts
- Mock external dependencies
- Use retry mechanisms for network-dependent tests

#### Debugging Accessibility Tests
```bash
# Run only accessibility tests
npx playwright test accessibility.spec.js --headed

# Check axe-core violations in browser console
npx playwright test --debug accessibility.spec.js
```

## Maintenance

### Regular Tasks
- Update browser versions: `npx playwright install`
- Review and update performance benchmarks quarterly
- Check accessibility compliance with new WCAG guidelines
- Update test data and mock responses as API evolves

### Monitoring
- Track test execution times in CI
- Monitor flaky test rates
- Review test coverage reports
- Validate performance benchmarks against real-world usage

## Contributing

When adding new E2E tests:
1. Follow the existing page object pattern
2. Include accessibility considerations
3. Add performance assertions for user-facing features
4. Update this documentation for new test categories
5. Ensure tests work across all supported browsers