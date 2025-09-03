/**
 * Security Headers Manager
 * Handles CSP, security headers, and browser security configuration
 */

class SecurityHeaders {
    constructor(config = {}) {
        this.config = {
            allowedOrigins: config.allowedOrigins || ['https://mvp-hotel.netlify.app', 'http://localhost:3000']
        };

        // Initialize security headers
        this.securityHeaders = {
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '0', // Disabled in modern browsers, CSP is better
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Resource-Policy': 'same-origin'
        };

        this.nonce = this.generateNonce();
    }

    /**
     * OWASP A05: Security Misconfiguration Prevention
     */
    applySecurityHeaders() {
        // Apply security headers via meta tags (for client-side)
        Object.entries(this.securityHeaders).forEach(([header, _value]) => {
            if (header === 'Content-Security-Policy') {
                const meta = document.createElement('meta');
                meta.httpEquiv = header;
                meta.content = this.generateCSP();
                document.head.appendChild(meta);
            }
        });

        // Disable debug mode in production
        this.configureProductionSecurity();

        // Remove sensitive information from errors
        this.setupErrorHandling();
    }

    /**
     * Configure production security measures
     */
    configureProductionSecurity() {
        if (window.location.hostname !== 'localhost') {
            /* eslint-disable no-console -- Production security hardening requires console modification */
            // Preserve console.error and console.warn for critical issues
            const originalError = console.error;
            const originalWarn = console.warn;

            // Disable non-critical console methods in production
            console.log = () => {};
            console.debug = () => {};
            console.info = () => {};

            // Restore critical logging methods
            console.error = originalError;
            console.warn = originalWarn;
            /* eslint-enable no-console */
        }
    }

    /**
     * Setup error handling to prevent information leakage
     */
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            if (window.location.hostname !== 'localhost') {
                event.preventDefault();
                // In production, log sanitized error without exposing details
                if (typeof window.errorTracking !== 'undefined') {
                    window.errorTracking.logError('CLIENT_ERROR', {
                        message: 'An error occurred',
                        url: event.filename,
                        line: event.lineno
                    });
                }
            }
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            if (window.location.hostname !== 'localhost') {
                event.preventDefault();
                if (typeof window.errorTracking !== 'undefined') {
                    window.errorTracking.logError('UNHANDLED_REJECTION', {
                        message: 'Promise rejection occurred'
                    });
                }
            }
        });
    }

    /**
     * Generate Content Security Policy
     */
    generateCSP() {
        return `
            default-src 'self';
            script-src 'self' 'nonce-${this.nonce}' https://cdn.jsdelivr.net;
            style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
            img-src 'self' data: https: blob:;
            font-src 'self' https://fonts.gstatic.com;
            connect-src 'self' https://api.openai.com https://api.groq.com https://*.pipedream.net;
            frame-src 'none';
            object-src 'none';
            base-uri 'self';
            form-action 'self';
            frame-ancestors 'none';
            upgrade-insecure-requests;
            block-all-mixed-content;
        `.replace(/\s+/g, ' ').trim();
    }

    /**
     * Update CSP with new nonce
     */
    updateCSP() {
        this.nonce = this.generateNonce();

        // Remove existing CSP meta tag
        const existingMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (existingMeta) {
            existingMeta.remove();
        }

        // Add new CSP meta tag
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = this.generateCSP();
        document.head.appendChild(meta);

        return this.nonce;
    }

    /**
     * Generate nonce for CSP
     */
    generateNonce() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode(...array));
    }

    /**
     * Get current nonce
     */
    getNonce() {
        return this.nonce;
    }

    /**
     * Apply script nonce to dynamically created scripts
     */
    createSecureScript(src, content) {
        const script = document.createElement('script');
        script.nonce = this.nonce;

        if (src) {
            script.src = src;
        }

        if (content) {
            script.textContent = content;
        }

        return script;
    }

    /**
     * Validate CORS origin
     */
    validateOrigin(origin) {
        return this.config.allowedOrigins.includes(origin);
    }

    /**
     * Setup CORS headers for requests
     */
    getCORSHeaders(origin) {
        const headers = {};

        if (this.validateOrigin(origin)) {
            headers['Access-Control-Allow-Origin'] = origin;
            headers['Access-Control-Allow-Credentials'] = 'true';
            headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
            headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token';
            headers['Access-Control-Max-Age'] = '86400'; // 24 hours
        }

        return headers;
    }

    /**
     * Validate request headers
     */
    validateRequestHeaders(headers) {
        const requiredHeaders = ['Content-Type'];
        const securityHeaders = ['X-Requested-With'];

        // Check required headers
        for (const header of requiredHeaders) {
            if (!headers[header] && !headers[header.toLowerCase()]) {
                return { valid: false, reason: `Missing required header: ${header}` };
            }
        }

        // Validate content type
        const contentType = headers['Content-Type'] || headers['content-type'];
        const allowedContentTypes = [
            'application/json',
            'application/x-www-form-urlencoded',
            'multipart/form-data',
            'text/plain'
        ];

        if (contentType && !allowedContentTypes.some(type => contentType.includes(type))) {
            return { valid: false, reason: 'Invalid content type' };
        }

        return { valid: true };
    }

    /**
     * Get all security headers
     */
    getAllHeaders() {
        return { ...this.securityHeaders };
    }

    /**
     * Add custom security header
     */
    addCustomHeader(name, value) {
        this.securityHeaders[name] = value;
    }

    /**
     * Remove security header
     */
    removeHeader(name) {
        delete this.securityHeaders[name];
    }

    /**
     * Check if feature policy is supported
     */
    isFeaturePolicySupported() {
        return 'featurePolicy' in document || 'permissions' in navigator;
    }

    /**
     * Setup feature policy restrictions
     */
    setupFeaturePolicy() {
        if (this.isFeaturePolicySupported()) {
            // Restrict access to sensitive features
            const restrictedFeatures = [
                'camera',
                'microphone',
                'geolocation',
                'payment',
                'usb',
                'magnetometer',
                'accelerometer',
                'gyroscope'
            ];

            restrictedFeatures.forEach(feature => {
                const meta = document.createElement('meta');
                meta.httpEquiv = 'Permissions-Policy';
                meta.content = `${feature}=()`;
                document.head.appendChild(meta);
            });
        }
    }

    /**
     * Initialize security headers on page load
     */
    initialize() {
        this.applySecurityHeaders();
        this.setupFeaturePolicy();

        // Log initialization only in development
        if (window.location.hostname === 'localhost') {
            console.info('Security Headers initialized');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityHeaders;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
    window.SecurityHeaders = SecurityHeaders;
}