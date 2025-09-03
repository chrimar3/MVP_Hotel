/**
 * Configuration Manager for HybridGenerator
 * Handles configuration validation, environment setup, and defaults
 */

class ConfigManager {
  constructor(config = {}) {
    this.config = this.buildConfig(config);
    this.availability = null;
  }

  /**
   * Build and validate configuration
   */
  buildConfig(config) {
    return {
      openai: {
        key: '', // API keys are handled server-side only for security
        endpoint: '/api/llm-proxy', // Always use secure server-side proxy
        model: 'gpt-4o-mini',
        timeout: 3000,
        maxRetries: 2,
        costPer1kTokens: 0.00015,
      },
      groq: {
        key: '', // API keys are handled server-side only for security
        endpoint: '/api/llm-proxy', // Always use secure server-side proxy
        model: 'mixtral-8x7b-32768',
        timeout: 1000,
        maxRetries: 1,
        costPer1kTokens: 0, // Free tier
      },
      proxy: {
        url: '/api/llm-proxy',
        enabled: true, // Always enabled for security
      },
      cache: {
        enabled: true,
        ttl: 3600000, // 1 hour
        maxSize: 100,
      },
      monitoring: {
        enabled: true,
        sampleRate: 1.0,
        alertThresholds: {
          errorRate: 0.1,
          latency: 5000,
          costPerDay: 1.0,
        },
      },
      abTesting: {
        enabled: config.enableAB || false,
        llmPercentage: 50, // % of users getting LLM vs templates
        trackingEnabled: true,
      },
    };
  }

  /**
   * Check API availability via secure proxy
   */
  async checkAvailability() {
    const availability = {
      openai: false,
      groq: false,
      template: true,
    };

    // Check OpenAI via proxy health endpoint
    try {
      const response = await fetch('/api/llm-proxy/health?provider=openai', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      availability.openai = response.ok;
    } catch (error) {
      // Silent failure for availability check - fallback will handle this
      if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
        console.debug('OpenAI availability check failed:', error);
      }
    }

    // Check Groq via proxy health endpoint
    try {
      const response = await fetch('/api/llm-proxy/health?provider=groq', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      availability.groq = response.ok;
    } catch (error) {
      // Silent failure for availability check - fallback will handle this
      if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
        console.debug('Groq availability check failed:', error);
      }
    }

    this.availability = availability;
    return availability;
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(provider) {
    return this.config[provider];
  }

  /**
   * Get monitoring configuration
   */
  getMonitoringConfig() {
    return this.config.monitoring;
  }

  /**
   * Get cache configuration
   */
  getCacheConfig() {
    return this.config.cache;
  }

  /**
   * Get A/B testing configuration
   */
  getABTestingConfig() {
    return this.config.abTesting;
  }

  /**
   * Get proxy configuration
   */
  getProxyConfig() {
    return this.config.proxy;
  }

  /**
   * Check if provider is available
   */
  isProviderAvailable(provider) {
    return this.availability && this.availability[provider];
  }

  /**
   * Get all availability status
   */
  getAvailability() {
    return this.availability;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConfigManager;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
  window.ConfigManager = ConfigManager;
}