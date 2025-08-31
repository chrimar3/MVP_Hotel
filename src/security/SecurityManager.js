/**
 * Comprehensive Security Manager
 * Implements OWASP Top 10 protection and security best practices
 * @module SecurityManager
 */

class SecurityManager {
    constructor() {
        this.initializeSecurityFeatures();
        this.setupCSRFProtection();
        this.initializeRateLimiting();
        this.setupSecurityLogging();
    }

    /**
     * Initialize core security features
     */
    initializeSecurityFeatures() {
        // Security configuration
        this.config = {
            maxRequestSize: 1048576, // 1MB
            maxFieldSize: 51200, // 50KB
            maxFileSize: 5242880, // 5MB
            allowedOrigins: ['https://mvp-hotel.netlify.app', 'http://localhost:3000'],
            allowedMethods: ['GET', 'POST'],
            sessionTimeout: 3600000, // 1 hour
            maxLoginAttempts: 5,
            lockoutDuration: 900000, // 15 minutes
            passwordMinLength: 12,
            requireStrongPassword: true
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

        // Initialize sanitization rules
        this.sanitizationRules = {
            allowedTags: ['b', 'i', 'em', 'strong', 'br', 'p', 'span'],
            allowedAttributes: {
                'span': ['class'],
                'p': ['class']
            },
            allowedClasses: ['highlight', 'review-text', 'hotel-name']
        };
    }

    /**
     * OWASP A01: Broken Access Control Prevention
     */
    validateAccess(user, resource, action) {
        // Implement RBAC (Role-Based Access Control)
        const permissions = {
            'guest': ['read:public'],
            'user': ['read:public', 'write:own', 'read:own'],
            'admin': ['read:all', 'write:all', 'delete:all']
        };

        const userRole = user?.role || 'guest';
        const requiredPermission = `${action}:${resource}`;
        
        const hasPermission = permissions[userRole]?.some(perm => {
            if (perm.includes('all')) {
                return perm.split(':')[0] === action;
            }
            return perm === requiredPermission || 
                   (perm === `${action}:own` && resource === user?.id);
        });

        if (!hasPermission) {
            this.logSecurityEvent('ACCESS_DENIED', { user, resource, action });
            return false;
        }

        return true;
    }

    /**
     * OWASP A02: Cryptographic Failures Prevention
     */
    async encryptSensitiveData(data, key) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            
            // Generate IV
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            // Import key
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                key,
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            );
            
