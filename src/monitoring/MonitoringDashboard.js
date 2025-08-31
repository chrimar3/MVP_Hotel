/**
 * Real-time Monitoring Dashboard
 * Displays performance metrics and alerts in real-time
 * @module MonitoringDashboard
 */

class MonitoringDashboard {
    constructor(containerId = 'monitoring-dashboard') {
        this.containerId = containerId;
        this.isVisible = false;
        this.refreshInterval = null;
        this.alertHistory = [];
        
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
        const isDev = process.env.NODE_ENV !== 'production';
        const isDebugMode = localStorage.getItem('perf-debug') === 'true';
        const hasQueryParam = window.location.search.includes('perf-debug');
        
        return isDev || isDebugMode || hasQueryParam;
    }

    /**
     * Initialize the monitoring dashboard
     */
    initialize() {
        this.createDashboardHTML();
        this.attachEventListeners();
        this.startMonitoring();
        
        console.log('🚀 Performance Monitoring Dashboard initialized');
        console.log('Toggle with Ctrl+Shift+P or click the floating button');
    }

    /**
     * Create dashboard HTML structure
     */
    createDashboardHTML() {
        // Create floating toggle button
        const toggleButton = document.createElement('div');
        toggleButton.id = 'perf-monitor-toggle';
        toggleButton.innerHTML = '📊';
        toggleButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: #007bff;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10000;
            font-size: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        `;
        
        toggleButton.addEventListener('mouseenter', () => {
            toggleButton.style.transform = 'scale(1.1)';
        });
        
        toggleButton.addEventListener('mouseleave', () => {
            toggleButton.style.transform = 'scale(1)';
        });

        // Create dashboard container
        const dashboard = document.createElement('div');
        dashboard.id = this.containerId;
        dashboard.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.9);
            color: white;
            z-index: 9999;
            display: none;
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        `;

        dashboard.innerHTML = `
            <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
                <header style="display: flex; justify-content: between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #444; padding-bottom: 20px;">
                    <h1 style="margin: 0; color: #007bff; font-size: 24px;">🚀 Performance Monitor</h1>
                    <button id="close-dashboard" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">✕ Close</button>
                </header>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <!-- Core Web Vitals -->
                    <div class="metric-card" id="core-web-vitals">
                        <h2 style="margin-top: 0; color: #28a745;">Core Web Vitals</h2>
                        <div id="vitals-content"></div>
                    </div>
                    
                    <!-- Performance Score -->
                    <div class="metric-card" id="performance-score">
                        <h2 style="margin-top: 0; color: #ffc107;">Performance Score</h2>
                        <div id="score-content"></div>
                    </div>
                    
                    <!-- Resource Timing -->
                    <div class="metric-card" id="resource-timing">
                        <h2 style="margin-top: 0; color: #17a2b8;">Resource Timing</h2>
                        <div id="resource-content"></div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px;">
                    <!-- Navigation Timing -->
                    <div class="metric-card" id="navigation-timing">
                        <h2 style="margin-top: 0; color: #6f42c1;">Navigation Timing</h2>
                        <div id="navigation-content"></div>
                    </div>
                    
                    <!-- Alerts -->
                    <div class="metric-card" id="alerts">
                        <h2 style="margin-top: 0; color: #dc3545;">Recent Alerts</h2>
                        <div id="alerts-content"></div>
                    </div>
                </div>

                <div class="metric-card" style="margin-top: 20px;" id="detailed-metrics">
                    <h2 style="margin-top: 0; color: #6c757d;">Detailed Metrics</h2>
                    <div id="detailed-content"></div>
                </div>
            </div>
        `;

        // Add card styles
        const style = document.createElement('style');
        style.textContent = `
            .metric-card {
                background: #1a1a1a;
                border: 1px solid #444;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.5);
            }
            .metric-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #333;
            }
            .metric-item:last-child {
                border-bottom: none;
            }
            .metric-value {
                font-weight: bold;
                font-size: 16px;
            }
            .status-good { color: #28a745; }
            .status-needs-improvement { color: #ffc107; }
            .status-poor { color: #dc3545; }
            .progress-bar {
                width: 100%;
                height: 20px;
                background: #333;
                border-radius: 10px;
                overflow: hidden;
                margin: 10px 0;
            }
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #28a745, #ffc107, #dc3545);
                transition: width 0.3s ease;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(toggleButton);
        document.body.appendChild(dashboard);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Toggle button
        document.getElementById('perf-monitor-toggle').addEventListener('click', () => {
            this.toggle();
        });

        // Close button
        document.getElementById('close-dashboard').addEventListener('click', () => {
            this.hide();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                this.toggle();
            }
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    /**
     * Start monitoring and refresh dashboard
     */
    startMonitoring() {
        this.refresh();
        this.refreshInterval = setInterval(() => {
            if (this.isVisible) {
                this.refresh();
            }
        }, 1000); // Refresh every second when visible
    }

    /**
     * Toggle dashboard visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Show dashboard
     */
    show() {
        const dashboard = document.getElementById(this.containerId);
        if (dashboard) {
            dashboard.style.display = 'block';
            this.isVisible = true;
            this.refresh();
        }
    }

    /**
     * Hide dashboard
     */
    hide() {
        const dashboard = document.getElementById(this.containerId);
        if (dashboard) {
            dashboard.style.display = 'none';
            this.isVisible = false;
        }
    }

    /**
     * Refresh dashboard content
     */
    refresh() {
        if (!window.performanceMonitor) return;
        
        const metrics = window.performanceMonitor.getMetrics();
        
        this.updateCoreWebVitals(metrics.coreWebVitals);
        this.updatePerformanceScore(metrics.performance);
        this.updateResourceTiming(metrics.resourceTiming);
        this.updateNavigationTiming(metrics.navigationTiming);
        this.updateAlerts();
        this.updateDetailedMetrics(metrics);
    }

    /**
     * Update Core Web Vitals display
     */
    updateCoreWebVitals(vitals) {
        const container = document.getElementById('vitals-content');
        if (!container) return;

        const vitalsHtml = Object.entries(vitals)
            .filter(([key, value]) => value !== null)
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

        container.innerHTML = vitalsHtml || '<p style="color: #666;">Collecting metrics...</p>';
    }

    /**
     * Update performance score display
     */
    updatePerformanceScore(performance) {
        const container = document.getElementById('score-content');
        if (!container || !performance) return;

        const scoreColor = this.getScoreColor(performance.score);
        
        container.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 48px; font-weight: bold; color: ${scoreColor}; margin-bottom: 10px;">
                    ${performance.score}
                </div>
                <div style="font-size: 24px; color: ${scoreColor}; margin-bottom: 15px;">
                    Grade: ${performance.grade}
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${performance.score}%; background: ${scoreColor};"></div>
                </div>
                <div style="font-size: 12px; color: #888; margin-top: 10px;">
                    Based on ${performance.validMetrics} metrics
                </div>
            </div>
        `;
    }

