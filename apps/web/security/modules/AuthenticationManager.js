/**
 * Authentication Manager
 * Handles login validation, password strength, session management, and rate limiting
 */

class AuthenticationManager {
    constructor(config = {}) {
        this.config = {
            maxLoginAttempts: config.maxLoginAttempts || 5,
            lockoutDuration: config.lockoutDuration || 900000, // 15 minutes
            passwordMinLength: config.passwordMinLength || 12,
            requireStrongPassword: config.requireStrongPassword !== false,
            sessionTimeout: config.sessionTimeout || 3600000, // 1 hour
        };

        this.rateLimits = new Map();
    }

    /**
     * OWASP A07: Identification and Authentication Failures
     */
    validateAuthentication(credentials) {
        // Check rate limiting
        if (!this.checkRateLimit('login', this.config.maxLoginAttempts)) {
            return {
                success: false,
                error: 'Too many login attempts. Please try again later.',
                reason: 'RATE_LIMIT_EXCEEDED'
            };
        }

        // Validate password strength
        if (!this.validatePasswordStrength(credentials.password)) {
            return {
                success: false,
                error: 'Password does not meet security requirements',
                reason: 'WEAK_PASSWORD'
            };
        }

        // In a real app, this would check against a secure database
        // with properly hashed passwords (bcrypt, argon2, etc.)
        return { success: true };
    }

    /**
     * Validate password strength
     */
    validatePasswordStrength(password) {
        if (!password || password.length < this.config.passwordMinLength) {
            return false;
        }

        if (this.config.requireStrongPassword) {
            const hasUpperCase = /[A-Z]/.test(password);
            const hasLowerCase = /[a-z]/.test(password);
            const hasNumbers = /\d/.test(password);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

            const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
                .filter(Boolean).length;

            return strength >= 3;
        }

        return true;
    }

    /**
     * Rate limiting implementation
     */
    checkRateLimit(action, limit = 10, window = 60000) {
        const now = Date.now();
        const key = `${action}_${this.getClientIdentifier()}`;

        if (!this.rateLimits.has(key)) {
            this.rateLimits.set(key, {
                count: 0,
                resetTime: now + window
            });
        }

        const limitData = this.rateLimits.get(key);

        if (now > limitData.resetTime) {
            limitData.count = 0;
            limitData.resetTime = now + window;
        }

        if (limitData.count >= limit) {
            return false;
        }

        limitData.count++;
        return true;
    }

    /**
     * Get client identifier for rate limiting
     */
    getClientIdentifier() {
        // Combination of factors to identify client
        return btoa([
            navigator.userAgent,
            navigator.language,
            new Date().getTimezoneOffset(),
            screen.width,
            screen.height
        ].join('|'));
    }

    /**
     * Session management
     */
    validateSession() {
        const sessionStart = sessionStorage.getItem('sessionStart');
        if (!sessionStart) {
            sessionStorage.setItem('sessionStart', Date.now().toString());
            return true;
        }

        const elapsed = Date.now() - parseInt(sessionStart);
        if (elapsed > this.config.sessionTimeout) {
            this.clearSession();
            return false;
        }

        return true;
    }

    /**
     * Get or create session ID
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = this.generateToken();
            sessionStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    }

    /**
     * Clear session data
     */
    clearSession() {
        sessionStorage.clear();
    }

    /**
     * Generate secure random token
     */
    generateToken(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.validateSession() && sessionStorage.getItem('sessionId');
    }

    /**
     * Start authentication session
     */
    startSession() {
        const sessionId = this.generateToken();
        sessionStorage.setItem('sessionId', sessionId);
        sessionStorage.setItem('sessionStart', Date.now().toString());
        return sessionId;
    }

    /**
     * Get authentication status
     */
    getAuthStatus() {
        return {
            authenticated: this.isAuthenticated(),
            sessionId: this.getSessionId(),
            sessionValid: this.validateSession(),
            sessionTimeout: this.config.sessionTimeout,
            sessionStart: sessionStorage.getItem('sessionStart')
        };
    }

    /**
     * Clean up rate limiting data (call periodically)
     */
    cleanupRateLimits() {
        const now = Date.now();
        for (const [key, data] of this.rateLimits.entries()) {
            if (now > data.resetTime) {
                this.rateLimits.delete(key);
            }
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthenticationManager;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
    window.AuthenticationManager = AuthenticationManager;
}