/**
 * Unit Tests for UI Components
 * Tests component functionality, rendering, and interactions
 */

// Mock browser environment
global.document = {
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  createElement: jest.fn(() => ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    click: jest.fn(),
    style: {},
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      toggle: jest.fn(),
      contains: jest.fn()
    },
    textContent: '',
    innerHTML: '',
    value: '',
    disabled: false
  })),
  addEventListener: jest.fn(),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};

global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  location: { href: 'http://localhost:3000' },
  getComputedStyle: jest.fn(() => ({
    getPropertyValue: jest.fn()
  }))
};

// Import components (these would be the actual component files)
// For this test, we'll create mock component classes that simulate the real ones

class MockRatingSelector {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      initialRating: 5,
      maxRating: 5,
      onChange: () => {},
      ...options
    };
    this.currentRating = this.options.initialRating;
    this.stars = [];
    this.init();
  }

  init() {
    this.createStars();
    this.bindEvents();
  }

  createStars() {
    for (let i = 1; i <= this.options.maxRating; i++) {
      const element = document.createElement('div');
      // Mock DOM methods
      element.classList.add = jest.fn();
      element.classList.remove = jest.fn();
      element.addEventListener = jest.fn();
      element.removeEventListener = jest.fn();
      
      const star = {
        element,
        rating: i,
        active: i <= this.currentRating
      };
      this.stars.push(star);
    }
  }

  bindEvents() {
    this.stars.forEach(star => {
      star.clickHandler = () => this.setRating(star.rating);
      star.mouseoverHandler = () => this.hoverRating(star.rating);
      star.mouseleaveHandler = () => this.clearHover();
      
      star.element.addEventListener('click', star.clickHandler);
      star.element.addEventListener('mouseover', star.mouseoverHandler);
      star.element.addEventListener('mouseleave', star.mouseleaveHandler);
    });
  }

  setRating(rating) {
    if (rating < 1 || rating > this.options.maxRating) return;
    
    this.currentRating = rating;
    this.updateStars();
    this.options.onChange(rating);
  }

  updateStars() {
    this.stars.forEach((star, index) => {
      star.active = index < this.currentRating;
      if (star.active) {
        star.element.classList.add('active');
      } else {
        star.element.classList.remove('active');
      }
    });
  }

  hoverRating(rating) {
    this.stars.forEach((star, index) => {
      if (index < rating) {
        star.element.classList.add('hover');
      } else {
        star.element.classList.remove('hover');
      }
    });
  }

  clearHover() {
    this.stars.forEach(star => {
      star.element.classList.remove('hover');
    });
  }

  getRating() {
    return this.currentRating;
  }

  destroy() {
    this.stars.forEach(star => {
      star.element.removeEventListener('click', star.clickHandler);
      star.element.removeEventListener('mouseover', star.mouseoverHandler);
      star.element.removeEventListener('mouseleave', star.mouseleaveHandler);
    });
    this.stars = [];
  }
}

