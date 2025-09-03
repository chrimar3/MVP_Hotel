/**
 * Main Hybrid Review Generator with Intelligent Routing
 *
 * A sophisticated review generation system that intelligently routes requests between
 * multiple LLM providers (OpenAI, Groq) and template-based fallbacks. Features include:
 * - Intelligent provider selection with fallback chain
 * - Request caching for performance optimization
 * - A/B testing capabilities for quality comparison
 * - Comprehensive metrics and monitoring
 * - Cost tracking and optimization
 * - Error handling with graceful degradation
 *
 * @class HybridGenerator
 * @since 2.0.0
 * @author Hotel Review Generator Team
 *
 * @example
 * // Initialize with configuration
 * const generator = new HybridGenerator({
 *   proxy: { url: '/api/llm-proxy' },
 *   cache: { ttl: 3600 },
 *   monitoring: { enabled: true }
 * });
 *
 * // Generate a review
 * const result = await generator.generate({
 *   hotelName: 'Grand Plaza',
 *   rating: 4,
 *   highlights: ['pool', 'breakfast'],
 *   tripType: 'leisure'
 * });
 *
 * console.log(result.text, result.source, result.latency);
 */

// Import supporting modules
const ConfigManager = typeof require !== 'undefined' ? require('./ConfigManager') : window.ConfigManager;
const LLMProvider = typeof require !== 'undefined' ? require('./LLMProvider') : window.LLMProvider;
const CacheManager = typeof require !== 'undefined' ? require('./CacheManager') : window.CacheManager;
const MetricsManager = typeof require !== 'undefined' ? require('./MetricsManager') : window.MetricsManager;
const TemplateGenerator = typeof require !== 'undefined' ? require('./TemplateGenerator') : window.TemplateGenerator;

class HybridGenerator {
  /**
   * Initialize the HybridGenerator with configuration and supporting services
   *
   * @constructor
   * @param {Object} [config={}] - Configuration object
   * @param {Object} [config.openai] - OpenAI configuration
   * @param {string} [config.openai.apiKey] - OpenAI API key
   * @param {Object} [config.groq] - Groq configuration
   * @param {string} [config.groq.apiKey] - Groq API key
   * @param {Object} [config.cache] - Cache configuration
   * @param {number} [config.cache.ttl=3600] - Cache time-to-live in seconds
   * @param {Object} [config.monitoring] - Monitoring configuration
   * @param {boolean} [config.monitoring.enabled=true] - Enable monitoring
   * @param {Object} [config.abTesting] - A/B testing configuration
   * @param {boolean} [config.abTesting.enabled=false] - Enable A/B testing
   * @param {number} [config.abTesting.llmPercentage=50] - Percentage of requests to route to LLM
   * @since 2.0.0
   */
  constructor(config = {}) {
    // Initialize core components
    this.configManager = new ConfigManager(config);
    this.llmProvider = new LLMProvider(this.configManager);
    this.cacheManager = new CacheManager(this.configManager);
    this.metricsManager = new MetricsManager(this.configManager);
    this.templateGenerator = new TemplateGenerator();

    // Initialize
    this.initialize();
  }

  /**
   * Initialize the hybrid generator and start background services
   *
   * @async
   * @returns {Promise<void>}
   * @throws {Error} Throws if initialization fails
   * @since 2.0.0
   *
   * @example
   * await generator.initialize();
   */
  async initialize() {
    // Validate API keys and check availability
    await this.configManager.checkAvailability();

    // Start monitoring and cleanup services
    if (this.configManager.getMonitoringConfig().enabled) {
      this.metricsManager.startMonitoring();
    }
    this.cacheManager.startCleanup();
  }