    /**
     * Update resource timing display
     */
    updateResourceTiming(resources) {
        const container = document.getElementById('resource-content');
        if (!container || !resources) return;

        const summary = this.getResourceSummary(resources);
        
        container.innerHTML = `
            <div class="metric-item">
                <span>Total Resources</span>
                <span class="metric-value">${summary.total}</span>
            </div>
            <div class="metric-item">
                <span>Cache Hit Rate</span>
                <span class="metric-value status-${summary.cacheHitRate > 50 ? 'good' : 'poor'}">
                    ${summary.cacheHitRate}%
                </span>
            </div>
            <div class="metric-item">
                <span>Total Size</span>
                <span class="metric-value">${Math.round(summary.totalSize / 1024)} KB</span>
            </div>
            <div style="margin-top: 15px;">
                <strong>By Type:</strong>
                ${Object.entries(summary.types).map(([type, count]) => 
                    `<div style="display: flex; justify-content: space-between; padding: 2px 0;">
                        <span>${type}:</span> <span>${count}</span>
                    </div>`
                ).join('')}
            </div>
        `;
    }

    /**
     * Update navigation timing display
     */
    updateNavigationTiming(navigation) {
        const container = document.getElementById('navigation-content');
        if (!container || !navigation) return;

        container.innerHTML = `
            <div class="metric-item">
                <span>DNS Lookup</span>
                <span class="metric-value">${navigation.dns || 0}ms</span>
            </div>
            <div class="metric-item">
                <span>TCP Connect</span>
                <span class="metric-value">${navigation.tcp || 0}ms</span>
            </div>
            <div class="metric-item">
                <span>TTFB</span>
                <span class="metric-value">${navigation.ttfb || 0}ms</span>
            </div>
            <div class="metric-item">
                <span>Download</span>
                <span class="metric-value">${navigation.download || 0}ms</span>
            </div>
            <div class="metric-item">
                <span>DOM Processing</span>
                <span class="metric-value">${navigation.domProcessing || 0}ms</span>
            </div>
            <div class="metric-item">
                <span>Total Time</span>
                <span class="metric-value status-${navigation.totalTime > 5000 ? 'poor' : 'good'}">
                    ${navigation.totalTime || 0}ms
                </span>
            </div>
        `;
    }