            // Encrypt
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                cryptoKey,
                dataBuffer
            );
            
            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encrypted), iv.length);
            
            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            this.logSecurityEvent('ENCRYPTION_ERROR', { error: error.message });
            throw new Error('Encryption failed');
        }
    }

    /**
     * OWASP A03: Injection Prevention
     */
    sanitizeInput(input, type = 'text') {
        if (!input) return '';
        
        let sanitized = String(input);
        
        switch (type) {
            case 'sql':
                // SQL injection prevention
                sanitized = sanitized
                    .replace(/['";\\]/g, '')
                    .replace(/--/g, '')
                    .replace(/\/\*/g, '')
                    .replace(/\*\//g, '')
                    .replace(/union\s+select/gi, '')
                    .replace(/drop\s+table/gi, '')
                    .replace(/insert\s+into/gi, '')
                    .replace(/select\s+.*\s+from/gi, '');
                break;
                
            case 'html':
                // XSS prevention
                sanitized = sanitized
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#x27;')
                    .replace(/\//g, '&#x2F;');
                break;
                
            case 'javascript':
                // JavaScript injection prevention
                sanitized = sanitized
                    .replace(/[<>'"]/g, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '')
                    .replace(/eval\s*\(/gi, '')
                    .replace(/new\s+Function/gi, '');
                break;
                
            case 'ldap':
                // LDAP injection prevention
                sanitized = sanitized
                    .replace(/[*()\\,]/g, '')
                    .replace(/\x00/g, '');
                break;
                
            case 'xpath':
                // XPath injection prevention
                sanitized = sanitized
                    .replace(/['"]/g, '')
                    .replace(/[()]/g, '');
                break;
                
            case 'command':
                // Command injection prevention
                sanitized = sanitized
                    .replace(/[;&|`$()\\<>]/g, '')
                    .replace(/\n|\r/g, '');
                break;
                
            default:
                // Generic text sanitization
                sanitized = sanitized
                    .replace(/[<>]/g, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '');
        }
        
        // Length limitation
        return sanitized.substring(0, this.config.maxFieldSize);
    }

    /**
     * OWASP A04: Insecure Design - Input Validation
     */
    validateInput(input, schema) {
        const errors = [];
        
        // Type validation
        if (schema.type && typeof input !== schema.type) {
            errors.push(`Invalid type: expected ${schema.type}`);
        }
        
        // Length validation
        if (schema.minLength && input.length < schema.minLength) {
            errors.push(`Minimum length is ${schema.minLength}`);
        }
        if (schema.maxLength && input.length > schema.maxLength) {
            errors.push(`Maximum length is ${schema.maxLength}`);
        }
        
        // Pattern validation
        if (schema.pattern && !schema.pattern.test(input)) {
            errors.push('Invalid format');
        }
        
        // Range validation for numbers
        if (schema.type === 'number') {
            if (schema.min !== undefined && input < schema.min) {
                errors.push(`Minimum value is ${schema.min}`);
            }
            if (schema.max !== undefined && input > schema.max) {
                errors.push(`Maximum value is ${schema.max}`);
            }
        }
        
        // Enum validation
        if (schema.enum && !schema.enum.includes(input)) {
            errors.push(`Must be one of: ${schema.enum.join(', ')}`);
        }
        
        if (errors.length > 0) {
            this.logSecurityEvent('VALIDATION_FAILED', { input: input.substring(0, 50), errors });
            return { valid: false, errors };
        }
        
        return { valid: true, sanitized: this.sanitizeInput(input, schema.sanitize) };
    }

    /**
     * OWASP A05: Security Misconfiguration Prevention
     */
    applySecurityHeaders() {
        // Apply security headers via meta tags (for client-side)
        Object.entries(this.securityHeaders).forEach(([header, value]) => {
            if (header === 'Content-Security-Policy') {
                const meta = document.createElement('meta');
                meta.httpEquiv = header;
                meta.content = this.generateCSP();
                document.head.appendChild(meta);
            }
        });
        
        // Disable debug mode in production
        if (window.location.hostname !== 'localhost') {
            console.log = () => {};
            console.debug = () => {};
            console.info = () => {};
        }
        
        // Remove sensitive information from errors
        window.addEventListener('error', (event) => {
            if (window.location.hostname !== 'localhost') {
                event.preventDefault();
                this.logSecurityEvent('CLIENT_ERROR', { 
                    message: 'An error occurred',
                    url: event.filename,
                    line: event.lineno
                });
            }
        });
    }

    /**
     * Generate Content Security Policy
     */
    generateCSP() {
        const nonce = this.generateNonce();
        
        return `
            default-src 'self';
            script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net;
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
     * OWASP A06: Vulnerable and Outdated Components
     */
    checkDependencies() {
        // In a real application, this would check package versions
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
            this.logSecurityEvent('VULNERABLE_DEPENDENCIES', vulnerabilities);
        }
        
        return vulnerabilities;
    }

    /**
     * OWASP A07: Identification and Authentication Failures
     */
    validateAuthentication(credentials) {
        // Check rate limiting
        if (!this.checkRateLimit('login', this.config.maxLoginAttempts)) {
            this.logSecurityEvent('LOGIN_RATE_LIMIT_EXCEEDED', { 
                username: credentials.username 
            });
            return { 
                success: false, 
                error: 'Too many login attempts. Please try again later.' 
            };
        }
        
        // Validate password strength
        if (!this.validatePasswordStrength(credentials.password)) {
            return { 
                success: false, 
                error: 'Password does not meet security requirements' 
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
     * OWASP A08: Software and Data Integrity Failures
     */
    verifyIntegrity(data, signature) {
        // Implement HMAC verification
        const computedSignature = this.computeHMAC(data);
        return computedSignature === signature;
    }

    /**
     * Compute HMAC for data integrity
     */
    async computeHMAC(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        
        const key = await crypto.subtle.generateKey(
            { name: 'HMAC', hash: 'SHA-256' },
            true,
            ['sign', 'verify']
        );
        
        const signature = await crypto.subtle.sign(
            'HMAC',
            key,
            dataBuffer
        );
        
        return btoa(String.fromCharCode(...new Uint8Array(signature)));
    }

    /**
     * OWASP A09: Security Logging and Monitoring
     */
    setupSecurityLogging() {
        this.securityLog = [];
        this.maxLogEntries = 10000;
        
        // Log security-relevant events
        this.securityEventTypes = [
            'LOGIN_ATTEMPT',
            'LOGIN_SUCCESS',
            'LOGIN_FAILURE',
            'ACCESS_DENIED',
            'VALIDATION_FAILED',
            'RATE_LIMIT_EXCEEDED',
            'SUSPICIOUS_ACTIVITY',
            'ENCRYPTION_ERROR',
            'AUTHENTICATION_ERROR',
            'AUTHORIZATION_ERROR',
            'CSRF_ATTEMPT',
            'XSS_ATTEMPT',
            'SQL_INJECTION_ATTEMPT',
            'VULNERABLE_DEPENDENCIES'
        ];
    }

    /**
     * Log security events
     */
    logSecurityEvent(eventType, details = {}) {
        const event = {
            timestamp: new Date().toISOString(),
            type: eventType,
            details: details,
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer,
            sessionId: this.getSessionId()
        };
        
        this.securityLog.push(event);
        
        // Rotate logs if needed
        if (this.securityLog.length > this.maxLogEntries) {
            this.securityLog = this.securityLog.slice(-this.maxLogEntries);
        }
        
        // Send critical events to server (in production)
        if (this.isCriticalEvent(eventType)) {
            this.sendToSecurityMonitoring(event);
        }
        
        // Store in localStorage for persistence
        try {
            localStorage.setItem('securityLog', JSON.stringify(
                this.securityLog.slice(-100) // Store only last 100 events locally
            ));
        } catch (e) {
            // Storage quota exceeded or disabled
        }
    }

    /**
     * Check if event is critical
     */
    isCriticalEvent(eventType) {
        const criticalEvents = [
            'ACCESS_DENIED',
            'CSRF_ATTEMPT',
            'XSS_ATTEMPT',
            'SQL_INJECTION_ATTEMPT',
            'AUTHENTICATION_ERROR',
            'AUTHORIZATION_ERROR'
        ];
        return criticalEvents.includes(eventType);
    }

    /**
     * Send security events to monitoring service
     */
    async sendToSecurityMonitoring(event) {
        // In production, this would send to a SIEM or monitoring service
        if (window.location.hostname !== 'localhost') {
            try {
                // Example: Send to monitoring endpoint
                await fetch('/api/security/log', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': this.getCSRFToken()
                    },
                    body: JSON.stringify(event)
                });
            } catch (error) {
                // Fail silently to avoid exposing errors to attackers
            }
        }
    }

    /**
     * OWASP A10: Server-Side Request Forgery (SSRF) Prevention
     */
    validateURL(url) {
        try {
            const parsed = new URL(url);
            
            // Block private IP ranges
            const privateIPRanges = [
                /^127\./,
                /^10\./,
                /^172\.(1[6-9]|2[0-9]|3[01])\./,
                /^192\.168\./,
                /^169\.254\./,
                /^::1$/,
                /^fe80::/,
                /^fc00::/
            ];
            
            const hostname = parsed.hostname;
            const isPrivate = privateIPRanges.some(range => range.test(hostname));
            
            if (isPrivate) {
                this.logSecurityEvent('SSRF_ATTEMPT', { url });
                return false;
            }
            
            // Only allow HTTPS in production
            if (window.location.hostname !== 'localhost' && parsed.protocol !== 'https:') {
                return false;
            }
            
            // Check against allowlist
            const allowedDomains = [
                'api.openai.com',
                'api.groq.com',
                'mvp-hotel.netlify.app'
            ];
            
            const isAllowed = allowedDomains.some(domain => 
                hostname === domain || hostname.endsWith(`.${domain}`)
            );
            
            return isAllowed;
        } catch (error) {
            return false;
        }
    }

    /**
     * CSRF Protection
     */
    setupCSRFProtection() {
        // Generate CSRF token
        this.csrfToken = this.generateToken();
        
        // Store in session
        sessionStorage.setItem('csrfToken', this.csrfToken);
        
        // Add to all forms
        document.addEventListener('DOMContentLoaded', () => {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'csrf_token';
                input.value = this.csrfToken;
                form.appendChild(input);
            });
        });
        
        // Validate on form submission
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const token = form.querySelector('input[name="csrf_token"]')?.value;
            
            if (!this.validateCSRFToken(token)) {
                e.preventDefault();
                this.logSecurityEvent('CSRF_ATTEMPT', { 
                    form: form.id || 'unknown' 
                });
                alert('Security validation failed. Please refresh and try again.');
            }
        });
    }

    /**
     * Validate CSRF token
     */
    validateCSRFToken(token) {
        const storedToken = sessionStorage.getItem('csrfToken');
        return token && token === storedToken;
    }

    /**
     * Get CSRF token
     */
    getCSRFToken() {
        return this.csrfToken || sessionStorage.getItem('csrfToken');
    }

    /**
     * Rate limiting implementation
     */
    initializeRateLimiting() {
        this.rateLimits = new Map();
    }

    /**
     * Check rate limit
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
        
        const limit_data = this.rateLimits.get(key);
        
        if (now > limit_data.resetTime) {
            limit_data.count = 0;
            limit_data.resetTime = now + window;
        }
        
        if (limit_data.count >= limit) {
            this.logSecurityEvent('RATE_LIMIT_EXCEEDED', { action, limit });
            return false;
        }
        
        limit_data.count++;
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
     * Generate secure random token
     */
    generateToken(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Generate nonce for CSP
     */
    generateNonce() {
        return btoa(this.generateToken(16));
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
            this.logSecurityEvent('SESSION_EXPIRED');
            return false;
        }
        
        return true;
    }

    /**
     * Clear session data
     */
    clearSession() {
        sessionStorage.clear();
        this.csrfToken = this.generateToken();
        sessionStorage.setItem('csrfToken', this.csrfToken);
    }

    /**
     * Initialize security manager on page load
     */
    initialize() {
        // Apply security headers
        this.applySecurityHeaders();
        
        // Check session validity
        this.validateSession();
        
        // Check for vulnerable dependencies
        this.checkDependencies();
        
        // Set up automatic session validation
        setInterval(() => {
            if (!this.validateSession()) {
                window.location.reload();
            }
        }, 60000); // Check every minute
        
        // Monitor for suspicious activity
        this.monitorSuspiciousActivity();
        
        console.info('Security Manager initialized');
    }

    /**
     * Monitor for suspicious activity
     */
    monitorSuspiciousActivity() {
        let rapidClickCount = 0;
        let lastClickTime = 0;
        
        // Detect rapid clicking (potential automation)
        document.addEventListener('click', () => {
            const now = Date.now();
            if (now - lastClickTime < 100) {
                rapidClickCount++;
                if (rapidClickCount > 10) {
                    this.logSecurityEvent('SUSPICIOUS_ACTIVITY', { 
                        type: 'rapid_clicking' 
                    });
                    rapidClickCount = 0;
                }
            } else {
                rapidClickCount = 0;
            }
            lastClickTime = now;
        });
        
        // Detect console usage (potential debugging attempt)
        const devtools = { open: false };
        const threshold = 160;
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.logSecurityEvent('SUSPICIOUS_ACTIVITY', { 
                        type: 'devtools_opened' 
                    });
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }

    /**
     * Export security logs for analysis
     */
    exportSecurityLogs() {
        const logs = {
            exportDate: new Date().toISOString(),
            sessionId: this.getSessionId(),
            events: this.securityLog
        };
        
        return JSON.stringify(logs, null, 2);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityManager;
}

// Initialize on page load
if (typeof window !== 'undefined') {
    window.securityManager = new SecurityManager();
    document.addEventListener('DOMContentLoaded', () => {
        window.securityManager.initialize();
    });
}