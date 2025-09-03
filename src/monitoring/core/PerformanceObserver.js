/**
 * Performance Observer Module
 * Handles setup and management of PerformanceObserver instances
 * @author Hotel Review Generator Team
 * @since 2.0.0
 */

import { createLogger } from '../../utils/logger.js';

const logger = createLogger('PerformanceObserver');

/**
 * Performance Observer Manager
 * Manages various PerformanceObserver instances for different metrics
 */
export class PerformanceObserverManager {
  /**
   * Creates a new PerformanceObserverManager instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = config;
    this.observers = new Map();
  }

  /**
   * Sets up navigation and paint timing observers
   * @param {Function} onNavigationEntry - Callback for navigation entries
   * @returns {void}
   */
  setupNavigationObserver(onNavigationEntry) {
    if (!('PerformanceObserver' in window)) {
      logger.warn('PerformanceObserver not supported');
      return;
    }

    try {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          onNavigationEntry(entry);
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation', 'paint'] });
      this.observers.set('navigation', navigationObserver);
    } catch (e) {
      logger.warn('Navigation/Paint observer failed:', e);
    }
  }

  /**
   * Sets up resource timing observer
   * @param {Function} onResourceEntry - Callback for resource entries
   * @returns {void}
   */
  setupResourceObserver(onResourceEntry) {
    if (!this.config.enableResourceTiming) return;

    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          onResourceEntry(entry);
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    } catch (e) {
      logger.warn('Resource observer failed:', e);
    }
  }

  /**
   * Sets up long task observer
   * @param {Function} onLongTaskEntry - Callback for long task entries
   * @returns {void}
   */
  setupLongTaskObserver(onLongTaskEntry) {
    if (!this.config.enableLongTaskTracking) return;

    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          onLongTaskEntry(entry);
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);
    } catch (e) {
      logger.warn('Long task observer failed:', e);
    }
  }

  /**
   * Sets up user timing observer
   * @param {Function} onUserTimingEntry - Callback for user timing entries
   * @returns {void}
   */
  setupUserTimingObserver(onUserTimingEntry) {
    if (!this.config.enableUserTiming) return;

    try {
      const userTimingObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          onUserTimingEntry(entry);
        }
      });
      userTimingObserver.observe({ entryTypes: ['mark', 'measure'] });
      this.observers.set('userTiming', userTimingObserver);
    } catch (e) {
      logger.warn('User timing observer failed:', e);
    }
  }

  /**
   * Cleans up all observers
   * @returns {void}
   */
  cleanup() {
    for (const [name, observer] of this.observers) {
      try {
        observer.disconnect();
      } catch (e) {
        logger.warn(`Failed to disconnect ${name} observer:`, e);
      }
    }
    this.observers.clear();
  }
}

export default PerformanceObserverManager;