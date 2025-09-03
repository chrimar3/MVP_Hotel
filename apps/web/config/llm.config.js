/**
 * LLM Configuration - Central Configuration for Review Generation Services
 *
 * Comprehensive configuration management for the hotel review generator's
 * LLM integration, including API keys, model settings, cache configuration,
 * cost tracking, feature flags, and monitoring settings.
 *
 * Security Note: API keys should be provided via environment variables
 * or secure configuration management, not hardcoded in source.
 *
 * @fileOverview LLM configuration and utility functions
 * @since 1.0.0
 * @author Hotel Review Generator Team
 *
 * @example
 * // Initialize configuration
 * const config = initializeConfig();
 *
 * // Check if APIs are configured
 * if (config.apis.openai.enabled && config.apis.openai.key) {
 *   console.log('OpenAI is configured');
 * }
 *
 * // Validate API keys
 * const validation = await validateAPIKeys();
 * console.log('API Status:', validation);
 */

/**
 * Main LLM configuration object containing all settings for review generation
 *
 * @type {Object}
 * @constant
 * @since 1.0.0
 */
const LLM_CONFIG = {
  /**
   * API configuration for different LLM providers
   *
   * @type {Object}
   * @property {Object} openai - OpenAI GPT configuration
   * @property {string} openai.key - API key (loaded from environment)
   * @property {string} openai.endpoint - API endpoint URL
   * @property {string} openai.model - Model name to use
   * @property {boolean} openai.enabled - Whether provider is enabled
   * @property {Object} groq - Groq configuration
   * @property {Object} proxy - CORS proxy configuration for browser requests
   */
  apis: {
    openai: {
      key: '', // API keys are handled server-side only for security
      endpoint: '/api/llm-proxy/openai', // Use server-side proxy
      model: 'gpt-4o-mini',
      enabled: true,
    },
    groq: {
      key: '', // API keys are handled server-side only for security
      endpoint: '/api/llm-proxy/groq', // Use server-side proxy
      model: 'mixtral-8x7b-32768',
      enabled: true,
    },
    proxy: {
      // Server-side proxy for secure API key handling
      url: '/api/llm-proxy',
      enabled: true, // Always use proxy for security
    },
  },

  /**
   * Text generation parameters and settings
   *
   * @type {Object}
   * @property {number} maxTokens - Maximum tokens to generate
   * @property {number} temperature - Creativity/randomness (0.0-2.0)
   * @property {number} topP - Nucleus sampling parameter
   * @property {number} frequencyPenalty - Penalty for repeated tokens
   * @property {number} presencePenalty - Penalty for repeated topics
   * @property {number} timeout - Request timeout in milliseconds
   * @property {number} retries - Number of retry attempts
   */
  generation: {
    maxTokens: 300,
    temperature: 0.8,
    topP: 0.9,
    frequencyPenalty: 0.3,
    presencePenalty: 0.6,
    timeout: 3000,
    retries: 2,
  },

  /**
   * Response caching configuration
   *
   * @type {Object}
   * @property {boolean} enabled - Whether caching is enabled
   * @property {number} ttl - Time to live in milliseconds
   * @property {number} maxSize - Maximum number of cached responses
   */
  cache: {
    enabled: true,
    ttl: 3600000, // 1 hour
    maxSize: 100, // Maximum cached responses
  },

  /**
   * Cost tracking and budgeting configuration
   *
   * @type {Object}
   * @property {number} [modelName] - Cost per 1K tokens for each model
   * @property {Object} budget - Daily and monthly budget limits
   */
  costs: {
    'gpt-4o-mini': 0.000015, // per 1K tokens input
    'gpt-3.5-turbo': 0.0015, // per 1K tokens
    'mixtral-8x7b': 0, // Free tier
    budget: {
      daily: 1.0, // $1 per day
      monthly: 30.0, // $30 per month
    },
  },

  /**
   * Feature flags for enabling/disabling functionality
   *
   * @type {Object}
   * @property {boolean} useLLM - Master switch for LLM usage
   * @property {boolean} fallbackToTemplate - Use templates when LLM fails
   * @property {boolean} trackAnalytics - Enable usage tracking
   * @property {boolean} abTesting - Enable A/B testing between LLM and templates
   * @property {boolean} multiLanguage - Support multiple languages
   * @property {boolean} cacheResponses - Enable response caching
   */
  features: {
    useLLM: true, // Master switch for LLM usage
    fallbackToTemplate: true, // Use templates if LLM fails
    trackAnalytics: true, // Track usage statistics
    abTesting: false, // A/B test LLM vs templates
    multiLanguage: true, // Support multiple languages
    cacheResponses: true, // Cache generated reviews
  },

  /**
   * Multi-language support configuration
   *
   * @type {Object}
   * @property {string[]} supported - Array of supported language codes
   * @property {string} default - Default language code
   */
  languages: {
    supported: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ja', 'zh', 'el'],
    default: 'en',
  },

  /**
   * Quality control and content validation settings
   *
   * @type {Object}
   * @property {number} minLength - Minimum word count for reviews
   * @property {number} maxLength - Maximum word count for reviews
   * @property {number} readabilityTarget - Target Flesch-Kincaid grade level
   * @property {boolean} sentimentAlignment - Align sentiment with rating
   * @property {boolean} personalityConsistency - Maintain consistent voice
   */
  quality: {
    minLength: 100, // Minimum words
    maxLength: 250, // Maximum words
    readabilityTarget: 8, // Flesch-Kincaid grade level
    sentimentAlignment: true, // Align sentiment with rating
    personalityConsistency: true, // Maintain consistent voice
  },

  /**
   * Rate limiting configuration per provider
   *
   * @type {Object}
   * @property {Object} openai - OpenAI rate limits
   * @property {number} openai.rpm - Requests per minute
   * @property {number} openai.tpm - Tokens per minute
   * @property {Object} groq - Groq rate limits
   */
  rateLimits: {
    openai: {
      rpm: 500, // Requests per minute
      tpm: 40000, // Tokens per minute
    },
    groq: {
      rpm: 30, // Free tier limit
      tpm: 10000,
    },
  },

  /**
   * Monitoring and alerting configuration
   *
   * @type {Object}
   * @property {boolean} logErrors - Enable error logging
   * @property {boolean} logPerformance - Enable performance logging
   * @property {Object} alertThreshold - Thresholds for alerts
   */
  monitoring: {
    logErrors: true,
    logPerformance: true,
    alertThreshold: {
      errorRate: 0.1, // 10% error rate
      latency: 5000, // 5 second response time
      cost: 1.0, // $1 per day
    },
  },
};

