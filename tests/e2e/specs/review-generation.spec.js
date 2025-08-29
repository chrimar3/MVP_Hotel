/**
 * E2E Tests for Review Generation
 * Complete user journey testing with Playwright
 */

const { test, expect } = require('@playwright/test');

test.describe('Hotel Review Generator E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/guest-feedback-portal-v7-modular.html');
        await page.waitForLoadState('networkidle');
    });

    test('should load the application correctly', async ({ page }) => {
        // Check main elements are present
        await expect(page.locator('h1')).toContainText('Share Your Experience');
        await expect(page.locator('#hotelName')).toBeVisible();
        await expect(page.locator('#generateBtn')).toBeVisible();
        
        // Check security badge
        await expect(page.locator('.security-badge')).toContainText('Secure & Private');
    });

    test('should generate review with valid input', async ({ page }) => {
        // Enter hotel name
        await page.fill('#hotelName', 'E2E Test Hotel');
        
        // Select rating
        await page.click('[data-rating="5"]');
        
        // Select trip type
        await page.click('[data-type="leisure"]');
        
        // Select highlights
        await page.click('[data-highlight="location"]');
        await page.click('[data-highlight="service"]');
        
        // Generate review
        await page.click('#generateBtn');
        
        // Wait for review to appear
        await expect(page.locator('#previewSection')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('#reviewText')).not.toBeEmpty();
        
        // Check review contains hotel name
        const reviewText = await page.locator('#reviewText').textContent();
        expect(reviewText).toContain('E2E Test Hotel');
    });

    test('should show validation error for missing hotel name', async ({ page }) => {
        // Try to generate without hotel name
        await page.click('[data-highlight="location"]');
        await page.click('#generateBtn');
        
        // Check error message
        await expect(page.locator('#errorMessage')).toBeVisible();
        await expect(page.locator('#errorMessage')).toContainText('hotel name');
    });

    test('should show validation error for missing highlights', async ({ page }) => {
        // Enter hotel name but no highlights
        await page.fill('#hotelName', 'Test Hotel');
        await page.click('#generateBtn');
        
        // Check error message
        await expect(page.locator('#errorMessage')).toBeVisible();
        await expect(page.locator('#errorMessage')).toContainText('highlight');
    });

    test('should copy review to clipboard', async ({ page, context }) => {
        // Grant clipboard permissions
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        
        // Generate a review
        await page.fill('#hotelName', 'Copy Test Hotel');
        await page.click('[data-highlight="comfort"]');
        await page.click('#generateBtn');
        
        // Wait for review
        await expect(page.locator('#previewSection')).toBeVisible();
        
        // Copy to clipboard
        await page.click('#copyBtn');
        
        // Check success message
        await expect(page.locator('#successMessage')).toBeVisible();
        await expect(page.locator('#successMessage')).toContainText('copied');
        
        // Verify clipboard content
        const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboardText).toContain('Copy Test Hotel');
    });

    test('should open platform links in new tabs', async ({ page, context }) => {
        // Generate a review first
        await page.fill('#hotelName', 'Platform Test Hotel');
        await page.click('[data-highlight="breakfast"]');
        await page.click('#generateBtn');
        
        await expect(page.locator('#previewSection')).toBeVisible();
        
        // Test Booking.com button
        const [bookingPage] = await Promise.all([
            context.waitForEvent('page'),
            page.click('#bookingBtn')
        ]);
        expect(bookingPage.url()).toContain('booking.com');
        await bookingPage.close();
        
        // Test Google Maps button
        const [googlePage] = await Promise.all([
            context.waitForEvent('page'),
            page.click('#googleBtn')
        ]);
        expect(googlePage.url()).toContain('google.com/maps');
        await googlePage.close();
        
        // Test TripAdvisor button
        const [tripPage] = await Promise.all([
            context.waitForEvent('page'),
            page.click('#tripBtn')
        ]);
        expect(tripPage.url()).toContain('tripadvisor.com');
        await tripPage.close();
    });

    test('should handle URL parameters correctly', async ({ page }) => {
        // Navigate with URL parameters
        await page.goto('/guest-feedback-portal-v7-modular.html?source=booking&hotel=URL%20Param%20Hotel');
        
        // Check hotel name is pre-filled
        const hotelNameValue = await page.inputValue('#hotelName');
        expect(hotelNameValue).toBe('URL Param Hotel');
    });

    test('should update statistics after generation', async ({ page }) => {
        // Check initial stats
        await expect(page.locator('#statReviews')).toHaveText('0');
        
        // Generate first review
        await page.fill('#hotelName', 'Stats Test Hotel');
        await page.click('[data-rating="5"]');
        await page.click('[data-highlight="wifi"]');
        await page.click('#generateBtn');
        
        await expect(page.locator('#previewSection')).toBeVisible();
        
        // Check stats updated
        await expect(page.locator('#statReviews')).toHaveText('1');
        await expect(page.locator('#statRating')).toHaveText('5.0');
        
        // Generate second review with different rating
        await page.click('[data-rating="3"]');
        await page.click('#generateBtn');
        
        await expect(page.locator('#statReviews')).toHaveText('2');
        await expect(page.locator('#statRating')).toHaveText('4.0'); // Average of 5 and 3
    });

    test('should be responsive on mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 390, height: 844 });
        
        // Check mobile layout
        await expect(page.locator('.container')).toBeVisible();
        await expect(page.locator('#hotelName')).toBeVisible();
        
        // Test interaction on mobile
        await page.fill('#hotelName', 'Mobile Test Hotel');
        await page.click('[data-rating="4"]');
        await page.click('[data-highlight="location"]');
        await page.click('#generateBtn');
        
        await expect(page.locator('#previewSection')).toBeVisible();
    });

    test('should show API status indicator', async ({ page }) => {
        // Check API status is displayed
        await expect(page.locator('#llmStatus')).toBeVisible();
        await expect(page.locator('#llmStatusText')).not.toBeEmpty();
        
        // Status should be either active, inactive, or fallback
        const statusClasses = await page.locator('#llmStatus').getAttribute('class');
        expect(statusClasses).toMatch(/active|inactive|fallback/);
    });

    test('should handle rapid clicking gracefully', async ({ page }) => {
        // Set up valid input
        await page.fill('#hotelName', 'Rapid Test Hotel');
        await page.click('[data-highlight="amenities"]');
        
        // Click generate button multiple times rapidly
        await Promise.all([
            page.click('#generateBtn'),
            page.click('#generateBtn'),
            page.click('#generateBtn')
        ]);
        
        // Should still work and show only one review
        await expect(page.locator('#previewSection')).toBeVisible();
        
        // Loading should be hidden
        await expect(page.locator('#loading')).not.toBeVisible();
    });

    test('should toggle highlights correctly', async ({ page }) => {
        const locationBtn = page.locator('[data-highlight="location"]');
        
        // Click to activate
        await locationBtn.click();
        await expect(locationBtn).toHaveClass(/active/);
        
        // Click to deactivate
        await locationBtn.click();
        await expect(locationBtn).not.toHaveClass(/active/);
        
        // Click to reactivate
        await locationBtn.click();
        await expect(locationBtn).toHaveClass(/active/);
    });

    test('should sanitize user input', async ({ page }) => {
        // Try to inject script tag
        await page.fill('#hotelName', '<script>alert("XSS")</script>Hotel');
        await page.click('[data-highlight="value"]');
        await page.click('#generateBtn');
        
        // Wait for review
        await expect(page.locator('#previewSection')).toBeVisible();
        
        // Check that script was sanitized
        const reviewText = await page.locator('#reviewText').textContent();
        expect(reviewText).not.toContain('<script>');
        expect(reviewText).toContain('Hotel');
    });

    test('should persist statistics across page reloads', async ({ page }) => {
        // Generate a review
        await page.fill('#hotelName', 'Persist Test Hotel');
        await page.click('[data-rating="4"]');
        await page.click('[data-highlight="cleanliness"]');
        await page.click('#generateBtn');
        
        await expect(page.locator('#previewSection')).toBeVisible();
        await expect(page.locator('#statReviews')).toHaveText('1');
        
        // Reload page
        await page.reload();
        
        // Check stats persisted
        await expect(page.locator('#statReviews')).toHaveText('1');
        await expect(page.locator('#statRating')).toHaveText('4.0');
    });

    test('should handle network errors gracefully', async ({ page }) => {
        // Simulate network failure
        await page.route('**/api.openai.com/**', route => route.abort());
        await page.route('**/api.groq.com/**', route => route.abort());
        
        // Try to generate review
        await page.fill('#hotelName', 'Network Error Hotel');
        await page.click('[data-highlight="location"]');
        await page.click('#generateBtn');
        
        // Should fall back to template and still show review
        await expect(page.locator('#previewSection')).toBeVisible({ timeout: 5000 });
        
        const reviewText = await page.locator('#reviewText').textContent();
        expect(reviewText).toContain('Network Error Hotel');
    });
});