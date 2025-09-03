/**
 * Advanced Analytics Module - Lazy loaded and privacy-focused
 * Handles user tracking, behavior analysis, and performance metrics
 * @author Hotel Review Generator Team
 * @since 2.0.0
 */

import { createLogger } from '../utils/logger.js';
import { safeGtag } from '../utils/analytics-helper.js';

const logger = createLogger('Analytics');

/**
 * Privacy-focused Analytics Engine
 * Provides comprehensive user behavior tracking with privacy controls
 */
class PrivacyAnalytics {
  /**
   * Creates a new PrivacyAnalytics instance
   * @param {Object} config - Configuration options for analytics
   * @param {string} config.trackingId - Google Analytics tracking ID
   * @param {boolean} config.enableUserTracking - Whether to enable user tracking
   * @param {boolean} config.enablePageViews - Whether to track page views
   * @param {boolean} config.enableEvents - Whether to track events
   * @param {boolean} config.enableConversions - Whether to track conversions
   * @param {boolean} config.enablePerformance - Whether to track performance metrics
   * @param {boolean} config.enableErrors - Whether to track errors
   * @param {boolean} config.respectDoNotTrack - Whether to respect Do Not Track setting
   * @param {boolean} config.anonymizeIp - Whether to anonymize IP addresses
   * @param {number} config.sessionTimeout - Session timeout in milliseconds
   * @param {number} config.batchSize - Number of events to batch before sending
   * @param {number} config.flushInterval - Interval for flushing events in milliseconds
   * @param {string} config.endpoint - Custom endpoint for sending events
   */
  constructor(config = {}) {
    this.config = {
      trackingId: null,
      enableUserTracking: true,
      enablePageViews: true,
      enableEvents: true,
      enableConversions: true,
      enablePerformance: true,
      enableErrors: true,
      respectDoNotTrack: true,
      anonymizeIp: true,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      batchSize: 10,
      flushInterval: 5000, // 5 seconds
      endpoint: null,
      ...config
    };

    this.events = [];
    this.session = null;
    this.user = null;
    this.pageStartTime = performance.now();
    this.flushTimer = null;

    this.initialize();
  }

  /**
   * Initializes the analytics engine
   * Sets up session tracking, user identification, and event listeners
   * @returns {void}
   */
  initialize() {
    // Respect Do Not Track
    if (this.config.respectDoNotTrack && navigator.doNotTrack === '1') {
      logger.info('Analytics disabled: Do Not Track is enabled');
      return;
    }

    this.initializeSession();
    this.initializeUser();
    this.setupEventListeners();
    this.startFlushTimer();

    // Track initial page view
    if (this.config.enablePageViews) {
      this.trackPageView();
    }

    logger.info('Privacy Analytics initialized');
  }

