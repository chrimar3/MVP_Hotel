/**
 * Error Tracking Module
 * Handles error collection, processing, and reporting
 * @author Hotel Review Generator Team
 * @since 2.0.0
 */

import { createLogger } from '../../utils/logger.js';

const logger = createLogger('ErrorTracker');

/**
 * Error Tracker
 * Tracks and reports application errors
 */
export class ErrorTracker {
  /**
   * Creates a new ErrorTracker instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = config;
    this.errors = [];
    this.maxErrors = config.maxErrors || 100;
  }

  /**
   * Sets up global error tracking
   * @returns {void}
   */
  setupGlobalErrorHandling() {
    if (!this.config.enableErrorTracking) return;

    // Catch JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        timestamp: Date.now()
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'unhandledrejection',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        reason: event.reason,
        timestamp: Date.now()
      });
    });

    // Catch resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.trackError({
          type: 'resource',
          message: 'Resource failed to load',
          element: event.target.tagName,
          source: event.target.src || event.target.href,
          timestamp: Date.now()
        });
      }
    }, true);
  }

  /**
   * Tracks a custom error
   * @param {Object|Error} error - The error to track
   * @returns {void}
   */
  trackError(error) {
    const errorData = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...error
    };

    // Add to error collection
    this.errors.push(errorData);

    // Keep errors within limit
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Report immediately if configured
    if (this.config.reportingEndpoint) {
      this.reportError(errorData);
    }

    logger.error('Error tracked:', errorData);
  }

  /**
   * Reports an error to the configured endpoint
   * @param {Object} error - The error to report
   * @returns {Promise<void>}
   */
  async reportError(error) {
    if (!this.config.reportingEndpoint) return;

    try {
      await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'error',
          data: error,
          timestamp: Date.now()
        })
      });
    } catch (e) {
      logger.warn('Failed to report error:', e);
    }
  }

  /**
   * Gets all tracked errors
   * @returns {Array} Array of error objects
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Gets error summary statistics
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    const typeCount = {};
    const totalErrors = this.errors.length;

    for (const error of this.errors) {
      typeCount[error.type] = (typeCount[error.type] || 0) + 1;
    }

    return {
      total: totalErrors,
      byType: typeCount,
      recentErrors: this.errors.slice(-10)
    };
  }

  /**
   * Generates a unique error identifier
   * @returns {string} Unique error ID
   */
  generateErrorId() {
    return 'err_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Clears all tracked errors
   * @returns {void}
   */
  clearErrors() {
    this.errors = [];
  }
}

export default ErrorTracker;