/**
 * Security Logger
 * Handles security event logging, monitoring, and alerting
 */

class SecurityLogger {
    constructor(config = {}) {
        this.config = {
            maxLogEntries: config.maxLogEntries || 10000,
            criticalEventTypes: config.criticalEventTypes || [
                'ACCESS_DENIED',
                'CSRF_ATTEMPT',
                'XSS_ATTEMPT',
                'SQL_INJECTION_ATTEMPT',
                'AUTHENTICATION_ERROR',
                'AUTHORIZATION_ERROR',
                'SSRF_ATTEMPT'
            ]
        };

        this.setupSecurityLogging();
        this.initializeSuspiciousActivityMonitoring();
    }

    /**
     * OWASP A09: Security Logging and Monitoring
     */
    setupSecurityLogging() {
        this.securityLog = [];

        // Load existing logs from localStorage
        this.loadExistingLogs();

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
            'VULNERABLE_DEPENDENCIES',
            'SESSION_EXPIRED',
            'SSRF_ATTEMPT',
            'CLIENT_ERROR',
            'UNHANDLED_REJECTION'
        ];
    }

    /**
     * Load existing logs from localStorage
     */
    loadExistingLogs() {
        try {
            const storedLogs = localStorage.getItem('securityLog');
            if (storedLogs) {
                this.securityLog = JSON.parse(storedLogs);
            }
        } catch (error) {
            // Ignore parsing errors and start fresh
            this.securityLog = [];
        }
    }

    /**
     * Log security events
     */
    logSecurityEvent(eventType, details = {}) {
        const event = {
            id: this.generateEventId(),
            timestamp: new Date().toISOString(),
            type: eventType,
            details: details,
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer,
            sessionId: this.getSessionId(),
            severity: this.getEventSeverity(eventType)
        };

        this.securityLog.push(event);

        // Rotate logs if needed
        if (this.securityLog.length > this.config.maxLogEntries) {
            this.securityLog = this.securityLog.slice(-this.config.maxLogEntries);
        }

        // Send critical events to server (in production)
        if (this.isCriticalEvent(eventType)) {
            this.sendToSecurityMonitoring(event);
        }

        // Store in localStorage for persistence
        this.persistLogs();

        // Trigger alerts for critical events
        if (event.severity === 'critical') {
            this.triggerAlert(event);
        }

        return event;
    }

    /**
     * Get event severity level
     */
    getEventSeverity(eventType) {
        const severityMap = {
            'LOGIN_ATTEMPT': 'info',
            'LOGIN_SUCCESS': 'info',
            'LOGIN_FAILURE': 'warning',
            'ACCESS_DENIED': 'critical',
            'VALIDATION_FAILED': 'warning',
            'RATE_LIMIT_EXCEEDED': 'warning',
            'SUSPICIOUS_ACTIVITY': 'warning',
            'ENCRYPTION_ERROR': 'critical',
            'AUTHENTICATION_ERROR': 'critical',
            'AUTHORIZATION_ERROR': 'critical',
            'CSRF_ATTEMPT': 'critical',
            'XSS_ATTEMPT': 'critical',
            'SQL_INJECTION_ATTEMPT': 'critical',
            'VULNERABLE_DEPENDENCIES': 'warning',
            'SESSION_EXPIRED': 'info',
            'SSRF_ATTEMPT': 'critical',
            'CLIENT_ERROR': 'warning',
            'UNHANDLED_REJECTION': 'warning'
        };

        return severityMap[eventType] || 'info';
    }

    /**
     * Generate unique event ID
     */
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get session ID
     */
    getSessionId() {
        return sessionStorage.getItem('sessionId') || 'no-session';
    }

    /**
     * Check if event is critical
     */
    isCriticalEvent(eventType) {
        return this.config.criticalEventTypes.includes(eventType);
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
     * Get CSRF token for secure requests
     */
    getCSRFToken() {
        return sessionStorage.getItem('csrfToken') || '';
    }

    /**
     * Persist logs to localStorage
     */
    persistLogs() {
        try {
            // Store only last 100 events locally to avoid storage quota issues
            const logsToStore = this.securityLog.slice(-100);
            localStorage.setItem('securityLog', JSON.stringify(logsToStore));
        } catch (error) {
            // Storage quota exceeded or disabled
            console.warn('Failed to persist security logs:', error);
        }
    }

    /**
     * Initialize suspicious activity monitoring
     */
    initializeSuspiciousActivityMonitoring() {
        this.suspiciousActivityDetectors = {
            rapidClicks: { count: 0, lastTime: 0, threshold: 10 },
            devToolsOpen: false,
            suspiciousPatterns: new Set()
        };

        this.startSuspiciousActivityMonitoring();
    }

    /**
     * Monitor for suspicious activity
     */
    startSuspiciousActivityMonitoring() {
        // Detect rapid clicking (potential automation)
        document.addEventListener('click', () => {
            const now = Date.now();
            const detector = this.suspiciousActivityDetectors.rapidClicks;

            if (now - detector.lastTime < 100) {
                detector.count++;
                if (detector.count > detector.threshold) {
                    this.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
                        type: 'rapid_clicking',
                        count: detector.count
                    });
                    detector.count = 0;
                }
            } else {
                detector.count = 0;
            }
            detector.lastTime = now;
        });

        // Detect console usage (potential debugging attempt)
        this.monitorDevTools();

        // Monitor for suspicious network patterns
        this.monitorNetworkActivity();
    }

    /**
     * Monitor developer tools usage
     */
    monitorDevTools() {
        const threshold = 160;
        let wasOpen = false;

        setInterval(() => {
            const isOpen = (
                window.outerHeight - window.innerHeight > threshold ||
                window.outerWidth - window.innerWidth > threshold
            );

            if (isOpen && !wasOpen) {
                this.suspiciousActivityDetectors.devToolsOpen = true;
                this.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
                    type: 'devtools_opened',
                    timestamp: new Date().toISOString()
                });
            }

            wasOpen = isOpen;
        }, 500);
    }

    /**
     * Monitor network activity for suspicious patterns
     */
    monitorNetworkActivity() {
        const originalFetch = window.fetch;
        const self = this;

        window.fetch = function(...args) {
            const url = args[0];

            // Log suspicious URLs
            if (typeof url === 'string') {
                if (self.isSuspiciousURL(url)) {
                    self.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
                        type: 'suspicious_url_request',
                        url: url.substring(0, 100) // Truncate for privacy
                    });
                }
            }

            return originalFetch.apply(this, args);
        };
    }

    /**
     * Check if URL is suspicious
     */
    isSuspiciousURL(url) {
        const suspiciousPatterns = [
            /javascript:/i,
            /data:.*script/i,
            /[<>]/,
            /\.\./,
            /admin/i,
            /config/i,
            /database/i,
            /\.env/i
        ];

        return suspiciousPatterns.some(pattern => pattern.test(url));
    }

    /**
     * Trigger alert for critical events
     */
    triggerAlert(event) {
        // In development, log to console
        if (window.location.hostname === 'localhost') {
            console.error(`🚨 Critical Security Event: ${event.type}`, event);
        }

        // Send to external alerting system if configured
        if (typeof window.alertingSystem !== 'undefined') {
            window.alertingSystem.sendAlert({
                type: 'security',
                severity: event.severity,
                event: event
            });
        }
    }

    /**
     * Get security logs with optional filtering
     */
    getSecurityLogs(filter = {}) {
        let logs = this.securityLog;

        // Filter by event type
        if (filter.eventType) {
            logs = logs.filter(log => log.type === filter.eventType);
        }

        // Filter by severity
        if (filter.severity) {
            logs = logs.filter(log => log.severity === filter.severity);
        }

        // Filter by time range
        if (filter.startTime) {
            logs = logs.filter(log => new Date(log.timestamp) >= new Date(filter.startTime));
        }
        if (filter.endTime) {
            logs = logs.filter(log => new Date(log.timestamp) <= new Date(filter.endTime));
        }

        // Limit results
        if (filter.limit) {
            logs = logs.slice(-filter.limit);
        }

        return logs;
    }

    /**
     * Get security statistics
     */
    getSecurityStats() {
        const stats = {
            totalEvents: this.securityLog.length,
            eventTypes: {},
            severityLevels: { info: 0, warning: 0, critical: 0 },
            lastActivity: null
        };

        this.securityLog.forEach(event => {
            // Count event types
            stats.eventTypes[event.type] = (stats.eventTypes[event.type] || 0) + 1;

            // Count severity levels
            if (event.severity) {
                stats.severityLevels[event.severity]++;
            }

            // Track last activity
            if (!stats.lastActivity || event.timestamp > stats.lastActivity) {
                stats.lastActivity = event.timestamp;
            }
        });

        return stats;
    }

    /**
     * Export security logs for analysis
     */
    exportSecurityLogs() {
        const logs = {
            exportDate: new Date().toISOString(),
            sessionId: this.getSessionId(),
            events: this.securityLog,
            stats: this.getSecurityStats()
        };

        return JSON.stringify(logs, null, 2);
    }

    /**
     * Clear security logs
     */
    clearLogs() {
        this.securityLog = [];
        localStorage.removeItem('securityLog');

        this.logSecurityEvent('LOGS_CLEARED', {
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Stop monitoring (cleanup)
     */
    stopMonitoring() {
        // In a full implementation, this would clean up event listeners
        // and intervals set up by the monitoring functions
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityLogger;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
    window.SecurityLogger = SecurityLogger;
}