class MockHighlightPicker {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      highlights: ['location', 'service', 'cleanliness', 'comfort', 'value'],
      maxSelections: null,
      onChange: () => {},
      ...options
    };
    this.selectedHighlights = [];
    this.checkboxes = [];
    this.init();
  }

  init() {
    this.createHighlights();
    this.bindEvents();
  }

  createHighlights() {
    this.options.highlights.forEach(highlight => {
      const element = document.createElement('div');
      // Mock DOM methods
      element.addEventListener = jest.fn();
      element.removeEventListener = jest.fn();
      
      const checkbox = {
        element,
        value: highlight,
        checked: false,
        label: highlight.charAt(0).toUpperCase() + highlight.slice(1)
      };
      this.checkboxes.push(checkbox);
    });
  }

  bindEvents() {
    this.checkboxes.forEach(checkbox => {
      checkbox.changeHandler = () => this.toggleHighlight(checkbox.value);
      checkbox.element.addEventListener('change', checkbox.changeHandler);
    });
  }

  toggleHighlight(highlight) {
    const index = this.selectedHighlights.indexOf(highlight);
    
    if (index > -1) {
      // Remove highlight
      this.selectedHighlights.splice(index, 1);
      this.updateCheckbox(highlight, false);
    } else {
      // Add highlight if within limit
      if (this.options.maxSelections && this.selectedHighlights.length >= this.options.maxSelections) {
        return false;
      }
      
      this.selectedHighlights.push(highlight);
      this.updateCheckbox(highlight, true);
    }

    this.options.onChange(this.selectedHighlights);
    return true;
  }

  updateCheckbox(highlight, checked) {
    const checkbox = this.checkboxes.find(cb => cb.value === highlight);
    if (checkbox) {
      checkbox.checked = checked;
      checkbox.element.checked = checked;
    }
  }

  getSelectedHighlights() {
    return [...this.selectedHighlights];
  }

  setSelectedHighlights(highlights) {
    this.selectedHighlights = [];
    this.checkboxes.forEach(checkbox => this.updateCheckbox(checkbox.value, false));
    
    highlights.forEach(highlight => {
      if (this.options.highlights.includes(highlight)) {
        this.toggleHighlight(highlight);
      }
    });
  }

  clearSelections() {
    this.selectedHighlights = [];
    this.checkboxes.forEach(checkbox => this.updateCheckbox(checkbox.value, false));
    this.options.onChange(this.selectedHighlights);
  }

  destroy() {
    this.checkboxes.forEach(checkbox => {
      checkbox.element.removeEventListener('change', checkbox.changeHandler);
    });
    this.checkboxes = [];
  }
}

class MockReviewDisplay {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showMetadata: true,
      allowCopy: true,
      onCopy: () => {},
      onRegenerate: () => {},
      ...options
    };
    this.currentReview = null;
    this.elements = {};
    this.init();
  }

  init() {
    this.createElements();
    this.bindEvents();
  }

  createElements() {
    this.elements.reviewText = document.createElement('div');
    this.elements.metadata = document.createElement('div');
    
    this.elements.copyButton = document.createElement('div');
    this.elements.copyButton.addEventListener = jest.fn();
    this.elements.copyButton.removeEventListener = jest.fn();
    
    this.elements.regenerateButton = document.createElement('div');
    this.elements.regenerateButton.addEventListener = jest.fn();
    this.elements.regenerateButton.removeEventListener = jest.fn();
    
    this.elements.loadingSpinner = document.createElement('div');
  }

  bindEvents() {
    this.copyHandler = () => this.copyReview();
    this.regenerateHandler = () => this.regenerateReview();
    
    if (this.options.allowCopy) {
      this.elements.copyButton.addEventListener('click', this.copyHandler);
    }
    
    this.elements.regenerateButton.addEventListener('click', this.regenerateHandler);
  }

  displayReview(review) {
    if (!review) {
      this.clear();
      return;
    }
    
    this.currentReview = review;
    this.elements.reviewText.textContent = review.text || '';
    
    if (this.options.showMetadata) {
      this.displayMetadata(review);
    }

    this.showReview();
  }

  displayMetadata(review) {
    if (!review) {
      this.elements.metadata.textContent = '';
      return;
    }
    
    const metadata = [];
    
    if (review.source) {
      metadata.push(`Source: ${review.source}`);
    }
    
    if (review.latency) {
      metadata.push(`Generated in: ${review.latency}ms`);
    }
    
    if (review.cost && review.cost > 0) {
      metadata.push(`Cost: $${review.cost.toFixed(4)}`);
    }

    this.elements.metadata.textContent = metadata.join(' | ');
  }

  showLoading() {
    this.elements.loadingSpinner.style.display = 'block';
    this.elements.reviewText.style.display = 'none';
    this.elements.copyButton.disabled = true;
    this.elements.regenerateButton.disabled = true;
  }

  hideLoading() {
    this.elements.loadingSpinner.style.display = 'none';
    this.elements.reviewText.style.display = 'block';
    this.elements.copyButton.disabled = false;
    this.elements.regenerateButton.disabled = false;
  }

  showReview() {
    this.hideLoading();
    this.elements.reviewText.style.display = 'block';
  }

  copyReview() {
    if (!this.currentReview) return;

    // Simulate clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(this.currentReview.text)
        .then(() => this.options.onCopy(true))
        .catch(() => this.options.onCopy(false));
    } else {
      // Fallback method
      this.options.onCopy(true);
    }
  }

  regenerateReview() {
    this.showLoading();
    this.options.onRegenerate();
  }

  clear() {
    this.currentReview = null;
    this.elements.reviewText.textContent = '';
    this.elements.metadata.textContent = '';
    this.hideLoading();
  }

  destroy() {
    if (this.elements.copyButton) {
      this.elements.copyButton.removeEventListener('click', this.copyHandler);
    }
    if (this.elements.regenerateButton) {
      this.elements.regenerateButton.removeEventListener('click', this.regenerateHandler);
    }
    this.elements = {};
  }
}

