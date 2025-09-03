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
        key: config.openaiKey || (typeof process !== 'undefined' && process.env ? process.env.OPENAI_API_KEY : null),
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4o-mini',
        timeout: 3000,
        maxRetries: 2,
        costPer1kTokens: 0.00015,
      },
      groq: {
        key: config.groqKey || (typeof process !== 'undefined' && process.env ? process.env.GROQ_API_KEY : null),
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'mixtral-8x7b-32768',
        timeout: 1000,
        maxRetries: 1,
        costPer1kTokens: 0, // Free tier
      },
      proxy: {
        url: config.proxyUrl || '/api/llm-proxy',
        enabled: config.useProxy !== false,
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
   * Check API availability
   */
  async checkAvailability() {
    const availability = {
      openai: false,
      groq: false,
      template: true,
    };

    // Check OpenAI
    if (this.config.openai.key && this.config.openai.key !== '') {
      try {
        // Quick validation without actual API call
        availability.openai = true;
      } catch (error) {
        // Silent failure for availability check - this is expected
        if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
          console.debug('OpenAI availability check failed:', error);
        }
      }
    }

    // Check Groq
    if (this.config.groq.key && this.config.groq.key !== '') {
      try {
        // Quick validation without actual API call
        availability.groq = true;
      } catch (error) {
        // Silent failure for availability check - this is expected
        if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
          console.debug('Groq availability check failed:', error);
        }
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