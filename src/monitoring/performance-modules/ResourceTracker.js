/**
 * Resource Tracker
 * Monitors resource loading, timing, and caching performance
 */

class ResourceTracker {
    constructor() {
        this.resources = [];
        this.observers = new Map();
        this.callbacks = new Set();
        this.navigationTiming = {};

        this.initialize();
    }

    /**
     * Initialize resource tracking
     */
    initialize() {
        if (typeof window === 'undefined') return;

        this.setupResourceObserver();
        this.setupNavigationTiming();
        this.trackExistingResources();
    }

    /**
     * Setup Performance Observer for resources
     */
    setupResourceObserver() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.processResourceEntry(entry);
                });
            });

            observer.observe({ entryTypes: ['resource'] });
            this.observers.set('resource', observer);
        } catch (error) {
            console.warn('Failed to observe resources:', error);
        }
    }

    /**
     * Setup navigation timing
     */
    setupNavigationTiming() {
        window.addEventListener('load', () => {
            const navigationEntry = performance.getEntriesByType('navigation')[0];
            if (navigationEntry) {
                this.navigationTiming = {
                    domContentLoaded: Math.round(navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart),
                    domComplete: Math.round(navigationEntry.domComplete - navigationEntry.navigationStart),
                    loadComplete: Math.round(navigationEntry.loadEventEnd - navigationEntry.navigationStart),
                    ttfb: Math.round(navigationEntry.responseStart - navigationEntry.requestStart),
                    domInteractive: Math.round(navigationEntry.domInteractive - navigationEntry.navigationStart),
                    redirectTime: Math.round(navigationEntry.redirectEnd - navigationEntry.redirectStart),
                    dnsTime: Math.round(navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart),
                    connectTime: Math.round(navigationEntry.connectEnd - navigationEntry.connectStart),
                    requestTime: Math.round(navigationEntry.responseEnd - navigationEntry.requestStart),
                    responseTime: Math.round(navigationEntry.responseEnd - navigationEntry.responseStart)
                };

                this.notifyCallbacks('navigation', this.navigationTiming);
            }
        });
    }

    /**
     * Track existing resources that loaded before observer setup
     */
    trackExistingResources() {
        const existingResources = performance.getEntriesByType('resource');
        existingResources.forEach(entry => {
            this.processResourceEntry(entry);
        });
    }

    /**
     * Process individual resource entry
     */
    processResourceEntry(entry) {
        const resource = {
            name: entry.name,
            type: this.getResourceType(entry),
            size: entry.transferSize || 0,
            duration: Math.round(entry.duration),
            startTime: Math.round(entry.startTime),
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
            protocol: this.getProtocol(entry),
            timing: {
                dns: Math.round(entry.domainLookupEnd - entry.domainLookupStart),
                connect: Math.round(entry.connectEnd - entry.connectStart),
                ssl: entry.secureConnectionStart > 0 ? Math.round(entry.connectEnd - entry.secureConnectionStart) : 0,
                ttfb: Math.round(entry.responseStart - entry.requestStart),
                download: Math.round(entry.responseEnd - entry.responseStart)
            },
            initiatorType: entry.initiatorType || 'other'
        };

        this.resources.push(resource);
        this.notifyCallbacks('resource', resource);

        // Check for performance issues
        this.checkResourcePerformance(resource);
    }

    /**
     * Get resource type from entry
     */
    getResourceType(entry) {
        if (entry.initiatorType === 'img' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(entry.name)) {
            return 'image';
        }
        if (entry.initiatorType === 'script' || /\.js$/i.test(entry.name)) {
            return 'script';
        }
        if (entry.initiatorType === 'css' || /\.css$/i.test(entry.name)) {
            return 'stylesheet';
        }
        if (/\.(woff|woff2|ttf|otf)$/i.test(entry.name)) {
            return 'font';
        }
        if (entry.initiatorType === 'xmlhttprequest' || entry.initiatorType === 'fetch') {
            return 'xhr';
        }
        return entry.initiatorType || 'other';
    }

    /**
     * Get protocol from entry
     */
    getProtocol(entry) {
        try {
            const url = new URL(entry.name);
            return url.protocol.replace(':', '');
        } catch {
            return 'unknown';
        }
    }

    /**
     * Check resource for performance issues
     */
    checkResourcePerformance(resource) {
        const issues = [];

        // Large resource size
        if (resource.size > 1024 * 1024) { // 1MB
            issues.push({
                type: 'large_resource',
                message: `Large resource detected: ${Math.round(resource.size / 1024)}KB`,
                severity: 'warning'
            });
        }

        // Slow loading resource
        if (resource.duration > 5000) { // 5 seconds
            issues.push({
                type: 'slow_resource',
                message: `Slow loading resource: ${Math.round(resource.duration)}ms`,
                severity: 'warning'
            });
        }

        // Non-HTTPS resource
        if (resource.protocol === 'http' && window.location.protocol === 'https:') {
            issues.push({
                type: 'mixed_content',
                message: 'Non-HTTPS resource on HTTPS page',
                severity: 'critical'
            });
        }

        // High TTFB
        if (resource.timing.ttfb > 2000) {
            issues.push({
                type: 'high_ttfb',
                message: `High Time to First Byte: ${resource.timing.ttfb}ms`,
                severity: 'warning'
            });
        }

        if (issues.length > 0) {
            this.notifyCallbacks('resource-issues', { resource, issues });
        }
    }

    /**
     * Add callback for resource events
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
                console.warn('Error in resource callback:', error);
            }
        });
    }

    /**
     * Get resource summary
     */
    getResourceSummary() {
        const summary = {
            total: this.resources.length,
            types: {},
            totalSize: 0,
            cached: 0,
            avgDuration: 0,
            protocols: {}
        };

        let totalDuration = 0;

        this.resources.forEach(resource => {
            summary.types[resource.type] = (summary.types[resource.type] || 0) + 1;
            summary.totalSize += resource.size;
            summary.protocols[resource.protocol] = (summary.protocols[resource.protocol] || 0) + 1;
            totalDuration += resource.duration;

            if (resource.cached) {
                summary.cached++;
            }
        });

        summary.avgDuration = this.resources.length > 0 ? Math.round(totalDuration / this.resources.length) : 0;
        summary.cacheHitRate = this.resources.length > 0 ? Math.round((summary.cached / this.resources.length) * 100) : 0;
        summary.totalSizeMB = Math.round((summary.totalSize / (1024 * 1024)) * 100) / 100;

        return summary;
    }

    /**
     * Get largest resources
     */
    getLargestResources(limit = 10) {
        return [...this.resources]
            .sort((a, b) => b.size - a.size)
            .slice(0, limit)
            .map(resource => ({
                name: resource.name.split('/').pop(),
                type: resource.type,
                size: resource.size,
                sizeMB: Math.round((resource.size / (1024 * 1024)) * 100) / 100,
                duration: resource.duration
            }));
    }

    /**
     * Get slowest resources
     */
    getSlowestResources(limit = 10) {
        return [...this.resources]
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit)
            .map(resource => ({
                name: resource.name.split('/').pop(),
                type: resource.type,
                duration: resource.duration,
                size: resource.size
            }));
    }

    /**
     * Get navigation timing
     */
    getNavigationTiming() {
        return { ...this.navigationTiming };
    }

    /**
     * Get all resources
     */
    getResources() {
        return [...this.resources];
    }

    /**
     * Get resources by type
     */
    getResourcesByType(type) {
        return this.resources.filter(resource => resource.type === type);
    }

    /**
     * Get performance insights
     */
    getInsights() {
        const insights = [];
        const summary = this.getResourceSummary();

        // Cache hit rate insights
        if (summary.cacheHitRate < 50) {
            insights.push({
                type: 'caching',
                message: `Low cache hit rate: ${summary.cacheHitRate}%. Consider implementing better caching strategies.`,
                severity: 'warning'
            });
        }

        // Total size insights
        if (summary.totalSizeMB > 5) {
            insights.push({
                type: 'bundle_size',
                message: `Large total resource size: ${summary.totalSizeMB}MB. Consider code splitting and optimization.`,
                severity: 'warning'
            });
        }

        // Navigation timing insights
        if (this.navigationTiming.ttfb > 1000) {
            insights.push({
                type: 'server_response',
                message: `Slow server response time: ${this.navigationTiming.ttfb}ms. Consider server optimization.`,
                severity: 'warning'
            });
        }

        return insights;
    }

    /**
     * Export resource data
     */
    exportData() {
        return {
            resources: this.getResources(),
            summary: this.getResourceSummary(),
            navigation: this.getNavigationTiming(),
            largest: this.getLargestResources(5),
            slowest: this.getSlowestResources(5),
            insights: this.getInsights(),
            timestamp: Date.now()
        };
    }

    /**
     * Cleanup observers
     */
    destroy() {
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers.clear();
        this.callbacks.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResourceTracker;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
    window.ResourceTracker = ResourceTracker;
}