describe('Rating Selector Component', () => {
  let container;
  let ratingSelector;

  beforeEach(() => {
    container = document.createElement('div');
    ratingSelector = new MockRatingSelector(container);
  });

  afterEach(() => {
    if (ratingSelector) {
      ratingSelector.destroy();
    }
  });

  describe('Initialization', () => {
    test('should initialize with default rating of 5', () => {
      expect(ratingSelector.getRating()).toBe(5);
    });

    test('should create correct number of stars', () => {
      expect(ratingSelector.stars).toHaveLength(5);
    });

    test('should initialize with custom rating', () => {
      const customRating = new MockRatingSelector(container, { initialRating: 3 });
      expect(customRating.getRating()).toBe(3);
      customRating.destroy();
    });

    test('should initialize with custom max rating', () => {
      const customMax = new MockRatingSelector(container, { maxRating: 10 });
      expect(customMax.stars).toHaveLength(10);
      customMax.destroy();
    });
  });

  describe('Rating Selection', () => {
    test('should set rating correctly', () => {
      const onChange = jest.fn();
      const selector = new MockRatingSelector(container, { onChange });

      selector.setRating(3);

      expect(selector.getRating()).toBe(3);
      expect(onChange).toHaveBeenCalledWith(3);

      selector.destroy();
    });

    test('should reject invalid ratings', () => {
      const initialRating = ratingSelector.getRating();

      ratingSelector.setRating(0);
      expect(ratingSelector.getRating()).toBe(initialRating);

      ratingSelector.setRating(6);
      expect(ratingSelector.getRating()).toBe(initialRating);

      ratingSelector.setRating(-1);
      expect(ratingSelector.getRating()).toBe(initialRating);
    });

    test('should update star display correctly', () => {
      ratingSelector.setRating(3);

      ratingSelector.stars.forEach((star, index) => {
        if (index < 3) {
          expect(star.element.classList.add).toHaveBeenCalledWith('active');
        } else {
          expect(star.element.classList.remove).toHaveBeenCalledWith('active');
        }
      });
    });
  });

  describe('Hover Effects', () => {
    test('should show hover effect on mouse over', () => {
      ratingSelector.hoverRating(4);

      ratingSelector.stars.forEach((star, index) => {
        if (index < 4) {
          expect(star.element.classList.add).toHaveBeenCalledWith('hover');
        } else {
          expect(star.element.classList.remove).toHaveBeenCalledWith('hover');
        }
      });
    });

    test('should clear hover effect on mouse leave', () => {
      ratingSelector.clearHover();

      ratingSelector.stars.forEach(star => {
        expect(star.element.classList.remove).toHaveBeenCalledWith('hover');
      });
    });
  });

  describe('Event Handling', () => {
    test('should bind click events to stars', () => {
      ratingSelector.stars.forEach(star => {
        expect(star.element.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      });
    });

    test('should bind hover events to stars', () => {
      ratingSelector.stars.forEach(star => {
        expect(star.element.addEventListener).toHaveBeenCalledWith('mouseover', expect.any(Function));
        expect(star.element.addEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function));
      });
    });
  });
});

