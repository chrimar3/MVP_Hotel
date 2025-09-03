/**
 * Main Performance Monitor - Core Performance Monitoring System
 *
 * Orchestrates all performance monitoring components including Web Vitals tracking,
 * resource monitoring, custom metrics collection, and performance reporting.
 * Provides a unified interface for comprehensive application performance monitoring.
 *
 * @class PerformanceMonitor
 * @since 2.0.0
 * @author Hotel Review Generator Team
 *
 * @example
 * // Initialize the performance monitor
 * const monitor = new PerformanceMonitor();
 *
 * // Track custom operations
 * const operation = monitor.startOperation('review-generation');
 * // ... perform operation ...
 * const duration = operation.end();
 *
 * // Monitor API calls
 * const apiCall = monitor.monitorAPICall('/api/reviews', 'POST');
 * // ... make API call ...
 * apiCall.end();
 *
 * // Get performance summary
 * const summary = monitor.getPerformanceSummary();
 * console.log('Performance Score:', summary.score);
 */

// Import performance modules
const WebVitalsTracker = typeof require !== 'undefined' ? require('./WebVitalsTracker') : window.WebVitalsTracker;
const ResourceTracker = typeof require !== 'undefined' ? require('./ResourceTracker') : window.ResourceTracker;
const MetricsCollector = typeof require !== 'undefined' ? require('./MetricsCollector') : window.MetricsCollector;
const PerformanceReporter = typeof require !== 'undefined' ? require('./PerformanceReporter') : window.PerformanceReporter;

class PerformanceMonitor {
    /**
     * Initialize the PerformanceMonitor with all monitoring components
     *
     * @constructor
     * @since 2.0.0
     */
    constructor() {
        // Initialize performance monitoring components
        this.webVitalsTracker = new WebVitalsTracker();
        this.resourceTracker = new ResourceTracker();
        this.metricsCollector = new MetricsCollector();
        this.performanceReporter = new PerformanceReporter();

        // Store start time
        this.startTime = performance.now();

        // Environment detection
        this.isProduction = this.getEnvironment() === 'production';

        this.initialize();
    }

    /**
     * Initialize performance monitoring system and setup component communication
     *
     * @private
     * @since 2.0.0
     */
    initialize() {
        if (typeof window === 'undefined') return;

        // Setup cross-component communication
        this.setupComponentCommunication();

        // Make components globally available
        this.exposeGlobalReferences();

        // Log initialization
        this.logMetric('PERF_MONITOR_INIT', {
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            connection: this.getConnectionInfo()
        });

        // Log initialization only in development
        if (!this.isProduction) {
            console.info('🚀 Performance Monitor initialized with all modules');
        }
    }

    /**
     * Setup inter-component communication for coordinated monitoring
     *
     * @private
     * @since 2.0.0
     */
    setupComponentCommunication() {
        // Web Vitals to Reporter
        this.webVitalsTracker.addCallback((vital, value, rating) => {
            this.performanceReporter.reportPerformance(`vital_${vital.toLowerCase()}`);
        });

        // Resource Tracker to Reporter
        this.resourceTracker.addCallback((event, data) => {
            if (event === 'resource-issues') {
                this.performanceReporter.reportError({
                    type: 'resource_performance_issue',
                    resource: data.resource.name,
                    issues: data.issues
                });
            }
        });

        // Metrics Collector to Reporter
        this.metricsCollector.addCallback((event, data) => {
            if (event === 'long-task' && data.severity === 'critical') {
                this.performanceReporter.reportError({
                    type: 'critical_long_task',
                    duration: data.duration
                });
            }
        });
    }

    /**
     * Expose global references for component access (backward compatibility)
     *
     * @private
     * @since 2.0.0
     */
    exposeGlobalReferences() {
        window.webVitalsTracker = this.webVitalsTracker;
        window.resourceTracker = this.resourceTracker;
        window.metricsCollector = this.metricsCollector;
        window.performanceReporter = this.performanceReporter;
    }