  /**
   * Generate a hotel review using intelligent routing between providers
   *
   * Routes requests through the following fallback chain:
   * 1. Cache lookup (if enabled)
   * 2. A/B testing decision (LLM vs Template)
   * 3. Primary LLM (OpenAI GPT-4o-mini)
   * 4. Fallback LLM (Groq Mixtral)
   * 5. Template generator (emergency fallback)
   *
   * @async
   * @param {Object} params - Review generation parameters
   * @param {string} params.hotelName - Name of the hotel
   * @param {number} params.rating - Rating from 1-5
   * @param {string} [params.tripType='leisure'] - Type of trip
   * @param {string[]} [params.highlights=[]] - Aspects to highlight
   * @param {number} [params.nights=3] - Number of nights stayed
   * @param {number} [params.guests=2] - Number of guests
   * @param {string} [params.language='en'] - Review language
   * @param {string} [params.voice='friendly'] - Writing voice/style
   * @returns {Promise<Object>} Generation result
   * @returns {string} returns.text - Generated review text
   * @returns {string} returns.source - Source used ('openai', 'groq', 'template', 'cache', 'emergency')
   * @returns {number} returns.latency - Generation time in milliseconds
   * @returns {string} returns.requestId - Unique request identifier
   * @returns {string} returns.timestamp - ISO timestamp
   * @returns {boolean} returns.cached - Whether result came from cache
   * @returns {number} returns.cost - Estimated cost in USD (0 for non-OpenAI sources)
   * @throws {Error} Throws if all generation methods fail
   * @since 2.0.0
   *
   * @example
   * const result = await generator.generate({
   *   hotelName: 'Luxury Resort & Spa',
   *   rating: 5,
   *   tripType: 'romantic',
   *   highlights: ['spa', 'oceanview', 'restaurant'],
   *   nights: 4,
   *   voice: 'enthusiastic'
   * });
   *
   * console.log(`Review (${result.source}): ${result.text}`);
   * console.log(`Generated in ${result.latency}ms for $${result.cost}`);
   */
  async generate(params) {
    const startTime = performance.now();
    const requestId = this.generateRequestId();

    try {
      // Record request
      this.metricsManager.recordMetric('requests.total', 1);

      // Check cache first
      const cached = await this.cacheManager.checkCache(params);
      if (cached) {
        this.metricsManager.recordMetric('cache.hits', 1);
        return this.formatResponse(cached, 'cache', performance.now() - startTime, requestId);
      }

      // Record cache miss
      this.metricsManager.recordMetric('cache.misses', 1);

      // A/B Testing logic
      const abConfig = this.configManager.getABTestingConfig();
      if (abConfig.enabled) {
        const useTemplate = !this.shouldUseLLM();
        if (useTemplate) {
          const result = await this.templateGenerator.generate(params);
          this.metricsManager.recordABTestResult('template', requestId);
          return this.formatResponse(result, 'template', performance.now() - startTime, requestId);
        }
      }

      // Try primary LLM (OpenAI)
      if (this.configManager.isProviderAvailable('openai')) {
        try {
          const result = await this.llmProvider.callOpenAI(params);
          await this.cacheManager.cacheResult(params, result);
          this.metricsManager.recordMetric('llm.openai.success', 1);
          this.metricsManager.trackCost('openai', result.tokens);
          return this.formatResponse(
            result.text,
            'openai',
            performance.now() - startTime,
            requestId
          );
        } catch (error) {
          this.metricsManager.recordMetric('llm.openai.errors', 1);
          this.metricsManager.logError('OpenAI failed', error, requestId);
        }
      }

      // Try fallback LLM (Groq)
      if (this.configManager.isProviderAvailable('groq')) {
        try {
          const result = await this.llmProvider.callGroq(params);
          await this.cacheManager.cacheResult(params, result);
          this.metricsManager.recordMetric('llm.groq.success', 1);
          return this.formatResponse(result.text, 'groq', performance.now() - startTime, requestId);
        } catch (error) {
          this.metricsManager.recordMetric('llm.groq.errors', 1);
          this.metricsManager.logError('Groq failed', error, requestId);
        }
      }

      // Emergency fallback to templates
      this.metricsManager.recordMetric('fallback.template', 1);
      const templateResult = await this.templateGenerator.generate(params);
      return this.formatResponse(
        templateResult,
        'template',
        performance.now() - startTime,
        requestId
      );
    } catch (error) {
      this.metricsManager.recordMetric('errors.total', 1);
      this.metricsManager.logError('Generation failed', error, requestId);

      // Last resort fallback
      const fallback = this.llmProvider.getEmergencyFallback(params);
      return this.formatResponse(fallback, 'emergency', performance.now() - startTime, requestId);
    } finally {
      // Record latency
      const latency = performance.now() - startTime;
      this.metricsManager.recordMetric('latency.ms', latency);

      // Check alert thresholds
      this.metricsManager.checkAlertThresholds();
    }
  }

  /**
   * A/B Testing decision: determine whether to use LLM or template generation
   *
   * @private
   * @returns {boolean} True if should use LLM, false for template
   * @since 2.0.0
   */
  shouldUseLLM() {
    const config = this.configManager.getABTestingConfig();
    if (!config.enabled) return true;

    const random = Math.random() * 100;
    return random < config.llmPercentage;
  }

