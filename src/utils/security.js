/**
 * Security Utility Module
 * Provides XSS protection, input validation, and sanitization
 */

class SecurityService {
    constructor() {
        // Initialize DOMPurify equivalent for sanitization
        this.allowedTags = ['b', 'i', 'em', 'strong', 'br'];
        this.allowedAttributes = [];
    }

    /**
     * Sanitize HTML content to prevent XSS
     * @param {string} dirty - Untrusted input
     * @returns {string} - Sanitized HTML
     */
    sanitizeHTML(dirty) {
        if (!dirty) return '';

        // Basic HTML sanitization
        let clean = String(dirty)
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');

        // Allow specific safe tags
        this.allowedTags.forEach(tag => {
            const regex = new RegExp(`&lt;(${tag})&gt;`, 'gi');
            clean = clean.replace(regex, '<$1>');
            const closeRegex = new RegExp(`&lt;\\/(${tag})&gt;`, 'gi');
            clean = clean.replace(closeRegex, '</$1>');
        });

        return clean;
    }

    /**
     * Sanitize text content (no HTML allowed)
     * @param {string} text - Input text
     * @returns {string} - Safe text
     */
    sanitizeText(text) {
        if (!text) return '';

        return String(text)
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim()
            .substring(0, 10000); // Limit length
    }

    /**
     * Validate and sanitize email
     * @param {string} email - Email input
     * @returns {string|null} - Valid email or null
     */
    validateEmail(email) {
        if (!email || typeof email !== 'string') return null;

        // Reject emails that originally contained dangerous characters
        if (/<|>|script|javascript:/i.test(email)) {
            return null;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const sanitized = this.sanitizeText(email).toLowerCase().trim();

        return emailRegex.test(sanitized) ? sanitized : null;
    }

    /**
     * Validate and sanitize hotel name
     * @param {string} name - Hotel name
     * @returns {string} - Sanitized name
     */
    validateHotelName(name) {
        if (!name) return 'Hotel';

        return this.sanitizeText(name)
            .replace(/[^a-zA-Z0-9\s\-'&]/g, '')
            .substring(0, 100);
    }

    /**
     * Validate rating (1-5)
     * @param {number} rating - Rating value
     * @returns {number} - Valid rating
     */
    validateRating(rating) {
        const num = parseInt(rating);
        if (isNaN(num) || num < 1 || num > 5) {
            return 0;
        }
        return num;
    }

    /**
     * Validate trip type
     * @param {string} tripType - Trip type
     * @returns {string} - Valid trip type
     */
    validateTripType(tripType) {
        const validTypes = ['business', 'leisure', 'family', 'romance', 'vacation'];
        const sanitized = this.sanitizeText(tripType).toLowerCase();

        return validTypes.includes(sanitized) ? sanitized : 'leisure';
    }

    /**
     * Validate numeric input
     * @param {any} input - Input value
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @param {number} defaultVal - Default if invalid
     * @returns {number} - Valid number
     */
    validateNumber(input, min, max, defaultVal) {
        const num = parseFloat(input);
        if (isNaN(num) || num < min || num > max) {
            return defaultVal;
        }
        return num;
    }

    /**
     * Validate URL parameters
     * @param {URLSearchParams} params - URL parameters
     * @returns {object} - Sanitized parameters
     */
    validateURLParams(params) {
        const safe = {};

        safe.source = this.sanitizeText(params.get('source') || 'direct');
        safe.tripType = this.validateTripType(params.get('tripType') || 'leisure');
        safe.nights = this.validateNumber(params.get('nights'), 1, 365, 3);
        safe.guests = this.validateNumber(params.get('guests'), 1, 20, 2);
        safe.hotel = this.validateHotelName(params.get('hotel') || 'Grand Hotel');

        return safe;
    }

    /**
     * Create safe DOM element with text
     * @param {string} tag - HTML tag
     * @param {string} text - Text content
     * @param {object} attributes - Safe attributes
     * @returns {HTMLElement} - Safe DOM element
     */
    createElement(tag, text = '', attributes = {}) {
        const element = document.createElement(tag);

        // Set text content safely
        if (text) {
            element.textContent = text;
        }

        // Set safe attributes
        const safeAttributes = ['class', 'id', 'data-rating', 'data-id', 'href', 'type', 'name'];
        Object.entries(attributes).forEach(([key, value]) => {
            if (safeAttributes.includes(key)) {
                element.setAttribute(key, this.sanitizeText(value));
            }
        });

        return element;
    }

    /**
     * Safe innerHTML replacement
     * @param {HTMLElement} element - Target element
     * @param {string} content - HTML content
     */
    setInnerHTML(element, content) {
        // Clear existing content
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }

        // Create safe content
        const temp = document.createElement('div');
        temp.textContent = content; // This automatically escapes HTML

        // Move safe content to target
        while (temp.firstChild) {
            element.appendChild(temp.firstChild);
        }
    }

    /**
     * Rate limiting check
     * @param {string} action - Action identifier
     * @param {number} limit - Maximum attempts
     * @param {number} window - Time window in ms
     * @returns {boolean} - Whether action is allowed
     */
    checkRateLimit(action, limit = 10, window = 60000) {
        const now = Date.now();
        const key = `rateLimit_${action}`;
        const data = JSON.parse(localStorage.getItem(key) || '{"count":0,"reset":0}');

        if (now > data.reset) {
            data.count = 0;
            data.reset = now + window;
        }

        if (data.count >= limit) {
            return false;
        }

        data.count++;
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    }

    /**
     * Generate CSP nonce
     * @returns {string} - CSP nonce
     */
    generateNonce() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode.apply(null, array));
    }

    /**
     * Apply CSP headers via meta tag
     */
    applyCSPHeaders() {
        const nonce = this.generateNonce();
        const csp = document.createElement('meta');
        csp.httpEquiv = 'Content-Security-Policy';
        csp.content = `
            default-src 'self';
            script-src 'self' 'nonce-${nonce}' https://api.openai.com https://api.groq.com;
            style-src 'self' 'unsafe-inline';
            img-src 'self' data: https:;
            connect-src 'self' https://api.openai.com https://api.groq.com https://*.pipedream.net;
            font-src 'self' data:;
            object-src 'none';
            base-uri 'self';
            form-action 'self';
            frame-ancestors 'none';
            upgrade-insecure-requests;
        `.replace(/\s+/g, ' ').trim();

        document.head.appendChild(csp);
        return nonce;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityService;
} else if (typeof window !== 'undefined') {
    window.SecurityService = SecurityService;
}