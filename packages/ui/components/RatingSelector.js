/**
 * Rating Selector Component - Accessible Star Rating Interface
 *
 * A fully accessible star rating component that allows users to select
 * a rating from 1-5 stars. Features keyboard navigation, screen reader
 * support, visual previews, and ARIA compliance.
 *
 * @class RatingSelector
 * @since 1.0.0
 * @author Hotel Review Generator Team
 *
 * @example
 * const ratingSelector = new RatingSelector(document.getElementById('rating'), {
 *   defaultRating: 4,
 *   labels: ['Terrible', 'Poor', 'Average', 'Good', 'Excellent'],
 *   required: true,
 *   onChange: (rating) => {
 *     console.log('Rating selected:', rating);
 *     updateReviewParameters({ rating });
 *   }
 * });
 *
 * // Get current rating
 * const currentRating = ratingSelector.getRating();
 *
 * // Validate selection
 * if (ratingSelector.validate()) {
 *   console.log('Rating is valid');
 * }
 */

class RatingSelector {
  /**
   * Initialize the RatingSelector component
   *
   * @constructor
   * @param {HTMLElement} container - DOM element to render the component into
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.defaultRating=5] - Initial rating value (1-5)
   * @param {Function} [options.onChange] - Callback function when rating changes
   * @param {string[]} [options.labels] - Array of 5 labels for each rating level
   * @param {boolean} [options.required=false] - Whether rating selection is required
   * @since 1.0.0
   *
   * @example
   * const selector = new RatingSelector(container, {
   *   defaultRating: 3,
   *   labels: ['Poor', 'Fair', 'Good', 'Great', 'Excellent'],
   *   required: true,
   *   onChange: (rating) => console.log('New rating:', rating)
   * });
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      defaultRating: options.defaultRating || 5,
      onChange: options.onChange || (() => {}),
      labels: options.labels || ['Poor', 'Fair', 'Good', 'Great', 'Excellent'],
      required: options.required || false,
    };

    this.currentRating = this.options.defaultRating;
    this.render();
    this.attachEvents();
  }

  /**
   * Render the rating selector HTML structure
   *
   * @private
   * @since 1.0.0
   */
  render() {
    const html = `
            <fieldset class="rating-selector" role="radiogroup" aria-required="${this.options.required}">
                <legend class="rating-label">Overall Rating ${this.options.required ? '<span aria-label="required">*</span>' : ''}</legend>
                <div class="rating-buttons">
                    ${[1, 2, 3, 4, 5]
                      .map(
                        (rating) => `
                        <button 
                            type="button"
                            class="rating-btn ${rating === this.currentRating ? 'active' : ''}"
                            data-rating="${rating}"
                            role="radio"
                            aria-checked="${rating === this.currentRating}"
                            aria-label="${rating} star${rating > 1 ? 's' : ''} - ${this.options.labels[rating - 1]}"
                            tabindex="${rating === this.currentRating ? '0' : '-1'}"
                        >
                            <span class="stars" aria-hidden="true">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</span>
                            <span class="label">${this.options.labels[rating - 1]}</span>
                        </button>
                    `
                      )
                      .join('')}
                </div>
                <div class="rating-description" role="status" aria-live="polite" aria-atomic="true">
                    <span id="rating-text">Rating: ${this.currentRating} stars - ${this.options.labels[this.currentRating - 1]}</span>
                </div>
            </fieldset>
        `;

    this.container.innerHTML = html;
    this.buttons = this.container.querySelectorAll('.rating-btn');
    this.descriptionEl = this.container.querySelector('#rating-text');
  }

