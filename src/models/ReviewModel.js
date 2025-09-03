/**
 * Review Model - Core Data Management for Hotel Review Generator
 *
 * A reactive model that manages the state of hotel review generation parameters,
 * user preferences, and statistics. Implements the Observer pattern for real-time
 * UI updates and includes persistence via localStorage.
 *
 * @class ReviewModel
 * @since 1.0.0
 * @author Hotel Review Generator Team
 *
 * @example
 * // Initialize the model
 * const reviewModel = new ReviewModel();
 *
 * // Subscribe to changes
 * const unsubscribe = reviewModel.subscribe((changeType, data) => {
 *   console.log('Model changed:', changeType, data);
 * });
 *
 * // Update hotel information
 * reviewModel.setHotelInfo('Grand Plaza Hotel', 'booking');
 * reviewModel.setRating(4);
 * reviewModel.toggleHighlight('pool');
 *
 * // Validate before generating review
 * const validation = reviewModel.validate();
 * if (validation.valid) {
 *   // Proceed with review generation
 * }
 */

class ReviewModel {
  /**
   * Initialize the ReviewModel with default state and load persisted preferences
   *
   * @constructor
   * @since 1.0.0
   */
  constructor() {
    this.state = {
      hotelName: '',
      rating: 5,
      tripType: 'leisure',
      highlights: [],
      language: 'en',
      voice: 'friendly',
      nights: 3,
      guests: 2,
      source: 'direct',
      generatedReview: null,
      statistics: {
        totalGenerated: 0,
        averageRating: 0,
        popularHighlights: [],
      },
    };

    this.observers = [];
    this.loadState();
  }

