/**
 * Streamlined Performance Monitoring Module
 * Main orchestrator for performance monitoring with modular components
 * @author Hotel Review Generator Team
 * @since 2.0.0
 */

import { createLogger } from '../utils/logger.js';
import { PerformanceObserverManager } from '../monitoring/core/PerformanceObserver.js';
import { WebVitalsTracker } from '../monitoring/core/WebVitalsTracker.js';
import { ErrorTracker } from '../monitoring/core/ErrorTracker.js';

const logger = createLogger('AdvancedPerformanceMonitor');

/**
 * Advanced Performance Monitor - Modular Version
 * Provides comprehensive performance tracking using specialized modules
 */
class AdvancedPerformanceMonitor {
  /**
   * Creates a new AdvancedPerformanceMonitor instance
   * @param {Object} config - Configuration options
   * @param {boolean} config.enableRUM - Enable real user monitoring
   * @param {boolean} config.enableErrorTracking - Enable error tracking
   * @param {boolean} config.enableUserTiming - Enable user timing API tracking
   * @param {boolean} config.enableResourceTiming - Enable resource timing tracking
   * @param {boolean} config.enableLongTaskTracking - Enable long task tracking
   * @param {boolean} config.enableMemoryTracking - Enable memory usage tracking
   * @param {boolean} config.enableNetworkTracking - Enable network request tracking
   * @param {number} config.samplingRate - Sampling rate (0.0 to 1.0)
   * @param {number} config.bufferSize - Maximum buffer size for metrics
   * @param {string} config.reportingEndpoint - Endpoint for reporting metrics
   */
  constructor(config = {}) {
    this.config = {
      enableRUM: true,
      enableErrorTracking: true,
      enableUserTiming: true,
      enableResourceTiming: true,
      enableLongTaskTracking: true,
      enableMemoryTracking: true,
      enableNetworkTracking: true,
      samplingRate: 1.0,
      bufferSize: 1000,
      reportingEndpoint: null,
      ...config
    };

    // Initialize data stores
    this.metrics = new Map();
    this.resources = [];
    this.longTasks = [];
    this.userTimings = [];
    this.networkRequests = [];
    this.memorySnapshots = [];

    // Initialize modules
    this.performanceObserver = new PerformanceObserverManager(this.config);
    this.webVitalsTracker = new WebVitalsTracker();
    this.errorTracker = new ErrorTracker(this.config);

    this.startTime = performance.now();

    this.initialize();
  }

  /**
   * Initializes the performance monitor
   * Sets up all observers and tracking mechanisms
   * @returns {void}
   */
  initialize() {
    // Only initialize if sampling rate allows
    if (Math.random() > this.config.samplingRate) {
      logger.info('Performance monitoring skipped due to sampling rate');
      return;
    }

    this.setupPerformanceObservers();
    this.setupErrorTracking();
    this.setupNetworkMonitoring();
    this.setupMemoryMonitoring();
    this.setupVisibilityChangeTracking();
    this.webVitalsTracker.startTracking();

    logger.info('Advanced Performance Monitor initialized');
  }

  /**
   * Sets up performance observers for various metrics
   * @returns {void}
   */
  setupPerformanceObservers() {
    // Setup navigation observer
    this.performanceObserver.setupNavigationObserver((entry) => {
      this.processNavigationEntry(entry);
    });

    // Setup resource observer
    this.performanceObserver.setupResourceObserver((entry) => {
      this.processResourceEntry(entry);
    });

    // Setup long task observer
    this.performanceObserver.setupLongTaskObserver((entry) => {
      this.processLongTaskEntry(entry);
    });

    // Setup user timing observer
    this.performanceObserver.setupUserTimingObserver((entry) => {
      this.processUserTimingEntry(entry);
    });
  }

  /**
   * Sets up error tracking using ErrorTracker module
   * @returns {void}
   */
  setupErrorTracking() {
    this.errorTracker.setupGlobalErrorHandling();
  }

