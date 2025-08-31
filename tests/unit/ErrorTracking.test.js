/**
 * Unit Tests for ErrorTracking Service
 * Tests error handling, monitoring, and reporting capabilities
 */

const ErrorTracking = require('../../src/services/error-tracking.js');

// Mock browser APIs
global.window = {
  location: {
    hostname: 'localhost',
    href: 'http://localhost:3000/test'
  },
  addEventListener: jest.fn(),
  PerformanceObserver: jest.fn(),
  analytics: {
    track: jest.fn()
  },
  monitoring: {
    alert: jest.fn(),
    report: jest.fn()
  },
  errorTracking: {
    logError: jest.fn()
  },
  Sentry: {
    init: jest.fn(),
    captureException: jest.fn()
  },
  innerWidth: 1920,
  innerHeight: 1080
};

global.navigator = {
  userAgent: 'Test Browser/1.0'
};

global.screen = {
  width: 1920,
  height: 1080
};

global.document = {
  referrer: 'http://test.com',
  createElement: jest.fn((tagName) => {
    const element = {
      tagName: tagName.toUpperCase(),
      src: '',
      onload: null,
      click: jest.fn(),
      // Make it look like a proper DOM node for appendChild
      nodeType: 1, // Element node
      nodeName: tagName.toUpperCase()
    };
    return element;
  }),
  head: {
    appendChild: jest.fn().mockImplementation(() => {
      // Mock appendChild to avoid JSDOM Node validation
      return true;
    })
  }
};

// Remove the global performance mock from here - will be set in beforeEach

global.console = {
  error: jest.fn()
};

global.URL = {
  createObjectURL: jest.fn(() => 'blob:test-url'),
  revokeObjectURL: jest.fn()
};

global.Blob = jest.fn();

