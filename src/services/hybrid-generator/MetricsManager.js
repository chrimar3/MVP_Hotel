/**
 * Metrics Manager for HybridGenerator
 * Handles performance monitoring, cost tracking, alerting, and metrics persistence
 */

class MetricsManager {
  constructor(configManager) {
    this.configManager = configManager;
    this.metrics = this.initializeMetrics();
    this.costTracker = {
      daily: new Map(),
      monthly: new Map(),
      total: 0,
    };
    this.performanceObserver = this.setupPerformanceObserver();
    this.monitoringInterval = null;

    // Load historical data
    this.loadMetrics();
  }

  /**
   * Initialize metrics structure
   */
  initializeMetrics() {
    return {
      requests: { total: 0, success: 0, errors: 0 },
      cache: { hits: 0, misses: 0 },
      llm: {
        openai: { success: 0, errors: 0, totalTokens: 0 },
        groq: { success: 0, errors: 0 },
      },
      fallback: { template: 0, emergency: 0 },
      latency: { sum: 0, count: 0, max: 0, min: Infinity },
      cost: { daily: 0, monthly: 0, total: 0 },
      abTesting: { llm: 0, template: 0 },
    };
  }

  /**
   * Record a metric value
   */
  recordMetric(path, value) {
    const parts = path.split('.');
    let current = this.metrics;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    const key = parts[parts.length - 1];
    if (key === 'ms') {
      // Handle latency metrics
      current.sum = (current.sum || 0) + value;
      current.count = (current.count || 0) + 1;
      current.max = Math.max(current.max || 0, value);
      current.min = Math.min(current.min || Infinity, value);
    } else {
      current[key] = (current[key] || 0) + value;
    }

    // Persist metrics
    this.saveMetrics();
  }

  /**
   * Track cost for a provider
   */
  trackCost(provider, tokens) {
    if (provider === 'openai') {
      const config = this.configManager.getProviderConfig('openai');
      const cost = (tokens / 1000) * config.costPer1kTokens;
      this.updateCostTracking(cost);
    }
    // Groq is free tier, no cost tracking needed
  }

  /**
   * Update cost tracking data
   */
  updateCostTracking(cost) {
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7);

    // Update daily cost
    const dailyCost = this.costTracker.daily.get(today) || 0;
    this.costTracker.daily.set(today, dailyCost + cost);

    // Update monthly cost
    const monthlyCost = this.costTracker.monthly.get(month) || 0;
    this.costTracker.monthly.set(month, monthlyCost + cost);

    // Update total cost
    this.costTracker.total += cost;

