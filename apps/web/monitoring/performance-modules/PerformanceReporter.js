/**
 * Performance Reporter
 * Handles reporting and analytics for performance data
 */

class PerformanceReporter {
    constructor() {
        this.isProduction = this.getEnvironment() === 'production';
        this.reportQueue = [];
        this.reportInterval = null;
        this.callbacks = new Set();

        // Rate limiting
        this.lastReportTime = 0;
        this.minReportInterval = 10000; // 10 seconds minimum between reports

        this.initialize();
    }

    /**
     * Initialize performance reporting
     */
    initialize() {
        if (typeof window === 'undefined') return;

        this.setupEventListeners();
        this.startPeriodicReporting();
    }

    /**
     * Setup event listeners for automatic reporting
     */
    setupEventListeners() {
        // Report on page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.reportPerformance('page_hidden');
            }
        });

        // Report before page unload
        window.addEventListener('beforeunload', () => {
            this.reportPerformance('page_unload', true); // Force immediate report
        });

        // Report on critical performance issues
        window.addEventListener('error', (event) => {
            this.reportError({
                type: 'javascript_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });

        // Report unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.reportError({
                type: 'unhandled_promise_rejection',
                reason: event.reason?.toString(),
                stack: event.reason?.stack
            });
        });
    }

    /**
     * Start periodic performance reporting
     */
    startPeriodicReporting() {
        // Report every 30 seconds in production, 60 seconds in development
        const interval = this.isProduction ? 30000 : 60000;

        this.reportInterval = setInterval(() => {
            this.reportPerformance('periodic');
        }, interval);
    }

    /**
     * Report performance data
     */
    reportPerformance(trigger = 'manual', forceImmediate = false) {
        const now = Date.now();

        // Rate limiting (except for forced reports)
        if (!forceImmediate && now - this.lastReportTime < this.minReportInterval) {
            return;
        }

        this.lastReportTime = now;

        // Gather performance data from all sources
        const report = this.buildPerformanceReport(trigger);

        // Add to queue and process
        this.queueReport(report);

        // Process queue
        if (forceImmediate) {
            this.processReportQueue(true);
        } else {
            this.processReportQueue();
        }

        // Notify callbacks
        this.notifyCallbacks('report-sent', report);
    }

    /**
     * Build comprehensive performance report
     */
    buildPerformanceReport(trigger) {
        const report = {
            timestamp: Date.now(),
            trigger,
            sessionId: this.getSessionId(),
            url: window.location.href,
            referrer: document.referrer,
            userAgent: navigator.userAgent
        };

        // Collect data from global performance monitors if available
        if (typeof window.webVitalsTracker !== 'undefined') {
            report.webVitals = window.webVitalsTracker.exportData();
        }

        if (typeof window.resourceTracker !== 'undefined') {
            report.resources = window.resourceTracker.exportData();
        }

        if (typeof window.metricsCollector !== 'undefined') {
            report.metrics = window.metricsCollector.exportData();
        }

        // Add basic performance data if monitors not available
        if (!report.webVitals && !report.resources && !report.metrics) {
            report.basic = this.collectBasicPerformanceData();
        }

        // Calculate overall score
        report.overallScore = this.calculateOverallScore(report);

        // Add performance insights
        report.insights = this.generateInsights(report);

        return report;
    }

    /**
     * Collect basic performance data as fallback
     */
    collectBasicPerformanceData() {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paintEntries = performance.getEntriesByType('paint');

        const data = {
            navigation: navigation ? {
                loadComplete: Math.round(navigation.loadEventEnd - navigation.navigationStart),
                domComplete: Math.round(navigation.domComplete - navigation.navigationStart),
                ttfb: Math.round(navigation.responseStart - navigation.requestStart)
            } : null,
            paint: {},
            resources: {
                total: performance.getEntriesByType('resource').length
            }
        };

        paintEntries.forEach(entry => {
            data.paint[entry.name.replace('-', '_')] = Math.round(entry.startTime);
        });

        return data;
    }

    /**
     * Calculate overall performance score
     */
    calculateOverallScore(report) {
        let score = 100;

        // Web Vitals scoring
        if (report.webVitals?.overallScore) {
            return report.webVitals.overallScore;
        }

        // Basic scoring from navigation timing
        if (report.basic?.navigation) {
            const nav = report.basic.navigation;

            // Penalize slow load times
            if (nav.loadComplete > 3000) score -= 20;
            else if (nav.loadComplete > 1500) score -= 10;

            // Penalize slow TTFB
            if (nav.ttfb > 1000) score -= 15;
            else if (nav.ttfb > 500) score -= 5;

            // Penalize slow DOM complete
            if (nav.domComplete > 2000) score -= 10;
            else if (nav.domComplete > 1000) score -= 5;
        }

        return Math.max(0, score);
    }

    /**
     * Generate performance insights
     */
    generateInsights(report) {
        const insights = [];

        // Aggregate insights from all modules
        if (report.webVitals?.insights) {
            insights.push(...report.webVitals.insights);
        }

        if (report.resources?.insights) {
            insights.push(...report.resources.insights);
        }

        if (report.metrics?.insights) {
            insights.push(...report.metrics.insights);
        }

        // Add overall insights
        if (report.overallScore < 50) {
            insights.push({
                type: 'overall_performance',
                message: 'Overall performance is poor. Consider implementing performance optimizations.',
                severity: 'critical'
            });
        } else if (report.overallScore < 75) {
            insights.push({
                type: 'overall_performance',
                message: 'Performance could be improved. Review individual metrics for optimization opportunities.',
                severity: 'warning'
            });
        }

        return insights;
    }

    /**
     * Queue report for sending
     */
    queueReport(report) {
        this.reportQueue.push(report);

        // Limit queue size
        if (this.reportQueue.length > 10) {
            this.reportQueue = this.reportQueue.slice(-10);
        }
    }

    /**
     * Process report queue
     */
    async processReportQueue(forceImmediate = false) {
        if (this.reportQueue.length === 0) return;

        const reports = [...this.reportQueue];
        this.reportQueue = [];

        // Send reports
        if (this.isProduction || forceImmediate) {
            await this.sendToAnalytics(reports);
        } else {
            this.logReportsToConsole(reports);
        }
    }

    /**
     * Send reports to analytics service
     */
    async sendToAnalytics(reports) {
        try {
            // Use sendBeacon for reliable delivery (especially on page unload)
            if (navigator.sendBeacon) {
                const success = navigator.sendBeacon(
                    '/api/analytics/performance',
                    JSON.stringify({ reports })
                );

                if (!success) {
                    // Fallback to fetch
                    await this.sendWithFetch(reports);
                }
            } else {
                await this.sendWithFetch(reports);
            }
        } catch (error) {
            console.warn('Failed to send performance reports:', error);

            // Store in localStorage as fallback
            this.storeReportsLocally(reports);
        }
    }

    /**
     * Send reports using fetch API
     */
    async sendWithFetch(reports) {
        const response = await fetch('/api/analytics/performance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reports }),
            keepalive: true // Important for unload events
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    }

    /**
     * Store reports locally as fallback
     */
    storeReportsLocally(reports) {
        try {
            const stored = JSON.parse(localStorage.getItem('performance_reports') || '[]');
            stored.push(...reports);

            // Keep only last 50 reports
            const limited = stored.slice(-50);
            localStorage.setItem('performance_reports', JSON.stringify(limited));
        } catch (error) {
            console.warn('Failed to store reports locally:', error);
        }
    }

    /**
     * Log reports to console in development
     */
    logReportsToConsole(reports) {
        reports.forEach(report => {
            console.group(`🚀 Performance Report (${report.trigger})`);
            console.info('Overall Score:', report.overallScore);

            if (report.webVitals?.vitals) {
                console.table(report.webVitals.vitals);
            }

            if (report.resources?.summary) {
                console.info('Resources:', report.resources.summary);
            }

            if (report.insights?.length > 0) {
                console.warn('Performance Issues:', report.insights);
            }

            console.groupEnd();
        });
    }

    /**
     * Report performance error
     */
    reportError(errorData) {
        const errorReport = {
            timestamp: Date.now(),
            type: 'error',
            sessionId: this.getSessionId(),
            url: window.location.href,
            error: errorData
        };

        this.queueReport(errorReport);
        this.processReportQueue();
    }

    /**
     * Add callback for reporting events
     */
    addCallback(callback) {
        this.callbacks.add(callback);
    }

    /**
     * Remove callback
     */
    removeCallback(callback) {
        this.callbacks.delete(callback);
    }

    /**
     * Notify callbacks
     */
    notifyCallbacks(event, data) {
        this.callbacks.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.warn('Error in reporter callback:', error);
            }
        });
    }

    /**
     * Get or create session ID
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('perf_session_id');
        if (!sessionId) {
            sessionId = 'perf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('perf_session_id', sessionId);
        }
        return sessionId;
    }

    /**
     * Get environment
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
     * Get queued reports count
     */
    getQueuedReportsCount() {
        return this.reportQueue.length;
    }

    /**
     * Force immediate report
     */
    forceReport(trigger = 'manual') {
        this.reportPerformance(trigger, true);
    }

    /**
     * Stop periodic reporting
     */
    stopReporting() {
        if (this.reportInterval) {
            clearInterval(this.reportInterval);
            this.reportInterval = null;
        }
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.stopReporting();

        // Send final report
        this.reportPerformance('destroy', true);

        this.callbacks.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceReporter;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
    window.PerformanceReporter = PerformanceReporter;
}