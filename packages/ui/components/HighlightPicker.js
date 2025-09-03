/**
 * Highlight Picker Component - Interactive Multi-Select UI
 *
 * A fully accessible multi-select component for choosing hotel highlights
 * to include in reviews. Features toggle buttons with visual feedback,
 * keyboard navigation, screen reader support, and validation.
 *
 * @class HighlightPicker
 * @since 1.0.0
 * @author Hotel Review Generator Team
 *
 * @example
 * const picker = new HighlightPicker(document.getElementById('highlights'), {
 *   minSelections: 2,
 *   maxSelections: 5,
 *   required: true,
 *   onChange: (selected) => {
 *     console.log('Selected highlights:', selected);
 *   }
 * });
 *
 * // Get current selection
 * const highlights = picker.getSelected();
 *
 * // Validate selection
 * if (picker.validate()) {
 *   console.log('Valid selection');
 * }
 */

class HighlightPicker {
  /**
   * Initialize the HighlightPicker component
   *
   * @constructor
   * @param {HTMLElement} container - DOM element to render the component into
   * @param {Object} [options={}] - Configuration options
   * @param {Array<Object>} [options.highlights] - Array of highlight objects
   * @param {string} options.highlights[].id - Unique identifier for the highlight
   * @param {string} options.highlights[].label - Display label for the highlight
   * @param {string} options.highlights[].icon - Emoji or icon for the highlight
   * @param {number} [options.maxSelections=0] - Maximum selections allowed (0 = unlimited)
   * @param {number} [options.minSelections=1] - Minimum selections required
   * @param {Function} [options.onChange] - Callback when selection changes
   * @param {boolean} [options.required=false] - Whether selection is required
   * @since 1.0.0
   *
   * @example
   * const picker = new HighlightPicker(container, {
   *   highlights: [
   *     { id: 'pool', label: 'Amazing Pool', icon: '🏊' },
   *     { id: 'spa', label: 'Relaxing Spa', icon: '💆' }
   *   ],
   *   minSelections: 1,
   *   maxSelections: 3,
   *   onChange: (selected) => updateForm(selected)
   * });
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      highlights: options.highlights || [
        { id: 'location', label: 'Great Location', icon: '📍' },
        { id: 'cleanliness', label: 'Spotless Clean', icon: '✨' },
        { id: 'comfort', label: 'Comfortable Beds', icon: '🛏️' },
        { id: 'service', label: 'Excellent Service', icon: '👨‍💼' },
        { id: 'breakfast', label: 'Delicious Breakfast', icon: '🍳' },
        { id: 'wifi', label: 'Fast WiFi', icon: '📶' },
        { id: 'value', label: 'Great Value', icon: '💰' },
        { id: 'amenities', label: 'Modern Amenities', icon: '🏊' },
      ],
      maxSelections: options.maxSelections || 0, // 0 = unlimited
      minSelections: options.minSelections || 1,
      onChange: options.onChange || (() => {}),
      required: options.required || false,
    };

    this.selected = new Set();
    this.render();
    this.attachEvents();
  }

  /**
   * Render the component HTML structure
   *
   * @private
   * @since 1.0.0
   */
  render() {
    const html = `
            <fieldset class="highlight-picker" role="group" aria-required="${this.options.required}">
                <legend class="highlight-label">
                    What You Enjoyed ${this.options.required ? '<span aria-label="required">*</span>' : ''}
                    ${this.options.minSelections > 0 ? `<span class="hint">(Select at least ${this.options.minSelections})</span>` : ''}
                </legend>
                
                <div class="highlight-grid">
                    ${this.options.highlights
                      .map(
                        (highlight) => `
                        <button 
                            type="button"
                            class="highlight-btn"
                            data-highlight="${highlight.id}"
                            aria-pressed="false"
                            aria-label="${highlight.label}"
                        >
                            <span class="highlight-icon" aria-hidden="true">${highlight.icon}</span>
                            <span class="highlight-text">${highlight.label}</span>
                            <span class="highlight-check" aria-hidden="true">✓</span>
                        </button>
                    `
                      )
                      .join('')}
                </div>
                
                <div class="highlight-status" role="status" aria-live="polite" aria-atomic="true">
                    <span id="selection-count">0 selected</span>
                </div>
                
                <div class="highlight-error" role="alert" style="display: none;"></div>
            </fieldset>
        `;

    this.container.innerHTML = html;
    this.buttons = this.container.querySelectorAll('.highlight-btn');
    this.statusEl = this.container.querySelector('#selection-count');
    this.errorEl = this.container.querySelector('.highlight-error');
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
        this.toggleHighlight(button.dataset.highlight);
      });

      // Keyboard support
      button.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          this.toggleHighlight(button.dataset.highlight);
        }
      });

      // Hover effects
      button.addEventListener('mouseenter', () => {
        if (!this.selected.has(button.dataset.highlight)) {
          button.classList.add('hover');
        }
      });

      button.addEventListener('mouseleave', () => {
        button.classList.remove('hover');
      });
    });
  }

  /**
   * Toggle selection state of a highlight
   *
   * @param {string} highlightId - ID of the highlight to toggle
   * @since 1.0.0
   *
   * @example
   * picker.toggleHighlight('location'); // Toggles location highlight
   */
  toggleHighlight(highlightId) {
    const button = this.container.querySelector(`[data-highlight="${highlightId}"]`);

    if (this.selected.has(highlightId)) {
      // Remove selection
      this.selected.delete(highlightId);
      button.classList.remove('active');
      button.setAttribute('aria-pressed', 'false');
    } else {
      // Check max selections
      if (this.options.maxSelections > 0 && this.selected.size >= this.options.maxSelections) {
        this.showError(`Maximum ${this.options.maxSelections} selections allowed`);
        return;
      }

      // Add selection
      this.selected.add(highlightId);
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
    }

    // Update status
    this.updateStatus();

    // Clear error
    this.clearError();

    // Trigger callback
    this.options.onChange(Array.from(this.selected));

    // Announce change
    this.announce(`${highlightId} ${this.selected.has(highlightId) ? 'selected' : 'deselected'}`);
  }

  /**
   * Update the status display with current selection count
   *
   * @private
   * @since 1.0.0
   */
  updateStatus() {
    const count = this.selected.size;
    const text = count === 0 ? 'None selected' : count === 1 ? '1 selected' : `${count} selected`;

    this.statusEl.textContent = text;

    // Add visual feedback for min selections
    if (this.options.minSelections > 0) {
      const hasMinimum = count >= this.options.minSelections;
      this.statusEl.classList.toggle('satisfied', hasMinimum);
      this.statusEl.classList.toggle('unsatisfied', !hasMinimum);
    }
  }

  /**
   * Get array of currently selected highlight IDs
   *
   * @returns {string[]} Array of selected highlight IDs
   * @since 1.0.0
   *
   * @example
   * const selected = picker.getSelected();
   * console.log('Currently selected:', selected); // ['location', 'wifi']
   */
  getSelected() {
    return Array.from(this.selected);
  }

  /**
   * Programmatically set the selected highlights
   *
   * @param {string[]} highlights - Array of highlight IDs to select
   * @since 1.0.0
   *
   * @example
   * picker.setSelected(['location', 'wifi', 'breakfast']);
   */
  setSelected(highlights) {
    // Clear current selections
    this.selected.clear();
    this.buttons.forEach((btn) => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });

    // Set new selections
    highlights.forEach((highlightId) => {
      if (this.container.querySelector(`[data-highlight="${highlightId}"]`)) {
        this.selected.add(highlightId);
        const button = this.container.querySelector(`[data-highlight="${highlightId}"]`);
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
      }
    });

    this.updateStatus();
  }

  /**
   * Validate current selection against configuration rules
   *
   * @returns {boolean} True if selection is valid, false otherwise
   * @since 1.0.0
   *
   * @example
   * if (!picker.validate()) {
   *   console.log('Please fix highlight selection');
   *   return;
   * }
   * // Proceed with form submission
   */
  validate() {
    if (this.options.required && this.selected.size === 0) {
      this.showError('Please select at least one highlight');
      return false;
    }

    if (this.options.minSelections > 0 && this.selected.size < this.options.minSelections) {
      this.showError(
        `Please select at least ${this.options.minSelections} highlight${this.options.minSelections > 1 ? 's' : ''}`
      );
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
    this.errorEl.textContent = message;
    this.errorEl.style.display = 'block';
    this.announce(message, 'assertive');

    // Add error styling
    this.container.querySelector('.highlight-picker').classList.add('has-error');
  }

  /**
   * Clear any displayed error messages
   *
   * @private
   * @since 1.0.0
   */
  clearError() {
    this.errorEl.style.display = 'none';
    this.errorEl.textContent = '';
    this.container.querySelector('.highlight-picker').classList.remove('has-error');
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
   * Reset the component to its initial state
   *
   * @since 1.0.0
   *
   * @example
   * picker.reset(); // Clears all selections
   */
  reset() {
    this.selected.clear();
    this.buttons.forEach((btn) => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });
    this.updateStatus();
    this.clearError();
  }

  /**
   * Enable all highlight buttons for interaction
   *
   * @since 1.0.0
   */
  enable() {
    this.buttons.forEach((btn) => (btn.disabled = false));
  }

  /**
   * Disable all highlight buttons to prevent interaction
   *
   * @since 1.0.0
   */
  disable() {
    this.buttons.forEach((btn) => (btn.disabled = true));
  }

  /**
   * Destroy the component and clean up DOM
   *
   * @since 1.0.0
   *
   * @example
   * picker.destroy(); // Clean up when component no longer needed
   */
  destroy() {
    this.container.innerHTML = '';
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HighlightPicker;
}