  /**
   * Format the generation response with comprehensive metadata
   *
   * @private
   * @param {string} text - Generated review text
   * @param {string} source - Source of generation
   * @param {number} latency - Generation time in milliseconds
   * @param {string} requestId - Unique request identifier
   * @returns {Object} Formatted response object
   * @since 2.0.0
   */
  formatResponse(text, source, latency, requestId) {
    return {
      text: text,
      source: source,
      latency: Math.round(latency),
      requestId: requestId,
      timestamp: new Date().toISOString(),
      cached: source === 'cache',
      cost: source === 'openai' ? this.llmProvider.estimateCost(text) : 0,
    };
  }

  /**
   * Generate a unique request identifier for tracking and debugging
   *
   * @private
   * @returns {string} Unique request ID in format 'req_timestamp_random'
   * @since 2.0.0
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get comprehensive metrics summary for monitoring and analytics
   *
   * @returns {Object} Metrics summary including requests, successes, failures, latency, costs
   * @since 2.0.0
   *
   * @example
   * const metrics = generator.getMetrics();
   * console.log(`Success rate: ${metrics.successRate}`);
   * console.log(`Average latency: ${metrics.averageLatency}ms`);
   * console.log(`Total cost: $${metrics.totalCost}`);
   */
  getMetrics() {
    return this.metricsManager.getMetricsSummary();
  }

  /**
   * Get detailed cache performance statistics
   *
   * @returns {Object} Cache statistics including hit rate, size, memory usage
   * @since 2.0.0
   *
   * @example
   * const stats = generator.getCacheStats();
   * console.log(`Cache hit rate: ${stats.hitRate}%`);
   * console.log(`Cache size: ${stats.entries} entries`);
   */
  getCacheStats() {
    return this.cacheManager.getCacheStats();
  }

  /**
   * Manually clear all cached results
   *
   * @since 2.0.0
   *
   * @example
   * generator.clearCache(); // Clears all cached reviews
   */
  clearCache() {
    this.cacheManager.clearCache();
  }

  /**
   * Get current generator configuration
   *
   * @returns {Object} Current configuration object
   * @since 2.0.0
   */
  getConfig() {
    return this.configManager.config;
  }

  /**
   * Get current availability status of all LLM providers
   *
   * @returns {Object} Provider availability status
   * @returns {boolean} returns.openai - OpenAI availability
   * @returns {boolean} returns.groq - Groq availability
   * @since 2.0.0
   *
   * @example
   * const availability = generator.getAvailability();
   * if (!availability.openai && !availability.groq) {
   *   console.warn('All LLM providers unavailable, using templates only');
   * }
   */
  getAvailability() {
    return this.configManager.getAvailability();
  }

  /**
   * Update generator configuration and reinitialize components
   *
   * @param {Object} newConfig - New configuration object
   * @since 2.0.0
   *
   * @example
   * generator.updateConfig({
   *   proxy: { url: '/api/llm-proxy' },
   *   cache: { ttl: 7200 }
   * });
   */
  updateConfig(newConfig) {
    this.configManager = new ConfigManager(newConfig);
    this.llmProvider = new LLMProvider(this.configManager);
    this.cacheManager = new CacheManager(this.configManager);
    // Note: MetricsManager keeps historical data, no need to recreate
  }

  /**
   * Force refresh of provider availability status
   *
   * @async
   * @returns {Promise<Object>} Updated availability status
   * @since 2.0.0
   *
   * @example
   * const availability = await generator.refreshAvailability();
   * console.log('Updated availability:', availability);
   */
  async refreshAvailability() {
    return this.configManager.checkAvailability();
  }

  /**
   * Destroy the generator and cleanup all resources
   *
   * Stops monitoring, clears caches, and releases all resources.
   * The generator cannot be used after calling this method.
   *
   * @since 2.0.0
   *
   * @example
   * // Cleanup when shutting down
   * generator.destroy();
   */
  destroy() {
    this.metricsManager.destroy();
    this.cacheManager.stopCleanup();
    this.cacheManager.clearCache();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    HybridGenerator,
    ConfigManager,
    LLMProvider,
    CacheManager,
    MetricsManager,
    TemplateGenerator
  };
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
  window.HybridGenerator = HybridGenerator;
}