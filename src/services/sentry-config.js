/**
 * Sentry Error Tracking Configuration
 * Production error monitoring and performance tracking
 */

(function() {
    'use strict';

    // Configuration
    const SENTRY_CONFIG = {
        dsn: '', // Add your Sentry DSN here: 'https://xxxxx@sentry.io/xxxxx'
        environment: window.location.hostname === 'localhost' ? 'development' : 'production',
        tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
        replaysSessionSampleRate: 0.1, // 10% of sessions for replay
        replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
        integrations: [],
        beforeSend: (event, hint) => {
            // Filter out known non-critical errors
            if (event.exception) {
                const error = hint.originalException;
                
                // Filter out network errors
                if (error && error.message && error.message.includes('NetworkError')) {
                    return null;
                }
                
                // Filter out browser extension errors
                if (error && error.stack && error.stack.includes('extension://')) {
                    return null;
                }
                
                // Sanitize sensitive data
                if (event.request && event.request.cookies) {
                    delete event.request.cookies;
                }
            }
            
            return event;
        }
    };

    // Initialize Sentry only if DSN is configured
    function initializeSentry() {
        if (!SENTRY_CONFIG.dsn) {
            console.info('Sentry DSN not configured. Error tracking disabled.');
            return;
        }

        // Load Sentry SDK
        const script = document.createElement('script');
        script.src = 'https://browser.sentry-cdn.com/7.0.0/bundle.min.js';
        script.crossOrigin = 'anonymous';
        script.onload = () => {
            if (window.Sentry) {
                window.Sentry.init(SENTRY_CONFIG);
                
                // Set user context (anonymous ID)
                const userId = localStorage.getItem('anonymous_user_id') || generateUserId();
                localStorage.setItem('anonymous_user_id', userId);
                
                window.Sentry.setUser({
                    id: userId,
                    segment: detectUserSegment()
                });
                
                // Add custom context
                window.Sentry.setContext('device', {
                    type: detectDeviceType(),
                    browser: detectBrowser(),
                    viewport: `${window.innerWidth}x${window.innerHeight}`,
                    pixelRatio: window.devicePixelRatio
                });
                
                // Track performance metrics
                trackWebVitals();
                
                console.info('Sentry initialized successfully');
            }
        };
        script.onerror = () => {
            console.warn('Failed to load Sentry SDK');
        };
        
        document.head.appendChild(script);
    }

    // Generate anonymous user ID
    function generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    // Detect user segment
    function detectUserSegment() {
        const referrer = document.referrer;
        if (referrer.includes('google.com')) return 'organic';
        if (referrer.includes('facebook.com') || referrer.includes('twitter.com')) return 'social';
        if (referrer === '') return 'direct';
        return 'referral';
    }

    // Detect device type
    function detectDeviceType() {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }

    // Detect browser
    function detectBrowser() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Edge')) return 'Edge';
        return 'Other';
    }

    // Track Web Vitals
    function trackWebVitals() {
        if (!window.Sentry) return;
        
        // First Contentful Paint
        const paintObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    window.Sentry.addBreadcrumb({
                        category: 'performance',
                        message: 'First Contentful Paint',
                        level: 'info',
                        data: { value: entry.startTime }
                    });
                }
            }
        });
        
        try {
            paintObserver.observe({ entryTypes: ['paint'] });
        } catch (e) {
            // PerformanceObserver not supported
        }
        
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            window.Sentry.addBreadcrumb({
                category: 'performance',
                message: 'Largest Contentful Paint',
                level: 'info',
                data: { value: lastEntry.renderTime || lastEntry.loadTime }
            });
        });
        
        try {
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
            // LCP not supported
        }
    }

    // Custom error handler
    window.trackError = function(error, context = {}) {
        console.error('Application Error:', error);
        
        if (window.Sentry) {
            window.Sentry.captureException(error, {
                contexts: { custom: context }
            });
        }
    };

    // Custom event tracking
    window.trackEvent = function(eventName, data = {}) {
        if (window.Sentry) {
            window.Sentry.addBreadcrumb({
                category: 'user',
                message: eventName,
                level: 'info',
                data: data
            });
        }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSentry);
    } else {
        initializeSentry();
    }

})();