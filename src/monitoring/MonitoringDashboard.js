/**
 * Monitoring Dashboard - Main Entry Point
 * This is a backward-compatible wrapper that imports from the modular structure
 */

// Import dashboard modules
const DashboardUI = typeof require !== 'undefined' ? require('./dashboard-modules/DashboardUI') : window.DashboardUI;

class MonitoringDashboard {
    constructor(containerId = 'monitoring-dashboard') {
        this.containerId = containerId;
        this.isVisible = false;
        this.refreshInterval = null;
        this.alertHistory = [];

        // Initialize UI
        this.ui = new DashboardUI(containerId);

        this.thresholds = {
            LCP: { good: 2500, poor: 4000 },
            FID: { good: 100, poor: 300 },
            CLS: { good: 0.1, poor: 0.25 },
            FCP: { good: 1800, poor: 3000 },
            TTI: { good: 3800, poor: 7300 }
        };

        // Only initialize in development or when explicitly enabled
        if (this.shouldInitialize()) {
            this.initialize();
        }
    }

    /**
     * Check if dashboard should be initialized
     */
    shouldInitialize() {
        const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
        const isDebugMode = typeof localStorage !== 'undefined' && localStorage.getItem('perf-debug') === 'true';
        const hasQueryParam = typeof window !== 'undefined' && window.location.search.includes('perf-debug');

        return isDev || isDebugMode || hasQueryParam;
    }

    /**
     * Initialize the monitoring dashboard
     */
    initialize() {
        this.ui.createDashboardHTML();
        this.attachEventListeners();
        this.startMonitoring();

        // Development-only logging
        if (this.shouldInitialize()) {
            console.info('🚀 Performance Monitoring Dashboard initialized');
            console.info('Toggle with Ctrl+Shift+P or click the floating button');
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Toggle dashboard
        this.ui.addClickHandler('perf-monitor-toggle', () => this.toggle());
        this.ui.addClickHandler('close-dashboard', () => this.hide());

        // Action buttons
        this.ui.addClickHandler('refresh-metrics', () => this.refreshMetrics());
        this.ui.addClickHandler('clear-cache', () => this.clearCache());
        this.ui.addClickHandler('export-data', () => this.exportData());
        this.ui.addClickHandler('toggle-auto-refresh', () => this.toggleAutoRefresh());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    /**
     * Start monitoring and auto-refresh
     */
    startMonitoring() {
        this.refreshMetrics();
        this.refreshInterval = setInterval(() => {
            if (this.isVisible) {
                this.refreshMetrics();
            }
        }, 5000);
    }

    /**
     * Toggle dashboard visibility
     */
    toggle() {
        this.ui.toggle();
        this.isVisible = !this.isVisible;
    }

    /**
     * Show dashboard
     */
    show() {
        this.ui.show();
        this.isVisible = true;
        this.refreshMetrics();
    }

    /**
     * Hide dashboard
     */
    hide() {
        this.ui.hide();
        this.isVisible = false;
    }

    /**
     * Refresh all metrics
     */
    refreshMetrics() {
        // Get performance data from global monitors if available
        if (typeof window !== 'undefined' && window.performanceMonitor) {
            const metrics = window.performanceMonitor.getMetrics();
            this.updateAllSections(metrics);
        } else {
            this.ui.updateSection('vitals-content', '<p style="color: #666;">Performance monitor not available</p>');
        }
    }

    /**
     * Update all dashboard sections
     */
    updateAllSections(metrics) {
        if (metrics.webVitals) {
            this.updateVitalsDisplay(metrics.webVitals.vitals);
            this.updatePerformanceScore(metrics);
        }

        if (metrics.resources) {
            this.updateResourceTiming(metrics.resources.summary);
            this.updateNavigationTiming(metrics.resources.navigation);
        }

        this.updateSystemInfo();
    }

    /**
     * Update vitals display
     */
    updateVitalsDisplay(vitals) {
        if (!vitals) return;

        const vitalsHtml = Object.entries(vitals)
            .filter(([, value]) => value !== null)
            .map(([key, value]) => {
                const status = this.getMetricStatus(key, value);
                const statusClass = `status-${status}`;

                return `
                    <div class="metric-item">
                        <span>${key}</span>
                        <span class="metric-value ${statusClass}">
                            ${this.formatMetricValue(key, value)}
                        </span>
                    </div>
                `;
            }).join('');

        this.ui.updateSection('vitals-content', vitalsHtml || '<p style="color: #666;">Collecting metrics...</p>');
    }

    /**
     * Clear performance cache
     */
    clearCache() {
        if (typeof window !== 'undefined' && window.performanceMonitor) {
            // Clear browser performance cache
            if (performance.clearResourceTimings) {
                performance.clearResourceTimings();
            }
            this.ui.showNotification('Performance cache cleared', 'success');
            this.refreshMetrics();
        }
    }

    /**
     * Export performance data
     */
    exportData() {
        if (typeof window !== 'undefined' && window.performanceMonitor) {
            const data = window.performanceMonitor.getMetrics();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `performance-data-${Date.now()}.json`;
            a.click();

            URL.revokeObjectURL(url);
            this.ui.showNotification('Performance data exported', 'success');
        }
    }

    /**
     * Toggle auto-refresh
     */
    toggleAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            this.ui.showNotification('Auto-refresh paused', 'info');
        } else {
            this.startMonitoring();
            this.ui.showNotification('Auto-refresh resumed', 'info');
        }
    }

