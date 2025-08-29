/**
 * Review Model
 * Manages review data and business logic
 */

class ReviewModel {
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
   * Subscribe to model changes
   */
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter((obs) => obs !== callback);
    };
  }

  /**
   * Notify observers of state changes
   */
  notify(changeType, data) {
    this.observers.forEach((callback) => callback(changeType, data));
  }

  /**
   * Update model state
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
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Set hotel information
   */
  setHotelInfo(hotelName, source = 'direct') {
    this.setState({ hotelName, source });
  }

  /**
   * Set rating
   */
  setRating(rating) {
    if (rating >= 1 && rating <= 5) {
      this.setState({ rating });
      this.updateStatistics('rating', rating);
    }
  }

  /**
   * Set trip details
   */
  setTripDetails(tripType, nights, guests) {
    this.setState({ tripType, nights, guests });
  }

  /**
   * Toggle highlight
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
   * Set language
   */
  setLanguage(language) {
    this.setState({ language });
  }

  /**
   * Set voice
   */
  setVoice(voice) {
    this.setState({ voice });
  }

  /**
   * Store generated review
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
   * Update statistics
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
   * Validate current state for review generation
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
   * Reset state
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
   * Load state from localStorage
   */
  loadState() {
    try {
      const saved = localStorage.getItem('reviewModelState');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      }
    } catch (error) {

    }
  }

  /**
   * Save state to localStorage
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

    }
  }

  /**
   * Export state for analytics
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
