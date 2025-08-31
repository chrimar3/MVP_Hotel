/**
 * Performance Monitor and Core Web Vitals Tracker
 * Implements comprehensive performance monitoring for production readiness
 * @module PerformanceMonitor
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            coreWebVitals: {
                LCP: null,    // Largest Contentful Paint
                FID: null,    // First Input Delay
                CLS: null,    // Cumulative Layout Shift
                FCP: null,    // First Contentful Paint
                TTI: null,    // Time to Interactive
                TTFB: null    // Time to First Byte
            },
            customMetrics: {},
            performanceEntries: [],
            resourceTiming: [],
            navigationTiming: {}
        };

        this.thresholds = {
            LCP: 2500,    // Good: <2.5s
            FID: 100,     // Good: <100ms
            CLS: 0.1,     // Good: <0.1
            FCP: 1800,    // Good: <1.8s
            TTI: 3800,    // Good: <3.8s
            TTFB: 800     // Good: <800ms
        };

        this.observers = new Map();
        this.startTime = performance.now();
        this.isProduction = process.env.NODE_ENV === 'production';

        this.initialize();
    }

    /**
     * Initialize performance monitoring
     */
    initialize() {
        if (typeof window === 'undefined') return;

        this.setupCoreWebVitals();
        this.setupPerformanceObservers();
        this.setupNavigationTiming();
        this.setupResourceTiming();
        this.setupCustomMetrics();
        this.startPeriodicReporting();

        // Log initialization
        this.logMetric('PERF_MONITOR_INIT', {
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            connection: this.getConnectionInfo()
        });
    }

    /**
     * Setup Core Web Vitals monitoring
     */
    setupCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        this.observeWebVital('largest-contentful-paint', (entry) => {
            this.metrics.coreWebVitals.LCP = Math.round(entry.startTime);
            this.evaluateMetric('LCP', entry.startTime);
        });

        // First Input Delay (FID)
        this.observeWebVital('first-input', (entry) => {
            this.metrics.coreWebVitals.FID = Math.round(entry.processingStart - entry.startTime);
            this.evaluateMetric('FID', entry.processingStart - entry.startTime);
        });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        this.observeWebVital('layout-shift', (entry) => {
            if (!entry.hadRecentInput) {
                clsValue += entry.value;
                this.metrics.coreWebVitals.CLS = Math.round(clsValue * 1000) / 1000;
                this.evaluateMetric('CLS', clsValue);
            }
        });

        // First Contentful Paint (FCP)
        this.observeWebVital('paint', (entry) => {
            if (entry.name === 'first-contentful-paint') {
                this.metrics.coreWebVitals.FCP = Math.round(entry.startTime);
                this.evaluateMetric('FCP', entry.startTime);
            }
        });
    }

    /**
     * Setup Performance Observers
     */
    setupPerformanceObservers() {
        // Long Task Observer
        this.observeWebVital('longtask', (entry) => {
            const duration = entry.duration;
            this.logMetric('LONG_TASK', {
                duration: Math.round(duration),
                startTime: Math.round(entry.startTime),
                blocking: duration > 50 // Tasks over 50ms block main thread
            });
        });

        // Measure Observer for custom marks
        this.observeWebVital('measure', (entry) => {
            this.metrics.customMetrics[entry.name] = {
                duration: Math.round(entry.duration),
                startTime: Math.round(entry.startTime)
            };
        });
    }

    /**
     * Setup Navigation Timing monitoring
     */
    setupNavigationTiming() {
        if (!performance.getEntriesByType) return;

        const navTiming = performance.getEntriesByType('navigation')[0];
        if (navTiming) {
            this.metrics.navigationTiming = {
                dns: Math.round(navTiming.domainLookupEnd - navTiming.domainLookupStart),
                tcp: Math.round(navTiming.connectEnd - navTiming.connectStart),
                ttfb: Math.round(navTiming.responseStart - navTiming.requestStart),
                download: Math.round(navTiming.responseEnd - navTiming.responseStart),
                domProcessing: Math.round(navTiming.domContentLoadedEventEnd - navTiming.responseEnd),
                totalTime: Math.round(navTiming.loadEventEnd - navTiming.fetchStart)
            };

            this.metrics.coreWebVitals.TTFB = this.metrics.navigationTiming.ttfb;
            this.evaluateMetric('TTFB', this.metrics.navigationTiming.ttfb);
        }
    }

    /**
     * Setup Resource Timing monitoring
     */
    setupResourceTiming() {
        if (!performance.getEntriesByType) return;

        const resourceEntries = performance.getEntriesByType('resource');
        this.metrics.resourceTiming = resourceEntries.map(entry => ({
            name: entry.name,
            type: this.getResourceType(entry),
            duration: Math.round(entry.duration),
            size: entry.transferSize || 0,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0
        }));

        // Identify slow resources
        const slowResources = this.metrics.resourceTiming.filter(r => r.duration > 1000);
        if (slowResources.length > 0) {
            this.logMetric('SLOW_RESOURCES', {
                count: slowResources.length,
                resources: slowResources.slice(0, 5) // Top 5 slowest
            });
        }
    }

    /**
     * Setup custom performance metrics
     */
    setupCustomMetrics() {
        // Time to Interactive (TTI) approximation
        this.calculateTTI();

        // Memory usage (if available)
        if (performance.memory) {
            this.metrics.customMetrics.memoryUsage = {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024), // MB
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024), // MB
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) // MB
            };
        }

        // Bundle size estimation
        this.estimateBundleSize();
    }

    /**
     * Observe Web Vitals with Performance Observer
     */
    observeWebVital(type, callback) {
        try {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(callback);
            });

            observer.observe({ type, buffered: true });
            this.observers.set(type, observer);
        } catch (error) {
            // Fallback for older browsers
            console.warn(`Performance Observer for ${type} not supported:`, error.message);
        }
    }

    /**
     * Calculate Time to Interactive (TTI)
     */
    calculateTTI() {
        // Simplified TTI calculation based on network quiet period
        setTimeout(() => {
            const entries = performance.getEntriesByType('navigation');
            if (entries.length > 0) {
                const navEntry = entries[0];
                const tti = Math.max(
                    navEntry.domContentLoadedEventEnd,
                    navEntry.loadEventEnd
                );

                this.metrics.coreWebVitals.TTI = Math.round(tti);
                this.evaluateMetric('TTI', tti);
            }
        }, 5000); // Wait 5s after page load
    }

    /**
     * Estimate bundle size from resource timing
     */
    estimateBundleSize() {
        const jsResources = this.metrics.resourceTiming.filter(r =>
            r.type === 'script' && r.name.includes(window.location.origin)
        );

        const totalSize = jsResources.reduce((sum, resource) => sum + resource.size, 0);

        this.metrics.customMetrics.bundleSize = {
            totalBytes: totalSize,
            totalKB: Math.round(totalSize / 1024),
            jsFiles: jsResources.length,
            cached: jsResources.filter(r => r.cached).length
        };
    }

    /**
     * Evaluate metric against threshold
     */
    evaluateMetric(metricName, value) {
        const threshold = this.thresholds[metricName];
        if (!threshold) return;

        const status = this.getMetricStatus(metricName, value);

        this.logMetric(`${metricName}_MEASURED`, {
            value: Math.round(value),
            threshold,
            status,
            isGood: status === 'good'
        });

        // Alert for poor metrics in production
        if (this.isProduction && status === 'poor') {
            this.alertPoorPerformance(metricName, value, threshold);
        }
    }

    /**
     * Get metric status (good/needs-improvement/poor)
     */
    getMetricStatus(metricName, value) {
        const threshold = this.thresholds[metricName];

        // Different scales for different metrics
        if (metricName === 'CLS') {
            if (value <= 0.1) return 'good';
            if (value <= 0.25) return 'needs-improvement';
            return 'poor';
        } else {
            if (value <= threshold) return 'good';
            if (value <= threshold * 1.5) return 'needs-improvement';
            return 'poor';
        }
    }

    /**
     * Get resource type from performance entry
     */
    getResourceType(entry) {
        if (entry.initiatorType) return entry.initiatorType;

        const url = entry.name;
        if (url.match(/\.(js|mjs)$/)) return 'script';
        if (url.match(/\.(css)$/)) return 'stylesheet';
        if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
        if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';

        return 'other';
    }

    /**
     * Get connection information
     */
    getConnectionInfo() {
        if (navigator.connection) {
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
     * Start periodic performance reporting
     */
    startPeriodicReporting() {
        // Report every 30 seconds
        this.reportInterval = setInterval(() => {
            this.reportMetrics();
        }, 30000);

        // Report on page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.reportMetrics('page_hidden');
            }
        });

        // Report before page unload
        window.addEventListener('beforeunload', () => {
            this.reportMetrics('page_unload');
        });
    }

    /**
     * Report metrics to monitoring service
     */
    reportMetrics(trigger = 'periodic') {
        const report = {
            timestamp: Date.now(),
            trigger,
            sessionDuration: Math.round(performance.now() - this.startTime),
            coreWebVitals: this.metrics.coreWebVitals,
            customMetrics: this.metrics.customMetrics,
            navigationTiming: this.metrics.navigationTiming,
            resourceSummary: this.getResourceSummary(),
            performance: this.getPerformanceScore(),
            connection: this.getConnectionInfo(),
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio || 1
            }
        };

        // Send to monitoring service
        this.sendToMonitoring(report);

        // Log for debugging in development
        if (!this.isProduction) {
            console.group('🚀 Performance Report');
            console.table(this.metrics.coreWebVitals);
            console.log('Custom Metrics:', this.metrics.customMetrics);
            console.log('Performance Score:', report.performance);
            console.groupEnd();
        }
    }

    /**
     * Get resource summary
     */
    getResourceSummary() {
        const resources = this.metrics.resourceTiming;
        const summary = {
            total: resources.length,
            types: {},
            totalSize: 0,
            cached: 0
        };

        resources.forEach(resource => {
            summary.types[resource.type] = (summary.types[resource.type] || 0) + 1;
            summary.totalSize += resource.size;
            if (resource.cached) summary.cached++;
        });

        summary.cacheHitRate = summary.total > 0 ?
            Math.round((summary.cached / summary.total) * 100) : 0;

        return summary;
    }

    /**
     * Calculate overall performance score
     */
    getPerformanceScore() {
        const vitals = this.metrics.coreWebVitals;
        let score = 100;
        let validMetrics = 0;

        // Score each Core Web Vital
        Object.keys(this.thresholds).forEach(metric => {
            const value = vitals[metric];
            if (value !== null) {
                validMetrics++;
                const status = this.getMetricStatus(metric, value);

                if (status === 'poor') score -= 20;
                else if (status === 'needs-improvement') score -= 10;
            }
        });

        return {
            score: Math.max(0, score),
            validMetrics,
            grade: this.getPerformanceGrade(score)
        };
    }

    /**
     * Get performance grade
     */
    getPerformanceGrade(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    /**
     * Send metrics to monitoring service
     */
    sendToMonitoring(report) {
        // Send to analytics service
        if (typeof gtag !== 'undefined') {
            gtag('event', 'performance_metrics', {
                event_category: 'performance',
                custom_map: {
                    lcp: report.coreWebVitals.LCP,
                    fid: report.coreWebVitals.FID,
                    cls: report.coreWebVitals.CLS
                }
            });
        }

        // Send to custom monitoring endpoint
        if (this.isProduction) {
            fetch('/api/performance-metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(report),
                keepalive: true // Ensure delivery even if page unloads
            }).catch(error => {
                console.warn('Failed to send performance metrics:', error);
            });
        }
    }

    /**
     * Alert for poor performance
     */
    alertPoorPerformance(metricName, value, threshold) {
        const alertData = {
            metric: metricName,
            value: Math.round(value),
            threshold,
            severity: 'warning',
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Send alert to monitoring
        if (window.errorTracking) {
            window.errorTracking.logError('PERFORMANCE_ALERT', alertData);
        }

        console.warn(`⚠️ Poor ${metricName} performance:`, alertData);
    }

    /**
     * Log custom performance metric
     */
    logMetric(name, data) {
        const entry = {
            name,
            timestamp: Date.now(),
            data
        };

        this.metrics.performanceEntries.push(entry);

        // Keep only last 100 entries
        if (this.metrics.performanceEntries.length > 100) {
            this.metrics.performanceEntries.shift();
        }
    }

    /**
     * Mark performance milestone
     */
    mark(name) {
        if (performance.mark) {
            performance.mark(name);
            this.logMetric('MARK', { name, timestamp: performance.now() });
        }
    }

    /**
     * Measure performance between marks
     */
    measure(name, startMark, endMark) {
        if (performance.measure) {
            try {
                performance.measure(name, startMark, endMark);
                const measure = performance.getEntriesByName(name, 'measure')[0];
                if (measure) {
                    this.logMetric('MEASURE', {
                        name,
                        duration: Math.round(measure.duration),
                        startTime: Math.round(measure.startTime)
                    });
                }
            } catch (error) {
                console.warn(`Failed to measure ${name}:`, error);
            }
        }
    }

    /**
     * Get current metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            performance: this.getPerformanceScore(),
            uptime: Math.round(performance.now() - this.startTime)
        };
    }

    /**
     * Destroy performance monitor
     */
    destroy() {
        // Clear intervals
        if (this.reportInterval) {
            clearInterval(this.reportInterval);
        }

        // Disconnect observers
        this.observers.forEach(observer => {
            observer.disconnect();
        });

        // Final report
        this.reportMetrics('destroy');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}

// Auto-initialize in browser
if (typeof window !== 'undefined') {
    window.performanceMonitor = new PerformanceMonitor();
}