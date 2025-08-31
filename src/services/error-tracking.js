/**
 * Free Error Tracking System
 * Client-side error tracking with optional Sentry integration (free tier)
 */

class ErrorTracking {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.sentryDSN = null; // Add your Sentry DSN when ready
    this.environment = this.detectEnvironment();
    this.sessionId = this.generateSessionId();

    this.initializeErrorHandlers();
    this.initializePerformanceTracking();
  }

  detectEnvironment() {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    } else if (hostname.includes('staging')) {
      return 'staging';
    }
    return 'production';
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  initializeErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'javascript',
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error ? event.error.stack : null,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        sessionId: this.sessionId,
      });

      // Prevent default error handling in production
      if (this.environment === 'production') {
        event.preventDefault();
      }
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'unhandledRejection',
        message: event.reason ? event.reason.toString() : 'Unhandled Promise Rejection',
        stack: event.reason && event.reason.stack ? event.reason.stack : null,
        promise: event.promise,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        sessionId: this.sessionId,
      });

      // Prevent default in production
      if (this.environment === 'production') {
        event.preventDefault();
      }
    });

    // Console error override
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.captureError({
        type: 'console',
        message: args.join(' '),
        timestamp: new Date().toISOString(),
        url: window.location.href,
        sessionId: this.sessionId,
      });
      originalConsoleError.apply(console, args);
    };
  }

  initializePerformanceTracking() {
    // Track slow network requests
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 3000) {
              // Resources taking more than 3 seconds
              this.captureError({
                type: 'performance',
                message: `Slow resource: ${entry.name}`,
                duration: Math.round(entry.duration),
                timestamp: new Date().toISOString(),
                url: window.location.href,
                sessionId: this.sessionId,
              });
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (e) {
        console.error('[ErrorTracking] Failed to track error:', e);
        // Fallback: store error locally
        this.queuedErrors.push({ error: e, timestamp: Date.now() });
      }

      // Track long tasks (blocking main thread)
      try {
        const taskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) {
              // Tasks blocking for more than 50ms
              this.captureError({
                type: 'performance',
                message: 'Long task detected',
                duration: Math.round(entry.duration),
                timestamp: new Date().toISOString(),
                url: window.location.href,
                sessionId: this.sessionId,
              });
            }
          });
        });
        taskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.error('[ErrorTracking] Failed to track error:', e);
        // Fallback: store error locally
        this.queuedErrors.push({ error: e, timestamp: Date.now() });
      }
    }

    // Track memory issues
    if (performance.memory) {
      setInterval(() => {
        const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        if (memoryUsage > 0.9) {
          // Using more than 90% of heap
          this.captureError({
            type: 'performance',
            message: 'High memory usage detected',
            memoryUsage: Math.round(memoryUsage * 100) + '%',
            usedHeap: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
            timestamp: new Date().toISOString(),
            url: window.location.href,
            sessionId: this.sessionId,
          });
        }
      }, 60000); // Check every minute
    }
  }

  captureError(error) {
    // Handle malformed error objects gracefully
    if (!error || typeof error !== 'object') {
      error = {
        type: 'unknown',
        message: 'Malformed error object',
        original: error,
        timestamp: new Date().toISOString()
      };
    }

    // Add context
    error.environment = this.environment;
    error.viewport = `${window.innerWidth}x${window.innerHeight}`;
    error.screen = `${screen.width}x${screen.height}`;
    error.referrer = document.referrer;

    // Ensure stack property exists (set to null if missing)
    if (!error.hasOwnProperty('stack') || error.stack === undefined) {
      error.stack = null;
    }

    // Store error
    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Save to localStorage
    this.saveToLocalStorage(error);

    // Send to Sentry if configured (free tier: 5K events/month)
    if (this.sentryDSN && this.environment === 'production') {
      this.sendToSentry(error);
    }

    // Log in development
    if (this.environment === 'development') {

    }

    // Send to free monitoring endpoint if critical
    if (error.type === 'javascript' || error.type === 'unhandledRejection') {
      this.sendToFreeMonitoring(error);
    }
  }

  saveToLocalStorage(error) {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('error_log') || '[]');
      storedErrors.push({
        message: error.message,
        type: error.type,
        timestamp: error.timestamp,
        url: error.url,
      });

      // Keep only last 50 errors in localStorage
      if (storedErrors.length > 50) {
        storedErrors.shift();
      }

      localStorage.setItem('error_log', JSON.stringify(storedErrors));
    } catch (e) {
      // Silently fail if localStorage is full
    }
  }

  sendToSentry(error) {
    // Basic Sentry integration (configure DSN first)
    if (!window.Sentry && this.sentryDSN) {
      // Dynamically load Sentry
      const script = document.createElement('script');
      script.src = 'https://browser.sentry-cdn.com/7.0.0/bundle.min.js';
      script.onload = () => {
        window.Sentry.init({
          dsn: this.sentryDSN,
          environment: this.environment,
          beforeSend(event) {
            // Filter sensitive data
            if (event.request) {
              delete event.request.cookies;
            }
            return event;
          },
        });

        // Send the error
        window.Sentry.captureException(new Error(error.message), {
          extra: error,
        });
      };
      document.head.appendChild(script);
    } else if (window.Sentry) {
      window.Sentry.captureException(new Error(error.message), {
        extra: error,
      });
    }
  }

  sendToFreeMonitoring(error) {
    // Send critical errors to a free monitoring service
    // You can use Google Forms, Webhook.site, or GitHub Issues API (free)

    // Option 1: Log to GitHub Issues (requires GitHub token)
    // This is just an example - implement based on your needs

    // Option 2: Send to a Google Form (free and no auth needed)
    const formUrl = 'YOUR_GOOGLE_FORM_URL'; // Create a Google Form and get the URL
    if (formUrl && formUrl !== 'YOUR_GOOGLE_FORM_URL') {
      const formData = new FormData();
      formData.append('entry.XXXXXX', error.message); // Replace with your form field IDs
      formData.append('entry.YYYYYY', error.type);
      formData.append('entry.ZZZZZZ', error.url);

      fetch(formUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formData,
      }).catch(() => {
        // Silently fail
      });
    }
  }

  // Manual error logging
  logError(message, context = {}) {
    this.captureError({
      type: 'manual',
      message,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      sessionId: this.sessionId,
    });
  }

  // Get error summary for dashboard
  getErrorSummary() {
    const summary = {
      totalErrors: this.errors.length,
      errorsByType: {},
      recentErrors: this.errors.slice(-10).reverse(),
      criticalErrors: [],
      performanceIssues: [],
    };

    this.errors.forEach((error) => {
      // Count by type
      if (!summary.errorsByType[error.type]) {
        summary.errorsByType[error.type] = 0;
      }
      summary.errorsByType[error.type]++;

      // Identify critical errors
      if (error.type === 'javascript' || error.type === 'unhandledRejection') {
        summary.criticalErrors.push(error);
      }

      // Identify performance issues
      if (error.type === 'performance') {
        summary.performanceIssues.push(error);
      }
    });

    return summary;
  }

  // Clear error log
  clearErrors() {
    this.errors = [];
    localStorage.removeItem('error_log');
  }

  // Export errors for debugging
  exportErrors() {
    const blob = new Blob([JSON.stringify(this.errors, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Create error report for developers
  generateErrorReport() {
    const report = {
      sessionId: this.sessionId,
      environment: this.environment,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errors: this.getErrorSummary(),
      performance: {
        memory: performance.memory
          ? {
              used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
              limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + 'MB',
            }
          : 'N/A',
        timing: performance.timing
          ? {
              loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
              domReady:
                performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
            }
          : 'N/A',
      },
    };

    return report;
  }
}

// Initialize error tracking
const errorTracking = new ErrorTracking();

// Expose for debugging in development
if (errorTracking.environment === 'development') {
  window.ErrorTracking = errorTracking;
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorTracking;
}
