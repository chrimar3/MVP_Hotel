/**
 * Dashboard UI Manager
 * Handles HTML creation, styling, and DOM interactions
 */

class DashboardUI {
    constructor(containerId = 'monitoring-dashboard') {
        this.containerId = containerId;
        this.isVisible = false;
    }

    /**
     * Create complete dashboard HTML structure
     */
    createDashboardHTML() {
        this.createToggleButton();
        this.createDashboardContainer();
        this.injectStyles();
    }

    /**
     * Create floating toggle button
     */
    createToggleButton() {
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

        // Add hover effects
        toggleButton.addEventListener('mouseenter', () => {
            toggleButton.style.transform = 'scale(1.1)';
        });

        toggleButton.addEventListener('mouseleave', () => {
            toggleButton.style.transform = 'scale(1)';
        });

        document.body.appendChild(toggleButton);
    }

    /**
     * Create main dashboard container
     */
    createDashboardContainer() {
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        dashboard.innerHTML = this.getDashboardTemplate();
        document.body.appendChild(dashboard);
    }

    /**
     * Get dashboard HTML template
     */
    getDashboardTemplate() {
        return `
            <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h1 style="margin: 0; font-size: 28px;">🚀 Performance Monitor</h1>
                    <button id="close-dashboard" style="background: #dc3545; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer;">
                        Close ✕
                    </button>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    <!-- Core Web Vitals Section -->
                    <div class="dashboard-section">
                        <h2 style="margin-top: 0; color: #17a2b8;">Core Web Vitals</h2>
                        <div id="vitals-content">
                            <p style="color: #666;">Loading...</p>
                        </div>
                    </div>

                    <!-- Performance Score Section -->
                    <div class="dashboard-section">
                        <h2 style="margin-top: 0; color: #28a745;">Performance Score</h2>
                        <div id="score-content">
                            <p style="color: #666;">Calculating...</p>
                        </div>
                    </div>

                    <!-- Resource Timing Section -->
                    <div class="dashboard-section">
                        <h2 style="margin-top: 0; color: #fd7e14;">Resources</h2>
                        <div id="resource-content">
                            <p style="color: #666;">Loading...</p>
                        </div>
                    </div>

                    <!-- Navigation Timing Section -->
                    <div class="dashboard-section">
                        <h2 style="margin-top: 0; color: #6f42c1;">Navigation</h2>
                        <div id="navigation-content">
                            <p style="color: #666;">Loading...</p>
                        </div>
                    </div>

                    <!-- System Info Section -->
                    <div class="dashboard-section">
                        <h2 style="margin-top: 0; color: #20c997;">System Info</h2>
                        <div id="system-content">
                            <p style="color: #666;">Loading...</p>
                        </div>
                    </div>

                    <!-- Alerts Section -->
                    <div class="dashboard-section">
                        <h2 style="margin-top: 0; color: #dc3545;">Performance Alerts</h2>
                        <div id="alerts-content">
                            <p style="color: #666;">No alerts</p>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div style="margin-top: 30px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="refresh-metrics" class="action-button">
                        🔄 Refresh Metrics
                    </button>
                    <button id="clear-cache" class="action-button">
                        🗑️ Clear Performance Cache
                    </button>
                    <button id="export-data" class="action-button">
                        📊 Export Data
                    </button>
                    <button id="toggle-auto-refresh" class="action-button">
                        ⏸️ Pause Auto-refresh
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Inject required CSS styles
     */
    injectStyles() {
        if (document.getElementById('dashboard-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'dashboard-styles';
        styles.textContent = `
            .dashboard-section {
                background: rgba(255, 255, 255, 0.1);
                padding: 20px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .metric-item {
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .metric-value {
                font-weight: bold;
                font-family: monospace;
            }

            .status-good { color: #28a745; }
            .status-needs-improvement { color: #ffc107; }
            .status-poor { color: #dc3545; }

            .progress-bar {
                background: rgba(255, 255, 255, 0.2);
                height: 8px;
                border-radius: 4px;
                overflow: hidden;
                margin: 10px 0;
            }

            .progress-fill {
                height: 100%;
                transition: width 0.3s ease;
                border-radius: 4px;
            }

            .action-button {
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
            }

            .action-button:hover {
                background: #0056b3;
            }

            .action-button:disabled {
                background: #6c757d;
                cursor: not-allowed;
            }

            .alert-item {
                background: rgba(220, 53, 69, 0.2);
                border: 1px solid #dc3545;
                border-radius: 4px;
                padding: 10px;
                margin: 5px 0;
                font-size: 12px;
            }

            .alert-item.warning {
                background: rgba(255, 193, 7, 0.2);
                border-color: #ffc107;
            }

            .alert-item.info {
                background: rgba(23, 162, 184, 0.2);
                border-color: #17a2b8;
            }

            @media (max-width: 768px) {
                .dashboard-section {
                    margin-bottom: 20px;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * Show dashboard
     */
    show() {
        const dashboard = document.getElementById(this.containerId);
        if (dashboard) {
            dashboard.style.display = 'block';
            this.isVisible = true;
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
     * Update section content
     */
    updateSection(sectionId, content) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.innerHTML = content;
        }
    }

    /**
     * Add click handler to element
     */
    addClickHandler(elementId, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('click', handler);
        }
    }

    /**
     * Set button state
     */
    setButtonState(buttonId, state) {
        const button = document.getElementById(buttonId);
        if (button) {
            switch (state) {
                case 'loading':
                    button.disabled = true;
                    button.style.opacity = '0.6';
                    break;
                case 'disabled':
                    button.disabled = true;
                    break;
                case 'enabled':
                default:
                    button.disabled = false;
                    button.style.opacity = '1';
                    break;
            }
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10001;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    /**
     * Get dashboard visibility state
     */
    isVisible() {
        return this.isVisible;
    }

    /**
     * Cleanup and destroy UI elements
     */
    destroy() {
        const dashboard = document.getElementById(this.containerId);
        const toggle = document.getElementById('perf-monitor-toggle');
        const styles = document.getElementById('dashboard-styles');

        if (dashboard) dashboard.remove();
        if (toggle) toggle.remove();
        if (styles) styles.remove();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardUI;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
    window.DashboardUI = DashboardUI;
}