  /**
   * Attach event listeners for user interactions
   *
   * @private
   * @since 1.0.0
   */
  attachEvents() {
    this.buttons.forEach((button) => {
      // Click handler
      button.addEventListener('click', () => {
        this.setRating(parseInt(button.dataset.rating));
      });

      // Keyboard navigation
      button.addEventListener('keydown', (e) => {
        let newRating = this.currentRating;

        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowUp':
            newRating = Math.min(5, this.currentRating + 1);
            e.preventDefault();
            break;
          case 'ArrowLeft':
          case 'ArrowDown':
            newRating = Math.max(1, this.currentRating - 1);
            e.preventDefault();
            break;
          case 'Home':
            newRating = 1;
            e.preventDefault();
            break;
          case 'End':
            newRating = 5;
            e.preventDefault();
            break;
          case ' ':
          case 'Enter':
            this.setRating(parseInt(button.dataset.rating));
            e.preventDefault();
            break;
        }

        if (newRating !== this.currentRating) {
          this.setRating(newRating);
          this.buttons[newRating - 1].focus();
        }
      });

      // Hover effects
      button.addEventListener('mouseenter', () => {
        this.showPreview(parseInt(button.dataset.rating));
      });

      button.addEventListener('mouseleave', () => {
        this.clearPreview();
      });
    });
  }

  /**
   * Set the current rating value and update UI
   *
   * @param {number} rating - Rating value from 1-5
   * @since 1.0.0
   *
   * @example
   * selector.setRating(4); // Sets rating to 4 stars
   */
  setRating(rating) {
    if (rating === this.currentRating) return;

    this.currentRating = rating;

    // Update visual state
    this.buttons.forEach((btn, index) => {
      const btnRating = index + 1;
      const isActive = btnRating === rating;

      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', isActive);
      btn.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    // Update description
    this.descriptionEl.textContent = `Rating: ${rating} stars - ${this.options.labels[rating - 1]}`;

    // Trigger callback
    this.options.onChange(rating);

    // Announce change
    this.announce(`Rating set to ${rating} stars`);
  }

  /**
   * Show visual preview of rating on hover
   *
   * @private
   * @param {number} rating - Rating to preview
   * @since 1.0.0
   */
  showPreview(rating) {
    this.buttons.forEach((btn, index) => {
      btn.classList.toggle('preview', index < rating);
    });
  }

  /**
   * Clear rating preview on mouse leave
   *
   * @private
   * @since 1.0.0
   */
  clearPreview() {
    this.buttons.forEach((btn) => {
      btn.classList.remove('preview');
    });
  }

  /**
   * Get the current rating value
   *
   * @returns {number} Current rating (1-5)
   * @since 1.0.0
   *
   * @example
   * const rating = selector.getRating();
   * console.log('Current rating:', rating); // e.g., 4
   */
  getRating() {
    return this.currentRating;
  }

  /**
   * Validate the current rating selection
   *
   * @returns {boolean} True if valid, false if required but not set
   * @since 1.0.0
   *
   * @example
   * if (!selector.validate()) {
   *   console.log('Please select a rating');
   *   return;
   * }
   * // Proceed with form submission
   */
  validate() {
    if (this.options.required && !this.currentRating) {
      this.showError('Please select a rating');
      return false;
    }
    return true;
  }

  /**
   * Display an error message to the user
   *
   * @private
   * @param {string} message - Error message to display
   * @since 1.0.0
   */
  showError(message) {
    const errorEl = this.container.querySelector('.rating-error') || this.createErrorElement();
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    this.announce(message, 'assertive');
  }

  /**
   * Create error display element if it doesn't exist
   *
   * @private
   * @returns {HTMLElement} Error display element
   * @since 1.0.0
   */
  createErrorElement() {
    const error = document.createElement('div');
    error.className = 'rating-error';
    error.setAttribute('role', 'alert');
    error.setAttribute('aria-live', 'assertive');
    this.container.appendChild(error);
    return error;
  }

  /**
   * Announce a message to screen readers
   *
   * @private
   * @param {string} message - Message to announce
   * @param {string} [priority='polite'] - Announcement priority ('polite' or 'assertive')
   * @since 1.0.0
   */
  announce(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.className = 'sr-only';
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.textContent = message;

    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  }

  /**
   * Reset rating to default value
   *
   * @since 1.0.0
   *
   * @example
   * selector.reset(); // Resets to defaultRating
   */
  reset() {
    this.setRating(this.options.defaultRating);
  }

  /**
   * Destroy the component and clean up DOM
   *
   * @since 1.0.0
   *
   * @example
   * selector.destroy(); // Clean up when component no longer needed
   */
  destroy() {
    this.container.innerHTML = '';
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RatingSelector;
}