  /**
   * Sets up network request monitoring
   * @returns {void}
   */
  setupNetworkMonitoring() {
    if (!this.config.enableNetworkTracking) return;

    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();

        this.trackNetworkRequest({
          url,
          method: args[1]?.method || 'GET',
          status: response.status,
          duration: endTime - startTime,
          size: response.headers.get('content-length'),
          type: 'fetch',
          timestamp: Date.now()
        });

        return response;
      } catch (error) {
        const endTime = performance.now();

        this.trackNetworkRequest({
          url,
          method: args[1]?.method || 'GET',
          error: error.message,
          duration: endTime - startTime,
          type: 'fetch',
          timestamp: Date.now()
        });

        throw error;
      }
    };
  }

  /**
   * Sets up memory usage monitoring
   * @returns {void}
   */
  setupMemoryMonitoring() {
    if (!this.config.enableMemoryTracking || !('memory' in performance)) return;

    // Take initial snapshot
    this.takeMemorySnapshot();

    // Take snapshots periodically
    setInterval(() => {
      this.takeMemorySnapshot();
    }, 30000); // Every 30 seconds
  }

  /**
   * Sets up page visibility change tracking
   * @returns {void}
   */
  setupVisibilityChangeTracking() {
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('visibilitychange', {
        hidden: document.hidden,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Processes navigation timing entry
   * @param {PerformanceNavigationTiming} entry - The navigation entry
   * @returns {void}
   */
  processNavigationEntry(entry) {
    this.metrics.set('navigation', {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
      tcpConnection: entry.connectEnd - entry.connectStart,
      serverResponse: entry.responseEnd - entry.responseStart,
      domProcessing: entry.domContentLoadedEventStart - entry.responseEnd,
      timestamp: Date.now()
    });
  }

  /**
   * Processes resource timing entry
   * @param {PerformanceResourceTiming} entry - The resource entry
   * @returns {void}
   */
  processResourceEntry(entry) {
    const resource = {
      name: entry.name,
      type: this.getResourceType(entry.name),
      duration: entry.duration,
      size: entry.transferSize || 0,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
      timestamp: Date.now()
    };

    this.resources.push(resource);

    // Keep resources within buffer limit
    if (this.resources.length > this.config.bufferSize) {
      this.resources.shift();
    }
  }

  /**
   * Processes long task entry and logs warnings for very long tasks
   * @param {PerformanceLongTaskTiming} entry - The long task entry
   * @returns {void}
   */
  processLongTaskEntry(entry) {
    const task = {
      duration: entry.duration,
      startTime: entry.startTime,
      timestamp: Date.now()
    };

    this.longTasks.push(task);

    // Warn about very long tasks
    if (entry.duration > 250) {
      logger.warn(`Very long task detected: ${entry.duration}ms`);
    }

    // Keep long tasks within buffer limit
    if (this.longTasks.length > this.config.bufferSize) {
      this.longTasks.shift();
    }
  }

  /**
   * Processes user timing entry (marks and measures)
   * @param {PerformanceMeasure|PerformanceMark} entry - The user timing entry
   * @returns {void}
   */
  processUserTimingEntry(entry) {
    const timing = {
      name: entry.name,
      entryType: entry.entryType,
      duration: entry.duration || 0,
      startTime: entry.startTime,
      timestamp: Date.now()
    };

    this.userTimings.push(timing);

    // Keep user timings within buffer limit
    if (this.userTimings.length > this.config.bufferSize) {
      this.userTimings.shift();
    }
  }

  /**
   * Tracks a network request
   * @param {Object} request - The network request data
   * @returns {void}
   */
  trackNetworkRequest(request) {
    this.networkRequests.push(request);

    // Keep network requests within buffer limit
    if (this.networkRequests.length > this.config.bufferSize) {
      this.networkRequests.shift();
    }
  }

  /**
   * Tracks a custom performance event
   * @param {string} eventName - The name of the event
   * @param {Object} data - Additional event data
   * @returns {void}
   */
  trackEvent(eventName, data) {
    this.metrics.set(eventName, {
      ...data,
      timestamp: Date.now()
    });
  }

  /**
   * Takes a memory usage snapshot
   * @returns {void}
   */
  takeMemorySnapshot() {
    if (!('memory' in performance)) return;

    const memory = performance.memory;
    const snapshot = {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      timestamp: Date.now()
    };

    this.memorySnapshots.push(snapshot);

    // Warn about high memory usage
    const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    if (usagePercent > 90) {
      logger.warn(`High memory usage: ${usagePercent.toFixed(1)}%`);
    }

    // Keep memory snapshots within buffer limit
    if (this.memorySnapshots.length > 100) {
      this.memorySnapshots.shift();
    }
  }

  /**
   * Determines the resource type from URL
   * @param {string} url - The resource URL
   * @returns {string} The resource type
   */
  getResourceType(url) {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  /**
   * Gets all collected metrics
   * @returns {Object} Object containing all collected metrics
   */
  getMetrics() {
    return {
      basic: Object.fromEntries(this.metrics),
      resources: this.resources,
      longTasks: this.longTasks,
      userTimings: this.userTimings,
      networkRequests: this.networkRequests,
      memorySnapshots: this.memorySnapshots,
      errors: this.errorTracker.getErrors(),
      coreWebVitals: this.webVitalsTracker.getVitals()
    };
  }

  /**
   * Gets Core Web Vitals metrics
   * @returns {Object} Object containing CLS, FID, and LCP values
   */
  getCoreWebVitals() {
    return this.webVitalsTracker.getVitals();
  }

  /**
   * Checks performance against budget thresholds
   * @returns {Object} Object containing budget status for various metrics
   */
  getPerformanceBudgetStatus() {
    const navigation = this.metrics.get('navigation');
    const vitals = this.webVitalsTracker.getVitalsStatus();

    return {
      coreWebVitals: vitals,
      navigation: navigation ? {
        domContentLoaded: {
          value: navigation.domContentLoaded,
          status: navigation.domContentLoaded <= 1500 ? 'good' : 'poor',
          threshold: 1500
        },
        loadComplete: {
          value: navigation.loadComplete,
          status: navigation.loadComplete <= 3000 ? 'good' : 'poor',
          threshold: 3000
        }
      } : null
    };
  }

  /**
   * Generates a comprehensive performance report
   * @returns {Object} Detailed performance report
   */
  generateReport() {
    const metrics = this.getMetrics();
    const budgetStatus = this.getPerformanceBudgetStatus();

    return {
      timestamp: new Date().toISOString(),
      sessionDuration: performance.now() - this.startTime,
      metrics,
      budgetStatus,
      summary: {
        totalResources: this.resources.length,
        totalLongTasks: this.longTasks.length,
        totalErrors: this.errorTracker.getErrors().length,
        avgResourceLoadTime: this.resources.reduce((acc, r) => acc + r.duration, 0) / this.resources.length || 0
      }
    };
  }

  /**
   * Cleans up observers and resources
   * @returns {void}
   */
  cleanup() {
    this.performanceObserver.cleanup();
    this.webVitalsTracker.cleanup();

    this.metrics.clear();
    this.resources = [];
    this.longTasks = [];
    this.userTimings = [];
    this.networkRequests = [];
    this.memorySnapshots = [];
  }
}

// Global error tracking setup for uncaught errors
if (window.hotelReviewApp?.performanceMonitor?.trackError) {
  window.addEventListener('error', (event) => {
    window.hotelReviewApp.performanceMonitor.trackError({
      type: 'global',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    window.hotelReviewApp.performanceMonitor.trackError({
      type: 'unhandledrejection',
      message: event.reason?.message || 'Unhandled Promise Rejection',
      reason: event.reason
    });
  });
}

export { AdvancedPerformanceMonitor };
export default AdvancedPerformanceMonitor;