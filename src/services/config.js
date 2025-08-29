/**
 * Production Configuration Manager
 * Centralizes all environment-specific configuration
 */

class ConfigManager {
  constructor() {
    // Default configuration (development)
    this.config = {
      // Analytics
      GA_MEASUREMENT_ID: 'G-DEVELOPMENT',
      GTM_ID: null,

      // Error Monitoring
      SENTRY_DSN: null,
      SENTRY_ENVIRONMENT: 'development',
      SENTRY_RELEASE: '1.0.0',

      // Feature Flags
      ENABLE_AI_SUGGESTIONS: false,
      ENABLE_ANALYTICS: true,
      ENABLE_ERROR_TRACKING: false,
      ENABLE_SHARE_TRACKING: true,

      // Security
      ALLOWED_ORIGINS: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      CSP_REPORT_URI: null,

      // Performance
      MAX_REVIEW_LENGTH: 2000,
      SESSION_TIMEOUT: 1800000, // 30 minutes
      CACHE_TTL: 86400, // 24 hours

      // URLs
      PRODUCTION_URL: window.location.origin,
      SUPPORT_EMAIL: 'support@example.com',

      // API (for future use)
      API_BASE_URL: null,
      OPENAI_API_KEY: null,
    };

    // Load environment-specific config
    this.loadEnvironmentConfig();
  }

  loadEnvironmentConfig() {
    // Check if we're in production
    const isProduction =
      window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

    if (isProduction) {
      // Production configuration
      this.config = {
        ...this.config,
        GA_MEASUREMENT_ID: 'G-YOUR_PRODUCTION_ID', 
        SENTRY_DSN: 'https://your-sentry-dsn@sentry.io/project', 
        SENTRY_ENVIRONMENT: 'production',
        ENABLE_ERROR_TRACKING: true,
        ALLOWED_ORIGINS: [window.location.origin],
        PRODUCTION_URL: window.location.origin,
      };
    }

    // Override with URL parameters for testing (remove in production)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'true') {
      this.config.ENABLE_ERROR_TRACKING = false;

    }
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    this.config[key] = value;
  }

  isProduction() {
    return this.config.SENTRY_ENVIRONMENT === 'production';
  }

  isDevelopment() {
    return this.config.SENTRY_ENVIRONMENT === 'development';
  }

  getSecurityHeaders() {
    return {
      'Content-Security-Policy': this.getCSP(),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };
  }

  getCSP() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://www.google-analytics.com https://sentry.io",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];

    if (this.config.CSP_REPORT_URI) {
      csp.push(`report-uri ${this.config.CSP_REPORT_URI}`);
    }

    return csp.join('; ');
  }
}

// Export singleton instance
const Config = new ConfigManager();

// Make available globally for non-module scripts
if (typeof window !== 'undefined') {
  window.AppConfig = Config;
}
