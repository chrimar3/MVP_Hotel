/**
 * @fileoverview Jest Setup Configuration for Hotel Review Generator Tests
 * @description Global test setup and configuration for comprehensive testing
 */

// Import testing library extensions
require('@testing-library/jest-dom');

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log in tests unless debugging
  log: process.env.DEBUG_TESTS ? console.log : jest.fn(),
  error: console.error,
  warn: console.warn,
  info: process.env.DEBUG_TESTS ? console.info : jest.fn(),
  debug: process.env.DEBUG_TESTS ? console.debug : jest.fn(),
};

// Mock window and DOM globals
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn();

// Mock window.open for platform routing tests
Object.defineProperty(window, 'open', {
  writable: true,
  value: jest.fn(),
});

// Mock window dimensions for responsive testing
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});

// Mock scrollTo for smooth scrolling tests
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// Mock requestAnimationFrame for animation tests
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

// Mock performance API for performance tests
Object.defineProperty(global.performance, 'now', {
  writable: true,
  value: jest.fn(() => Date.now()),
});

// Setup DOM environment for each test
beforeEach(() => {
  // Reset DOM
  document.head.innerHTML = '';
  document.body.innerHTML = '';

  // Reset all mocks
  jest.clearAllMocks();

  // Reset timers
  jest.clearAllTimers();

  // Add basic meta tags that tests expect
  const viewport = document.createElement('meta');
  viewport.name = 'viewport';
  viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover';
  document.head.appendChild(viewport);

  // Add title for analytics tests
  document.title = 'Hotel Review Generator - Test';

  // Reset window size
  window.innerWidth = 1024;
  window.innerHeight = 768;
});

// Cleanup after each test
afterEach(() => {
  // Clear any pending timers
  jest.runOnlyPendingTimers();
  jest.useRealTimers();

  // Clear DOM
  document.head.innerHTML = '';
  document.body.innerHTML = '';

  // Reset mocks
  jest.restoreAllMocks();
});

// Global test utilities
global.testUtils = {
  // Wait for element to appear
  waitForElement: (selector, timeout = 1000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkElement = () => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
          return;
        }

        if (Date.now() - startTime > timeout) {
          reject(new Error(`Element ${selector} not found within ${timeout}ms`));
          return;
        }

        setTimeout(checkElement, 10);
      };

      checkElement();
    });
  },

  // Simulate user input
  simulateInput: (element, value) => {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  },

  // Simulate click with proper event
  simulateClick: (element) => {
    element.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
  },

  // Create mock touch event
  createTouchEvent: (type, touches) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    event.touches = touches;
    event.changedTouches = touches;
    return event;
  },

  // Mock mobile viewport
  setMobileViewport: () => {
    window.innerWidth = 375;
    window.innerHeight = 667;
    window.dispatchEvent(new Event('resize'));
  },

  // Mock desktop viewport
  setDesktopViewport: () => {
    window.innerWidth = 1024;
    window.innerHeight = 768;
    window.dispatchEvent(new Event('resize'));
  },

  // Create performance entry mock
  createPerformanceEntry: (name, entryType, startTime, duration = 0) => ({
    name,
    entryType,
    startTime,
    duration,
    toJSON: () => ({ name, entryType, startTime, duration }),
  }),
};