    // Update metrics
    this.metrics.cost.daily = this.costTracker.daily.get(today);
    this.metrics.cost.monthly = this.costTracker.monthly.get(month);
    this.metrics.cost.total = this.costTracker.total;
  }

  /**
   * Record A/B test result
   */
  recordABTestResult(variant, requestId) {
    const config = this.configManager.getABTestingConfig();
    if (!config.trackingEnabled) return;

    this.metrics.abTesting[variant] = (this.metrics.abTesting[variant] || 0) + 1;

    // Send to analytics if configured
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('AB_Test_Variant', {
        test: 'llm_vs_template',
        variant: variant,
        requestId: requestId,
      });
    }
  }

  /**
   * Check alert thresholds and send alerts if needed
   */
  checkAlertThresholds() {
    const config = this.configManager.getMonitoringConfig();
    const { alertThresholds } = config;

    // Check error rate
    const errorRate = this.metrics.requests.errors / this.metrics.requests.total;
    if (errorRate > alertThresholds.errorRate) {
      this.sendAlert('error_rate', `Error rate ${(errorRate * 100).toFixed(1)}% exceeds threshold`);
    }

    // Check latency
    const avgLatency = this.metrics.latency.sum / this.metrics.latency.count;
    if (avgLatency > alertThresholds.latency) {
      this.sendAlert('latency', `Average latency ${avgLatency.toFixed(0)}ms exceeds threshold`);
    }

    // Check daily cost
    if (this.metrics.cost.daily > alertThresholds.costPerDay) {
      this.sendAlert('cost', `Daily cost $${this.metrics.cost.daily.toFixed(2)} exceeds threshold`);
    }
  }

  /**
   * Send alert to monitoring systems
   */
  sendAlert(type, message) {
    // Log alerts in development for debugging
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
      console.warn(`🚨 HybridGenerator Alert [${type}]: ${message}`);
    }

    // Send to monitoring service if configured
    if (typeof window !== 'undefined' && window.monitoring) {
      window.monitoring.alert({
        type: type,
        message: message,
        timestamp: new Date().toISOString(),
        metrics: this.getMetricsSummary(),
      });
    }

    // Send to error tracking as well for persistent logging
    if (typeof window !== 'undefined' && window.errorTracking) {
      window.errorTracking.logError('HYBRID_GENERATOR_ALERT', {
        type,
        message,
        timestamp: new Date().toISOString(),
        component: 'HybridGenerator'
      });
    }
  }

  /**
   * Setup performance observer
   */
  setupPerformanceObserver() {
    if (typeof PerformanceObserver === 'undefined') return null;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('llm-generation')) {
          this.recordMetric('performance.duration', entry.duration);
        }
      }
    });

    observer.observe({ entryTypes: ['measure'] });
    return observer;
  }

  /**
   * Start monitoring services
   */
  startMonitoring() {
    const config = this.configManager.getMonitoringConfig();
    if (!config.enabled) return;

    // Report metrics every minute
    this.monitoringInterval = setInterval(() => {
      this.reportMetrics();
    }, 60000);
  }

  /**
   * Stop monitoring services
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Report metrics to monitoring service
   */
  reportMetrics() {
    const summary = this.getMetricsSummary();

    // Send to monitoring service
    if (typeof window !== 'undefined' && window.monitoring) {
      window.monitoring.report(summary);
    }
  }

  /**
   * Get metrics summary for reporting
   */
  getMetricsSummary() {
    const avgLatency =
      this.metrics.latency.count > 0 ? this.metrics.latency.sum / this.metrics.latency.count : 0;

    const successRate =
      this.metrics.requests.total > 0
        ? (this.metrics.requests.total - this.metrics.requests.errors) / this.metrics.requests.total
        : 0;

    const cacheHitRate =
      this.metrics.cache.hits + this.metrics.cache.misses > 0
        ? this.metrics.cache.hits / (this.metrics.cache.hits + this.metrics.cache.misses)
        : 0;

    return {
      requests: this.metrics.requests,
      successRate: (successRate * 100).toFixed(1) + '%',
      cacheHitRate: (cacheHitRate * 100).toFixed(1) + '%',
      avgLatency: avgLatency.toFixed(0) + 'ms',
      maxLatency: this.metrics.latency.max + 'ms',
      cost: {
        daily: '$' + this.metrics.cost.daily.toFixed(4),
        monthly: '$' + this.metrics.cost.monthly.toFixed(2),
        total: '$' + this.metrics.cost.total.toFixed(2),
      },
      providers: {
        openai: this.metrics.llm.openai,
        groq: this.metrics.llm.groq,
      },
      fallbacks: this.metrics.fallback,
      abTesting: this.configManager.getABTestingConfig().enabled ? this.metrics.abTesting : null,
      availability: this.configManager.getAvailability(),
    };
  }

  /**
   * Save metrics to localStorage
   */
  saveMetrics() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('hybrid_metrics', JSON.stringify(this.metrics));
        localStorage.setItem(
          'hybrid_cost',
          JSON.stringify({
            daily: Array.from(this.costTracker.daily.entries()),
            monthly: Array.from(this.costTracker.monthly.entries()),
            total: this.costTracker.total,
          })
        );
      } catch (error) {
        // Silent failure in production - error tracking handled elsewhere
        if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
          console.warn('Failed to save metrics:', error);
        }
      }
    }
  }

  /**
   * Load metrics from localStorage
   */
  loadMetrics() {
    if (typeof localStorage !== 'undefined') {
      try {
        const metricsStr = localStorage.getItem('hybrid_metrics');
        if (metricsStr) {
          this.metrics = JSON.parse(metricsStr);
        }

        const costStr = localStorage.getItem('hybrid_cost');
        if (costStr) {
          const costData = JSON.parse(costStr);
          this.costTracker.daily = new Map(costData.daily);
          this.costTracker.monthly = new Map(costData.monthly);
          this.costTracker.total = costData.total;
        }
      } catch (error) {
        // Silent failure in production - error tracking handled elsewhere
        if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
          console.warn('Failed to load metrics:', error);
        }
      }
    }
  }

  /**
   * Log errors to appropriate systems
   */
  logError(message, error, requestId) {
    // Only log errors to console in development
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
      console.error(`[${requestId}] ${message}:`, error);
    } else if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.error(`[${requestId}] ${message}:`, error);
    }

    // Always send to error tracking service if available
    if (typeof window !== 'undefined' && window.errorTracking) {
      window.errorTracking.logError({
        message: message,
        error: error.message,
        stack: error.stack,
        requestId: requestId,
        timestamp: new Date().toISOString(),
        component: 'HybridGenerator'
      });
    }
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    this.stopMonitoring();
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MetricsManager;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
  window.MetricsManager = MetricsManager;
}