/**
 * Initialize configuration from environment variables or localStorage
 *
 * Loads API keys from environment variables (Node.js) or saved configuration
 * from localStorage (browser). Environment variables take precedence.
 *
 * @returns {Object} Initialized configuration object
 * @since 1.0.0
 *
 * @example
 * const config = initializeConfig();
 * console.log('OpenAI enabled:', config.apis.openai.enabled);
 * console.log('Cache TTL:', config.cache.ttl);
 */
function initializeConfig() {
  // Security Note: API keys are never loaded on client-side for security
  // All API calls go through the secure server-side proxy at /api/llm-proxy

  // Load non-sensitive configuration from localStorage (Browser)
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = localStorage.getItem('llm_config');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Only merge non-sensitive configuration (exclude API keys)
        const { apis, ...safeConfig } = parsed;
        Object.assign(LLM_CONFIG, safeConfig);
      } catch (e) {
        console.warn('Failed to parse stored LLM config:', e);
      }
    }
  }

  return LLM_CONFIG;
}

/**
 * Save configuration to localStorage (excluding sensitive API keys)
 *
 * Saves non-sensitive configuration to browser localStorage for persistence.
 * API keys are excluded for security reasons.
 *
 * @param {Object} config - Configuration object to save
 * @since 1.0.0
 *
 * @example
 * const updatedConfig = { ...LLM_CONFIG, cache: { enabled: false } };
 * saveConfig(updatedConfig);
 */
function saveConfig(config) {
  if (typeof window !== 'undefined' && window.localStorage) {
    // Don't save API keys in localStorage for security
    const toSave = { ...config };
    delete toSave.apis.openai.key;
    delete toSave.apis.groq.key;

    localStorage.setItem('llm_config', JSON.stringify(toSave));
  }
}

/**
 * Validate API keys by making test requests to each provider
 *
 * Tests connectivity and authentication with configured LLM providers
 * by sending minimal test requests. Used for health checks and setup validation.
 *
 * @async
 * @returns {Promise<Object>} Object with boolean status for each provider
 * @returns {boolean} returns.openai - OpenAI API key validity
 * @returns {boolean} returns.groq - Groq API key validity
 * @since 1.0.0
 *
 * @example
 * const validation = await validateAPIKeys();
 * if (validation.openai) {
 *   console.log('OpenAI API key is valid');
 * } else {
 *   console.error('OpenAI API key is invalid or missing');
 * }
 *
 * if (!validation.openai && !validation.groq) {
 *   console.warn('No LLM providers available, using template fallback');
 * }
 */
async function validateAPIKeys() {
  const results = {
    openai: false,
    groq: false,
  };

  // Test OpenAI via secure proxy
  try {
    const response = await fetch(LLM_CONFIG.apis.openai.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      }),
    });
    results.openai = response.ok;
  } catch (e) {
    console.warn('OpenAI proxy validation failed:', e);
  }

  // Test Groq via secure proxy
  try {
    const response = await fetch(LLM_CONFIG.apis.groq.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      }),
    });
    results.groq = response.ok;
  } catch (e) {
    console.warn('Groq proxy validation failed:', e);
  }

  return results;
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LLM_CONFIG, initializeConfig, saveConfig, validateAPIKeys };
} else {
  // Browser global
  window.LLM_CONFIG = LLM_CONFIG;
  window.initializeLLMConfig = initializeConfig;
  window.saveLLMConfig = saveConfig;
  window.validateAPIKeys = validateAPIKeys;
}