    /**
     * Update alerts display
     */
    updateAlerts() {
        const container = document.getElementById('alerts-content');
        if (!container) return;

        if (this.alertHistory.length === 0) {
            container.innerHTML = '<p style="color: #28a745;">✓ No performance alerts</p>';
            return;
        }

        const recentAlerts = this.alertHistory.slice(-5).reverse();
        
        container.innerHTML = recentAlerts.map(alert => `
            <div style="background: #2d1b1b; border-left: 4px solid #dc3545; padding: 10px; margin: 10px 0; border-radius: 4px;">
                <div style="font-weight: bold; color: #dc3545;">
                    ${alert.metric} Alert
                </div>
                <div style="font-size: 12px; color: #ccc; margin: 5px 0;">
                    Value: ${alert.value} (threshold: ${alert.threshold})
                </div>
                <div style="font-size: 11px; color: #888;">
                    ${new Date(alert.timestamp).toLocaleTimeString()}
                </div>
            </div>
        `).join('');
    }

    /**
     * Update detailed metrics display
     */
    updateDetailedMetrics(metrics) {
        const container = document.getElementById('detailed-content');
        if (!container) return;

        const customMetrics = metrics.customMetrics || {};
        
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                ${Object.entries(customMetrics).map(([key, value]) => `
                    <div style="background: #2a2a2a; padding: 15px; border-radius: 6px;">
                        <div style="font-weight: bold; color: #17a2b8; margin-bottom: 5px;">
                            ${key}
                        </div>
                        <div style="font-size: 14px;">
                            ${this.formatCustomMetric(key, value)}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #2a2a2a; border-radius: 6px;">
                <strong style="color: #17a2b8;">Session Info:</strong>
                <div style="margin-top: 10px; font-family: monospace; font-size: 12px;">
                    Uptime: ${Math.round(metrics.uptime / 1000)}s | 
                    Entries: ${metrics.performanceEntries?.length || 0} |
                    Last Updated: ${new Date().toLocaleTimeString()}
                </div>
            </div>
        `;
    }

    /**
     * Get metric status based on thresholds
     */
    getMetricStatus(metricName, value) {
        const threshold = this.thresholds[metricName];
        if (!threshold) return 'good';

        if (metricName === 'CLS') {
            if (value <= 0.1) return 'good';
            if (value <= 0.25) return 'needs-improvement';
            return 'poor';
        } else {
            if (value <= threshold.good) return 'good';
            if (value <= threshold.poor) return 'needs-improvement';
            return 'poor';
        }
    }

    /**
     * Format metric value for display
     */
    formatMetricValue(metricName, value) {
        if (metricName === 'CLS') {
            return value.toFixed(3);
        } else {
            return `${Math.round(value)}ms`;
        }
    }

    /**
     * Format custom metric for display
     */
    formatCustomMetric(key, value) {
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        } else if (typeof value === 'number') {
            return key.includes('Time') || key.includes('Duration') ? 
                `${Math.round(value)}ms` : value.toString();
        } else {
            return value.toString();
        }
    }

    /**
     * Get score color based on performance score
     */
    getScoreColor(score) {
        if (score >= 90) return '#28a745';
        if (score >= 80) return '#ffc107';
        return '#dc3545';
    }

    /**
     * Get resource summary from resource timing data
     */
    getResourceSummary(resources) {
        if (!resources || !Array.isArray(resources)) {
            return { total: 0, cacheHitRate: 0, totalSize: 0, types: {} };
        }

        const summary = {
            total: resources.length,
            types: {},
            totalSize: 0,
            cached: 0
        };

        resources.forEach(resource => {
            summary.types[resource.type] = (summary.types[resource.type] || 0) + 1;
            summary.totalSize += resource.size || 0;
            if (resource.cached) summary.cached++;
        });

        summary.cacheHitRate = summary.total > 0 ? 
            Math.round((summary.cached / summary.total) * 100) : 0;

        return summary;
    }

    /**
     * Add alert to history
     */
    addAlert(alert) {
        this.alertHistory.push({
            ...alert,
            timestamp: Date.now()
        });

        // Keep only last 20 alerts
        if (this.alertHistory.length > 20) {
            this.alertHistory.shift();
        }
    }

    /**
     * Destroy dashboard
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        const dashboard = document.getElementById(this.containerId);
        const toggle = document.getElementById('perf-monitor-toggle');
        
        if (dashboard) dashboard.remove();
        if (toggle) toggle.remove();
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