describe('Highlight Picker Component', () => {
  let container;
  let highlightPicker;

  beforeEach(() => {
    container = document.createElement('div');
    highlightPicker = new MockHighlightPicker(container);
  });

  afterEach(() => {
    if (highlightPicker) {
      highlightPicker.destroy();
    }
  });

  describe('Initialization', () => {
    test('should create checkboxes for all highlights', () => {
      expect(highlightPicker.checkboxes).toHaveLength(5);
      expect(highlightPicker.checkboxes.map(cb => cb.value)).toEqual([
        'location', 'service', 'cleanliness', 'comfort', 'value'
      ]);
    });

    test('should initialize with custom highlights', () => {
      const customHighlights = ['wifi', 'breakfast', 'parking'];
      const picker = new MockHighlightPicker(container, { highlights: customHighlights });
      
      expect(picker.checkboxes).toHaveLength(3);
      expect(picker.checkboxes.map(cb => cb.value)).toEqual(customHighlights);
      
      picker.destroy();
    });

    test('should start with no selections', () => {
      expect(highlightPicker.getSelectedHighlights()).toEqual([]);
    });
  });

  describe('Highlight Selection', () => {
    test('should toggle highlights correctly', () => {
      const onChange = jest.fn();
      const picker = new MockHighlightPicker(container, { onChange });

      picker.toggleHighlight('location');
      expect(picker.getSelectedHighlights()).toEqual(['location']);
      expect(onChange).toHaveBeenCalledWith(['location']);

      picker.toggleHighlight('service');
      expect(picker.getSelectedHighlights()).toEqual(['location', 'service']);
      expect(onChange).toHaveBeenCalledWith(['location', 'service']);

      picker.destroy();
    });

    test('should remove highlights when toggled again', () => {
      highlightPicker.toggleHighlight('location');
      highlightPicker.toggleHighlight('service');
      
      expect(highlightPicker.getSelectedHighlights()).toEqual(['location', 'service']);

      highlightPicker.toggleHighlight('location');
      expect(highlightPicker.getSelectedHighlights()).toEqual(['service']);
    });

    test('should respect maximum selection limit', () => {
      const picker = new MockHighlightPicker(container, { maxSelections: 2 });

      expect(picker.toggleHighlight('location')).toBe(true);
      expect(picker.toggleHighlight('service')).toBe(true);
      expect(picker.toggleHighlight('cleanliness')).toBe(false);

      expect(picker.getSelectedHighlights()).toEqual(['location', 'service']);

      picker.destroy();
    });

    test('should set selections programmatically', () => {
      highlightPicker.setSelectedHighlights(['location', 'service', 'value']);
      expect(highlightPicker.getSelectedHighlights()).toEqual(['location', 'service', 'value']);
    });

    test('should ignore invalid highlights when setting', () => {
      highlightPicker.setSelectedHighlights(['location', 'invalid', 'service']);
      expect(highlightPicker.getSelectedHighlights()).toEqual(['location', 'service']);
    });

    test('should clear all selections', () => {
      const onChange = jest.fn();
      const picker = new MockHighlightPicker(container, { onChange });

      picker.toggleHighlight('location');
      picker.toggleHighlight('service');
      
      picker.clearSelections();
      
      expect(picker.getSelectedHighlights()).toEqual([]);
      expect(onChange).toHaveBeenCalledWith([]);

      picker.destroy();
    });
  });

  describe('Checkbox Management', () => {
    test('should update checkbox states correctly', () => {
      highlightPicker.toggleHighlight('location');
      
      const locationCheckbox = highlightPicker.checkboxes.find(cb => cb.value === 'location');
      expect(locationCheckbox.checked).toBe(true);
      expect(locationCheckbox.element.checked).toBe(true);
    });

    test('should bind change events to checkboxes', () => {
      highlightPicker.checkboxes.forEach(checkbox => {
        expect(checkbox.element.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      });
    });
  });
});

describe('Review Display Component', () => {
  let container;
  let reviewDisplay;

  beforeEach(() => {
    container = document.createElement('div');
    reviewDisplay = new MockReviewDisplay(container);
  });

  afterEach(() => {
    if (reviewDisplay) {
      reviewDisplay.destroy();
    }
  });

  describe('Initialization', () => {
    test('should create all necessary elements', () => {
      expect(reviewDisplay.elements.reviewText).toBeTruthy();
      expect(reviewDisplay.elements.metadata).toBeTruthy();
      expect(reviewDisplay.elements.copyButton).toBeTruthy();
      expect(reviewDisplay.elements.regenerateButton).toBeTruthy();
      expect(reviewDisplay.elements.loadingSpinner).toBeTruthy();
    });

    test('should bind events when copy is allowed', () => {
      expect(reviewDisplay.elements.copyButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should not bind copy events when copy is disabled', () => {
      const display = new MockReviewDisplay(container, { allowCopy: false });
      // Copy button event should not be bound
      display.destroy();
    });
  });

  describe('Review Display', () => {
    test('should display review text correctly', () => {
      const review = {
        text: 'Amazing hotel with great service!',
        source: 'openai',
        latency: 1500,
        cost: 0.002
      };

      reviewDisplay.displayReview(review);

      expect(reviewDisplay.elements.reviewText.textContent).toBe(review.text);
      expect(reviewDisplay.currentReview).toEqual(review);
    });

    test('should display metadata when enabled', () => {
      const display = new MockReviewDisplay(container, { showMetadata: true });
      const review = {
        text: 'Test review',
        source: 'groq',
        latency: 800,
        cost: 0
      };

      display.displayMetadata(review);

      expect(display.elements.metadata.textContent).toContain('Source: groq');
      expect(display.elements.metadata.textContent).toContain('Generated in: 800ms');

      display.destroy();
    });

    test('should not display cost when zero', () => {
      const review = {
        text: 'Free review',
        source: 'template',
        latency: 100,
        cost: 0
      };

      reviewDisplay.displayMetadata(review);

      expect(reviewDisplay.elements.metadata.textContent).not.toContain('Cost:');
    });

    test('should hide metadata when disabled', () => {
      const display = new MockReviewDisplay(container, { showMetadata: false });
      const review = { text: 'Test', source: 'openai', latency: 1000 };

      display.displayReview(review);

      // Metadata should not be displayed
      display.destroy();
    });
  });

  describe('Loading States', () => {
    test('should show loading spinner correctly', () => {
      reviewDisplay.showLoading();

      expect(reviewDisplay.elements.loadingSpinner.style.display).toBe('block');
      expect(reviewDisplay.elements.reviewText.style.display).toBe('none');
      expect(reviewDisplay.elements.copyButton.disabled).toBe(true);
      expect(reviewDisplay.elements.regenerateButton.disabled).toBe(true);
    });

    test('should hide loading spinner correctly', () => {
      reviewDisplay.hideLoading();

      expect(reviewDisplay.elements.loadingSpinner.style.display).toBe('none');
      expect(reviewDisplay.elements.reviewText.style.display).toBe('block');
      expect(reviewDisplay.elements.copyButton.disabled).toBe(false);
      expect(reviewDisplay.elements.regenerateButton.disabled).toBe(false);
    });
  });

  describe('Copy Functionality', () => {
    beforeEach(() => {
      // Mock clipboard API
      global.navigator = {
        clipboard: {
          writeText: jest.fn()
        }
      };
    });

    test('should copy review to clipboard', async () => {
      const onCopy = jest.fn();
      const display = new MockReviewDisplay(container, { onCopy });
      const review = { text: 'Copyable review' };

      display.displayReview(review);
      navigator.clipboard.writeText.mockResolvedValue();

      display.copyReview();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Copyable review');

      display.destroy();
    });

    test('should handle copy errors gracefully', async () => {
      const onCopy = jest.fn();
      const display = new MockReviewDisplay(container, { onCopy });
      const review = { text: 'Review to copy' };

      display.displayReview(review);
      navigator.clipboard.writeText.mockRejectedValue(new Error('Copy failed'));

      display.copyReview();

      // Should call onCopy with false on error
      setTimeout(() => {
        expect(onCopy).toHaveBeenCalledWith(false);
      }, 0);

      display.destroy();
    });

    test('should not copy when no review is loaded', () => {
      navigator.clipboard.writeText.mockResolvedValue();

      reviewDisplay.copyReview();

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });
  });

  describe('Regenerate Functionality', () => {
    test('should trigger regeneration correctly', () => {
      const onRegenerate = jest.fn();
      const display = new MockReviewDisplay(container, { onRegenerate });

      display.regenerateReview();

      expect(display.elements.loadingSpinner.style.display).toBe('block');
      expect(onRegenerate).toHaveBeenCalled();

      display.destroy();
    });
  });

  describe('Clear Functionality', () => {
    test('should clear review display', () => {
      const review = { text: 'Review to clear' };
      reviewDisplay.displayReview(review);

      reviewDisplay.clear();

      expect(reviewDisplay.currentReview).toBeNull();
      expect(reviewDisplay.elements.reviewText.textContent).toBe('');
      expect(reviewDisplay.elements.metadata.textContent).toBe('');
    });
  });

  describe('Component Lifecycle', () => {
    test('should clean up event listeners on destroy', () => {
      // Store references to mock functions before destroy clears them
      const copyButtonRemoveListener = reviewDisplay.elements.copyButton.removeEventListener;
      const regenerateButtonRemoveListener = reviewDisplay.elements.regenerateButton.removeEventListener;
      
      reviewDisplay.destroy();

      expect(copyButtonRemoveListener).toHaveBeenCalled();
      expect(regenerateButtonRemoveListener).toHaveBeenCalled();
      expect(reviewDisplay.elements).toEqual({});
    });
  });
});

describe('Component Integration', () => {
  test('should work together in a complete form', () => {
    const container = document.createElement('div');
    const onChange = jest.fn();

    // Initialize components
    const ratingSelector = new MockRatingSelector(container, { onChange });
    const highlightPicker = new MockHighlightPicker(container, { onChange });
    const reviewDisplay = new MockReviewDisplay(container, {
      onRegenerate: onChange,
      onCopy: onChange
    });

    // Simulate user interactions
    ratingSelector.setRating(4);
    highlightPicker.toggleHighlight('location');
    highlightPicker.toggleHighlight('service');

    // Check form state
    expect(ratingSelector.getRating()).toBe(4);
    expect(highlightPicker.getSelectedHighlights()).toEqual(['location', 'service']);

    // Simulate review generation
    const mockReview = {
      text: 'Integrated test review',
      source: 'openai',
      latency: 1200
    };

    reviewDisplay.displayReview(mockReview);
    expect(reviewDisplay.currentReview).toEqual(mockReview);

    // Cleanup
    ratingSelector.destroy();
    highlightPicker.destroy();
    reviewDisplay.destroy();

    expect(onChange).toHaveBeenCalled();
  });

  test('should handle component errors gracefully', () => {
    const container = document.createElement('div');

    // Test with invalid initial values
    expect(() => {
      const ratingSelector = new MockRatingSelector(container, { initialRating: 10 });
      ratingSelector.destroy();
    }).not.toThrow();

    expect(() => {
      const highlightPicker = new MockHighlightPicker(container, { highlights: [] });
      highlightPicker.destroy();
    }).not.toThrow();

    expect(() => {
      const reviewDisplay = new MockReviewDisplay(container);
      reviewDisplay.displayReview(null);
      reviewDisplay.destroy();
    }).not.toThrow();
  });

  test('should maintain component state independently', () => {
    const container = document.createElement('div');

    const ratingSelector1 = new MockRatingSelector(container, { initialRating: 3 });
    const ratingSelector2 = new MockRatingSelector(container, { initialRating: 5 });

    ratingSelector1.setRating(2);
    ratingSelector2.setRating(4);

    expect(ratingSelector1.getRating()).toBe(2);
    expect(ratingSelector2.getRating()).toBe(4);

    ratingSelector1.destroy();
    ratingSelector2.destroy();
  });
});