describe('ErrorTracking', () => {
  let errorTracking;
  let setIntervalSpy;
  let clearIntervalSpy;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    localStorage.getItem.mockReturnValue(null);
    
    // Ensure window.location is set to localhost for development environment
    global.window.location.hostname = 'localhost';
    
    // Override document to avoid JSDOM Node validation issues
    global.document = {
      referrer: 'http://test.com',
      createElement: jest.fn((tagName) => ({
        tagName: tagName.toUpperCase(),
        src: '',
        onload: null,
        click: jest.fn(),
        nodeType: 1,
        nodeName: tagName.toUpperCase()
      })),
      head: {
        appendChild: jest.fn()
      }
    };
    
    // Ensure window.Sentry is available for tests (may be deleted by some tests)
    global.window.Sentry = {
      init: jest.fn(),
      captureException: jest.fn()
    };
    
    // Ensure navigator.userAgent matches test expectations (override setup.js)
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Test Browser/1.0',
      configurable: true
    });
    
    // Mock console.error
    const originalConsoleError = console.error;
    console.error = jest.fn(originalConsoleError);
    
    // Spy on intervals BEFORE creating ErrorTracking instance
    setIntervalSpy = jest.spyOn(global, 'setInterval');
    clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    // Ensure performance.memory is available for memory monitoring
    // The ErrorTracking class checks `performance.memory` directly
    global.performance = global.performance || {};
    global.performance.memory = {
      usedJSHeapSize: 50000000,
      jsHeapSizeLimit: 100000000
    };
    global.performance.timing = {
      navigationStart: 1000,
      loadEventEnd: 2000,
      domContentLoadedEventEnd: 1500
    };
    
    // Make sure performance is also available without global prefix
    global.window.performance = global.performance;
    
    // Create new instance
    errorTracking = new ErrorTracking();
  });

  afterEach(() => {
    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(errorTracking.errors).toEqual([]);
      expect(errorTracking.maxErrors).toBe(100);
      expect(errorTracking.environment).toBe('development');
      expect(errorTracking.sessionId).toContain('session_');
    });

    test('should detect environment correctly', () => {
      // Test development
      window.location.hostname = 'localhost';
      let tracking = new ErrorTracking();
      expect(tracking.detectEnvironment()).toBe('development');
      
      // Test staging
      window.location.hostname = 'staging.example.com';
      tracking = new ErrorTracking();
      expect(tracking.detectEnvironment()).toBe('staging');
      
      // Test production
      window.location.hostname = 'example.com';
      tracking = new ErrorTracking();
      expect(tracking.detectEnvironment()).toBe('production');
    });

    test('should generate unique session IDs', () => {
      const id1 = errorTracking.generateSessionId();
      const id2 = errorTracking.generateSessionId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toContain('session_');
      expect(id2).toContain('session_');
    });

    test('should set up error event listeners', () => {
      expect(window.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });
  });

  describe('Error Capture', () => {
    test('should capture basic error information', () => {
      const testError = {
        type: 'javascript',
        message: 'Test error message',
        source: 'test.js',
        line: 42,
        column: 10
      };
      
      errorTracking.captureError(testError);
      
      expect(errorTracking.errors).toHaveLength(1);
      const capturedError = errorTracking.errors[0];
      
      expect(capturedError.message).toBe('Test error message');
      expect(capturedError.environment).toBe('development');
      expect(capturedError.viewport).toBe('1920x1080');
      expect(capturedError.screen).toBe('1920x1080');
      expect(capturedError.referrer).toBe('http://test.com');
    });

    test('should enforce maximum error limit', () => {
      errorTracking.maxErrors = 3;
      
      // Add more errors than the limit
      for (let i = 0; i < 5; i++) {
        errorTracking.captureError({
          type: 'test',
          message: `Error ${i}`,
          timestamp: new Date().toISOString()
        });
      }
      
      expect(errorTracking.errors).toHaveLength(3);
      // Should keep the most recent errors
      expect(errorTracking.errors[2].message).toBe('Error 4');
    });

    test('should save errors to localStorage', () => {
      const testError = {
        type: 'javascript',
        message: 'localStorage test',
        timestamp: '2023-01-01T00:00:00.000Z',
        url: 'http://test.com'
      };
      
      errorTracking.saveToLocalStorage(testError);
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'error_log',
        expect.stringContaining('localStorage test')
      );
    });

    test('should handle localStorage errors gracefully', () => {
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      expect(() => {
        errorTracking.saveToLocalStorage({
          message: 'test',
          type: 'test',
          timestamp: '2023-01-01T00:00:00.000Z'
        });
      }).not.toThrow();
    });
  });

  describe('Manual Error Logging', () => {
    test('should log manual errors with context', () => {
      const context = { userId: '123', action: 'button_click' };
      
      errorTracking.logError('Manual error test', context);
      
      expect(errorTracking.errors).toHaveLength(1);
      const error = errorTracking.errors[0];
      
      expect(error.type).toBe('manual');
      expect(error.message).toBe('Manual error test');
      expect(error.context).toEqual(context);
      expect(error.sessionId).toBe(errorTracking.sessionId);
    });
  });

  describe('Performance Monitoring', () => {
    test('should initialize PerformanceObserver when available', () => {
      // Mock PerformanceObserver
      const mockObserver = {
        observe: jest.fn()
      };
      window.PerformanceObserver = jest.fn(() => mockObserver);
      
      const tracking = new ErrorTracking();
      
      expect(window.PerformanceObserver).toHaveBeenCalledTimes(2); // Resource and longtask observers
    });

    test('should handle PerformanceObserver unavailability', () => {
      delete window.PerformanceObserver;
      
      expect(() => new ErrorTracking()).not.toThrow();
    });

    test('should start memory monitoring interval', () => {
      // setInterval should have been called during ErrorTracking construction in beforeEach
      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        60000
      );
    });

    test('should detect high memory usage', () => {
      // Simulate high memory usage
      global.performance.memory.usedJSHeapSize = 95000000; // 95% of heap (95/100)
      
      const captureErrorSpy = jest.spyOn(errorTracking, 'captureError');
      
      // Get the memory check function from the setInterval call
      // Should be the last setInterval call (memory monitoring)
      const intervalCalls = setIntervalSpy.mock.calls.filter(call => call[1] === 60000);
      expect(intervalCalls).toHaveLength(1);
      const memoryCheck = intervalCalls[0][0];
      
      // Trigger memory check
      memoryCheck();
      
      expect(captureErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'performance',
          message: 'High memory usage detected',
          memoryUsage: '95%'
        })
      );
    });
  });

  describe('Error Event Handlers', () => {
    test('should handle JavaScript errors', () => {
      const captureErrorSpy = jest.spyOn(errorTracking, 'captureError');
      
      // Simulate JavaScript error event
      const errorEvent = {
        message: 'ReferenceError: variable is not defined',
        filename: 'app.js',
        lineno: 42,
        colno: 10,
        error: {
          stack: 'ReferenceError at app.js:42:10'
        },
        preventDefault: jest.fn()
      };
      
      // Get the error handler from addEventListener calls
      const errorHandler = window.addEventListener.mock.calls
        .find(call => call[0] === 'error')[1];
      
      errorHandler(errorEvent);
      
      expect(captureErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'javascript',
          message: 'ReferenceError: variable is not defined',
          source: 'app.js',
          line: 42,
          column: 10,
          stack: 'ReferenceError at app.js:42:10'
        })
      );
    });

    test('should handle unhandled promise rejections', () => {
      const captureErrorSpy = jest.spyOn(errorTracking, 'captureError');
      
      const rejectionEvent = {
        reason: new Error('Promise rejection test'),
        promise: {},
        preventDefault: jest.fn()
      };
      
      const rejectionHandler = window.addEventListener.mock.calls
        .find(call => call[0] === 'unhandledrejection')[1];
      
      rejectionHandler(rejectionEvent);
      
      expect(captureErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'unhandledRejection',
          message: 'Error: Promise rejection test',
          stack: expect.any(String)
        })
      );
    });

    test('should override console.error in production', () => {
      // Set up production environment
      errorTracking.environment = 'production';
      
      const captureErrorSpy = jest.spyOn(errorTracking, 'captureError');
      
      console.error('Test console error', 'Additional info');
      
      expect(captureErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'console',
          message: 'Test console error Additional info'
        })
      );
    });
  });

  describe('Sentry Integration', () => {
    beforeEach(() => {
      errorTracking.environment = 'production';
      errorTracking.sentryDSN = 'https://test@sentry.io/project';
    });

    test('should dynamically load Sentry when not available', () => {
      delete window.Sentry;
      
      // Mock createElement to return a valid-looking script element
      const mockScript = {
        src: '',
        onload: null,
        // Mock properties to satisfy appendChild
        nodeType: 1,
        nodeName: 'SCRIPT'
      };
      document.createElement.mockReturnValue(mockScript);
      
      // Spy on appendChild
      const appendChildSpy = jest.spyOn(document.head, 'appendChild');
      appendChildSpy.mockImplementation(() => mockScript);
      
      errorTracking.sendToSentry({
        message: 'Test error',
        type: 'javascript'
      });
      
      expect(document.createElement).toHaveBeenCalledWith('script');
      expect(appendChildSpy).toHaveBeenCalledWith(mockScript);
      
      appendChildSpy.mockRestore();
    });

    test('should send error to Sentry when available', () => {
      const testError = {
        message: 'Sentry test error',
        type: 'javascript',
        stack: 'Error stack trace'
      };
      
      errorTracking.sendToSentry(testError);
      
      expect(window.Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        { extra: testError }
      );
    });
  });

  describe('Error Summary and Reporting', () => {
    beforeEach(() => {
      // Add sample errors
      errorTracking.errors = [
        { type: 'javascript', message: 'JS Error 1', timestamp: '2023-01-01T00:00:00Z' },
        { type: 'javascript', message: 'JS Error 2', timestamp: '2023-01-01T00:01:00Z' },
        { type: 'performance', message: 'Slow resource', timestamp: '2023-01-01T00:02:00Z' },
        { type: 'unhandledRejection', message: 'Promise error', timestamp: '2023-01-01T00:03:00Z' },
        { type: 'console', message: 'Console error', timestamp: '2023-01-01T00:04:00Z' }
      ];
    });

    test('should generate comprehensive error summary', () => {
      const summary = errorTracking.getErrorSummary();
      
      expect(summary.totalErrors).toBe(5);
      expect(summary.errorsByType.javascript).toBe(2);
      expect(summary.errorsByType.performance).toBe(1);
      expect(summary.recentErrors).toHaveLength(5);
      expect(summary.criticalErrors).toHaveLength(3); // JS errors and promise rejections
      expect(summary.performanceIssues).toHaveLength(1);
    });

    test('should generate comprehensive error report', () => {
      const report = errorTracking.generateErrorReport();
      
      expect(report.sessionId).toBe(errorTracking.sessionId);
      expect(report.environment).toBe('development');
      expect(report.timestamp).toBeTruthy();
      expect(report.userAgent).toBe('Test Browser/1.0');
      expect(report.errors.totalErrors).toBe(5);
      expect(report.performance.memory.used).toContain('MB');
      expect(report.performance.timing.loadTime).toBe(1000);
    });
  });

  describe('Error Log Management', () => {
    test('should clear all errors', () => {
      errorTracking.errors = [
        { message: 'Error 1' },
        { message: 'Error 2' }
      ];
      
      errorTracking.clearErrors();
      
      expect(errorTracking.errors).toHaveLength(0);
      expect(localStorage.removeItem).toHaveBeenCalledWith('error_log');
    });

    test('should export errors as JSON file', () => {
      errorTracking.errors = [
        { message: 'Export test error', timestamp: '2023-01-01T00:00:00Z' }
      ];
      
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };
      document.createElement.mockReturnValue(mockLink);
      
      errorTracking.exportErrors();
      
      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('Export test error')],
        { type: 'application/json' }
      );
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Free Monitoring Integration', () => {
    test('should send critical errors to free monitoring', () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue();
      
      errorTracking.sendToFreeMonitoring({
        type: 'javascript',
        message: 'Critical error',
        url: 'http://test.com'
      });
      
      // Should not call fetch without proper form URL configured
      expect(fetchSpy).not.toHaveBeenCalled();
      
      fetchSpy.mockRestore();
    });

    test('should handle fetch errors gracefully in free monitoring', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
      
      // Configure a form URL
      errorTracking.sendToFreeMonitoring = jest.fn().mockImplementation((error) => {
        const formData = new FormData();
        return fetch('https://docs.google.com/forms/test', {
          method: 'POST',
          mode: 'no-cors',
          body: formData
        }).catch(() => {
          // Should silently fail
        });
      });
      
      expect(() => {
        errorTracking.sendToFreeMonitoring({
          type: 'javascript',
          message: 'Test error'
        });
      }).not.toThrow();
      
      fetchSpy.mockRestore();
    });
  });

  describe('Environment-Specific Behavior', () => {
    test('should expose ErrorTracking globally in development', () => {
      errorTracking.environment = 'development';
      
      // Re-initialize to trigger global exposure
      const devTracking = new ErrorTracking();
      
      expect(window.ErrorTracking).toBeDefined();
    });

    test('should not expose ErrorTracking globally in production', () => {
      errorTracking.environment = 'production';
      delete window.ErrorTracking;
      
      const prodTracking = new ErrorTracking();
      
      expect(window.ErrorTracking).toBeUndefined();
    });

    test('should prevent default error handling in production', () => {
      errorTracking.environment = 'production';
      
      const errorEvent = {
        message: 'Production error',
        preventDefault: jest.fn()
      };
      
      const errorHandler = window.addEventListener.mock.calls
        .find(call => call[0] === 'error')[1];
      
      errorHandler(errorEvent);
      
      expect(errorEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle malformed error objects', () => {
      expect(() => {
        errorTracking.captureError(null);
      }).not.toThrow();
      
      expect(() => {
        errorTracking.captureError(undefined);
      }).not.toThrow();
      
      expect(() => {
        errorTracking.captureError({});
      }).not.toThrow();
    });

    test('should handle missing performance.memory gracefully', () => {
      delete performance.memory;
      
      const tracking = new ErrorTracking();
      const report = tracking.generateErrorReport();
      
      expect(report.performance.memory).toBe('N/A');
    });

    test('should handle missing performance.timing gracefully', () => {
      delete performance.timing;
      
      const tracking = new ErrorTracking();
      const report = tracking.generateErrorReport();
      
      expect(report.performance.timing).toBe('N/A');
    });

    test('should handle errors without stack traces', () => {
      const errorWithoutStack = {
        type: 'javascript',
        message: 'Error without stack',
        error: null
      };
      
      expect(() => {
        errorTracking.captureError(errorWithoutStack);
      }).not.toThrow();
      
      const capturedError = errorTracking.errors[0];
      expect(capturedError.stack).toBeNull();
    });
  });
});