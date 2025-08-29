/**
 * Rating Selector Component
 * Handles star rating selection with accessibility
 */

class RatingSelector {
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

  attachEvents() {
    this.buttons.forEach((button, index) => {
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

  showPreview(rating) {
    this.buttons.forEach((btn, index) => {
      btn.classList.toggle('preview', index < rating);
    });
  }

  clearPreview() {
    this.buttons.forEach((btn) => {
      btn.classList.remove('preview');
    });
  }

  getRating() {
    return this.currentRating;
  }

  validate() {
    if (this.options.required && !this.currentRating) {
      this.showError('Please select a rating');
      return false;
    }
    return true;
  }

  showError(message) {
    const errorEl = this.container.querySelector('.rating-error') || this.createErrorElement();
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    this.announce(message, 'assertive');
  }

  createErrorElement() {
    const error = document.createElement('div');
    error.className = 'rating-error';
    error.setAttribute('role', 'alert');
    error.setAttribute('aria-live', 'assertive');
    this.container.appendChild(error);
    return error;
  }

  announce(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.className = 'sr-only';
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.textContent = message;

    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  }

  reset() {
    this.setRating(this.options.defaultRating);
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RatingSelector;
}
