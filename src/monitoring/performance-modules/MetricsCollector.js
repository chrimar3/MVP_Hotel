/**
 * Metrics Collector
 * Handles custom metrics, performance scoring, and system information
 */

class MetricsCollector {
    constructor() {
        this.customMetrics = {};
        this.performanceEntries = [];
        this.observers = new Map();
        this.callbacks = new Set();
        this.startTime = performance.now();

        this.initialize();
    }

    /**
     * Initialize metrics collection
     */
    initialize() {
        if (typeof window === 'undefined') return;

        this.setupCustomObservers();
        this.collectSystemInfo();
        this.startPerformanceMonitoring();
    }

    /**
     * Setup custom performance observers
     */
    setupCustomObservers() {
        // Long Task Observer
        this.observeLongTasks();

        // User Timing Observer
        this.observeUserTiming();

        // Memory usage (if available)
        this.observeMemory();
    }

    /**
     * Observe long tasks that block the main thread
     */
    observeLongTasks() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.recordCustomMetric('longTask', {
                        duration: entry.duration,
                        startTime: entry.startTime,
                        name: entry.name
                    });

                    // Alert for very long tasks
                    if (entry.duration > 100) {
                        this.notifyCallbacks('long-task', {
                            duration: entry.duration,
                            severity: entry.duration > 250 ? 'critical' : 'warning'
                        });
                    }
                });
            });

            observer.observe({ type: 'longtask', buffered: true });
            this.observers.set('longtask', observer);
        } catch (error) {
            console.warn('Long task observer not supported:', error);
        }
    }

    /**
     * Observe user timing marks and measures
     */
    observeUserTiming() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.performanceEntries.push({
                        name: entry.name,
                        type: entry.entryType,
                        startTime: entry.startTime,
                        duration: entry.duration || 0
                    });
                });
            });

            observer.observe({ entryTypes: ['mark', 'measure'] });
            this.observers.set('user-timing', observer);
        } catch (error) {
            console.warn('User timing observer failed:', error);
        }
    }

    /**
     * Monitor memory usage (Chrome only)
     */
    observeMemory() {
        if ('memory' in performance) {
            setInterval(() => {
                this.recordCustomMetric('memory', {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                });
            }, 10000); // Every 10 seconds
        }
    }

    /**
     * Collect system and browser information
     */
    collectSystemInfo() {
        this.systemInfo = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio || 1
            },
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            connection: this.getConnectionInfo(),
            hardware: this.getHardwareInfo()
        };
    }

    /**
     * Get connection information
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
     * Get hardware information
     */
    getHardwareInfo() {
        const hardware = {
            cores: navigator.hardwareConcurrency || 'unknown',
            memory: 'unknown'
        };

        // Device memory API (limited support)
        if ('deviceMemory' in navigator) {
            hardware.memory = navigator.deviceMemory + 'GB';
        }

        return hardware;
    }

    /**
     * Start performance monitoring intervals
     */
    startPerformanceMonitoring() {
        // Update system info periodically
        this.systemInfoInterval = setInterval(() => {
            this.systemInfo.viewport = {
                width: window.innerWidth,
                height: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio || 1
            };
            this.systemInfo.onLine = navigator.onLine;
            this.systemInfo.connection = this.getConnectionInfo();
        }, 30000); // Every 30 seconds
    }

    /**
     * Record custom metric
     */
    recordCustomMetric(name, value) {
        if (!this.customMetrics[name]) {
            this.customMetrics[name] = [];
        }

        this.customMetrics[name].push({
            value,
            timestamp: Date.now(),
            sessionTime: Math.round(performance.now() - this.startTime)
        });

        // Keep only last 100 entries per metric
        if (this.customMetrics[name].length > 100) {
            this.customMetrics[name] = this.customMetrics[name].slice(-100);
        }

        this.notifyCallbacks('custom-metric', { name, value });
    }

    /**
     * Add performance mark
     */
    mark(name) {
        if (performance.mark) {
            performance.mark(name);
        }
    }

    /**
     * Add performance measure
     */
    measure(name, startMark, endMark) {
        if (performance.measure) {
            try {
                performance.measure(name, startMark, endMark);
                return performance.getEntriesByName(name, 'measure').pop();
            } catch (error) {
                console.warn('Performance measure failed:', error);
            }
        }
        return null;
    }

    /**
     * Time a function execution
     */
    timeFunction(name, fn) {
        const startMark = `${name}-start`;
        const endMark = `${name}-end`;

        this.mark(startMark);
        const result = fn();

        // Handle both sync and async functions
        if (result && typeof result.then === 'function') {
            return result.finally(() => {
                this.mark(endMark);
                this.measure(name, startMark, endMark);
            });
        } else {
            this.mark(endMark);
            this.measure(name, startMark, endMark);
            return result;
        }
    }

    /**
     * Calculate overall performance score
     */
    calculatePerformanceScore(webVitals) {
        const score = 100;
        let penalties = 0;

        // Web Vitals penalties
        if (webVitals) {
            if (webVitals.LCP > 2500) penalties += 15;
            if (webVitals.FID > 100) penalties += 15;
            if (webVitals.CLS > 0.1) penalties += 15;
            if (webVitals.FCP > 1800) penalties += 10;
            if (webVitals.TTI > 3800) penalties += 10;
            if (webVitals.TTFB > 800) penalties += 10;
        }

        // Long task penalties
        const longTasks = this.customMetrics.longTask || [];
        const recentLongTasks = longTasks.filter(task =>
            Date.now() - task.timestamp < 60000 // Last minute
        );

        recentLongTasks.forEach(task => {
            if (task.value.duration > 250) penalties += 5;
            else if (task.value.duration > 100) penalties += 2;
        });

        // Memory usage penalties (if available)
        const memoryMetrics = this.customMetrics.memory || [];
        const latestMemory = memoryMetrics[memoryMetrics.length - 1];
        if (latestMemory && latestMemory.value.used > latestMemory.value.limit * 0.8) {
            penalties += 10; // High memory usage
        }

        return Math.max(0, score - penalties);
    }

    /**
     * Get performance insights
     */
    getPerformanceInsights() {
        const insights = [];

        // Long task insights
        const longTasks = this.customMetrics.longTask || [];
        const recentLongTasks = longTasks.filter(task =>
            Date.now() - task.timestamp < 300000 // Last 5 minutes
        );

        if (recentLongTasks.length > 5) {
            insights.push({
                type: 'main_thread_blocking',
                message: `${recentLongTasks.length} long tasks detected in the last 5 minutes. Consider code splitting or moving work to web workers.`,
                severity: 'warning'
            });
        }

        // Memory insights
        const memoryMetrics = this.customMetrics.memory || [];
        const latestMemory = memoryMetrics[memoryMetrics.length - 1];
        if (latestMemory) {
            const memoryUsage = (latestMemory.value.used / latestMemory.value.limit) * 100;
            if (memoryUsage > 80) {
                insights.push({
                    type: 'high_memory_usage',
                    message: `High memory usage: ${Math.round(memoryUsage)}%. Consider optimizing memory-intensive operations.`,
                    severity: 'critical'
                });
            }
        }

        // Connection insights
        if (this.systemInfo.connection) {
            if (this.systemInfo.connection.effectiveType === '2g') {
                insights.push({
                    type: 'slow_connection',
                    message: 'User on slow 2G connection. Consider optimizing for low bandwidth.',
                    severity: 'info'
                });
            }

            if (this.systemInfo.connection.saveData) {
                insights.push({
                    type: 'save_data',
                    message: 'User has data saver enabled. Consider reducing data usage.',
                    severity: 'info'
                });
            }
        }

        return insights;
    }

    /**
     * Add callback for metric events
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
     * Notify callbacks of events
     */
    notifyCallbacks(event, data) {
        this.callbacks.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.warn('Error in metrics callback:', error);
            }
        });
    }

    /**
     * Get custom metrics
     */
    getCustomMetrics() {
        return { ...this.customMetrics };
    }

    /**
     * Get performance entries
     */
    getPerformanceEntries() {
        return [...this.performanceEntries];
    }

    /**
     * Get system information
     */
    getSystemInfo() {
        return { ...this.systemInfo };
    }

    /**
     * Get session duration
     */
    getSessionDuration() {
        return Math.round(performance.now() - this.startTime);
    }

    /**
     * Export all metrics data
     */
    exportData() {
        return {
            customMetrics: this.getCustomMetrics(),
            performanceEntries: this.getPerformanceEntries(),
            systemInfo: this.getSystemInfo(),
            sessionDuration: this.getSessionDuration(),
            insights: this.getPerformanceInsights(),
            timestamp: Date.now()
        };
    }

    /**
     * Clear metrics data
     */
    clearMetrics() {
        this.customMetrics = {};
        this.performanceEntries = [];
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        // Clear intervals
        if (this.systemInfoInterval) {
            clearInterval(this.systemInfoInterval);
        }

        // Disconnect observers
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers.clear();
        this.callbacks.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MetricsCollector;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
    window.MetricsCollector = MetricsCollector;
}