/**
 * E2E Accessibility Tests for Hotel Review Generator
 * Tests keyboard navigation, screen reader compatibility, and ARIA compliance
 */

const { test } = require('./fixtures/test-fixtures');
const { expect } = require('@playwright/test');
const { injectAxe, checkA11y } = require('axe-playwright');

test.describe('Hotel Review Generator - Accessibility', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-feedback-portal-v7-modular.html');
    await page.waitForLoadState('networkidle');
    await injectAxe(page);
  });

  test('should pass automated accessibility checks', async ({ page }) => {
    // Check initial page accessibility
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Get all focusable elements
    const focusableElements = await page.locator('input, select, button, [tabindex]:not([tabindex="-1"])').all();
    
    if (focusableElements.length > 0) {
      // Focus first element
      await focusableElements[0].focus();
      
      // Tab through elements
      for (let i = 1; i < Math.min(focusableElements.length, 10); i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        
        // Check that focus is visible
        const activeElement = await page.evaluate(() => {
          const active = document.activeElement;
          return active ? active.tagName : null;
        });
        expect(['INPUT', 'SELECT', 'BUTTON', 'A'].includes(activeElement)).toBe(true);
      }
    }
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    // Check hotel name input has proper labeling
    const hotelInput = page.locator('#hotelName');
    await expect(hotelInput).toHaveAttribute('aria-label');
    
    // Check buttons have accessible names
    const generateButton = page.locator('#generateBtn');
    const buttonText = await generateButton.textContent();
    expect(buttonText.trim().length).toBeGreaterThan(0);
    
    // Check rating buttons have proper ARIA attributes
    const ratingButtons = page.locator('[data-rating]');
    const count = await ratingButtons.count();
    
    for (let i = 0; i < count; i++) {
      const button = ratingButtons.nth(i);
      await expect(button).toHaveAttribute('data-rating');
      await expect(button).toBeVisible();
    }
  });

  test('should provide screen reader friendly content', async ({ page }) => {
    // Check main heading structure
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    
    const headingText = await mainHeading.textContent();
    expect(headingText.trim().length).toBeGreaterThan(0);
    
    // Check form labels
    const labels = page.locator('label');
    const labelCount = await labels.count();
    
    // Should have labels for form inputs
    expect(labelCount).toBeGreaterThan(0);
    
    // Check that form has proper structure
    await expect(page.locator('form, [role="form"]')).toBeVisible();
  });

  test('should handle keyboard interactions for rating selection', async ({ page }) => {
    // Focus on rating area
    const firstRating = page.locator('[data-rating="1"]');
    await firstRating.focus();
    
    // Use arrow keys to navigate ratings
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    
    // Press Enter or Space to select
    await page.keyboard.press('Enter');
    
    // Verify selection
    const selectedRating = page.locator('[data-rating="3"]');
    await expect(selectedRating).toHaveClass(/active|selected/);
  });

  test('should handle keyboard interactions for highlights', async ({ page }) => {
    // Focus on first highlight
    const firstHighlight = page.locator('[data-highlight]').first();
    await firstHighlight.focus();
    
    // Press Space or Enter to toggle
    await page.keyboard.press('Space');
    
    // Verify highlight is selected
    await expect(firstHighlight).toHaveClass(/active|selected/);
    
    // Toggle again
    await page.keyboard.press('Space');
    await expect(firstHighlight).not.toHaveClass(/active|selected/);
  });

  test('should provide proper focus indicators', async ({ page }) => {
    // Get all interactive elements
    const interactiveElements = page.locator('button, input, select, [tabindex]:not([tabindex="-1"])');
    const count = await interactiveElements.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const element = interactiveElements.nth(i);
      await element.focus();
      
      // Check that element has focus styling
      const computedStyle = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          outline: style.outline,
          outlineWidth: style.outlineWidth,
          outlineColor: style.outlineColor,
          boxShadow: style.boxShadow
        };
      });
      
      // Should have some focus indicator
      const hasFocusIndicator = 
        computedStyle.outline !== 'none' ||
        computedStyle.outlineWidth !== '0px' ||
        computedStyle.boxShadow !== 'none';
        
      expect(hasFocusIndicator).toBe(true);
    }
  });

  test('should announce form validation errors to screen readers', async ({ page }) => {
    // Try to generate without hotel name
    await page.click('#generateBtn');
    
    // Check for ARIA live region or proper error announcement
    const errorMessage = page.locator('#errorMessage, [role="alert"], .error-message');
    await expect(errorMessage).toBeVisible();
    
    // Check if error has proper ARIA attributes
    const ariaLive = await errorMessage.getAttribute('aria-live');
    const role = await errorMessage.getAttribute('role');
    
    expect(ariaLive === 'polite' || ariaLive === 'assertive' || role === 'alert').toBe(true);
  });

  test('should support high contrast mode', async ({ page }) => {
    // Simulate high contrast mode by checking color contrast
    const elements = page.locator('button, input, .highlight-btn, .rating-btn');
    const count = await elements.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const element = elements.nth(i);
      
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          border: computed.border
        };
      });
      
      // Should have distinct colors (not transparent/default)
      expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('should handle reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    });
    
    // Fill form and generate review
    await page.fill('#hotelName', 'Motion Test Hotel');
    await page.click('[data-highlight="location"]');
    await page.click('#generateBtn');
    
    // Check that animations are reduced or disabled
    const loadingElement = page.locator('#loading, .loading, .spinner');
    
    if (await loadingElement.isVisible()) {
      const animationDuration = await loadingElement.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return computed.animationDuration;
      });
      
      // Should have reduced animation duration or no animation
      expect(['0s', '0.01s'].includes(animationDuration) || animationDuration === '').toBe(true);
    }
  });

  test('should provide meaningful page title and meta information', async ({ page }) => {
    // Check page title is descriptive
    const title = await page.title();
    expect(title.toLowerCase()).toContain('hotel');
    expect(title.toLowerCase()).toContain('review');
    
    // Check meta description
    const metaDescription = await page.getAttribute('meta[name="description"]', 'content');
    if (metaDescription) {
      expect(metaDescription.length).toBeGreaterThan(50);
    }
    
    // Check lang attribute
    const htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBeTruthy();
    expect(htmlLang.length).toBeGreaterThanOrEqual(2);
  });

  test('should handle text scaling up to 200%', async ({ page }) => {
    // Simulate text scaling by setting larger font size
    await page.addStyleTag({
      content: `
        * {
          font-size: 200% !important;
        }
      `
    });
    
    await page.waitForTimeout(1000);
    
    // Check that content is still accessible and not overlapping
    const hotelInput = page.locator('#hotelName');
    const generateButton = page.locator('#generateBtn');
    
    await expect(hotelInput).toBeVisible();
    await expect(generateButton).toBeVisible();
    
    // Check that elements don't overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    // Allow some margin for scaling
    expect(bodyWidth).toBeLessThan(viewportWidth * 1.5);
  });
});