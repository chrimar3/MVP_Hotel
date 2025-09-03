/**
 * Advanced Analytics Module - Lazy loaded and privacy-focused
 * Handles user tracking, behavior analysis, and performance metrics
 */

/**
 * Privacy-focused Analytics Engine
 */
class PrivacyAnalytics {
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

  initialize() {
    // Respect Do Not Track
    if (this.config.respectDoNotTrack && navigator.doNotTrack === '1') {
      console.log('Analytics disabled: Do Not Track is enabled');
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

    console.log('Privacy Analytics initialized');
  }

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

  startFlushTimer() {
    this.flushTimer = setInterval(() => {
      if (this.events.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  generateUserId() {
    return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

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

  trackConversion(conversionName, value = null, currency = 'USD') {
    if (!this.config.enableConversions) return;

    this.trackEvent('conversion', {
      conversionName,
      value,
      currency,
      timestamp: Date.now()
    });
  }

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

  trackPerformance(metrics) {
    if (!this.config.enablePerformance) return;

    this.trackEvent('performance', {
      ...metrics,
      timestamp: Date.now()
    });
  }

  // Custom tracking methods for hotel review app
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

  trackReviewCopy(reviewData) {
    this.trackEvent('review_copied', {
      reviewLength: reviewData.content?.length || 0,
      rating: reviewData.rating,
      platform: reviewData.platform
    });
  }

  trackPlatformRedirect(platform, hotelName) {
    this.trackEvent('platform_redirect', {
      platform,
      hotelName
    });
  }

  trackLanguageChange(from, to) {
    this.trackEvent('language_change', {
      fromLanguage: from,
      toLanguage: to
    });
  }

  generateEventId() {
    return 'evt_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

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
      if (this.config.trackingId && typeof gtag !== 'undefined') {
        this.sendToGoogleAnalytics(eventsToSend);
      }

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Analytics events sent:', eventsToSend);
      }

    } catch (error) {
      console.error('Failed to send analytics events:', error);

      // Put events back in queue for retry
      this.events.unshift(...eventsToSend);

      // Limit queue size to prevent memory issues
      if (this.events.length > this.config.batchSize * 10) {
        this.events = this.events.slice(-this.config.batchSize * 5);
      }
    }
  }

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

  sendToGoogleAnalytics(events) {
    events.forEach(event => {
      gtag('event', event.name, {
        custom_parameter_1: JSON.stringify(event.properties),
        session_id: event.session.id,
        user_id: event.user.id
      });
    });
  }

  // Public API methods
  getSession() {
    return { ...this.session };
  }

  getUser() {
    return { ...this.user };
  }

  getQueuedEvents() {
    return [...this.events];
  }

  clearUser() {
    localStorage.removeItem('analytics_user_id');
    localStorage.removeItem('analytics_first_visit');
    this.user = null;
  }

  pause() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  resume() {
    if (!this.flushTimer) {
      this.startFlushTimer();
    }
  }

  destroy() {
    this.pause();
    this.flush();
    this.events = [];
    this.session = null;
    this.user = null;
  }
}

// Utility functions
export const createAnalytics = (config = {}) => {
  return new PrivacyAnalytics(config);
};

export const trackEvent = (eventName, properties = {}) => {
  if (window.hotelReviewApp?.analytics) {
    return window.hotelReviewApp.analytics.trackEvent(eventName, properties);
  }
};

export const trackConversion = (conversionName, value = null, currency = 'USD') => {
  if (window.hotelReviewApp?.analytics) {
    return window.hotelReviewApp.analytics.trackConversion(conversionName, value, currency);
  }
};

export const trackError = (error, context = {}) => {
  if (window.hotelReviewApp?.analytics) {
    return window.hotelReviewApp.analytics.trackError(error, context);
  }
};

export { PrivacyAnalytics };
export default PrivacyAnalytics;