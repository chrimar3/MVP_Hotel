/**
 * @fileoverview Test suite for Hotel Review Generator v3
 * @description TDD-first approach for all new features
 */

describe('HotelReviewGenerator v3 Features', () => {
  let generator;
  
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="hotel-name"></div>
      <div id="output-section" class="hidden"></div>
      <div id="review-output"></div>
      <div id="platform-submit"></div>
      <div id="review-length-indicator"></div>
      <div id="language-selector"></div>
      <div id="form-sections"></div>
    `;
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn()
    };
    global.localStorage = localStorageMock;
  });

  describe('One-Tap Review Submission', () => {
    it('should show platform submit buttons after review generation', () => {
      // Arrange
      const review = 'Great hotel with excellent service!';
      
      // Act
      generator.generateReview();
      generator.showPlatformButtons(review);
      
      // Assert
      const buttons = document.querySelectorAll('.platform-submit-btn');
      expect(buttons.length).toBeGreaterThan(0);
      expect(buttons[0].textContent).toContain('Booking.com');
    });

    it('should open correct platform URL with review copied', () => {
      // Arrange
      const review = 'Amazing stay!';
      const hotelName = 'Grand Hotel';
      window.open = jest.fn();
      
      // Act
      generator.submitToPlatform('booking', review, hotelName);
      
      // Assert
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('booking.com'),
        '_blank'
      );
    });

    it('should track platform submission analytics', () => {
      // Arrange
      const trackEvent = jest.fn();
      generator.analytics = { track: trackEvent };
      
      // Act
      generator.submitToPlatform('google', 'Great!', 'Hotel');
      
      // Assert
      expect(trackEvent).toHaveBeenCalledWith('platform_submit', {
        platform: 'google',
        reviewLength: 6
      });
    });
  });

  describe('Micro-Animations', () => {
    it('should add animation class on button click', () => {
      // Arrange
      const button = document.createElement('button');
      button.classList.add('btn');
      
      // Act
      generator.addMicroAnimations();
      button.click();
      
      // Assert
      expect(button.classList.contains('btn-pressed')).toBe(true);
    });

    it('should show skeleton loader during generation', () => {
      // Arrange
      const output = document.getElementById('output-section');
      
      // Act
      generator.showSkeletonLoader();
      
      // Assert
      expect(output.querySelector('.skeleton-loader')).toBeTruthy();
    });

    it('should remove animation classes after animation ends', (done) => {
      // Arrange
      const button = document.createElement('button');
      
      // Act
      generator.animateButton(button);
      
      // Assert
      setTimeout(() => {
        expect(button.classList.contains('btn-pressed')).toBe(false);
        done();
      }, 300);
    });
  });

  describe('Multi-Language Support', () => {
    it('should detect browser language on init', () => {
      // Arrange
      navigator.language = 'es-ES';
      
      // Act
      const detected = generator.detectLanguage();
      
      // Assert
      expect(detected).toBe('es');
    });

    it('should translate UI elements but not review', () => {
      // Arrange
      const translations = {
        es: { generate: 'Generar' }
      };
      
      // Act
      generator.translateUI('es');
      const review = generator.generateReview();
      
      // Assert
      expect(document.querySelector('.btn').textContent).toContain('Generar');
      expect(review).toMatch(/^[A-Za-z\s.,!]+$/); // English only
    });

    it('should persist language preference', () => {
      // Act
      generator.setLanguage('fr');
      
      // Assert
      expect(localStorage.setItem).toHaveBeenCalledWith('preferred_language', 'fr');
    });
  });

  describe('Progressive Form Disclosure', () => {
    it('should only show hotel name field initially', () => {
      // Act
      generator.initProgressiveForm();
      
      // Assert
      const sections = document.querySelectorAll('.form-section:not(.hidden)');
      expect(sections.length).toBe(1);
      expect(sections[0].id).toBe('hotel-section');
    });

    it('should reveal aspects after hotel name is entered', () => {
      // Arrange
      const hotelInput = document.getElementById('hotel-name');
      
      // Act
      hotelInput.value = 'Test Hotel';
      hotelInput.dispatchEvent(new Event('input'));
      
      // Assert
      const aspectsSection = document.getElementById('aspects-section');
      expect(aspectsSection.classList.contains('hidden')).toBe(false);
    });

    it('should show progress indicator for each revealed section', () => {
      // Act
      generator.revealSection('aspects');
      generator.revealSection('comments');
      
      // Assert
      const progress = generator.getProgressPercentage();
      expect(progress).toBeGreaterThan(50);
    });
  });

  describe('Review Length Indicator', () => {
    it('should show "perfect" for optimal length (100-200 chars)', () => {
      // Arrange
      const review = 'a'.repeat(150);
      
      // Act
      const indicator = generator.getLengthIndicator(review);
      
      // Assert
      expect(indicator.status).toBe('perfect');
      expect(indicator.message).toContain('Perfect length');
    });

    it('should warn when review is too short (<50 chars)', () => {
      // Arrange
      const review = 'Too short';
      
      // Act
      const indicator = generator.getLengthIndicator(review);
      
      // Assert
      expect(indicator.status).toBe('warning');
      expect(indicator.message).toContain('Add more detail');
    });

    it('should update indicator in real-time', () => {
      // Arrange
      const textarea = document.createElement('textarea');
      const indicator = document.getElementById('review-length-indicator');
      
      // Act
      generator.attachLengthIndicator(textarea, indicator);
      textarea.value = 'a'.repeat(120);
      textarea.dispatchEvent(new Event('input'));
      
      // Assert
      expect(indicator.textContent).toContain('Perfect');
    });
  });

  describe('Platform Validation', () => {
    it('should detect profanity in review', () => {
      // Arrange
      const badReview = 'This hotel was damn awful';
      
      // Act
      const validation = generator.validateReview(badReview);
      
      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('inappropriate language');
    });

    it('should ensure minimum length requirement', () => {
      // Arrange
      const shortReview = 'OK';
      
      // Act
      const validation = generator.validateReview(shortReview);
      
      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('too short');
    });

    it('should verify hotel name is included', () => {
      // Arrange
      const hotelName = 'Grand Plaza';
      const review = 'Great experience and wonderful staff!';
      
      // Act
      const validation = generator.validateReview(review, hotelName);
      
      // Assert
      expect(validation.warnings).toContain('hotel name not mentioned');
    });

    it('should show green checkmark for valid review', () => {
      // Arrange
      const validReview = 'Grand Plaza Hotel was amazing! Clean rooms, great location, and friendly staff made our stay perfect.';
      
      // Act
      generator.showValidation(validReview);
      
      // Assert
      const indicator = document.querySelector('.validation-indicator');
      expect(indicator.classList.contains('valid')).toBe(true);
    });
  });

  describe('Exit Intent Draft Save', () => {
    it('should detect when user tries to leave with unsaved changes', () => {
      // Arrange
      const mockEvent = { preventDefault: jest.fn() };
      document.getElementById('hotel-name').value = 'Test Hotel';
      
      // Act
      const result = generator.handleBeforeUnload(mockEvent);
      
      // Assert
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('should not prompt if form is empty', () => {
      // Arrange
      const mockEvent = { preventDefault: jest.fn() };
      
      // Act
      const result = generator.handleBeforeUnload(mockEvent);
      
      // Assert
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(result).toBeFalsy();
    });

    it('should auto-save draft when page visibility changes', () => {
      // Arrange
      document.getElementById('hotel-name').value = 'Hotel';
      const saveSpy = jest.spyOn(generator, 'saveDraft');
      
      // Act
      document.dispatchEvent(new Event('visibilitychange'));
      
      // Assert
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('Performance Optimizations', () => {
    it('should debounce auto-save to prevent excessive saves', (done) => {
      // Arrange
      const saveSpy = jest.spyOn(generator, 'saveDraft');
      const input = document.getElementById('hotel-name');
      
      // Act
      for (let i = 0; i < 10; i++) {
        input.value = `Hotel ${i}`;
        input.dispatchEvent(new Event('input'));
      }
      
      // Assert
      setTimeout(() => {
        expect(saveSpy).toHaveBeenCalledTimes(1);
        done();
      }, 600);
    });

    it('should lazy-load language translations', async () => {
      // Arrange
      const loadSpy = jest.spyOn(generator, 'loadTranslations');
      
      // Act
      await generator.setLanguage('fr');
      
      // Assert
      expect(loadSpy).toHaveBeenCalledWith('fr');
    });

    it('should cache platform URLs for faster submission', () => {
      // Act
      const url1 = generator.getPlatformUrl('booking');
      const url2 = generator.getPlatformUrl('booking');
      
      // Assert
      expect(url1).toBe(url2); // Same reference = cached
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      // Act
      generator.init();
      
      // Assert
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        expect(btn.getAttribute('aria-label') || btn.textContent).toBeTruthy();
      });
    });

    it('should be keyboard navigable', () => {
      // Arrange
      const form = generator.createForm();
      
      // Assert
      const focusable = form.querySelectorAll('button, input, textarea, select');
      focusable.forEach(el => {
        expect(el.tabIndex).toBeGreaterThanOrEqual(0);
      });
    });

    it('should announce changes to screen readers', () => {
      // Arrange
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      
      // Act
      generator.announce('Review generated successfully');
      
      // Assert
      expect(announcement.textContent).toContain('Review generated');
    });
  });

  describe('Error Handling', () => {
    it('should gracefully handle localStorage errors', () => {
      // Arrange
      localStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });
      
      // Act & Assert
      expect(() => generator.saveDraft()).not.toThrow();
    });

    it('should provide fallback for unsupported languages', () => {
      // Act
      const result = generator.translateUI('xyz');
      
      // Assert
      expect(result.language).toBe('en');
    });

    it('should handle network errors in platform submission', async () => {
      // Arrange
      window.open = jest.fn().mockReturnValue(null);
      
      // Act
      const result = await generator.submitToPlatform('booking');
      
      // Assert
      expect(result.error).toBeTruthy();
      expect(result.fallback).toBe('copy_to_clipboard');
    });
  });
});