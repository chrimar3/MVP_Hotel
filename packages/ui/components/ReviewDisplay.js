/**
 * Review Display Component - Generated Review Presentation
 *
 * A comprehensive component for displaying generated hotel reviews with
 * interactive features including copy to clipboard, sharing to platforms,
 * user feedback collection, and accessibility support.
 *
 * @class ReviewDisplay
 * @since 1.0.0
 * @author Hotel Review Generator Team
 *
 * @example
 * const reviewDisplay = new ReviewDisplay(document.getElementById('review-output'), {
 *   platforms: ['booking', 'google', 'tripadvisor'],
 *   animateIn: true,
 *   onCopy: (reviewData) => {
 *     console.log('Review copied:', reviewData.text.length + ' characters');
 *   },
 *   onShare: (platform, reviewData) => {
 *     console.log(`Review shared on ${platform}`);
 *   }
 * });
 *
 * // Display a generated review
 * reviewDisplay.displayReview({
 *   text: 'My stay at Grand Hotel was excellent...',
 *   source: 'openai',
 *   latency: 1200,
 *   cost: 0.000045,
 *   cached: false
 * });
 */

/**
 * Review Display Component Class
 * Handles the display and interaction of generated hotel reviews
 */
class ReviewDisplay {
  /**
   * Initialize the ReviewDisplay component
   *
   * @constructor
   * @param {HTMLElement} container - DOM element to render the component into
   * @param {Object} [options={}] - Configuration options
   * @param {Function} [options.onCopy] - Callback when review is copied
   * @param {Function} [options.onShare] - Callback when review is shared
   * @param {string[]} [options.platforms] - Platforms to show share buttons for
   * @param {boolean} [options.animateIn=true] - Whether to animate component entrance
   * @since 1.0.0
   *
   * @example
   * const display = new ReviewDisplay(container, {
   *   platforms: ['booking', 'google', 'tripadvisor'],
   *   onCopy: (data) => console.log('Copied!'),
   *   onShare: (platform, data) => console.log(`Shared on ${platform}`)
   * });
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onCopy: options.onCopy || (() => {}),
      onShare: options.onShare || (() => {}),
      platforms: options.platforms || ['booking', 'google', 'tripadvisor'],
      animateIn: options.animateIn !== false,
    };

    this.review = null;
    this.render();
  }

  /**
   * Render the component HTML structure
   *
   * @private
   * @since 1.0.0
   */
  render() {
    const html = `
            <div class="review-display" style="display: none;">
                <div class="review-header">
                    <h2 class="review-title">Your Generated Review</h2>
                    <div class="review-metadata" role="status" aria-live="polite"></div>
                </div>
                
                <div class="review-content-wrapper">
                    <div class="review-text" id="review-text" tabindex="0" role="article"></div>
                    
                    <div class="review-stats">
                        <span class="stat-item" id="word-count">0 words</span>
                        <span class="stat-item" id="char-count">0 characters</span>
                        <span class="stat-item" id="read-time">0 min read</span>
                    </div>
                </div>
                
                <div class="review-actions">
                    <button 
                        class="btn btn-primary copy-btn"
                        id="copy-btn"
                        aria-label="Copy review to clipboard"
                        disabled
                    >
                        <span class="btn-icon">📋</span>
                        <span class="btn-text">Copy Review</span>
                    </button>
                    
                    <div class="platform-buttons">
                        ${this.options.platforms
                          .map(
                            (platform) => `
                            <button 
                                class="btn platform-btn"
                                data-platform="${platform}"
                                aria-label="Post to ${this.getPlatformName(platform)} (opens in new tab)"
                            >
                                <span class="btn-icon">${this.getPlatformIcon(platform)}</span>
                                <span class="btn-text">${this.getPlatformName(platform)}</span>
                            </button>
                        `
                          )
                          .join('')}
                    </div>
                </div>
                
                <div class="review-feedback" style="display: none;">
                    <p>Was this review helpful?</p>
                    <div class="feedback-buttons">
                        <button class="feedback-btn" data-feedback="yes" aria-label="Yes, helpful">
                            👍 Yes
                        </button>
                        <button class="feedback-btn" data-feedback="no" aria-label="No, not helpful">
                            👎 No
                        </button>
                    </div>
                </div>
                
                <div class="copy-success" role="status" aria-live="polite" style="display: none;">
                    ✓ Review copied to clipboard!
                </div>
            </div>
        `;

    this.container.innerHTML = html;
    this.displayEl = this.container.querySelector('.review-display');
    this.textEl = this.container.querySelector('#review-text');
    this.metadataEl = this.container.querySelector('.review-metadata');
    this.copyBtn = this.container.querySelector('#copy-btn');
    this.wordCountEl = this.container.querySelector('#word-count');
    this.charCountEl = this.container.querySelector('#char-count');
    this.readTimeEl = this.container.querySelector('#read-time');
    this.copySuccessEl = this.container.querySelector('.copy-success');

    this.attachEvents();
  }

