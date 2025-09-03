/**
 * Security Modules Index
 * Main entry point for all security components
 */

// Import all security modules
const SecurityManager = typeof require !== 'undefined' ? require('./SecurityManager') : window.SecurityManagerCore;
const AuthenticationManager = typeof require !== 'undefined' ? require('./AuthenticationManager') : window.AuthenticationManager;
const ValidationManager = typeof require !== 'undefined' ? require('./ValidationManager') : window.ValidationManager;
const SecurityHeaders = typeof require !== 'undefined' ? require('./SecurityHeaders') : window.SecurityHeaders;
const SecurityLogger = typeof require !== 'undefined' ? require('./SecurityLogger') : window.SecurityLogger;
const CryptoUtils = typeof require !== 'undefined' ? require('./CryptoUtils') : window.CryptoUtils;

// Export all components
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SecurityManager,
        AuthenticationManager,
        ValidationManager,
        SecurityHeaders,
        SecurityLogger,
        CryptoUtils,
        // For backward compatibility, export SecurityManager as default
        default: SecurityManager,
    };
}

// For browser compatibility
if (typeof window !== 'undefined') {
    window.SecurityModule = {
        SecurityManager,
        AuthenticationManager,
        ValidationManager,
        SecurityHeaders,
        SecurityLogger,
        CryptoUtils,
    };
}