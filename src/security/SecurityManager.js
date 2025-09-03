/**
 * Security Manager - Main Entry Point (Backward Compatible Wrapper)
 *
 * This is a backward-compatible wrapper that imports from the modular security
 * structure while maintaining the same API surface for existing consumers.
 * The actual implementation is in ./modules/SecurityManager.js.
 *
 * @class SecurityManager
 * @since 2.0.0
 * @author Hotel Review Generator Team
 *
 * @example
 * // Usage remains the same as before
 * const security = new SecurityManager({
 *   enableCSP: true,
 *   apiRateLimit: { requests: 100, window: 60000 }
 * });
 *
 * // Or use the global instance
 * window.securityManager.validateInput(userInput);
 */

// Import the modular SecurityManager
const SecurityModule = typeof require !== 'undefined'
    ? require('./modules')
    : (typeof window !== 'undefined' ? window.SecurityModule : {});

// Get the main SecurityManager class
const { SecurityManager: SecurityManagerCore } = SecurityModule;

// Create wrapper class for backward compatibility
class SecurityManager extends SecurityManagerCore {
    constructor(config = {}) {
        super(config);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityManager;
}

// Initialize on page load for backward compatibility
if (typeof window !== 'undefined') {
    window.SecurityManager = SecurityManager;

    // Auto-initialize as before
    window.securityManager = new SecurityManager();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Already initialized in constructor
        });
    }
}