// Custom Jest matchers for hotel review testing
expect.extend({
  toBeValidReview(received) {
    const pass =
      typeof received === 'string' &&
      received.length >= 10 &&
      received.length <= 1000 &&
      !received.toLowerCase().includes('damn') &&
      !received.toLowerCase().includes('hell');

    return {
      message: () =>
        pass
          ? `Expected ${received} not to be a valid review`
          : `Expected ${received} to be a valid review (10-1000 chars, family-friendly)`,
      pass,
    };
  },

  toHaveCorrectPlatformURL(received, platform) {
    const platformPatterns = {
      booking: /booking\.com/,
      tripadvisor: /tripadvisor\.com/,
      google: /maps\.google\.com/,
      yelp: /yelp\.com/,
    };

    const pattern = platformPatterns[platform];
    const pass = pattern && pattern.test(received);

    return {
      message: () =>
        pass
          ? `Expected ${received} not to match ${platform} URL pattern`
          : `Expected ${received} to match ${platform} URL pattern`,
      pass,
    };
  },

  toHaveAccessibleLabel(received) {
    const hasLabel =
      received.getAttribute('aria-label') ||
      received.getAttribute('aria-labelledby') ||
      received.textContent.trim() ||
      received.title ||
      (received.labels && received.labels.length > 0);

    return {
      message: () =>
        hasLabel
          ? `Expected element not to have accessible label`
          : `Expected element to have accessible label (aria-label, aria-labelledby, text content, title, or associated label)`,
      pass: !!hasLabel,
    };
  },

  toMeetTouchTargetSize(received, minSize = 48) {
    const rect = received.getBoundingClientRect();
    const pass = rect.width >= minSize && rect.height >= minSize;

    return {
      message: () =>
        pass
          ? `Expected touch target not to meet minimum size of ${minSize}px`
          : `Expected touch target to meet minimum size of ${minSize}px (actual: ${rect.width}x${rect.height})`,
      pass,
    };
  },
});

// Performance test helpers
global.performanceHelpers = {
  // Measure function execution time
  measureExecutionTime: async (fn) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return {
      result,
      executionTime: end - start,
    };
  },

  // Check if execution is within performance budget
  isWithinBudget: (executionTime, budget) => executionTime <= budget,

  // Mock performance metrics for testing
  mockPerformanceMetrics: () => ({
    fcp: Math.random() * 1000 + 500, // 500-1500ms
    lcp: Math.random() * 1000 + 1000, // 1000-2000ms
    cls: Math.random() * 0.1, // 0-0.1
    fid: Math.random() * 50, // 0-50ms
    ttfb: Math.random() * 200 + 100, // 100-300ms
  }),
};

// BMAD-specific test helpers
global.bmadHelpers = {
  // Verify conversion funnel step completion
  verifyFunnelStep: (stepName, events) => {
    return events.some((event) => event.step === stepName || event.type === stepName);
  },

  // Calculate conversion rate between two steps
  calculateConversionRate: (fromStep, toStep, events) => {
    const fromCount = events.filter((e) => e.step === fromStep || e.type === fromStep).length;
    const toCount = events.filter((e) => e.step === toStep || e.type === toStep).length;
    return fromCount > 0 ? (toCount / fromCount) * 100 : 0;
  },

  // Verify BMAD performance targets
  verifyPerformanceTargets: (metrics) => ({
    pageLoadUnder2s: metrics.loadComplete < 2000,
    reviewGenerationUnder500ms: metrics.reviewGeneration < 500,
    interactiveUnder5s: metrics.interactive < 5000,
    firstContentfulPaintUnder1s: metrics.fcp < 1000,
  }),

  // Mock analytics events for testing
  createMockAnalyticsEvent: (type, data = {}) => ({
    type,
    timestamp: Date.now(),
    sessionId: 'test-session-' + Math.random().toString(36).substr(2, 9),
    ...data,
  }),
};

// Error boundary for test isolation
global.createErrorBoundary = () => {
  const errors = [];

  const originalError = console.error;
  console.error = (...args) => {
    errors.push(args.join(' '));
    originalError(...args);
  };

  return {
    getErrors: () => [...errors],
    clearErrors: () => {
      errors.length = 0;
    },
    restore: () => {
      console.error = originalError;
    },
  };
};

// Setup fake timers for animation and debounce testing
beforeEach(() => {
  jest.useFakeTimers();
});

// Log test environment info in verbose mode
if (process.env.DEBUG_TESTS) {
  console.log('🧪 Jest setup complete - Hotel Review Generator Test Suite');
  console.log(`📊 Coverage thresholds: 85% functions, lines, statements | 80% branches`);
  console.log(`⏱️  Test timeout: 10 seconds`);
  console.log(`🎯 BMAD targets: <2s load, <500ms generation, WCAG 2.1 AA`);
}