  /**
   * Attach event listeners for user interactions
   *
   * @private
   * @since 1.0.0
   */
  attachEvents() {
    // Copy button
    this.copyBtn?.addEventListener('click', () => this.copyReview());

    // Platform buttons
    this.container.querySelectorAll('.platform-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const platform = btn.dataset.platform;
        this.shareOnPlatform(platform);
      });
    });

    // Feedback buttons
    this.container.querySelectorAll('.feedback-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.submitFeedback(btn.dataset.feedback);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        if (this.review) {
          e.preventDefault();
          this.copyReview();
        }
      }
    });
  }

  /**
   * Display a generated review with metadata and statistics
   *
   * @param {Object} reviewData - Generated review data
   * @param {string} reviewData.text - The generated review text
   * @param {string} [reviewData.source] - Generation source ('openai', 'groq', 'template', 'cache')
   * @param {number} [reviewData.latency] - Generation time in milliseconds
   * @param {number} [reviewData.cost] - Generation cost in USD
   * @param {boolean} [reviewData.cached] - Whether result came from cache
   * @param {string} [reviewData.hotelName] - Hotel name for sharing links
   * @param {string} [reviewData.requestId] - Unique request identifier
   * @since 1.0.0
   *
   * @example
   * display.displayReview({
   *   text: 'My 3-night stay at Grand Plaza was exceptional...',
   *   source: 'openai',
   *   latency: 850,
   *   cost: 0.000045,
   *   cached: false,
   *   hotelName: 'Grand Plaza Hotel',
   *   requestId: 'req_123456'
   * });
   */
  displayReview(reviewData) {
    this.review = reviewData;

    // Show container
    this.displayEl.style.display = 'block';

    // Set review text
    this.textEl.textContent = reviewData.text;

    // Update metadata
    this.updateMetadata(reviewData);

    // Update statistics
    this.updateStats(reviewData.text);

    // Enable copy button
    this.copyBtn.disabled = false;

    // Animate in
    if (this.options.animateIn) {
      this.animateIn();
    }

    // Focus on review for screen readers
    this.textEl.focus();

    // Show feedback after delay
    setTimeout(() => {
      this.container.querySelector('.review-feedback').style.display = 'block';
    }, 3000);
  }

  /**
   * Update metadata display with review generation information
   *
   * @private
   * @param {Object} reviewData - Review data with metadata
   * @since 1.0.0
   */
  updateMetadata(reviewData) {
    const metadata = [];

    if (reviewData.source) {
      metadata.push(
        `<span class="meta-source">Source: ${this.formatSource(reviewData.source)}</span>`
      );
    }

    if (reviewData.latency) {
      metadata.push(`<span class="meta-latency">Generated in ${reviewData.latency}ms</span>`);
    }

    if (reviewData.cost && reviewData.cost > 0) {
      metadata.push(`<span class="meta-cost">Cost: $${reviewData.cost.toFixed(6)}</span>`);
    }

    if (reviewData.cached) {
      metadata.push(`<span class="meta-cached">📦 Cached</span>`);
    }

    this.metadataEl.innerHTML = metadata.join(' • ');
  }

  /**
   * Calculate and display text statistics
   *
   * @private
   * @param {string} text - Review text to analyze
   * @since 1.0.0
   */
  updateStats(text) {
    const words = text.trim().split(/\s+/).length;
    const chars = text.length;
    const readTime = Math.ceil(words / 200); // Average reading speed

    this.wordCountEl.textContent = `${words} words`;
    this.charCountEl.textContent = `${chars} characters`;
    this.readTimeEl.textContent = `${readTime} min read`;
  }

  /**
   * Copy review text to clipboard using Clipboard API
   *
   * @async
   * @returns {Promise<void>}
   * @returns {Promise<void>}
   * @since 1.0.0
   *
   * @example
   * await display.copyReview(); // Copies current review to clipboard
   */
  async copyReview() {
    if (!this.review) return;

    try {
      await navigator.clipboard.writeText(this.review.text);
      this.showCopySuccess();
      this.options.onCopy(this.review);

      // Track analytics
      this.trackEvent('copy_review', {
        source: this.review.source,
        length: this.review.text.length,
      });
    } catch (error) {
      // Production: console.error('Failed to copy:', error);
      this.showCopyError();
    }
  }

  /**
   * Show visual feedback for successful copy operation
   *
   * @private
   * @since 1.0.0
   */
  showCopySuccess() {
    this.copySuccessEl.style.display = 'block';
    this.copyBtn.innerHTML = '<span class="btn-icon">✓</span><span class="btn-text">Copied!</span>';

    setTimeout(() => {
      this.copySuccessEl.style.display = 'none';
      this.copyBtn.innerHTML =
        '<span class="btn-icon">📋</span><span class="btn-text">Copy Review</span>';
    }, 2000);
  }

  /**
   * Show visual feedback for failed copy operation
   *
   * @private
   * @since 1.0.0
   */
  showCopyError() {
    this.copyBtn.innerHTML =
      '<span class="btn-icon">❌</span><span class="btn-text">Copy Failed</span>';

    setTimeout(() => {
      this.copyBtn.innerHTML =
        '<span class="btn-icon">📋</span><span class="btn-text">Copy Review</span>';
    }, 2000);
  }

  /**
   * Open platform-specific URL for sharing the review
   *
   * @param {string} platform - Platform identifier ('booking', 'google', 'tripadvisor', etc.)
   * @since 1.0.0
   *
   * @example
   * display.shareOnPlatform('booking'); // Opens Booking.com in new tab
   */
  shareOnPlatform(platform) {
    if (!this.review) return;

    const urls = this.getPlatformUrls();
    const url = urls[platform];

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      this.options.onShare(platform, this.review);

      // Track analytics
      this.trackEvent('share_review', {
        platform: platform,
        source: this.review.source,
      });
    }
  }

  /**
   * Generate platform-specific URLs for sharing
   *
   * @private
   * @returns {Object} Object mapping platform names to URLs
   * @since 1.0.0
   */
  getPlatformUrls() {
    const hotelName = encodeURIComponent(this.review?.hotelName || 'Hotel');

    return {
      booking: `https://www.booking.com/hotel/${hotelName}`,
      google: `https://www.google.com/maps/search/${hotelName}`,
      tripadvisor: `https://www.tripadvisor.com/Search?q=${hotelName}`,
      expedia: `https://www.expedia.com/Hotel-Search?destination=${hotelName}`,
      hotels: `https://www.hotels.com/search.do?q=${hotelName}`,
    };
  }

  /**
   * Get display name for a platform identifier
   *
   * @private
   * @param {string} platform - Platform identifier
   * @returns {string} Human-readable platform name
   * @since 1.0.0
   */
  getPlatformName(platform) {
    const names = {
      booking: 'Booking.com',
      google: 'Google',
      tripadvisor: 'TripAdvisor',
      expedia: 'Expedia',
      hotels: 'Hotels.com',
    };
    return names[platform] || platform;
  }

  /**
   * Get emoji icon for a platform identifier
   *
   * @private
   * @param {string} platform - Platform identifier
   * @returns {string} Emoji icon for the platform
   * @since 1.0.0
   */
  getPlatformIcon(platform) {
    const icons = {
      booking: '📘',
      google: '🗺️',
      tripadvisor: '✈️',
      expedia: '🏨',
      hotels: '🛏️',
    };
    return icons[platform] || '🌐';
  }

  /**
   * Format generation source for display
   *
   * @private
   * @param {string} source - Source identifier
   * @returns {string} Human-readable source name
   * @since 1.0.0
   */
  formatSource(source) {
    const sourceNames = {
      openai: 'OpenAI GPT-4',
      groq: 'Groq Mixtral',
      template: 'Template System',
      cache: 'Cache',
      emergency: 'Fallback',
    };
    return sourceNames[source] || source;
  }

  /**
   * Handle user feedback submission
   *
   * @private
   * @param {string} feedback - Feedback type ('yes' or 'no')
   * @since 1.0.0
   */
  submitFeedback(feedback) {
    // Hide feedback section
    this.container.querySelector('.review-feedback').style.display = 'none';

    // Track feedback
    this.trackEvent('review_feedback', {
      feedback: feedback,
      source: this.review?.source,
      requestId: this.review?.requestId,
    });

    // Show thank you message
    const thankYou = document.createElement('div');
    thankYou.className = 'feedback-thanks';
    thankYou.textContent = 'Thank you for your feedback!';
    this.container.querySelector('.review-feedback').replaceWith(thankYou);
  }

  /**
   * Animate component entrance with fade and slide effects
   *
   * @private
   * @since 1.0.0
   */
  animateIn() {
    this.displayEl.style.opacity = '0';
    this.displayEl.style.transform = 'translateY(20px)';

    requestAnimationFrame(() => {
      this.displayEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      this.displayEl.style.opacity = '1';
      this.displayEl.style.transform = 'translateY(0)';
    });
  }

  /**
   * Send analytics event to tracking service
   *
   * @private
   * @param {string} eventName - Event name to track
   * @param {Object} data - Event data to send
   * @since 1.0.0
   */
  trackEvent(eventName, data) {
    // Send to analytics service
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track(eventName, data);
    }
  }

  /**
   * Hide the review display component
   *
   * @since 1.0.0
   *
   * @example
   * display.hide(); // Hides the component
   */
  hide() {
    this.displayEl.style.display = 'none';
    this.review = null;
  }

  /**
   * Reset component to initial state
   *
   * @since 1.0.0
   *
   * @example
   * display.reset(); // Clears review and resets UI
   */
  reset() {
    this.hide();
    this.textEl.textContent = '';
    this.metadataEl.innerHTML = '';
    this.copyBtn.disabled = true;
  }

  /**
   * Destroy the component and clean up DOM
   *
   * @since 1.0.0
   *
   * @example
   * display.destroy(); // Clean up when component no longer needed
   */
  destroy() {
    this.container.innerHTML = '';
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReviewDisplay;
}
