/**
 * Error Monitoring and Logging System
 * Integrates with Sentry for production error tracking
 */

class ErrorMonitor {
  constructor(config) {
    this.config = config || window.AppConfig;
    this.errorQueue = [];
    this.maxQueueSize = 50;
    this.initialized = false;
    
    this.initializeErrorTracking();
  }
  
  initializeErrorTracking() {
    // Set up global error handlers
    window.addEventListener('error', (event) => {
      this.handleError({
        message: event.message,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        type: 'uncaught'
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        error: event.reason,
        type: 'unhandledRejection'
      });
    });
    
    // Initialize Sentry if in production
    if (this.config.get('ENABLE_ERROR_TRACKING') && this.config.get('SENTRY_DSN')) {
      this.initializeSentry();
    }
  }
  
  initializeSentry() {
    // Dynamically load Sentry
    const script = document.createElement('script');
    script.src = 'https://browser.sentry-cdn.com/7.0.0/bundle.min.js';
    script.onload = () => {
      if (window.Sentry) {
        window.Sentry.init({
          dsn: this.config.get('SENTRY_DSN'),
          environment: this.config.get('SENTRY_ENVIRONMENT'),
          release: this.config.get('SENTRY_RELEASE'),
          tracesSampleRate: 0.1,
          beforeSend(event) {
            // Filter out sensitive information
            if (event.request) {
              delete event.request.cookies;
              delete event.request.headers;
            }
            return event;
          }
        });
        this.initialized = true;
        
        // Send queued errors
        this.flushErrorQueue();
      }
    };
    document.head.appendChild(script);
  }
  
  handleError(errorInfo) {
    // Log to console in development
    if (this.config.isDevelopment()) {
      console.error('Error tracked:', errorInfo);
    }
    
    // Add to queue
    this.errorQueue.push({
      ...errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Trim queue if too large
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
    
    // Send to Sentry if available
    if (this.initialized && window.Sentry) {
      this.sendToSentry(errorInfo);
    }
    
    // Log to local storage for debugging
    this.logToLocalStorage(errorInfo);
  }
  
  sendToSentry(errorInfo) {
    if (window.Sentry) {
      if (errorInfo.error instanceof Error) {
        window.Sentry.captureException(errorInfo.error);
      } else {
        window.Sentry.captureMessage(errorInfo.message, 'error');
      }
    }
  }
  
  flushErrorQueue() {
    if (this.initialized && window.Sentry) {
      this.errorQueue.forEach(error => this.sendToSentry(error));
      this.errorQueue = [];
    }
  }
  
  logToLocalStorage(errorInfo) {
    try {
      const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      errors.push({
        message: errorInfo.message,
        timestamp: errorInfo.timestamp,
        url: errorInfo.url
      });
      
      // Keep only last 20 errors
      if (errors.length > 20) {
        errors.shift();
      }
      
      localStorage.setItem('app_errors', JSON.stringify(errors));
    } catch (e) {
      // Silently fail if localStorage is full or unavailable
    }
  }
  
  logError(message, context = {}) {
    this.handleError({
      message,
      context,
      type: 'manual'
    });
  }
  
  logWarning(message, context = {}) {
    if (this.config.isDevelopment()) {
      console.warn(message, context);
    }
    
    if (window.Sentry) {
      window.Sentry.captureMessage(message, 'warning');
    }
  }
  
  clearLocalErrors() {
    localStorage.removeItem('app_errors');
  }
  
  getLocalErrors() {
    try {
      return JSON.parse(localStorage.getItem('app_errors') || '[]');
    } catch {
      return [];
    }
  }
}

// Initialize error monitoring
const errorMonitor = new ErrorMonitor();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.ErrorMonitor = errorMonitor;
}