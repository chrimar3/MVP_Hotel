/**
 * Performance Monitoring Module - Lazy loaded for optimal performance
 * Tracks application performance, errors, and user interactions
 * @author Hotel Review Generator Team
 * @since 2.0.0
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('AdvancedPerformanceMonitor');

/**
 * Advanced Performance Monitor with lazy loading capabilities
 * Provides comprehensive performance tracking and monitoring
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

    this.metrics = new Map();
    this.errors = [];
    this.userTimings = [];
    this.resources = [];
    this.longTasks = [];
    this.networkRequests = [];
    this.memorySnapshots = [];

    this.observers = new Map();
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

    // Start core web vitals tracking
    this.trackCoreWebVitals();

    logger.info('Advanced Performance Monitor initialized');
  }

  /**
   * Sets up performance observers for various metrics
   * @returns {void}
   */
  setupPerformanceObservers() {
    if (!('PerformanceObserver' in window)) {
      logger.warn('PerformanceObserver not supported');
      return;
    }

    // Navigation and Paint timing
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processNavigationEntry(entry);
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation', 'paint'] });
      this.observers.set('navigation', navigationObserver);
    } catch (e) {
      logger.warn('Navigation/Paint observer failed:', e);
    }

    // Resource timing
    if (this.config.enableResourceTiming) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.processResourceEntry(entry);
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (e) {
        logger.warn('Resource observer failed:', e);
      }
    }

    // Long task tracking
    if (this.config.enableLongTaskTracking) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.processLongTaskEntry(entry);
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (e) {
        logger.warn('Long task observer failed:', e);
      }
    }

    // User timing
    if (this.config.enableUserTiming) {
      try {
        const userTimingObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.processUserTimingEntry(entry);
          }
        });
        userTimingObserver.observe({ entryTypes: ['measure', 'mark'] });
        this.observers.set('usertiming', userTimingObserver);
      } catch (e) {
        logger.warn('User timing observer failed:', e);
      }
    }
  }

  /**
   * Sets up error tracking and reporting
   * @returns {void}
   */
  setupErrorTracking() {
    if (!this.config.enableErrorTracking) return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now()
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'unhandled_promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Sets up network request monitoring
   * @returns {void}
   */
  setupNetworkMonitoring() {
    if (!this.config.enableNetworkTracking) return;

    // Monkey patch fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];

      try {
        const response = await originalFetch(...args);
        this.trackNetworkRequest({
          url,
          method: args[1]?.method || 'GET',
          status: response.status,
          duration: performance.now() - startTime,
          timestamp: Date.now()
        });
        return response;
      } catch (error) {
        this.trackNetworkRequest({
          url,
          method: args[1]?.method || 'GET',
          status: 0,
          duration: performance.now() - startTime,
          error: error.message,
          timestamp: Date.now()
        });
        throw error;
      }
    };

    // Monkey patch XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._monitoringData = { method, url, startTime: null };
      return originalOpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      if (this._monitoringData) {
        this._monitoringData.startTime = performance.now();

        this.addEventListener('loadend', () => {
          if (this._monitoringData) {
            window.hotelReviewApp?.performanceMonitor?.trackNetworkRequest({
              url: this._monitoringData.url,
              method: this._monitoringData.method,
              status: this.status,
              duration: performance.now() - this._monitoringData.startTime,
              timestamp: Date.now()
            });
          }
        });
      }

      return originalSend.call(this, ...args);
    };
  }

  /**
   * Sets up memory usage monitoring
   * @returns {void}
   */
  setupMemoryMonitoring() {
    if (!this.config.enableMemoryTracking || !('memory' in performance)) return;

    // Take memory snapshots periodically
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
      this.trackEvent('visibility_change', {
        hidden: document.hidden,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Tracks Core Web Vitals (CLS, FID, LCP)
   * @returns {void}
   */
  trackCoreWebVitals() {
    // Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          this.metrics.set('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        logger.warn('CLS observer failed:', e);
      }
    }

    // First Input Delay (FID)
    if ('PerformanceObserver' in window) {
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.metrics.set('fid', entry.processingStart - entry.startTime);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (e) {
        logger.warn('FID observer failed:', e);
      }
    }

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.set('lcp', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        logger.warn('LCP observer failed:', e);
      }
    }
  }

  /**
   * Processes navigation timing entry
   * @param {PerformanceNavigationTiming} entry - The navigation entry
   * @returns {void}
   */
  processNavigationEntry(entry) {
    this.metrics.set('navigationTiming', {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ssl: entry.secureConnectionStart ? entry.connectEnd - entry.secureConnectionStart : 0,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      dom: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      load: entry.loadEventEnd - entry.loadEventStart,
      total: entry.loadEventEnd - entry.navigationStart
    });
  }

  /**
   * Processes resource timing entry
   * @param {PerformanceResourceTiming} entry - The resource entry
   * @returns {void}
   */
  processResourceEntry(entry) {
    if (this.resources.length >= this.config.bufferSize) {
      this.resources.shift(); // Remove oldest entry
    }

    this.resources.push({
      name: entry.name,
      duration: entry.duration,
      size: entry.transferSize || entry.encodedBodySize,
      type: this.getResourceType(entry.name),
      timestamp: entry.startTime
    });

    // Track slow resources
    if (entry.duration > 1000) {
      this.trackEvent('slow_resource', {
        name: entry.name,
        duration: entry.duration,
        size: entry.transferSize || entry.encodedBodySize
      });
    }
  }

  /**
   * Processes long task entry and logs warnings for very long tasks
   * @param {PerformanceLongTaskTiming} entry - The long task entry
   * @returns {void}
   */
  processLongTaskEntry(entry) {
    if (this.longTasks.length >= this.config.bufferSize) {
      this.longTasks.shift();
    }

    this.longTasks.push({
      duration: entry.duration,
      startTime: entry.startTime,
      timestamp: Date.now()
    });

    // Alert on very long tasks
    if (entry.duration > 500) {
      logger.warn(`Very long task detected: ${entry.duration}ms`);
    }
  }

  /**
   * Processes user timing entry (marks and measures)
   * @param {PerformanceMeasure|PerformanceMark} entry - The user timing entry
   * @returns {void}
   */
  processUserTimingEntry(entry) {
    if (this.userTimings.length >= this.config.bufferSize) {
      this.userTimings.shift();
    }

    this.userTimings.push({
      name: entry.name,
      entryType: entry.entryType,
      startTime: entry.startTime,
      duration: entry.duration || 0,
      timestamp: Date.now()
    });
  }

  /**
   * Tracks an error with context information
   * @param {Error|string} error - The error to track
   * @returns {void}
   */
  trackError(error) {
    if (this.errors.length >= this.config.bufferSize) {
      this.errors.shift();
    }

    this.errors.push(error);

    // Report critical errors immediately
    if (this.config.reportingEndpoint && error.type === 'javascript') {
      this.reportError(error);
    }
  }

  /**
   * Tracks a network request
   * @param {Object} request - The network request data
   * @returns {void}
   */
  trackNetworkRequest(request) {
    if (this.networkRequests.length >= this.config.bufferSize) {
      this.networkRequests.shift();
    }

    this.networkRequests.push(request);
  }

  /**
   * Tracks a custom performance event
   * @param {string} eventName - The name of the event
   * @param {Object} data - Additional event data
   * @returns {void}
   */
  trackEvent(eventName, data) {
    this.metrics.set(`event_${eventName}`, {
      ...data,
      timestamp: Date.now()
    });
  }

  /**
   * Takes a memory usage snapshot
   * @returns {void}
   */
  takeMemorySnapshot() {
    if ('memory' in performance) {
      const memInfo = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };

      if (this.memorySnapshots.length >= this.config.bufferSize) {
        this.memorySnapshots.shift();
      }

      this.memorySnapshots.push(memInfo);

      // Alert on high memory usage
      const usagePercent = (memInfo.used / memInfo.limit) * 100;
      if (usagePercent > 90) {
        logger.warn(`High memory usage: ${usagePercent.toFixed(1)}%`);
        this.trackEvent('high_memory_usage', memInfo);
      }
    }
  }

  /**
   * Determines the resource type from URL
   * @param {string} url - The resource URL
   * @returns {string} The resource type
   */
  getResourceType(url) {
    if (url.match(/\.(js)$/)) return 'script';
    if (url.match(/\.(css)$/)) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    return 'other';
  }

  /**
   * Reports an error to the configured endpoint
   * @param {Error|Object} error - The error to report
   * @returns {Promise<void>}
   */
  async reportError(error) {
    if (!this.config.reportingEndpoint) return;

    try {
      await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'error',
          error,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: Date.now()
        })
      });
    } catch (e) {
      logger.warn('Failed to report error:', e);
    }
  }

  // Public API methods
  /**
   * Gets all collected metrics
   * @returns {Object} Object containing all collected metrics
   */
  getMetrics() {
    return {
      basic: Object.fromEntries(this.metrics),
      resources: this.resources,
      errors: this.errors,
      userTimings: this.userTimings,
      longTasks: this.longTasks,
      networkRequests: this.networkRequests,
      memorySnapshots: this.memorySnapshots,
      uptime: performance.now() - this.startTime
    };
  }

  /**
   * Gets Core Web Vitals metrics
   * @returns {Object} Object containing CLS, FID, and LCP values
   */
  getCoreWebVitals() {
    return {
      lcp: this.metrics.get('lcp'),
      fid: this.metrics.get('fid'),
      cls: this.metrics.get('cls')
    };
  }

  /**
   * Checks performance against budget thresholds
   * @returns {Object} Object containing budget status for various metrics
   */
  getPerformanceBudgetStatus() {
    const vitals = this.getCoreWebVitals();
    const navigation = this.metrics.get('navigationTiming');

    return {
      lcp: { value: vitals.lcp, threshold: 2500, pass: vitals.lcp < 2500 },
      fid: { value: vitals.fid, threshold: 100, pass: vitals.fid < 100 },
      cls: { value: vitals.cls, threshold: 0.1, pass: vitals.cls < 0.1 },
      ttfb: { value: navigation?.ttfb, threshold: 600, pass: navigation?.ttfb < 600 }
    };
  }

  /**
   * Generates a comprehensive performance report
   * @returns {Object} Detailed performance report
   */
  generateReport() {
    const metrics = this.getMetrics();
    const vitals = this.getCoreWebVitals();
    const budget = this.getPerformanceBudgetStatus();

    return {
      summary: {
        uptime: metrics.uptime,
        errorCount: metrics.errors.length,
        longTaskCount: metrics.longTasks.length,
        resourceCount: metrics.resources.length
      },
      coreWebVitals: vitals,
      performanceBudget: budget,
      detailedMetrics: metrics,
      timestamp: Date.now()
    };
  }

  /**
   * Cleans up observers and resources
   * @returns {void}
   */
  cleanup() {
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Clear data
    this.metrics.clear();
    this.errors.length = 0;
    this.userTimings.length = 0;
    this.resources.length = 0;
    this.longTasks.length = 0;
    this.networkRequests.length = 0;
    this.memorySnapshots.length = 0;
  }
}

// Utility function to create monitor with optimal settings
export const createPerformanceMonitor = (config = {}) => {
  return new AdvancedPerformanceMonitor(config);
};

// Export error reporting function
export const reportError = (error, context = {}) => {
  if (window.hotelReviewApp?.performanceMonitor?.trackError) {
    window.hotelReviewApp.performanceMonitor.trackError({
      type: 'manual',
      message: error.message || error,
      stack: error.stack,
      context,
      timestamp: Date.now()
    });
  }
};

export { AdvancedPerformanceMonitor };
export default AdvancedPerformanceMonitor;