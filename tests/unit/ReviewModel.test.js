/**
 * Unit Tests for ReviewModel
 * Tests state management, validation, and business logic
 */

const ReviewModel = require('../../src/models/ReviewModel.js');

describe('ReviewModel', () => {
  let model;

  beforeEach(() => {
    // Reset localStorage mock - use jest.clearAllMocks() which is set up in setup.js
    jest.clearAllMocks();
    
    // Set default return value for getItem
    localStorage.getItem.mockReturnValue(null);
    
    // Create new model instance
    model = new ReviewModel();
  });

  describe('Initialization', () => {
    test('should initialize with default state', () => {
      const state = model.getState();
      
      expect(state.hotelName).toBe('');
      expect(state.rating).toBe(5);
      expect(state.tripType).toBe('leisure');
      expect(state.highlights).toEqual([]);
      expect(state.language).toBe('en');
      expect(state.voice).toBe('friendly');
      expect(state.nights).toBe(3);
      expect(state.guests).toBe(2);
      expect(state.source).toBe('direct');
      expect(state.generatedReview).toBeNull();
      expect(state.statistics.totalGenerated).toBe(0);
    });

    test('should load state from localStorage if available', () => {
      const savedState = {
        statistics: {
          totalGenerated: 5,
          averageRating: 4.2,
          popularHighlights: [{ name: 'location', count: 3 }]
        },
        language: 'es',
        voice: 'professional'
      };
      
      localStorage.getItem.mockReturnValue(JSON.stringify(savedState));
      
      const loadedModel = new ReviewModel();
      const state = loadedModel.getState();
      
      expect(state.statistics.totalGenerated).toBe(5);
      expect(state.language).toBe('es');
      expect(state.voice).toBe('professional');
    });

    test('should handle localStorage load errors gracefully', () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      expect(() => new ReviewModel()).not.toThrow();
    });
  });

  describe('State Management', () => {
    test('should update state correctly', () => {
      const updates = {
        hotelName: 'Grand Hotel',
        rating: 4,
        tripType: 'business'
      };
      
      model.setState(updates);
      const state = model.getState();
      
      expect(state.hotelName).toBe('Grand Hotel');
      expect(state.rating).toBe(4);
      expect(state.tripType).toBe('business');
    });

    test('should preserve existing state when updating', () => {
      model.setState({ hotelName: 'Test Hotel' });
      model.setState({ rating: 3 });
      
      const state = model.getState();
      expect(state.hotelName).toBe('Test Hotel');
      expect(state.rating).toBe(3);
      expect(state.language).toBe('en'); // Should preserve default
    });

    test('should return immutable state copy', () => {
      const state1 = model.getState();
      const state2 = model.getState();
      
      expect(state1).not.toBe(state2); // Different object references
      expect(state1).toEqual(state2); // Same content
    });

    test('should save state to localStorage after updates', () => {
      model.setState({ language: 'fr', voice: 'enthusiastic' });
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'reviewModelState',
        expect.stringContaining('fr')
      );
    });

    test('should handle localStorage save errors gracefully', () => {
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      expect(() => {
        model.setState({ hotelName: 'Test' });
      }).not.toThrow();
    });
  });

  describe('Observer Pattern', () => {
    test('should allow subscribing to state changes', () => {
      const callback = jest.fn();
      const unsubscribe = model.subscribe(callback);
      
      expect(typeof unsubscribe).toBe('function');
      expect(model.observers).toContain(callback);
    });

    test('should notify observers of state changes', () => {
      const callback = jest.fn();
      model.subscribe(callback);
      
      model.setState({ hotelName: 'Observer Test Hotel' });
      
      expect(callback).toHaveBeenCalledWith('stateChange', {
        key: 'hotelName',
        value: 'Observer Test Hotel'
      });
    });

    test('should not notify observers if value unchanged', () => {
      const callback = jest.fn();
      model.subscribe(callback);
      
      model.setState({ rating: 5 }); // Same as default value
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should allow unsubscribing from state changes', () => {
      const callback = jest.fn();
      const unsubscribe = model.subscribe(callback);
      
      unsubscribe();
      model.setState({ hotelName: 'No Notification' });
      
      expect(callback).not.toHaveBeenCalled();
      expect(model.observers).not.toContain(callback);
    });

    test('should notify multiple observers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      model.subscribe(callback1);
      model.subscribe(callback2);
      
      model.setState({ rating: 4 });
      
      expect(callback1).toHaveBeenCalledWith('stateChange', {
        key: 'rating',
        value: 4
      });
      expect(callback2).toHaveBeenCalledWith('stateChange', {
        key: 'rating',
        value: 4
      });
    });
  });

  describe('Hotel Information', () => {
    test('should set hotel information with default source', () => {
      model.setHotelInfo('Luxury Resort');
      const state = model.getState();
      
      expect(state.hotelName).toBe('Luxury Resort');
      expect(state.source).toBe('direct');
    });

    test('should set hotel information with custom source', () => {
      model.setHotelInfo('Partner Hotel', 'booking.com');
      const state = model.getState();
      
      expect(state.hotelName).toBe('Partner Hotel');
      expect(state.source).toBe('booking.com');
    });
  });

  describe('Rating Management', () => {
    test('should set valid ratings', () => {
      [1, 2, 3, 4, 5].forEach(rating => {
        model.setRating(rating);
        expect(model.getState().rating).toBe(rating);
      });
    });

    test('should reject invalid ratings', () => {
      const originalRating = model.getState().rating;
      
      // Test invalid ratings
      [0, -1, 6, 10, 'five', null, undefined].forEach(invalidRating => {
        model.setRating(invalidRating);
        expect(model.getState().rating).toBe(originalRating);
      });
    });

    test('should update statistics when setting rating', () => {
      const callback = jest.fn();
      model.subscribe(callback);
      
      model.setRating(4);
      
      // Should call setState which triggers observer
      expect(callback).toHaveBeenCalledWith('stateChange', {
        key: 'rating',
        value: 4
      });
    });
  });

  describe('Trip Details', () => {
    test('should set trip details correctly', () => {
      model.setTripDetails('business', 7, 4);
      const state = model.getState();
      
      expect(state.tripType).toBe('business');
      expect(state.nights).toBe(7);
      expect(state.guests).toBe(4);
    });

    test('should handle partial trip details', () => {
      model.setTripDetails('family');
      const state = model.getState();
      
      expect(state.tripType).toBe('family');
      expect(state.nights).toBeUndefined();
      expect(state.guests).toBeUndefined();
    });
  });

  describe('Highlights Management', () => {
    test('should add highlights when not present', () => {
      model.toggleHighlight('location');
      model.toggleHighlight('service');
      
      const highlights = model.getState().highlights;
      expect(highlights).toContain('location');
      expect(highlights).toContain('service');
      expect(highlights).toHaveLength(2);
    });

    test('should remove highlights when already present', () => {
      model.setState({ highlights: ['location', 'service', 'cleanliness'] });
      
      model.toggleHighlight('service');
      
      const highlights = model.getState().highlights;
      expect(highlights).not.toContain('service');
      expect(highlights).toContain('location');
      expect(highlights).toContain('cleanliness');
      expect(highlights).toHaveLength(2);
    });

    test('should handle duplicate toggle attempts', () => {
      model.toggleHighlight('wifi');
      model.toggleHighlight('wifi');
      
      const highlights = model.getState().highlights;
      expect(highlights).toHaveLength(0);
    });

    test('should maintain highlight order', () => {
      model.toggleHighlight('location');
      model.toggleHighlight('service');
      model.toggleHighlight('cleanliness');
      
      const highlights = model.getState().highlights;
      expect(highlights[0]).toBe('location');
      expect(highlights[1]).toBe('service');
      expect(highlights[2]).toBe('cleanliness');
    });
  });

  describe('Language and Voice Settings', () => {
    test('should set language', () => {
      model.setLanguage('es');
      expect(model.getState().language).toBe('es');
    });

    test('should set voice', () => {
      model.setVoice('professional');
      expect(model.getState().voice).toBe('professional');
    });

    test('should handle various language codes', () => {
      const languages = ['en', 'es', 'fr', 'de', 'pt', 'zh'];
      
      languages.forEach(lang => {
        model.setLanguage(lang);
        expect(model.getState().language).toBe(lang);
      });
    });

    test('should handle different voice types', () => {
      const voices = ['friendly', 'professional', 'enthusiastic', 'detailed'];
      
      voices.forEach(voice => {
        model.setVoice(voice);
        expect(model.getState().voice).toBe(voice);
      });
    });
  });

  describe('Generated Review Management', () => {
    test('should store generated review and update statistics', () => {
      const callback = jest.fn();
      model.subscribe(callback);
      
      const review = {
        text: 'Great hotel with excellent service!',
        source: 'openai',
        latency: 1500
      };
      
      model.setGeneratedReview(review);
      
      const state = model.getState();
      expect(state.generatedReview).toEqual(review);
      expect(state.statistics.totalGenerated).toBe(1);
      
      // Should notify observers of review generation
      expect(callback).toHaveBeenCalledWith('reviewGenerated', review);
    });

    test('should increment total generated count', () => {
      const review1 = { text: 'Review 1' };
      const review2 = { text: 'Review 2' };
      
      model.setGeneratedReview(review1);
      expect(model.getState().statistics.totalGenerated).toBe(1);
      
      model.setGeneratedReview(review2);
      expect(model.getState().statistics.totalGenerated).toBe(2);
    });
  });

  describe('Statistics Management', () => {
    test('should update rating statistics correctly', () => {
      // First rating
      model.updateStatistics('rating', 5);
      expect(model.getState().statistics.averageRating).toBe(5);
      
      // Second rating
      model.setState({ statistics: { ...model.getState().statistics, totalGenerated: 1 } });
      model.updateStatistics('rating', 3);
      
      // Average should be (5 * 1 + 3) / 2 = 4
      expect(model.getState().statistics.averageRating).toBe(4);
    });

    test('should track popular highlights', () => {
      model.updateStatistics('highlight', 'location');
      model.updateStatistics('highlight', 'service');
      model.updateStatistics('highlight', 'location'); // Duplicate
      
      const highlights = model.getState().statistics.popularHighlights;
      
      expect(highlights).toHaveLength(2);
      expect(highlights[0]).toEqual({ name: 'location', count: 2 });
      expect(highlights[1]).toEqual({ name: 'service', count: 1 });
    });

    test('should sort highlights by popularity', () => {
      model.updateStatistics('highlight', 'service');
      model.updateStatistics('highlight', 'location');
      model.updateStatistics('highlight', 'cleanliness');
      model.updateStatistics('highlight', 'location');
      model.updateStatistics('highlight', 'location');
      
      const highlights = model.getState().statistics.popularHighlights;
      
      expect(highlights[0].name).toBe('location');
      expect(highlights[0].count).toBe(3);
      expect(highlights[1].name).toBe('service');
      expect(highlights[2].name).toBe('cleanliness');
    });

    test('should limit popular highlights to 10 items', () => {
      // Add 15 different highlights
      for (let i = 0; i < 15; i++) {
        model.updateStatistics('highlight', `highlight_${i}`);
      }
      
      const highlights = model.getState().statistics.popularHighlights;
      expect(highlights).toHaveLength(10);
    });
  });

  describe('Validation', () => {
    test('should validate complete valid state', () => {
      model.setState({
        hotelName: 'Valid Hotel',
        rating: 4,
        highlights: ['location', 'service']
      });
      
      const validation = model.validate();
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect missing hotel name', () => {
      model.setState({ hotelName: '' });
      
      const validation = model.validate();
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Hotel name is required');
    });

    test('should detect short hotel name', () => {
      model.setState({ hotelName: 'A' });
      
      const validation = model.validate();
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Hotel name is required');
    });

    test('should detect invalid ratings', () => {
      model.setState({ rating: 0 });
      
      let validation = model.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Valid rating is required');
      
      model.setState({ rating: 6 });
      validation = model.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Valid rating is required');
    });

    test('should detect missing highlights', () => {
      model.setState({
        hotelName: 'Test Hotel',
        rating: 5,
        highlights: []
      });
      
      const validation = model.validate();
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('At least one highlight must be selected');
    });

    test('should return multiple validation errors', () => {
      model.setState({
        hotelName: '',
        rating: 0,
        highlights: []
      });
      
      const validation = model.validate();
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(3);
    });

    test('should handle whitespace-only hotel name', () => {
      model.setState({ hotelName: '   ' });
      
      const validation = model.validate();
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Hotel name is required');
    });
  });

  describe('Reset Functionality', () => {
    test('should reset state to defaults while preserving statistics', () => {
      const callback = jest.fn();
      model.subscribe(callback);
      
      // Set up non-default state
      model.setState({
        hotelName: 'Test Hotel',
        rating: 3,
        tripType: 'business',
        highlights: ['location', 'service'],
        language: 'es',
        voice: 'professional',
        nights: 7,
        guests: 4,
        generatedReview: { text: 'test review' },
        statistics: {
          totalGenerated: 5,
          averageRating: 4.2,
          popularHighlights: [{ name: 'location', count: 3 }]
        }
      });
      
      model.reset();
      
      const state = model.getState();
      
      // Should reset to defaults
      expect(state.hotelName).toBe('');
      expect(state.rating).toBe(5);
      expect(state.tripType).toBe('leisure');
      expect(state.highlights).toEqual([]);
      expect(state.language).toBe('en');
      expect(state.voice).toBe('friendly');
      expect(state.nights).toBe(3);
      expect(state.guests).toBe(2);
      expect(state.generatedReview).toBeNull();
      
      // Should preserve statistics
      expect(state.statistics.totalGenerated).toBe(5);
      expect(state.statistics.averageRating).toBe(4.2);
      expect(state.statistics.popularHighlights).toHaveLength(1);
      
      // Should notify observers
      expect(callback).toHaveBeenCalledWith('reset', null);
    });
  });

  describe('Analytics Export', () => {
    test('should export analytics data', () => {
      model.setState({
        statistics: {
          totalGenerated: 10,
          averageRating: 4.5,
          popularHighlights: [
            { name: 'location', count: 5 },
            { name: 'service', count: 3 }
          ]
        }
      });
      
      const analytics = model.exportAnalytics();
      
      expect(analytics.totalReviews).toBe(10);
      expect(analytics.averageRating).toBe(4.5);
      expect(analytics.popularHighlights).toHaveLength(2);
      expect(analytics.timestamp).toBeTruthy();
      expect(new Date(analytics.timestamp)).toBeInstanceOf(Date);
    });

    test('should export analytics with default values', () => {
      const analytics = model.exportAnalytics();
      
      expect(analytics.totalReviews).toBe(0);
      expect(analytics.averageRating).toBe(0);
      expect(analytics.popularHighlights).toEqual([]);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle undefined/null values gracefully', () => {
      expect(() => {
        model.setState({ hotelName: null });
        model.setState({ rating: undefined });
        model.setState({ highlights: null });
      }).not.toThrow();
    });

    test('should handle invalid highlight values', () => {
      expect(() => {
        model.toggleHighlight(null);
        model.toggleHighlight(undefined);
        model.toggleHighlight('');
      }).not.toThrow();
    });

    test('should handle malformed statistics updates', () => {
      expect(() => {
        model.updateStatistics('invalid_type', 'value');
        model.updateStatistics('rating', 'not_a_number');
        model.updateStatistics('highlight', null);
      }).not.toThrow();
    });

    test('should handle observer errors gracefully', () => {
      const faultyCallback = jest.fn(() => {
        throw new Error('Observer error');
      });
      
      model.subscribe(faultyCallback);
      
      // Should not throw even if observer throws
      expect(() => {
        model.setState({ hotelName: 'Test' });
      }).not.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    test('should not save to localStorage on every state access', () => {
      model.getState();
      model.getState();
      model.getState();
      
      // localStorage.setItem should not be called just from getState
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    test('should handle large numbers of observers efficiently', () => {
      const callbacks = [];
      
      // Add many observers
      for (let i = 0; i < 100; i++) {
        callbacks.push(jest.fn());
        model.subscribe(callbacks[i]);
      }
      
      const start = performance.now();
      model.setState({ hotelName: 'Performance Test' });
      const end = performance.now();
      
      // Should complete quickly (less than 100ms for 100 observers)
      expect(end - start).toBeLessThan(100);
      
      // All observers should be called
      callbacks.forEach(callback => {
        expect(callback).toHaveBeenCalled();
      });
    });

    test('should handle rapid state changes efficiently', () => {
      const start = performance.now();
      
      // Rapid state changes
      for (let i = 0; i < 100; i++) {
        model.setState({ hotelName: `Hotel ${i}` });
      }
      
      const end = performance.now();
      
      // Should complete quickly
      expect(end - start).toBeLessThan(100);
      expect(model.getState().hotelName).toBe('Hotel 99');
    });
  });
});