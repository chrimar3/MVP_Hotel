/**
 * Analytics Helper Utility
 * Provides safe access to Google Analytics gtag function
 * @author Hotel Review Generator Team
 * @since 2.0.0
 */

/**
 * Safely calls gtag if it's available
 * @param {...any} args - Arguments to pass to gtag
 * @returns {void}
 */
function safeGtag(...args) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

/**
 * Checks if Google Analytics is loaded and available
 * @returns {boolean} True if gtag is available
 */
function isGtagAvailable() {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/**
 * Tracks an event with Google Analytics if available
 * @param {string} eventName - The event name
 * @param {Object} parameters - Event parameters
 * @returns {void}
 */
function trackEvent(eventName, parameters = {}) {
  safeGtag('event', eventName, parameters);
}

/**
 * Tracks a page view with Google Analytics if available
 * @param {string} pagePath - The page path
 * @param {string} pageTitle - The page title
 * @returns {void}
 */
function trackPageView(pagePath, pageTitle) {
  safeGtag('config', 'GA_MEASUREMENT_ID', {
    page_path: pagePath,
    page_title: pageTitle
  });
}

export { safeGtag, isGtagAvailable, trackEvent, trackPageView };