    /**
     * Get network connection information using Network Information API
     *
     * @private
     * @returns {Object|null} Connection information or null if not available
     * @since 2.0.0
     */
    getConnectionInfo() {
        if ('connection' in navigator) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
        }
        return null;
    }

    /**
     * Detect current environment (development, staging, production)
     *
     * @private
     * @returns {string} Environment name
     * @since 2.0.0
     */
    getEnvironment() {
        if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
            return process.env.NODE_ENV;
        }

        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'development';
        }

        return 'production';
    }

    /**
     * Log a custom metric (compatibility method for legacy code)
     *
     * @param {string} name - Metric name
     * @param {Object} data - Metric data
     * @since 2.0.0
     *
     * @example
     * monitor.logMetric('user_action', {
     *   action: 'click',
     *   element: 'generate-button',
     *   timestamp: Date.now()
     * });
     */
    logMetric(name, data) {
        this.metricsCollector.recordCustomMetric(name, data);
    }

    /**
     * Mark a performance milestone (compatibility method)
     *
     * @param {string} name - Mark name
     * @since 2.0.0
     *
     * @example
     * monitor.mark('review-generation-start');
     * // ... perform operation ...
     * monitor.mark('review-generation-end');
     */
    mark(name) {
        this.metricsCollector.mark(name);
    }

    /**
     * Measure performance between two marks (compatibility method)
     *
     * @param {string} name - Measure name
     * @param {string} startMark - Start mark name
     * @param {string} [endMark] - End mark name (defaults to now)
     * @returns {number} Duration in milliseconds
     * @since 2.0.0
     *
     * @example
     * const duration = monitor.measure('review-generation',
     *   'review-generation-start', 'review-generation-end');
     * console.log(`Operation took ${duration}ms`);
     */
    measure(name, startMark, endMark) {
        return this.metricsCollector.measure(name, startMark, endMark);
    }

    /**
     * Time function execution automatically (compatibility method)
     *
     * @param {string} name - Operation name
     * @param {Function} fn - Function to time
     * @returns {*} Function return value
     * @since 2.0.0
     *
     * @example
     * const result = monitor.timeFunction('data-processing', () => {
     *   return processLargeDataset(data);
     * });
     */
    timeFunction(name, fn) {
        return this.metricsCollector.timeFunction(name, fn);
    }

    /**
     * Evaluate a metric against performance thresholds (compatibility method)
     *
     * @param {string} name - Metric name
     * @param {number} value - Metric value
     * @returns {string} Rating ('good', 'needs-improvement', 'poor', 'unknown')
     * @since 2.0.0
     */
    evaluateMetric(name, value) {
        if (name === 'LCP' || name === 'FID' || name === 'CLS' || name === 'FCP' || name === 'TTI' || name === 'TTFB') {
            return this.webVitalsTracker.evaluateVital(name, value);
        }
        return 'unknown';
    }

    /**
     * Get comprehensive performance metrics from all monitoring components
     *
     * @returns {Object} Complete metrics data
     * @returns {Object} returns.webVitals - Core Web Vitals data
     * @returns {Object} returns.resources - Resource loading data
     * @returns {Object} returns.metrics - Custom metrics data
     * @returns {number} returns.overallScore - Overall performance score (0-100)
     * @returns {number} returns.uptime - Session uptime in milliseconds
     * @returns {number} returns.timestamp - Data collection timestamp
     * @since 2.0.0
     */
    getMetrics() {
        return {
            webVitals: this.webVitalsTracker.exportData(),
            resources: this.resourceTracker.exportData(),
            metrics: this.metricsCollector.exportData(),
            overallScore: this.getPerformanceScore(),
            uptime: Math.round(performance.now() - this.startTime),
            timestamp: Date.now()
        };
    }

    /**
     * Calculate overall performance score from all metrics
     *
     * @returns {number} Performance score from 0-100
     * @since 2.0.0
     */
    getPerformanceScore() {
        const webVitalsScore = this.webVitalsTracker.getOverallScore();
        const customScore = this.metricsCollector.calculatePerformanceScore(
            this.webVitalsTracker.getVitals()
        );

        // Weighted average: Web Vitals (70%) + Custom Metrics (30%)
        return Math.round((webVitalsScore * 0.7) + (customScore * 0.3));
    }

    /**
     * Get performance insights and recommendations from all components
     *
     * @returns {Array<Object>} Array of insight objects with severity and recommendations
     * @since 2.0.0
     */
    getInsights() {
        const insights = [];

        insights.push(...this.webVitalsTracker.getInsights());
        insights.push(...this.resourceTracker.getInsights());
        insights.push(...this.metricsCollector.getPerformanceInsights());

        return insights;
    }

    /**
     * Get concise performance summary optimized for dashboard display
     *
     * @returns {Object} Performance summary with key metrics and status
     * @returns {number} returns.score - Overall performance score
     * @returns {Object} returns.webVitals - Web Vitals summary
     * @returns {Object} returns.resources - Resource summary
     * @returns {Object} returns.system - System information
     * @returns {Array} returns.insights - Top performance insights
     * @returns {string} returns.uptime - Session duration
     * @since 2.0.0
     */
    getPerformanceSummary() {
        const webVitals = this.webVitalsTracker.getVitals();
        const resourceSummary = this.resourceTracker.getResourceSummary();
        const systemInfo = this.metricsCollector.getSystemInfo();

        return {
            score: this.getPerformanceScore(),
            webVitals,
            resources: {
                total: resourceSummary.total,
                totalSize: resourceSummary.totalSizeMB + 'MB',
                cacheHitRate: resourceSummary.cacheHitRate + '%',
                avgDuration: resourceSummary.avgDuration + 'ms'
            },
            system: {
                connection: systemInfo.connection?.effectiveType || 'unknown',
                cores: systemInfo.hardware?.cores || 'unknown',
                memory: systemInfo.hardware?.memory || 'unknown'
            },
            insights: this.getInsights(),
            uptime: this.metricsCollector.getSessionDuration()
        };
    }

    /**
     * Force immediate performance report to monitoring service
     *
     * @param {string} [trigger='manual'] - What triggered the report
     * @since 2.0.0
     *
     * @example
     * monitor.reportMetrics('page_unload');
     */
    reportMetrics(trigger = 'manual') {
        this.performanceReporter.forceReport(trigger);
    }

    /**
     * Start monitoring a custom operation with automatic timing
     *
     * @param {string} name - Operation name
     * @returns {Object} Operation controller with end() method
     * @since 2.0.0
     *
     * @example
     * const operation = monitor.startOperation('llm-generation');
     * // ... perform operation ...
     * const duration = operation.end(); // Returns duration in ms
     */
    startOperation(name) {
        this.mark(`${name}-start`);
        return {
            end: () => {
                this.mark(`${name}-end`);
                return this.measure(name, `${name}-start`, `${name}-end`);
            }
        };
    }

    /**
     * Monitor page load performance and report when complete
     *
     * @since 2.0.0
     */
    monitorPageLoad() {
        if (document.readyState === 'complete') {
            this.reportMetrics('page_load_complete');
        } else {
            window.addEventListener('load', () => {
                this.reportMetrics('page_load_complete');
            });
        }
    }

    /**
     * Monitor user interactions with performance timing
     *
     * @param {string} eventType - Type of interaction ('click', 'scroll', etc.)
     * @param {HTMLElement} [element] - DOM element involved
     * @param {Object} [metadata={}] - Additional metadata
     * @returns {Object} Operation controller
     * @since 2.0.0
     *
     * @example
     * const interaction = monitor.monitorUserInteraction('click', button, {
     *   feature: 'review-generation'
     * });
     * // ... handle interaction ...
     * interaction.end();
     */
    monitorUserInteraction(eventType, element, metadata = {}) {
        const operation = this.startOperation(`user_${eventType}`);

        this.logMetric('user_interaction', {
            type: eventType,
            element: element?.tagName || 'unknown',
            timestamp: Date.now(),
            ...metadata
        });

        return operation;
    }

    /**
     * Monitor API calls with performance timing
     *
     * @param {string} url - API endpoint URL
     * @param {string} [method='GET'] - HTTP method
     * @returns {Object} Operation controller
     * @since 2.0.0
     *
     * @example
     * const apiCall = monitor.monitorAPICall('/api/reviews', 'POST');
     * fetch('/api/reviews', options)
     *   .then(response => {
     *     apiCall.end();
     *     return response.json();
     *   });
     */
    monitorAPICall(url, method = 'GET') {
        const operation = this.startOperation(`api_${method.toLowerCase()}`);

        this.logMetric('api_call', {
            url: url.split('?')[0], // Remove query params for privacy
            method,
            timestamp: Date.now()
        });

        return operation;
    }

    /**
     * Get detailed Web Vitals performance report
     *
     * @returns {Object} Complete Web Vitals data
     * @since 2.0.0
     */
    getWebVitalsReport() {
        return this.webVitalsTracker.exportData();
    }

    /**
     * Get detailed resource loading performance report
     *
     * @returns {Object} Complete resource loading data
     * @since 2.0.0
     */
    getResourceReport() {
        return this.resourceTracker.exportData();
    }

    /**
     * Get the largest resources by transfer size
     *
     * @param {number} [limit=10] - Maximum number of resources to return
     * @returns {Array<Object>} Array of resource objects sorted by size
     * @since 2.0.0
     */
    getLargestResources(limit = 10) {
        return this.resourceTracker.getLargestResources(limit);
    }

    /**
     * Get the slowest loading resources by duration
     *
     * @param {number} [limit=10] - Maximum number of resources to return
     * @returns {Array<Object>} Array of resource objects sorted by load time
     * @since 2.0.0
     */
    getSlowestResources(limit = 10) {
        return this.resourceTracker.getSlowestResources(limit);
    }

    /**
     * Check if overall performance is healthy
     *
     * @returns {boolean} True if performance meets healthy thresholds
     * @since 2.0.0
     */
    isPerformanceHealthy() {
        const score = this.getPerformanceScore();
        const insights = this.getInsights();
        const criticalIssues = insights.filter(insight => insight.severity === 'critical');

        return score >= 75 && criticalIssues.length === 0;
    }

    /**
     * Get detailed performance health status with recommendations
     *
     * @returns {Object} Health status information
     * @returns {string} returns.status - Overall status ('good', 'needs-improvement', 'poor')
     * @returns {number} returns.score - Performance score
     * @returns {number} returns.criticalIssues - Number of critical issues
     * @returns {number} returns.warnings - Number of warnings
     * @returns {Array} returns.recommendations - Top recommendations for improvement
     * @since 2.0.0
     */
    getHealthStatus() {
        const score = this.getPerformanceScore();
        const insights = this.getInsights();

        const criticalCount = insights.filter(i => i.severity === 'critical').length;
        const warningCount = insights.filter(i => i.severity === 'warning').length;

        let status = 'good';
        if (criticalCount > 0 || score < 50) {
            status = 'poor';
        } else if (warningCount > 2 || score < 75) {
            status = 'needs-improvement';
        }

        return {
            status,
            score,
            criticalIssues: criticalCount,
            warnings: warningCount,
            recommendations: insights.slice(0, 3) // Top 3 recommendations
        };
    }

    /**
     * Destroy the performance monitor and clean up all resources
     *
     * @since 2.0.0
     */
    destroy() {
        // Destroy all components
        this.webVitalsTracker.destroy();
        this.resourceTracker.destroy();
        this.metricsCollector.destroy();
        this.performanceReporter.destroy();

        // Clean up global references
        delete window.webVitalsTracker;
        delete window.resourceTracker;
        delete window.metricsCollector;
        delete window.performanceReporter;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
    window.PerformanceMonitorCore = PerformanceMonitor;
}