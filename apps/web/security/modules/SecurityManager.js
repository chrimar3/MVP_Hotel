/**
 * Main Security Manager
 * Orchestrates all security modules and provides unified security interface
 */

// Import security modules
const AuthenticationManager = typeof require !== 'undefined' ? require('./AuthenticationManager') : window.AuthenticationManager;
const ValidationManager = typeof require !== 'undefined' ? require('./ValidationManager') : window.ValidationManager;
const SecurityHeaders = typeof require !== 'undefined' ? require('./SecurityHeaders') : window.SecurityHeaders;
const SecurityLogger = typeof require !== 'undefined' ? require('./SecurityLogger') : window.SecurityLogger;
const CryptoUtils = typeof require !== 'undefined' ? require('./CryptoUtils') : window.CryptoUtils;

class SecurityManager {
    constructor(config = {}) {
        // Initialize security modules
        this.authManager = new AuthenticationManager(config.authentication || {});
        this.validationManager = new ValidationManager(config.validation || {});
        this.securityHeaders = new SecurityHeaders(config.headers || {});
        this.securityLogger = new SecurityLogger(config.logging || {});
        this.cryptoUtils = new CryptoUtils();

        // CSRF protection
        this.csrfToken = this.cryptoUtils.generateToken();
        this.setupCSRFProtection();

        // Initialize
        this.initialize();
    }

    /**
     * Initialize the security manager
     */
    initialize() {
        // Apply security headers
        this.securityHeaders.initialize();

        // Check session validity
        this.validateSession();

        // Check for vulnerable dependencies
        this.checkDependencies();

        // Set up automatic session validation
        this.setupSessionMonitoring();

        // Log initialization
        this.securityLogger.logSecurityEvent('SECURITY_MANAGER_INITIALIZED');

        // Log initialization only in development
        if (window.location.hostname === 'localhost') {
            console.info('Security Manager initialized with all modules');
        }
    }

    /**
     * Setup session monitoring
     */
    setupSessionMonitoring() {
        setInterval(() => {
            if (!this.validateSession()) {
                this.securityLogger.logSecurityEvent('SESSION_EXPIRED');
                this.handleSessionExpiration();
            }
        }, 60000); // Check every minute
    }

    /**
     * Handle session expiration
     */
    handleSessionExpiration() {
        this.clearSession();
        // In a real app, redirect to login or show notification
        if (typeof window.onSessionExpired === 'function') {
            window.onSessionExpired();
        }
    }

    /**
     * CSRF Protection
     */
    setupCSRFProtection() {
        // Store CSRF token in session
        sessionStorage.setItem('csrfToken', this.csrfToken);

        // Add to all forms when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.addCSRFTokensToForms());
        } else {
            this.addCSRFTokensToForms();
        }

