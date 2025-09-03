/**
 * Performance Modules Index
 * Main entry point for all performance monitoring components
 */

// Import all performance modules
const PerformanceMonitor = typeof require !== 'undefined' ? require('./PerformanceMonitor') : window.PerformanceMonitorCore;
const WebVitalsTracker = typeof require !== 'undefined' ? require('./WebVitalsTracker') : window.WebVitalsTracker;
const ResourceTracker = typeof require !== 'undefined' ? require('./ResourceTracker') : window.ResourceTracker;
const MetricsCollector = typeof require !== 'undefined' ? require('./MetricsCollector') : window.MetricsCollector;
const PerformanceReporter = typeof require !== 'undefined' ? require('./PerformanceReporter') : window.PerformanceReporter;

// Export all components
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PerformanceMonitor,
        WebVitalsTracker,
        ResourceTracker,
        MetricsCollector,
        PerformanceReporter,
        // For backward compatibility, export PerformanceMonitor as default
        default: PerformanceMonitor,
    };
}

// For browser compatibility
if (typeof window !== 'undefined') {
    window.PerformanceModule = {
        PerformanceMonitor,
        WebVitalsTracker,
        ResourceTracker,
        MetricsCollector,
        PerformanceReporter,
    };
}