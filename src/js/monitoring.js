/**
 * Performance Monitoring Module - Lazy loaded for optimal performance
 * Tracks application performance, errors, and user interactions
 */

/**
 * Advanced Performance Monitor with lazy loading capabilities
 */
class AdvancedPerformanceMonitor {
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

  initialize() {
    // Only initialize if sampling rate allows
    if (Math.random() > this.config.samplingRate) {
      console.log('Performance monitoring skipped due to sampling rate');
      return;
    }

    this.setupPerformanceObservers();
    this.setupErrorTracking();
    this.setupNetworkMonitoring();
    this.setupMemoryMonitoring();
    this.setupVisibilityChangeTracking();

    // Start core web vitals tracking
    this.trackCoreWebVitals();

    console.log('Advanced Performance Monitor initialized');
  }

  setupPerformanceObservers() {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
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
      console.warn('Navigation/Paint observer failed:', e);
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
        console.warn('Resource observer failed:', e);
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
        console.warn('Long task observer failed:', e);
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
        console.warn('User timing observer failed:', e);
      }
    }
  }

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

  setupMemoryMonitoring() {
    if (!this.config.enableMemoryTracking || !('memory' in performance)) return;

    // Take memory snapshots periodically
    setInterval(() => {
      this.takeMemorySnapshot();
    }, 30000); // Every 30 seconds
  }

  setupVisibilityChangeTracking() {
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('visibility_change', {
        hidden: document.hidden,
        timestamp: Date.now()
      });
    });
  }

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
        console.warn('CLS observer failed:', e);
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
        console.warn('FID observer failed:', e);
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
        console.warn('LCP observer failed:', e);
      }
    }
  }

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
      console.warn(`Very long task detected: ${entry.duration}ms`);
    }
  }

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

  trackNetworkRequest(request) {
    if (this.networkRequests.length >= this.config.bufferSize) {
      this.networkRequests.shift();
    }

    this.networkRequests.push(request);
  }

  trackEvent(eventName, data) {
    this.metrics.set(`event_${eventName}`, {
      ...data,
      timestamp: Date.now()
    });
  }

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
        console.warn(`High memory usage: ${usagePercent.toFixed(1)}%`);
        this.trackEvent('high_memory_usage', memInfo);
      }
    }
  }

  getResourceType(url) {
    if (url.match(/\.(js)$/)) return 'script';
    if (url.match(/\.(css)$/)) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    return 'other';
  }

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
      console.warn('Failed to report error:', e);
    }
  }

  // Public API methods
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

  getCoreWebVitals() {
    return {
      lcp: this.metrics.get('lcp'),
      fid: this.metrics.get('fid'),
      cls: this.metrics.get('cls')
    };
  }

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