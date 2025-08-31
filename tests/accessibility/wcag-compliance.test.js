/**
 * WCAG 2.1 AAA Compliance Tests
 * Automated accessibility testing for the review generator
 */

const { test, expect } = require('@playwright/test');
const { injectAxe, checkA11y } = require('axe-playwright');

test.describe('WCAG 2.1 AAA Compliance', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/review-generator.html');
        await injectAxe(page);
    });

    test('should pass automated accessibility checks', async ({ page }) => {
        // Run axe accessibility checks
        await checkA11y(page, null, {
            detailedReport: true,
            detailedReportOptions: {
                html: true
            },
            axeOptions: {
                runOnly: {
                    type: 'tag',
                    values: ['wcag2aaa', 'wcag21aaa', 'best-practice']
                }
            }
        });
    });

    test('should have proper heading hierarchy', async ({ page }) => {
        const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => 
            elements.map(el => ({
                level: parseInt(el.tagName[1]),
                text: el.textContent,
                visible: el.offsetParent !== null
            }))
        );

        // Check h1 exists and is unique
        const h1s = headings.filter(h => h.level === 1 && h.visible);
        expect(h1s).toHaveLength(1);

        // Check heading hierarchy doesn't skip levels
        const visibleHeadings = headings.filter(h => h.visible);
        for (let i = 1; i < visibleHeadings.length; i++) {
            const levelDiff = visibleHeadings[i].level - visibleHeadings[i-1].level;
            expect(levelDiff).toBeLessThanOrEqual(1);
        }
    });

    test('should have skip to main content link', async ({ page }) => {
        // Focus the skip link
        await page.keyboard.press('Tab');
        
        const skipLink = await page.locator('.skip-link:focus');
        await expect(skipLink).toBeVisible();
        await expect(skipLink).toHaveText(/skip to main/i);
        
        // Activate skip link
        await page.keyboard.press('Enter');
        
        // Check focus moved to main content
        const mainContent = await page.locator('#main-content');
        await expect(mainContent).toBeFocused();
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
        // Check form has proper labeling
        const inputs = await page.locator('input, button, select');
        const count = await inputs.count();
        
        for (let i = 0; i < count; i++) {
            const input = inputs.nth(i);
            const hasLabel = await input.evaluate(el => {
                const id = el.id;
                const label = document.querySelector(`label[for="${id}"]`);
                const ariaLabel = el.getAttribute('aria-label');
                const ariaLabelledby = el.getAttribute('aria-labelledby');
                return !!(label || ariaLabel || ariaLabelledby);
            });
            
            expect(hasLabel).toBeTruthy();
        }
    });

    test('should support keyboard navigation', async ({ page }) => {
        // Tab through all interactive elements
        const interactiveElements = await page.locator('button, input, a, [tabindex="0"]');
        const count = await interactiveElements.count();
        
        for (let i = 0; i < count; i++) {
            await page.keyboard.press('Tab');
            const focusedElement = await page.evaluate(() => document.activeElement.tagName);
            expect(['BUTTON', 'INPUT', 'A']).toContain(focusedElement);
        }
    });

    test('should have sufficient color contrast', async ({ page }) => {
        // Check text contrast ratios meet WCAG AAA (7:1 for normal text, 4.5:1 for large text)
        const contrastIssues = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            const issues = [];
            
            elements.forEach(el => {
                const style = window.getComputedStyle(el);
                const color = style.color;
                const bgColor = style.backgroundColor;
                const fontSize = parseFloat(style.fontSize);
                
                // Simple contrast check (would use color contrast library in production)
                if (color && bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
                    // This is a simplified check - use a proper contrast library
                    const rgb = color.match(/\d+/g);
                    const bgRgb = bgColor.match(/\d+/g);
                    
                    if (rgb && bgRgb) {
                        // Calculate relative luminance (simplified)
                        const getLuminance = (r, g, b) => {
                            const [rs, gs, bs] = [r, g, b].map(c => {
                                c = c / 255;
                                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
                            });
                            return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
                        };
                        
                        const l1 = getLuminance(...rgb);
                        const l2 = getLuminance(...bgRgb);
                        const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
                        
                        const requiredRatio = fontSize >= 18 ? 4.5 : 7;
                        if (contrast < requiredRatio) {
                            issues.push({
                                element: el.tagName,
                                contrast: contrast.toFixed(2),
                                required: requiredRatio
                            });
                        }
                    }
                }
            });
            
            return issues;
        });
        
        expect(contrastIssues).toHaveLength(0);
    });

    test('should have focus indicators', async ({ page }) => {
        // Check all interactive elements have visible focus indicators
        const buttons = await page.locator('button');
        const firstButton = buttons.first();
        
        await firstButton.focus();
        
        const hasOutline = await firstButton.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.outlineWidth !== '0px' || style.boxShadow !== 'none';
        });
        
        expect(hasOutline).toBeTruthy();
    });

    test('should announce live regions', async ({ page }) => {
        // Check live region exists and works
        const liveRegion = await page.locator('[aria-live]');
        await expect(liveRegion).toHaveCount(3); // polite, assertive regions
        
        // Generate an error to test assertive announcement
        await page.click('#generateBtn');
        
        const errorMessage = await page.locator('[role="alert"]');
        await expect(errorMessage).toBeVisible();
    });

    test('should support screen reader forms', async ({ page }) => {
        // Check form inputs have proper attributes
        const hotelInput = await page.locator('#hotelName');
        
        await expect(hotelInput).toHaveAttribute('aria-required', 'true');
        await expect(hotelInput).toHaveAttribute('aria-describedby', 'hotelNameHelp');
        
        // Check fieldsets have legends
        const fieldsets = await page.locator('fieldset');
        const count = await fieldsets.count();
        
        for (let i = 0; i < count; i++) {
            const fieldset = fieldsets.nth(i);
            const legend = await fieldset.locator('legend');
            await expect(legend).toBeVisible();
            await expect(legend).not.toBeEmpty();
        }
    });

    test('should handle radio groups properly', async ({ page }) => {
        // Check rating buttons work as radio group
        const ratingButtons = await page.locator('.rating-btn');
        
        // Click first rating
        await ratingButtons.first().click();
        await expect(ratingButtons.first()).toHaveAttribute('aria-checked', 'true');
        
        // Click second rating
        await ratingButtons.nth(1).click();
        await expect(ratingButtons.first()).toHaveAttribute('aria-checked', 'false');
        await expect(ratingButtons.nth(1)).toHaveAttribute('aria-checked', 'true');
    });

    test('should support arrow key navigation', async ({ page }) => {
        // Focus first rating button
        const firstRating = await page.locator('[data-rating="1"]');
        await firstRating.focus();
        
        // Press right arrow
        await page.keyboard.press('ArrowRight');
        
        // Check focus moved to next button
        const secondRating = await page.locator('[data-rating="2"]');
        await expect(secondRating).toBeFocused();
        
        // Press left arrow
        await page.keyboard.press('ArrowLeft');
        await expect(firstRating).toBeFocused();
    });

    test('should respect prefers-reduced-motion', async ({ page }) => {
        // Enable reduced motion
        await page.emulateMedia({ reducedMotion: 'reduce' });
        
        // Check animations are disabled
        const hasReducedMotion = await page.evaluate(() => {
            const element = document.querySelector('.preview-section');
            const style = window.getComputedStyle(element);
            return style.animationDuration === '0.01ms';
        });
        
        expect(hasReducedMotion).toBeTruthy();
    });

    test('should support high contrast mode', async ({ page }) => {
        // Emulate high contrast
        await page.emulateMedia({ forcedColors: 'active' });
        
        // Check elements are still visible
        const buttons = await page.locator('button');
        const count = await buttons.count();
        
        for (let i = 0; i < count; i++) {
            await expect(buttons.nth(i)).toBeVisible();
        }
    });

    test('should have proper touch targets', async ({ page }) => {
        // Check all buttons meet minimum size (44x44px)
        const buttons = await page.locator('button');
        const count = await buttons.count();
        
        for (let i = 0; i < count; i++) {
            const button = buttons.nth(i);
            const box = await button.boundingBox();
            
            expect(box.width).toBeGreaterThanOrEqual(44);
            expect(box.height).toBeGreaterThanOrEqual(44);
        }
    });

    test('should have accessible error messages', async ({ page }) => {
        // Trigger validation error
        await page.click('#generateBtn');
        
        // Check error is announced
        const error = await page.locator('[role="alert"]');
        await expect(error).toBeVisible();
        await expect(error).toHaveAttribute('aria-live', 'assertive');
    });

    test('should provide keyboard shortcuts info', async ({ page }) => {
        // Check keyboard info section exists
        const keyboardInfo = await page.locator('.keyboard-info');
        await expect(keyboardInfo).toBeVisible();
        await expect(keyboardInfo).toContainText('Tab');
        await expect(keyboardInfo).toContainText('Space');
        await expect(keyboardInfo).toContainText('Enter');
    });

    test('should support dark mode', async ({ page }) => {
        // Emulate dark mode
        await page.emulateMedia({ colorScheme: 'dark' });
        
        // Check text is still readable
        const body = await page.locator('body');
        const bgColor = await body.evaluate(el => 
            window.getComputedStyle(el).backgroundColor
        );
        
        // Background should be dark in dark mode
        expect(bgColor).not.toBe('rgb(255, 255, 255)');
    });

    test('should have lang attribute', async ({ page }) => {
        const html = await page.locator('html');
        await expect(html).toHaveAttribute('lang', 'en');
    });

    test('should have descriptive page title', async ({ page }) => {
        const title = await page.title();
        expect(title).toContain('Guest Feedback');
        expect(title).toContain('Accessible');
    });

    test('should handle form validation accessibly', async ({ page }) => {
        // Submit form without required fields
        await page.click('#generateBtn');
        
        // Check error is associated with input
        const hotelInput = await page.locator('#hotelName');
        const hasError = await hotelInput.evaluate(el => {
            return el.validity && !el.validity.valid;
        });
        
        expect(hasError).toBeTruthy();
    });
});