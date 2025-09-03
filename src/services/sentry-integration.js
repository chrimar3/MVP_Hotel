/**
 * Sentry Integration for Production Monitoring
 * Free tier: 5,000 events/month
 */

class SentryIntegration {
  constructor() {
    // Free Sentry DSN - replace with your actual DSN from sentry.io
    // Sign up at https://sentry.io (free tier available)
    this.DSN = 'https://YOUR_DSN_HERE@sentry.io/YOUR_PROJECT_ID';
    this.environment = this.detectEnvironment();
    this.isInitialized = false;

    // Only initialize in production
    if (this.environment === 'production' && this.DSN !== 'https://YOUR_DSN_HERE@sentry.io/YOUR_PROJECT_ID') {
      this.initialize();
    }
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

  initialize() {
    try {
      // Dynamically load Sentry SDK
      const script = document.createElement('script');
      script.src = 'https://browser.sentry-cdn.com/7.91.0/bundle.tracing.min.js';
      script.crossOrigin = 'anonymous';

      script.onload = () => {
        if (window.Sentry) {
          window.Sentry.init({
            dsn: this.DSN,
            environment: this.environment,

            // Performance Monitoring
            integrations: [
              new window.Sentry.BrowserTracing({
                tracingOrigins: ['localhost', 'chrimar3.github.io', /^\//],
                routingInstrumentation: window.Sentry.reactRouterV6Instrumentation(
                  window.history
                ),
              }),
              new window.Sentry.Replay({
                maskAllText: true,
                blockAllMedia: true,
              }),
            ],

            // Performance settings
            tracesSampleRate: this.environment === 'production' ? 0.1 : 1.0,
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,

            // Release tracking
            release: 'hotel-review-generator@2.0.0',

            // User context
            beforeSend: (event, _hint) => {
              // Add user context
              if (event.user) {
                event.user = {
                  ...event.user,
                  id: this.getUserId(),
                };
              }

              // Filter out sensitive data
              if (event.request) {
                delete event.request.cookies;
                delete event.request.headers?.authorization;
              }

              // Don't send events in development
              if (this.environment === 'development') {
                // Development logging allowed for Sentry debugging
                console.info('[Sentry] Event captured (dev mode):', event);
                return null;
              }

              return event;
            },

            // Ignore certain errors
            ignoreErrors: [
              'ResizeObserver loop limit exceeded',
              'Non-Error promise rejection captured',
              /extension\//i,
              /^chrome:\/\//i,
              /^moz-extension:\/\//i,
            ],
          });

          this.isInitialized = true;
          // Development-only initialization logging
          if (this.environment === 'development') {
            console.info('[Sentry] Initialized successfully');
          }

          // Set initial user context
          this.setUserContext();

          // Track initial page view
          this.trackPageView();
        }
      };

      script.onerror = () => {
        console.error('[Sentry] Failed to load SDK');
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error('[Sentry] Initialization error:', error);
    }
  }

  getUserId() {
    let userId = localStorage.getItem('sentry_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('sentry_user_id', userId);
    }
    return userId;
  }

  setUserContext() {
    if (window.Sentry && this.isInitialized) {
      window.Sentry.setUser({
        id: this.getUserId(),
        environment: this.environment,
      });
    }
  }

  // Manual error capture
  captureError(error, context = {}) {
    if (window.Sentry && this.isInitialized) {
      window.Sentry.captureException(error, {
        extra: context,
        tags: {
          component: context.component || 'unknown',
        },
      });
    } else {
      console.error('[Sentry] Error captured (not initialized):', error, context);
    }
  }

  // Capture custom messages
  captureMessage(message, level = 'info', context = {}) {
    if (window.Sentry && this.isInitialized) {
      window.Sentry.captureMessage(message, level, {
        extra: context,
      });
    }
  }

  // Performance monitoring
  startTransaction(name, op = 'navigation') {
    if (window.Sentry && this.isInitialized) {
      return window.Sentry.startTransaction({
        name,
        op,
      });
    }
    return null;
  }

  // Track page views
  trackPageView(pageName = null) {
    if (window.Sentry && this.isInitialized) {
      const page = pageName || window.location.pathname;
      window.Sentry.addBreadcrumb({
        category: 'navigation',
        message: `Viewed ${page}`,
        level: 'info',
      });
    }
  }

  // Track user actions
  trackUserAction(action, data = {}) {
    if (window.Sentry && this.isInitialized) {
      window.Sentry.addBreadcrumb({
        category: 'user-action',
        message: action,
        level: 'info',
        data,
      });
    }
  }

  // Track review generation
  trackReviewGeneration(success, metadata = {}) {
    if (window.Sentry && this.isInitialized) {
      const transaction = this.startTransaction('review-generation', 'task');

      if (transaction) {
        transaction.setData('hotel_name', metadata.hotelName);
        transaction.setData('rating', metadata.rating);
        transaction.setData('success', success);

        if (success) {
          transaction.setStatus('ok');
        } else {
          transaction.setStatus('internal_error');
        }

        transaction.finish();
      }

      // Also track as breadcrumb
      window.Sentry.addBreadcrumb({
        category: 'review',
        message: success ? 'Review generated successfully' : 'Review generation failed',
        level: success ? 'info' : 'error',
        data: metadata,
      });
    }
  }

  // Track API calls
  trackAPICall(endpoint, method, status, duration) {
    if (window.Sentry && this.isInitialized) {
      window.Sentry.addBreadcrumb({
        category: 'api',
        message: `${method} ${endpoint}`,
        level: status >= 400 ? 'error' : 'info',
        data: {
          status_code: status,
          duration_ms: duration,
        },
      });
    }
  }

  // Set custom tags
  setTag(key, value) {
    if (window.Sentry && this.isInitialized) {
      window.Sentry.setTag(key, value);
    }
  }

  // Set custom context
  setContext(key, context) {
    if (window.Sentry && this.isInitialized) {
      window.Sentry.setContext(key, context);
    }
  }
}

// Create singleton instance
const sentryIntegration = new SentryIntegration();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.SentryIntegration = sentryIntegration;
}

// Integrate with existing error tracking
if (typeof window !== 'undefined' && window.ErrorTracking) {
  const originalCaptureError = window.ErrorTracking.captureError;
  window.ErrorTracking.captureError = function(error) {
    // Call original error tracking
    originalCaptureError.call(this, error);

    // Also send to Sentry
    sentryIntegration.captureError(new Error(error.message), {
      type: error.type,
      source: error.source,
      url: error.url,
      sessionId: error.sessionId,
    });
  };
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SentryIntegration;
}