/**
 * Validation Manager
 * Handles input validation, sanitization, and access control
 */

class ValidationManager {
    constructor(config = {}) {
        this.config = {
            maxRequestSize: config.maxRequestSize || 1048576, // 1MB
            maxFieldSize: config.maxFieldSize || 51200, // 50KB
            maxFileSize: config.maxFileSize || 5242880, // 5MB
            allowedOrigins: config.allowedOrigins || ['https://mvp-hotel.netlify.app', 'http://localhost:3000'],
            allowedMethods: config.allowedMethods || ['GET', 'POST']
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

        return hasPermission;
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
            return { valid: false, errors };
        }

        return { valid: true, sanitized: this.sanitizeInput(input, schema.sanitize) };
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
     * Validate file upload
     */
    validateFileUpload(file) {
        const errors = [];

        // File size validation
        if (file.size > this.config.maxFileSize) {
            errors.push(`File size exceeds ${this.config.maxFileSize} bytes`);
        }

        // File type validation
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain'
        ];

        if (!allowedTypes.includes(file.type)) {
            errors.push('File type not allowed');
        }

        // File name validation
        const fileName = file.name;
        if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
            errors.push('Invalid file name');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate email format
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    }

    /**
     * Validate phone number format
     */
    validatePhone(phone) {
        const phoneRegex = /^\+?[\d\s\-()]+$/;
        return phoneRegex.test(phone) && phone.length >= 10 && phone.length <= 20;
    }

    /**
     * Validate hotel rating
     */
    validateRating(rating) {
        const numRating = Number(rating);
        return Number.isInteger(numRating) && numRating >= 1 && numRating <= 5;
    }

    /**
     * Common validation schemas
     */
    getValidationSchemas() {
        return {
            hotelName: {
                type: 'string',
                minLength: 1,
                maxLength: 100,
                pattern: /^[a-zA-Z0-9\s\-_&.,]+$/,
                sanitize: 'html'
            },
            rating: {
                type: 'number',
                min: 1,
                max: 5,
                sanitize: 'text'
            },
            reviewText: {
                type: 'string',
                minLength: 10,
                maxLength: 1000,
                sanitize: 'html'
            },
            email: {
                type: 'string',
                minLength: 5,
                maxLength: 254,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                sanitize: 'html'
            },
            password: {
                type: 'string',
                minLength: 12,
                maxLength: 128,
                sanitize: 'text'
            },
            tripType: {
                type: 'string',
                enum: ['business', 'leisure', 'family', 'solo', 'couple'],
                sanitize: 'text'
            }
        };
    }

    /**
     * Bulk validation for form data
     */
    validateForm(formData, schemaName) {
        const schemas = this.getValidationSchemas();
        const results = {};
        let isValid = true;

        for (const [field, value] of Object.entries(formData)) {
            if (schemas[field]) {
                const result = this.validateInput(value, schemas[field]);
                results[field] = result;
                if (!result.valid) {
                    isValid = false;
                }
            }
        }

        return {
            valid: isValid,
            results
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationManager;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
    window.ValidationManager = ValidationManager;
}