/**
 * Web Vitals Tracker
 * Monitors Core Web Vitals: LCP, FID, CLS, FCP, TTI, TTFB
 */

class WebVitalsTracker {
    constructor() {
        this.vitals = {
            LCP: null,    // Largest Contentful Paint
            FID: null,    // First Input Delay
            CLS: null,    // Cumulative Layout Shift
            FCP: null,    // First Contentful Paint
            TTI: null,    // Time to Interactive
            TTFB: null    // Time to First Byte
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
        this.callbacks = new Set();
        this.clsValue = 0;

        this.initialize();
    }

    /**
     * Initialize Core Web Vitals monitoring
     */
    initialize() {
        if (typeof window === 'undefined') return;

        this.setupLCP();
        this.setupFID();
        this.setupCLS();
        this.setupFCP();
        this.setupTTI();
        this.setupTTFB();
    }

    /**
     * Setup Largest Contentful Paint monitoring
     */
    setupLCP() {
        this.observeWebVital('largest-contentful-paint', (entry) => {
            this.vitals.LCP = Math.round(entry.startTime);
            this.notifyCallbacks('LCP', entry.startTime);
        });
    }

    /**
     * Setup First Input Delay monitoring
     */
    setupFID() {
        this.observeWebVital('first-input', (entry) => {
            this.vitals.FID = Math.round(entry.processingStart - entry.startTime);
            this.notifyCallbacks('FID', entry.processingStart - entry.startTime);
        });
    }

    /**
     * Setup Cumulative Layout Shift monitoring
     */
    setupCLS() {
        this.observeWebVital('layout-shift', (entry) => {
            if (!entry.hadRecentInput) {
                this.clsValue += entry.value;
                this.vitals.CLS = Math.round(this.clsValue * 1000) / 1000;
                this.notifyCallbacks('CLS', this.clsValue);
            }
        });
    }

    /**
     * Setup First Contentful Paint monitoring
     */
    setupFCP() {
        this.observeWebVital('paint', (entry) => {
            if (entry.name === 'first-contentful-paint') {
                this.vitals.FCP = Math.round(entry.startTime);
                this.notifyCallbacks('FCP', entry.startTime);
            }
        });
    }

    /**
     * Setup Time to Interactive monitoring
     */
    setupTTI() {
        // TTI is complex to calculate accurately, using approximation
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigationEntry = performance.getEntriesByType('navigation')[0];
                if (navigationEntry) {
                    const tti = navigationEntry.domInteractive;
                    this.vitals.TTI = Math.round(tti);
                    this.notifyCallbacks('TTI', tti);
                }
            }, 0);
        });
    }

    /**
     * Setup Time to First Byte monitoring
     */
    setupTTFB() {
        window.addEventListener('load', () => {
            const navigationEntry = performance.getEntriesByType('navigation')[0];
            if (navigationEntry) {
                const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
                this.vitals.TTFB = Math.round(ttfb);
                this.notifyCallbacks('TTFB', ttfb);
            }
        });
    }

    /**
     * Observe web vital with Performance Observer
     */
    observeWebVital(type, callback) {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(callback);
            });

            observer.observe({ type, buffered: true });
            this.observers.set(type, observer);
        } catch (error) {
            console.warn(`Failed to observe ${type}:`, error);
        }
    }

    /**
     * Add callback for vital changes
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
     * Notify all callbacks of vital change
     */
    notifyCallbacks(vital, value) {
        this.callbacks.forEach(callback => {
            try {
                callback(vital, value, this.evaluateVital(vital, value));
            } catch (error) {
                console.warn('Error in vital callback:', error);
            }
        });
    }

    /**
     * Evaluate vital against thresholds
     */
    evaluateVital(vital, value) {
        const threshold = this.thresholds[vital];
        if (!threshold) return 'unknown';

        if (vital === 'CLS') {
            if (value <= 0.1) return 'good';
            if (value <= 0.25) return 'needs-improvement';
            return 'poor';
        } else {
            if (value <= threshold) return 'good';
            if (value <= threshold * 2.5) return 'needs-improvement';
            return 'poor';
        }
    }

    /**
     * Get all current vitals
     */
    getVitals() {
        return { ...this.vitals };
    }

    /**
     * Get vital scores
     */
    getVitalScores() {
        const scores = {};
        Object.keys(this.vitals).forEach(vital => {
            const value = this.vitals[vital];
            if (value !== null) {
                scores[vital] = {
                    value,
                    rating: this.evaluateVital(vital, value),
                    threshold: this.thresholds[vital]
                };
            }
        });
        return scores;
    }

    /**
     * Calculate overall Web Vitals score
     */
    getOverallScore() {
        const scores = this.getVitalScores();
        const validScores = Object.values(scores).filter(score => score.value !== null);

        if (validScores.length === 0) return 0;

        const goodCount = validScores.filter(score => score.rating === 'good').length;
        const improvementCount = validScores.filter(score => score.rating === 'needs-improvement').length;

        // Score based on distribution
        return Math.round(((goodCount * 100) + (improvementCount * 50)) / validScores.length);
    }

    /**
     * Get performance insights
     */
    getInsights() {
        const insights = [];
        const scores = this.getVitalScores();

        Object.entries(scores).forEach(([vital, score]) => {
            if (score.rating === 'poor') {
                insights.push({
                    type: 'critical',
                    vital,
                    message: this.getImprovementSuggestion(vital),
                    value: score.value,
                    threshold: score.threshold
                });
            } else if (score.rating === 'needs-improvement') {
                insights.push({
                    type: 'warning',
                    vital,
                    message: this.getImprovementSuggestion(vital),
                    value: score.value,
                    threshold: score.threshold
                });
            }
        });

        return insights;
    }

    /**
     * Get improvement suggestions for specific vitals
     */
    getImprovementSuggestion(vital) {
        const suggestions = {
            LCP: 'Optimize images, remove unused CSS, upgrade server response times',
            FID: 'Minimize JavaScript execution time, remove non-critical third-party scripts',
            CLS: 'Set size attributes for images and videos, avoid inserting content above existing content',
            FCP: 'Remove render-blocking resources, optimize critical resource priority',
            TTI: 'Minimize main thread work, reduce JavaScript execution time',
            TTFB: 'Optimize server response times, use a CDN, improve caching'
        };

        return suggestions[vital] || 'Consider performance optimization techniques';
    }

    /**
     * Export vitals data for reporting
     */
    exportData() {
        return {
            vitals: this.getVitals(),
            scores: this.getVitalScores(),
            overallScore: this.getOverallScore(),
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
    module.exports = WebVitalsTracker;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
    window.WebVitalsTracker = WebVitalsTracker;
}