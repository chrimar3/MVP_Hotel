/**
 * Core Web Vitals Tracker Module
 * Tracks CLS, FID, and LCP metrics
 * @author Hotel Review Generator Team
 * @since 2.0.0
 */

import { createLogger } from '../../utils/logger.js';

const logger = createLogger('WebVitalsTracker');

/**
 * Core Web Vitals Tracker
 * Tracks and monitors Core Web Vitals metrics
 */
export class WebVitalsTracker {
  /**
   * Creates a new WebVitalsTracker instance
   */
  constructor() {
    this.vitals = {
      CLS: null,
      FID: null,
      LCP: null
    };
    this.observers = new Map();
  }

  /**
   * Starts tracking Core Web Vitals
   * @returns {void}
   */
  startTracking() {
    this.trackCLS();
    this.trackFID();
    this.trackLCP();
  }

  /**
   * Tracks Cumulative Layout Shift (CLS)
   * @returns {void}
   */
  trackCLS() {
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.vitals.CLS = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);
    } catch (e) {
      logger.warn('CLS observer failed:', e);
    }
  }

  /**
   * Tracks First Input Delay (FID)
   * @returns {void}
   */
  trackFID() {
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.vitals.FID = entry.processingStart - entry.startTime;
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);
    } catch (e) {
      logger.warn('FID observer failed:', e);
    }
  }

  /**
   * Tracks Largest Contentful Paint (LCP)
   * @returns {void}
   */
  trackLCP() {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.vitals.LCP = entry.startTime;
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);
    } catch (e) {
      logger.warn('LCP observer failed:', e);
    }
  }

  /**
   * Gets current Core Web Vitals values
   * @returns {Object} Object containing CLS, FID, and LCP values
   */
  getVitals() {
    return { ...this.vitals };
  }

  /**
   * Checks if Core Web Vitals meet performance thresholds
   * @returns {Object} Object containing pass/fail status for each vital
   */
  getVitalsStatus() {
    return {
      CLS: {
        value: this.vitals.CLS,
        status: this.vitals.CLS !== null ? (this.vitals.CLS <= 0.1 ? 'good' : this.vitals.CLS <= 0.25 ? 'needs-improvement' : 'poor') : 'unknown',
        threshold: 0.1
      },
      FID: {
        value: this.vitals.FID,
        status: this.vitals.FID !== null ? (this.vitals.FID <= 100 ? 'good' : this.vitals.FID <= 300 ? 'needs-improvement' : 'poor') : 'unknown',
        threshold: 100
      },
      LCP: {
        value: this.vitals.LCP,
        status: this.vitals.LCP !== null ? (this.vitals.LCP <= 2500 ? 'good' : this.vitals.LCP <= 4000 ? 'needs-improvement' : 'poor') : 'unknown',
        threshold: 2500
      }
    };
  }

  /**
   * Cleans up observers
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

export default WebVitalsTracker;