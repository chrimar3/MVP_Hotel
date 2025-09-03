/**
 * Performance Monitor - Main Entry Point (Backward Compatible Wrapper)
 *
 * This is a backward-compatible wrapper that imports from the modular structure
 * while maintaining the same API surface for existing consumers. The actual
 * implementation is in ./performance-modules/PerformanceMonitor.js.
 *
 * @class PerformanceMonitor
 * @since 2.0.0
 * @author Hotel Review Generator Team
 *
 * @example
 * // Usage remains the same as before
 * const monitor = new PerformanceMonitor();
 *
 * // Or use the global instance
 * window.performanceMonitor.mark('operation-start');
 * window.performanceMonitor.measure('operation', 'operation-start');
 */

// Import the modular PerformanceMonitor
const PerformanceModule = typeof require !== 'undefined'
    ? require('./performance-modules')
    : (typeof window !== 'undefined' ? window.PerformanceModule : {});

// Get the main PerformanceMonitor class
const { PerformanceMonitor: PerformanceMonitorCore } = PerformanceModule;

// Create wrapper class for backward compatibility
class PerformanceMonitor extends PerformanceMonitorCore {
    constructor() {
        super();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}

// Auto-initialize in browser for backward compatibility
if (typeof window !== 'undefined') {
    window.PerformanceMonitor = PerformanceMonitor;
    window.performanceMonitor = new PerformanceMonitor();
}