        // Validate on form submission
        document.addEventListener('submit', (e) => this.validateFormSubmission(e));
    }

    /**
     * Add CSRF tokens to all forms
     */
    addCSRFTokensToForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            // Check if token already exists
            if (!form.querySelector('input[name="csrf_token"]')) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'csrf_token';
                input.value = this.csrfToken;
                form.appendChild(input);
            }
        });
    }

    /**
     * Validate form submission
     */
    validateFormSubmission(event) {
        const form = event.target;
        const token = form.querySelector('input[name="csrf_token"]')?.value;

        if (!this.validateCSRFToken(token)) {
            event.preventDefault();
            this.securityLogger.logSecurityEvent('CSRF_ATTEMPT', {
                form: form.id || 'unknown'
            });
            alert('Security validation failed. Please refresh and try again.');
        }
    }

    // ==================== Authentication Methods ====================

    /**
     * Validate user authentication
     */
    validateAuthentication(credentials) {
        const result = this.authManager.validateAuthentication(credentials);

        if (result.reason === 'RATE_LIMIT_EXCEEDED') {
            this.securityLogger.logSecurityEvent('LOGIN_RATE_LIMIT_EXCEEDED', {
                username: credentials.username
            });
        }

        return result;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.authManager.isAuthenticated();
    }

    /**
     * Start authentication session
     */
    startSession() {
        const sessionId = this.authManager.startSession();
        this.securityLogger.logSecurityEvent('SESSION_STARTED', { sessionId });
        return sessionId;
    }

    /**
     * Validate current session
     */
    validateSession() {
        return this.authManager.validateSession();
    }

    /**
     * Clear session data
     */
    clearSession() {
        this.authManager.clearSession();
        this.csrfToken = this.cryptoUtils.generateToken();
        sessionStorage.setItem('csrfToken', this.csrfToken);
        this.securityLogger.logSecurityEvent('SESSION_CLEARED');
    }

    // ==================== Validation Methods ====================

    /**
     * Validate access control
     */
    validateAccess(user, resource, action) {
        const hasAccess = this.validationManager.validateAccess(user, resource, action);

        if (!hasAccess) {
            this.securityLogger.logSecurityEvent('ACCESS_DENIED', { user, resource, action });
        }

        return hasAccess;
    }

    /**
     * Sanitize user input
     */
    sanitizeInput(input, type = 'text') {
        return this.validationManager.sanitizeInput(input, type);
    }

    /**
     * Validate input against schema
     */
    validateInput(input, schema) {
        const result = this.validationManager.validateInput(input, schema);

        if (!result.valid) {
            this.securityLogger.logSecurityEvent('VALIDATION_FAILED', {
                input: input.substring(0, 50),
                errors: result.errors
            });
        }

        return result;
    }

    /**
     * Validate URL for SSRF prevention
     */
    validateURL(url) {
        const isValid = this.validationManager.validateURL(url);

        if (!isValid) {
            this.securityLogger.logSecurityEvent('SSRF_ATTEMPT', { url });
        }

        return isValid;
    }

    /**
     * Validate form data
     */
    validateForm(formData, schemaName) {
        return this.validationManager.validateForm(formData, schemaName);
    }

    // ==================== Cryptography Methods ====================

    /**
     * Encrypt sensitive data
     */
    async encryptSensitiveData(data, key) {
        try {
            return await this.cryptoUtils.encryptSensitiveData(data, key);
        } catch (error) {
            this.securityLogger.logSecurityEvent('ENCRYPTION_ERROR', { error: error.message });
            throw error;
        }
    }

    /**
     * Compute HMAC for data integrity
     */
    async computeHMAC(data, key) {
        return this.cryptoUtils.computeHMAC(data, key);
    }

    /**
     * Verify data integrity
     */
    async verifyIntegrity(data, signature, key) {
        return this.cryptoUtils.verifyHMAC(data, signature, key);
    }

    /**
     * Generate secure token
     */
    generateToken(length = 32) {
        return this.cryptoUtils.generateToken(length);
    }

    // ==================== CSRF Protection ====================

    /**
     * Validate CSRF token
     */
    validateCSRFToken(token) {
        const storedToken = sessionStorage.getItem('csrfToken');
        return this.cryptoUtils.constantTimeCompare(token || '', storedToken || '');
    }

    /**
     * Get CSRF token
     */
    getCSRFToken() {
        return this.csrfToken || sessionStorage.getItem('csrfToken');
    }

    /**
     * Refresh CSRF token
     */
    refreshCSRFToken() {
        this.csrfToken = this.cryptoUtils.generateToken();
        sessionStorage.setItem('csrfToken', this.csrfToken);
        this.addCSRFTokensToForms();
        return this.csrfToken;
    }

    // ==================== Security Headers ====================

    /**
     * Get security nonce for inline scripts
     */
    getSecurityNonce() {
        return this.securityHeaders.getNonce();
    }

    /**
     * Create secure script element
     */
    createSecureScript(src, content) {
        return this.securityHeaders.createSecureScript(src, content);
    }

    // ==================== Monitoring and Logging ====================

    /**
     * Log security event
     */
    logSecurityEvent(eventType, details = {}) {
        return this.securityLogger.logSecurityEvent(eventType, details);
    }

    /**
     * Get security logs
     */
    getSecurityLogs(filter = {}) {
        return this.securityLogger.getSecurityLogs(filter);
    }

    /**
     * Get security statistics
     */
    getSecurityStats() {
        return this.securityLogger.getSecurityStats();
    }

    /**
     * Export security logs
     */
    exportSecurityLogs() {
        return this.securityLogger.exportSecurityLogs();
    }

    // ==================== Dependency Checking ====================

    /**
     * Check for vulnerable dependencies
     */
    checkDependencies() {
        const vulnerabilities = [];

        // Check for known vulnerable versions (example)
        if (typeof DOMPurify !== 'undefined' && DOMPurify.version < '2.4.0') {
            vulnerabilities.push({
                package: 'DOMPurify',
                severity: 'medium',
                recommendation: 'Update to version 2.4.0 or higher'
            });
        }

        if (vulnerabilities.length > 0) {
            this.securityLogger.logSecurityEvent('VULNERABLE_DEPENDENCIES', vulnerabilities);
        }

        return vulnerabilities;
    }

    // ==================== Utility Methods ====================

    /**
     * Get comprehensive security status
     */
    getSecurityStatus() {
        return {
            authentication: this.authManager.getAuthStatus(),
            session: {
                valid: this.validateSession(),
                csrfToken: !!this.getCSRFToken()
            },
            crypto: this.cryptoUtils.getCryptoCapabilities(),
            vulnerabilities: this.checkDependencies(),
            logs: this.getSecurityStats(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Perform security health check
     */
    performHealthCheck() {
        const results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            checks: []
        };

        // Check 1: Session validation
        const sessionValid = this.validateSession();
        results.checks.push({
            name: 'Session Validation',
            status: sessionValid ? 'passed' : 'failed',
            message: sessionValid ? 'Session is valid' : 'Session validation failed'
        });
        if (sessionValid) {
            results.passed++;
        } else {
            results.failed++;
        }

        // Check 2: CSRF protection
        const csrfValid = !!this.getCSRFToken();
        results.checks.push({
            name: 'CSRF Protection',
            status: csrfValid ? 'passed' : 'failed',
            message: csrfValid ? 'CSRF token is present' : 'CSRF token missing'
        });
        if (csrfValid) {
            results.passed++;
        } else {
            results.failed++;
        }

        // Check 3: Crypto support
        const cryptoSupported = this.cryptoUtils.isWebCryptoSupported();
        results.checks.push({
            name: 'Crypto Support',
            status: cryptoSupported ? 'passed' : 'failed',
            message: cryptoSupported ? 'Web Crypto API is supported' : 'Web Crypto API not available'
        });
        if (cryptoSupported) {
            results.passed++;
        } else {
            results.failed++;
        }

        // Check 4: Vulnerabilities
        const vulnerabilities = this.checkDependencies();
        results.checks.push({
            name: 'Dependency Security',
            status: vulnerabilities.length === 0 ? 'passed' : 'warning',
            message: vulnerabilities.length === 0 ? 'No known vulnerabilities' : `${vulnerabilities.length} vulnerability(ies) found`
        });
        if (vulnerabilities.length === 0) {
            results.passed++;
        } else {
            results.warnings++;
        }

        return results;
    }

    /**
     * Cleanup and destroy security manager
     */
    destroy() {
        // Stop monitoring
        this.securityLogger.stopMonitoring();

        // Clear intervals and cleanup
        this.authManager.cleanupRateLimits();

        // Log destruction
        this.securityLogger.logSecurityEvent('SECURITY_MANAGER_DESTROYED');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityManager;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
    window.SecurityManagerCore = SecurityManager;
}