  /**
   * Initializes a new analytics session
   * Creates session ID and tracks session metadata
   * @returns {void}
   */
  initializeSession() {
    const sessionId = this.generateSessionId();
    const now = Date.now();

    this.session = {
      id: sessionId,
      startTime: now,
      lastActivity: now,
      pageViews: 0,
      events: 0,
      referrer: document.referrer || 'direct',
      userAgent: navigator.userAgent,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    // Store session in sessionStorage
    sessionStorage.setItem('analytics_session', JSON.stringify(this.session));
  }

  /**
   * Initializes user identification and tracking
   * Creates or retrieves existing user ID from localStorage
   * @returns {void}
   */
  initializeUser() {
    // Try to get existing user ID from localStorage
    let userId = localStorage.getItem('analytics_user_id');

    if (!userId) {
      userId = this.generateUserId();
      localStorage.setItem('analytics_user_id', userId);
    }

    const firstVisit = localStorage.getItem('analytics_first_visit');
    if (!firstVisit) {
      localStorage.setItem('analytics_first_visit', Date.now().toString());
    }

    this.user = {
      id: userId,
      firstVisit: parseInt(firstVisit) || Date.now(),
      isReturning: !!firstVisit
    };
  }

  /**
   * Sets up event listeners for automatic tracking
   * Tracks page visibility, clicks, form submissions, scroll, and resize events
   * @returns {void}
   */
  setupEventListeners() {
    // Page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden', {
          timeOnPage: performance.now() - this.pageStartTime
        });
        this.flush(); // Ensure events are sent before page is hidden
      } else {
        this.trackEvent('page_visible');
        this.pageStartTime = performance.now();
      }
    });

    // Before unload - track session end
    window.addEventListener('beforeunload', () => {
      this.trackEvent('session_end', {
        sessionDuration: Date.now() - this.session.startTime,
        pageViews: this.session.pageViews,
        totalEvents: this.session.events
      });
      this.flush();
    });

    // Click tracking
    document.addEventListener('click', (event) => {
      this.trackClick(event);
    });

    // Form submissions
    document.addEventListener('submit', (event) => {
      this.trackFormSubmission(event);
    });

    // Scroll tracking
    let scrollTimer = null;
    let maxScroll = 0;

    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);

      const scrollPercent = Math.round(
        (window.pageYOffset / (document.body.scrollHeight - window.innerHeight)) * 100
      );

      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
      }

      scrollTimer = setTimeout(() => {
        this.trackEvent('scroll', {
          scrollPercent,
          maxScrollPercent: maxScroll
        });
      }, 1000);
    });

    // Resize tracking
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.trackEvent('viewport_change', {
          width: window.innerWidth,
          height: window.innerHeight
        });
      }, 500);
    });
  }

  /**
   * Starts the timer for automatically flushing events
   * @returns {void}
   */
  startFlushTimer() {
    this.flushTimer = setInterval(() => {
      if (this.events.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  /**
   * Generates a unique session identifier
   * @returns {string} A unique session ID
   */
  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Generates a unique user identifier
   * @returns {string} A unique user ID
   */
  generateUserId() {
    return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Tracks a page view event
   * @param {string|null} path - The page path (defaults to current path)
   * @param {string|null} title - The page title (defaults to current title)
   * @returns {void}
   */
  trackPageView(path = null, title = null) {
    if (!this.config.enablePageViews) return;

    const pageData = {
      path: path || window.location.pathname,
      title: title || document.title,
      referrer: document.referrer,
      timestamp: Date.now(),
      loadTime: performance.now() - this.pageStartTime
    };

    this.session.pageViews++;
    this.trackEvent('page_view', pageData);
  }

  /**
   * Tracks a custom event with properties
   * @param {string} eventName - The name of the event
   * @param {Object} properties - Additional properties for the event
   * @returns {string|undefined} The event ID if tracking is enabled
   */
  trackEvent(eventName, properties = {}) {
    if (!this.config.enableEvents) return;

    const event = {
      id: this.generateEventId(),
      name: eventName,
      properties: {
        ...properties,
        timestamp: Date.now(),
        sessionId: this.session.id,
        userId: this.user.id
      },
      session: {
        id: this.session.id,
        startTime: this.session.startTime,
        pageViews: this.session.pageViews
      },
      user: {
        id: this.user.id,
        isReturning: this.user.isReturning,
        firstVisit: this.user.firstVisit
      },
      page: {
        url: window.location.href,
        path: window.location.pathname,
        title: document.title
      }
    };

    this.events.push(event);
    this.session.events++;
    this.session.lastActivity = Date.now();

    // Auto-flush if batch size reached
    if (this.events.length >= this.config.batchSize) {
      this.flush();
    }

    return event.id;
  }

  /**
   * Tracks click events on buttons, links, and tracked elements
   * @param {Event} clickEvent - The click event object
   * @returns {void}
   */
  trackClick(clickEvent) {
    const element = clickEvent.target;
    const tagName = element.tagName.toLowerCase();

    // Track button clicks
    if (tagName === 'button' || element.type === 'submit') {
      this.trackEvent('button_click', {
        buttonText: element.textContent?.trim() || element.value,
        buttonType: element.type,
        buttonId: element.id,
        buttonClass: element.className
      });
    }

    // Track link clicks
    if (tagName === 'a') {
      this.trackEvent('link_click', {
        href: element.href,
        linkText: element.textContent?.trim(),
        linkId: element.id,
        linkClass: element.className,
        isExternal: element.hostname !== window.location.hostname
      });
    }

    // Track specific UI elements
    if (element.dataset.track) {
      this.trackEvent('ui_interaction', {
        trackingId: element.dataset.track,
        elementType: tagName,
        elementId: element.id,
        elementClass: element.className,
        elementText: element.textContent?.trim()
      });
    }
  }

  /**
   * Tracks form submission events with safe data collection
   * @param {Event} submitEvent - The form submission event object
   * @returns {void}
   */
  trackFormSubmission(submitEvent) {
    const form = submitEvent.target;
    const formData = new FormData(form);

    // Don't track sensitive data
    const allowedFields = ['feedback_type', 'rating', 'language', 'category'];
    const trackedData = {};

    for (const [key, value] of formData.entries()) {
      if (allowedFields.includes(key)) {
        trackedData[key] = value;
      }
    }

    this.trackEvent('form_submission', {
      formId: form.id,
      formAction: form.action,
      formMethod: form.method,
      formData: trackedData,
      fieldCount: form.elements.length
    });
  }

  /**
   * Tracks conversion events
   * @param {string} conversionName - The name of the conversion
   * @param {number|null} value - The monetary value of the conversion
   * @param {string} currency - The currency code (defaults to 'USD')
   * @returns {void}
   */
  trackConversion(conversionName, value = null, currency = 'USD') {
    if (!this.config.enableConversions) return;

    this.trackEvent('conversion', {
      conversionName,
      value,
      currency,
      timestamp: Date.now()
    });
  }

  /**
   * Tracks error events with context
   * @param {Error|string} error - The error object or message
   * @param {Object} context - Additional context about the error
   * @returns {void}
   */
  trackError(error, context = {}) {
    if (!this.config.enableErrors) return;

    this.trackEvent('error', {
      message: error.message || error,
      stack: error.stack,
      type: error.constructor?.name,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }

  /**
   * Tracks performance metrics
   * @param {Object} metrics - Performance metrics to track
   * @returns {void}
   */
  trackPerformance(metrics) {
    if (!this.config.enablePerformance) return;

    this.trackEvent('performance', {
      ...metrics,
      timestamp: Date.now()
    });
  }

  // Custom tracking methods for hotel review app
  /**
   * Tracks review generation events specific to the hotel review app
   * @param {Object} reviewData - Data about the generated review
   * @param {string} reviewData.content - The review content
   * @param {number} reviewData.rating - The review rating
   * @param {string} reviewData.language - The review language
   * @param {string} reviewData.platform - The target platform
   * @param {string} reviewData.hotelName - The hotel name
   * @param {number} reviewData.generationTime - Time taken to generate review
   * @returns {void}
   */
  trackReviewGeneration(reviewData) {
    this.trackEvent('review_generated', {
      reviewLength: reviewData.content?.length || 0,
      rating: reviewData.rating,
      language: reviewData.language,
      platform: reviewData.platform,
      hotelName: reviewData.hotelName,
      generationTime: reviewData.generationTime
    });
  }

  /**
   * Tracks when a review is copied to clipboard
   * @param {Object} reviewData - Data about the copied review
   * @param {string} reviewData.content - The review content
   * @param {number} reviewData.rating - The review rating
   * @param {string} reviewData.platform - The target platform
   * @returns {void}
   */
  trackReviewCopy(reviewData) {
    this.trackEvent('review_copied', {
      reviewLength: reviewData.content?.length || 0,
      rating: reviewData.rating,
      platform: reviewData.platform
    });
  }

  /**
   * Tracks platform redirect events
   * @param {string} platform - The target platform
   * @param {string} hotelName - The hotel name
   * @returns {void}
   */
  trackPlatformRedirect(platform, hotelName) {
    this.trackEvent('platform_redirect', {
      platform,
      hotelName
    });
  }

  /**
   * Tracks language change events
   * @param {string} from - The previous language
   * @param {string} to - The new language
   * @returns {void}
   */
  trackLanguageChange(from, to) {
    this.trackEvent('language_change', {
      fromLanguage: from,
      toLanguage: to
    });
  }

  /**
   * Generates a unique event identifier
   * @returns {string} A unique event ID
   */
  generateEventId() {
    return 'evt_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Flushes queued events to configured endpoints
   * @returns {Promise<void>}
   */
  async flush() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      // Send to configured endpoint
      if (this.config.endpoint) {
        await this.sendToEndpoint(eventsToSend);
      }

      // Send to Google Analytics if available
      if (this.config.trackingId) {
        this.sendToGoogleAnalytics(eventsToSend);
      }

      // Log events in development
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Analytics events sent:', eventsToSend);
      }

    } catch (error) {
      logger.error('Failed to send analytics events:', error);

      // Put events back in queue for retry
      this.events.unshift(...eventsToSend);

      // Limit queue size to prevent memory issues
      if (this.events.length > this.config.batchSize * 10) {
        this.events = this.events.slice(-this.config.batchSize * 5);
      }
    }
  }

  /**
   * Sends events to a custom endpoint
   * @param {Array} events - Array of events to send
   * @returns {Promise<void>}
   */
  async sendToEndpoint(events) {
    const payload = {
      events,
      session: this.session,
      user: this.user,
      timestamp: Date.now()
    };

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Sends events to Google Analytics using gtag
   * @param {Array} events - Array of events to send
   * @returns {void}
   */
  sendToGoogleAnalytics(events) {
    events.forEach(event => {
      safeGtag('event', event.name, {
        custom_parameter_1: JSON.stringify(event.properties),
        session_id: event.session.id,
        user_id: event.user.id
      });
    });
  }

  // Public API methods
  /**
   * Gets the current session data
   * @returns {Object} A copy of the current session object
   */
  getSession() {
    return { ...this.session };
  }

  /**
   * Gets the current user data
   * @returns {Object} A copy of the current user object
   */
  getUser() {
    return { ...this.user };
  }

  /**
   * Gets the currently queued events
   * @returns {Array} A copy of the queued events array
   */
  getQueuedEvents() {
    return [...this.events];
  }

  /**
   * Clears user data from storage and memory
   * @returns {void}
   */
  clearUser() {
    localStorage.removeItem('analytics_user_id');
    localStorage.removeItem('analytics_first_visit');
    this.user = null;
  }

  /**
   * Pauses the automatic event flushing
   * @returns {void}
   */
  pause() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Resumes the automatic event flushing
   * @returns {void}
   */
  resume() {
    if (!this.flushTimer) {
      this.startFlushTimer();
    }
  }

  /**
   * Destroys the analytics instance and cleans up resources
   * @returns {void}
   */
  destroy() {
    this.pause();
    this.flush();
    this.events = [];
    this.session = null;
    this.user = null;
  }
}

// Utility functions

/**
 * Factory function to create a new PrivacyAnalytics instance
 * @param {Object} config - Configuration options for the analytics instance
 * @returns {PrivacyAnalytics} A new PrivacyAnalytics instance
 */
export const createAnalytics = (config = {}) => {
  return new PrivacyAnalytics(config);
};

/**
 * Global utility function to track an event
 * @param {string} eventName - The name of the event to track
 * @param {Object} properties - Additional properties for the event
 * @returns {string|undefined} The event ID if tracking is successful
 */
export const trackEvent = (eventName, properties = {}) => {
  if (window.hotelReviewApp?.analytics) {
    return window.hotelReviewApp.analytics.trackEvent(eventName, properties);
  }
};

/**
 * Global utility function to track a conversion
 * @param {string} conversionName - The name of the conversion
 * @param {number|null} value - The monetary value of the conversion
 * @param {string} currency - The currency code (defaults to 'USD')
 * @returns {string|undefined} The event ID if tracking is successful
 */
export const trackConversion = (conversionName, value = null, currency = 'USD') => {
  if (window.hotelReviewApp?.analytics) {
    return window.hotelReviewApp.analytics.trackConversion(conversionName, value, currency);
  }
};

/**
 * Global utility function to track an error
 * @param {Error|string} error - The error object or message
 * @param {Object} context - Additional context about the error
 * @returns {string|undefined} The event ID if tracking is successful
 */
export const trackError = (error, context = {}) => {
  if (window.hotelReviewApp?.analytics) {
    return window.hotelReviewApp.analytics.trackError(error, context);
  }
};

export { PrivacyAnalytics };
export default PrivacyAnalytics;