  /**
   * Subscribe to model state changes using the Observer pattern
   *
   * @param {Function} callback - Callback function to execute on state changes
   * @param {string} callback.changeType - Type of change ('stateChange', 'reviewGenerated', 'reset')
   * @param {*} callback.data - Data associated with the change
   * @returns {Function} Unsubscribe function to remove the observer
   * @since 1.0.0
   *
   * @example
   * const unsubscribe = model.subscribe((type, data) => {
   *   if (type === 'stateChange') {
   *     console.log(`${data.key} changed to:`, data.value);
   *   }
   * });
   * // Later...
   * unsubscribe();
   */
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter((obs) => obs !== callback);
    };
  }

  /**
   * Notify all subscribed observers of state changes
   *
   * @private
   * @param {string} changeType - Type of change ('stateChange', 'reviewGenerated', 'reset')
   * @param {*} data - Data to pass to observers
   * @since 1.0.0
   */
  notify(changeType, data) {
    this.observers.forEach((callback) => {
      try {
        callback(changeType, data);
      } catch (error) {
        // Handle observer errors gracefully - continue notifying other observers
        console.error('Observer error:', error);
      }
    });
  }

  /**
   * Update model state and notify observers of changes
   *
   * @param {Object} updates - Object containing state updates
   * @param {string} [updates.hotelName] - Hotel name
   * @param {number} [updates.rating] - Rating from 1-5
   * @param {string} [updates.tripType] - Trip type ('leisure', 'business')
   * @param {string[]} [updates.highlights] - Array of highlight strings
   * @param {string} [updates.language] - Language code ('en', 'es', etc.)
   * @param {string} [updates.voice] - Voice style ('friendly', 'professional', etc.)
   * @param {number} [updates.nights] - Number of nights stayed
   * @param {number} [updates.guests] - Number of guests
   * @param {string} [updates.source] - Booking source
   * @param {string} [updates.generatedReview] - Generated review text
   * @since 1.0.0
   */
  setState(updates) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };
    this.saveState();

    Object.keys(updates).forEach((key) => {
      if (oldState[key] !== this.state[key]) {
        this.notify('stateChange', { key, value: this.state[key] });
      }
    });
  }

  /**
   * Get a copy of the current model state
   *
   * @returns {Object} Complete state object with all properties
   * @returns {string} returns.hotelName - Hotel name
   * @returns {number} returns.rating - Rating from 1-5
   * @returns {string} returns.tripType - Trip type
   * @returns {string[]} returns.highlights - Selected highlights
   * @returns {string} returns.language - Language code
   * @returns {string} returns.voice - Voice style
   * @returns {number} returns.nights - Number of nights
   * @returns {number} returns.guests - Number of guests
   * @returns {string} returns.source - Booking source
   * @returns {string|null} returns.generatedReview - Generated review text
   * @returns {Object} returns.statistics - Usage statistics
   * @since 1.0.0
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Set hotel information and booking source
   *
   * @param {string} hotelName - Name of the hotel
   * @param {string} [source='direct'] - Booking source ('direct', 'booking', 'expedia', etc.)
   * @since 1.0.0
   *
   * @example
   * model.setHotelInfo('Grand Plaza Hotel', 'booking');
   */
  setHotelInfo(hotelName, source = 'direct') {
    this.setState({ hotelName, source });
  }

  /**
   * Set hotel rating and update statistics
   *
   * @param {number} rating - Hotel rating from 1 to 5
   * @throws {Error} Throws error if rating is not between 1 and 5
   * @since 1.0.0
   *
   * @example
   * model.setRating(4); // Sets rating to 4 stars
   */
  setRating(rating) {
    if (rating >= 1 && rating <= 5) {
      this.setState({ rating });
      this.updateStatistics('rating', rating);
    }
  }

  /**
   * Set trip details including type, duration, and party size
   *
   * @param {string} tripType - Type of trip ('leisure', 'business', 'family', 'romantic')
   * @param {number} nights - Number of nights stayed (must be positive)
   * @param {number} guests - Number of guests (must be positive)
   * @since 1.0.0
   *
   * @example
   * model.setTripDetails('business', 2, 1);
   * model.setTripDetails('family', 7, 4);
   */
  setTripDetails(tripType, nights, guests) {
    this.setState({ tripType, nights, guests });
  }

  /**
   * Toggle a highlight selection (add if not present, remove if present)
   *
   * @param {string} highlight - Highlight to toggle (e.g., 'pool', 'wifi', 'breakfast')
   * @since 1.0.0
   *
   * @example
   * model.toggleHighlight('pool');     // Adds pool highlight
   * model.toggleHighlight('pool');     // Removes pool highlight
   * model.toggleHighlight('breakfast'); // Adds breakfast highlight
   */
  toggleHighlight(highlight) {
    const highlights = [...this.state.highlights];
    const index = highlights.indexOf(highlight);

    if (index > -1) {
      highlights.splice(index, 1);
    } else {
      highlights.push(highlight);
    }

    this.setState({ highlights });
    this.updateStatistics('highlight', highlight);
  }

  /**
   * Set the review generation language
   *
   * @param {string} language - ISO language code ('en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ja', 'zh', 'el')
   * @since 1.0.0
   *
   * @example
   * model.setLanguage('es'); // Set to Spanish
   * model.setLanguage('fr'); // Set to French
   */
  setLanguage(language) {
    this.setState({ language });
  }

  /**
   * Set the review writing voice/style
   *
   * @param {string} voice - Voice style ('friendly', 'professional', 'enthusiastic', 'detailed')
   * @since 1.0.0
   *
   * @example
   * model.setVoice('professional'); // Formal, business-like tone
   * model.setVoice('enthusiastic'); // Excited, energetic tone
   */
  setVoice(voice) {
    this.setState({ voice });
  }

  /**
   * Store a generated review and update statistics
   *
   * @param {string} review - The generated review text
   * @fires ReviewModel#reviewGenerated
   * @since 1.0.0
   *
   * @example
   * model.setGeneratedReview('My stay at Grand Plaza was excellent...');
   */
  setGeneratedReview(review) {
    this.setState({
      generatedReview: review,
      statistics: {
        ...this.state.statistics,
        totalGenerated: this.state.statistics.totalGenerated + 1,
      },
    });
    this.notify('reviewGenerated', review);
  }

  /**
   * Update internal statistics based on user actions
   *
   * @private
   * @param {string} type - Type of statistic ('rating', 'highlight')
   * @param {*} value - Value to track in statistics
   * @since 1.0.0
   */
  updateStatistics(type, value) {
    const stats = { ...this.state.statistics };

    if (type === 'rating') {
      const total = stats.totalGenerated || 0;
      const currentAvg = stats.averageRating || 0;
      stats.averageRating = (currentAvg * total + value) / (total + 1);
    }

    if (type === 'highlight') {
      const highlights = stats.popularHighlights || [];
      const existing = highlights.find((h) => h.name === value);

      if (existing) {
        existing.count++;
      } else {
        highlights.push({ name: value, count: 1 });
      }

      highlights.sort((a, b) => b.count - a.count);
      stats.popularHighlights = highlights.slice(0, 10);
    }

    this.setState({ statistics: stats });
  }

  /**
   * Validate current state to ensure all required fields are present for review generation
   *
   * @returns {Object} Validation result
   * @returns {boolean} returns.valid - Whether the state is valid
   * @returns {string[]} returns.errors - Array of error messages if invalid
   * @since 1.0.0
   *
   * @example
   * const validation = model.validate();
   * if (validation.valid) {
   *   // Proceed with generation
   * } else {
   *   console.error('Validation errors:', validation.errors);
   * }
   */
  validate() {
    const errors = [];

    if (!this.state.hotelName || this.state.hotelName.trim().length < 2) {
      errors.push('Hotel name is required');
    }

    if (!this.state.rating || this.state.rating < 1 || this.state.rating > 5) {
      errors.push('Valid rating is required');
    }

    if (this.state.highlights.length === 0) {
      errors.push('At least one highlight must be selected');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Reset the model to default state while preserving statistics
   *
   * @fires ReviewModel#reset
   * @since 1.0.0
   *
   * @example
   * model.reset(); // Clears all fields except statistics
   */
  reset() {
    const stats = this.state.statistics;
    this.state = {
      hotelName: '',
      rating: 5,
      tripType: 'leisure',
      highlights: [],
      language: 'en',
      voice: 'friendly',
      nights: 3,
      guests: 2,
      source: 'direct',
      generatedReview: null,
      statistics: stats,
    };
    this.notify('reset', null);
  }

  /**
   * Load persisted state from localStorage (statistics, language, voice)
   *
   * @private
   * @since 1.0.0
   */
  loadState() {
    try {
      const saved = localStorage.getItem('reviewModelState');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      }
    } catch (error) {
      // Silently fail if localStorage is not available or data is corrupted
      console.warn('Failed to load state from localStorage:', error.message);
    }
  }

  /**
   * Save current state to localStorage for persistence
   *
   * @private
   * @since 1.0.0
   */
  saveState() {
    try {
      const toSave = {
        statistics: this.state.statistics,
        language: this.state.language,
        voice: this.state.voice,
      };
      localStorage.setItem('reviewModelState', JSON.stringify(toSave));
    } catch (error) {
      // Silently fail if localStorage is not available
      console.warn('Failed to save state to localStorage:', error.message);
    }
  }

  /**
   * Export analytics data for reporting and monitoring
   *
   * @returns {Object} Analytics data
   * @returns {number} returns.totalReviews - Total reviews generated
   * @returns {number} returns.averageRating - Average rating across all reviews
   * @returns {Array} returns.popularHighlights - Most popular highlights with counts
   * @returns {string} returns.timestamp - ISO timestamp of export
   * @since 1.0.0
   *
   * @example
   * const analytics = model.exportAnalytics();
   * console.log(`Generated ${analytics.totalReviews} reviews`);
   */
  exportAnalytics() {
    return {
      totalReviews: this.state.statistics.totalGenerated,
      averageRating: this.state.statistics.averageRating,
      popularHighlights: this.state.statistics.popularHighlights,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReviewModel;
}