    /**
     * Helper methods for metric formatting and status
     */
    getMetricStatus(metric, value) {
        const thresholds = this.thresholds[metric];
        if (!thresholds) return 'good';

        if (metric === 'CLS') {
            if (value <= 0.1) return 'good';
            if (value <= 0.25) return 'needs-improvement';
            return 'poor';
        } else {
            if (value <= thresholds.good) return 'good';
            if (value <= thresholds.poor) return 'needs-improvement';
            return 'poor';
        }
    }

    formatMetricValue(metric, value) {
        if (metric === 'CLS') {
            return value.toFixed(3);
        }
        return `${Math.round(value)}ms`;
    }

    updatePerformanceScore(metrics) {
        const score = metrics.overallScore || 0;
        const scoreColor = score >= 90 ? '#28a745' : score >= 50 ? '#ffc107' : '#dc3545';
        const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 50 ? 'C' : score >= 25 ? 'D' : 'F';

        this.ui.updateSection('score-content', `
            <div style="text-align: center;">
                <div style="font-size: 48px; font-weight: bold; color: ${scoreColor}; margin-bottom: 10px;">
                    ${score}
                </div>
                <div style="font-size: 24px; color: ${scoreColor}; margin-bottom: 15px;">
                    Grade: ${grade}
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${score}%; background: ${scoreColor};"></div>
                </div>
            </div>
        `);
    }

    updateResourceTiming(summary) {
        if (!summary) return;

        this.ui.updateSection('resource-content', `
            <div class="metric-item">
                <span>Total Resources</span>
                <span class="metric-value">${summary.total || 0}</span>
            </div>
            <div class="metric-item">
                <span>Cache Hit Rate</span>
                <span class="metric-value status-${(summary.cacheHitRate || 0) > 50 ? 'good' : 'poor'}">
                    ${summary.cacheHitRate || 0}%
                </span>
            </div>
        `);
    }

    updateNavigationTiming(navigation) {
        if (!navigation) return;

        this.ui.updateSection('navigation-content', `
            <div class="metric-item">
                <span>TTFB</span>
                <span class="metric-value">${navigation.ttfb || 0}ms</span>
            </div>
            <div class="metric-item">
                <span>DOM Complete</span>
                <span class="metric-value">${navigation.domComplete || 0}ms</span>
            </div>
        `);
    }

    updateSystemInfo() {
        this.ui.updateSection('system-content', `
            <div class="metric-item">
                <span>User Agent</span>
                <span class="metric-value" style="font-size: 10px;">${navigator.userAgent.substring(0, 50)}...</span>
            </div>
            <div class="metric-item">
                <span>Viewport</span>
                <span class="metric-value">${window.innerWidth}x${window.innerHeight}</span>
            </div>
        `);
    }

    /**
     * Destroy dashboard
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        this.ui.destroy();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MonitoringDashboard;
}

// Auto-initialize in development
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.monitoringDashboard = new MonitoringDashboard();
    });
}