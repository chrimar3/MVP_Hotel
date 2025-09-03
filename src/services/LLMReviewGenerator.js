/**
 * LLM-based Review Generator with Hybrid Fallback System
 *
 * A robust review generation system that provides high-quality hotel reviews
 * through multiple fallback layers:
 * - Primary: OpenAI GPT-4o-mini (best quality/cost ratio)
 * - Fallback: Groq Mixtral (ultra-fast, free)
 * - Emergency: Template system (always available)
 *
 * Features include request caching, cost tracking, performance monitoring,
 * and comprehensive error handling with graceful degradation.
 *
 * @class LLMReviewGenerator
 * @since 1.0.0
 * @author Hotel Review Generator Team
 *
 * @example
 * const generator = new LLMReviewGenerator({
 *   proxyUrl: '/api/llm-proxy' // Secure server-side proxy
 * });
 *
 * const result = await generator.generateReview({
 *   hotelName: 'Grand Hotel',
 *   rating: 4,
 *   tripType: 'business',
 *   highlights: ['wifi', 'location'],
 *   voice: 'professional'
 * });
 *
 * console.log(result.text); // Generated review
 * console.log(result.source); // 'openai', 'groq', or 'template'
 * console.log(`Cost: $${result.cost}`);
 */

class LLMReviewGenerator {
  /**
   * Initialize the LLM Review Generator with API keys and configuration
   *
   * @constructor
   * @param {Object} [config={}] - Configuration object
   * @param {string} [config.openaiKey] - OpenAI API key for GPT-4o-mini
   * @param {string} [config.groqKey] - Groq API key for Mixtral
   * @param {string} [config.proxyUrl] - CORS proxy URL for browser requests
   * @since 1.0.0
   */
  constructor(config = {}) {
    // Security: API keys are handled server-side only via proxy
    this.openaiKey = null; // Never store API keys client-side
    this.groqKey = null; // Never store API keys client-side
    this.proxyUrl = config.proxyUrl || '/api/llm-proxy'; // Secure server-side proxy

    // Model settings (all requests go through secure proxy)
    this.models = {
      primary: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        url: '/api/llm-proxy', // Use secure server-side proxy
        timeout: 3000,
        costPerRequest: 0.000045,
      },
      fallback: {
        provider: 'groq',
        model: 'mixtral-8x7b-32768',
        url: '/api/llm-proxy', // Use secure server-side proxy
        timeout: 1000,
        costPerRequest: 0,
      },
    };

    // Cache for responses
    this.cache = new Map();
    this.cacheTimeout = 3600000; // 1 hour

    // Statistics
    this.stats = {
      requests: 0,
      successes: 0,
      failures: 0,
      cacheHits: 0,
      totalCost: 0,
      avgLatency: 0,
    };

    // Template fallback system
    this.templateGenerator = new TemplateReviewGenerator();
  }

  /**
   * Generate a hotel review using the best available method
   *
   * Attempts generation in this order:
   * 1. Check cache for existing result
   * 2. Try OpenAI GPT-4o-mini (primary)
   * 3. Try Groq Mixtral (fallback)
   * 4. Use template system (emergency)
   *
   * @async
   * @param {Object} params - Review generation parameters
   * @param {string} params.hotelName - Name of the hotel
   * @param {number} params.rating - Hotel rating from 1-5
   * @param {string} [params.tripType='leisure'] - Type of trip ('leisure', 'business', 'family', 'romantic')
   * @param {string[]} [params.highlights=[]] - Aspects to highlight in the review
   * @param {number} [params.nights=3] - Number of nights stayed
   * @param {string} [params.voice='friendly'] - Writing voice ('friendly', 'professional', 'enthusiastic', 'detailed')
   * @param {string} [params.language='en'] - Review language code
   * @returns {Promise<Object>} Generation result
   * @returns {string} returns.text - Generated review text
   * @returns {string} returns.source - Source used ('openai', 'groq', 'template', 'cache')
   * @returns {string|null} returns.model - Model name used (null for template)
   * @returns {number} returns.latency - Generation time in milliseconds
   * @returns {number} returns.cost - Cost in USD (0 for free sources)
   * @throws {Error} Never throws - always returns a result via fallback chain
   * @since 1.0.0
   *
   * @example
   * const result = await generator.generateReview({
   *   hotelName: 'Sunset Beach Resort',
   *   rating: 5,
   *   tripType: 'romantic',
   *   highlights: ['beachfront', 'spa', 'sunset views'],
   *   nights: 7,
   *   voice: 'enthusiastic'
   * });
   */
  async generateReview(params) {
    const startTime = performance.now();
    this.stats.requests++;

    // Check cache first
    const cacheKey = this.getCacheKey(params);
    if (this.cache.has(cacheKey)) {
      this.stats.cacheHits++;
      return {
        text: this.cache.get(cacheKey),
        source: 'cache',
        latency: performance.now() - startTime,
      };
    }

    // Try primary LLM (OpenAI)
    try {
      const review = await this.generateWithOpenAI(params);
      this.cacheResult(cacheKey, review);
      this.stats.successes++;
      this.stats.totalCost += this.models.primary.costPerRequest;

      const latency = performance.now() - startTime;
      this.updateAvgLatency(latency);

      return {
        text: review,
        source: 'openai',
        model: 'gpt-4o-mini',
        latency: latency,
        cost: this.models.primary.costPerRequest,
      };
    } catch (error) {
      // Log primary LLM failure for monitoring
      console.warn('Primary LLM (OpenAI) failed:', error.message);
      this.stats.failures++;
    }

    // Try fallback LLM (Groq)
    try {
      const review = await this.generateWithGroq(params);
      this.cacheResult(cacheKey, review);
      this.stats.successes++;

      const latency = performance.now() - startTime;
      this.updateAvgLatency(latency);

      return {
        text: review,
        source: 'groq',
        model: 'mixtral-8x7b',
        latency: latency,
        cost: 0,
      };
    } catch (error) {
      // Log fallback LLM failure for monitoring
      console.warn('Fallback LLM (Groq) failed:', error.message);
      this.stats.failures++;
    }

    // Emergency fallback to templates
    this.stats.failures++;
    const review = this.templateGenerator.generate(params);

    const latency = performance.now() - startTime;
    this.updateAvgLatency(latency);

    return {
      text: review,
      source: 'template',
      model: null,
      latency: latency,
      cost: 0,
    };
  }

  /**
   * Generate review using OpenAI GPT-4o-mini model
   *
   * @private
   * @async
   * @param {Object} params - Review generation parameters
   * @returns {Promise<string>} Generated review text
   * @throws {Error} Throws if OpenAI API call fails or API key missing
   * @since 1.0.0
   */
  async generateWithOpenAI(params) {
    const prompt = this.buildPrompt(params);

    const response = await this.fetchWithTimeout(
      this.models.primary.url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Security: No Authorization header - proxy handles API keys server-side
        },
        body: JSON.stringify({
          provider: 'openai', // Tell proxy which provider to use
          model: this.models.primary.model,
          messages: [
            {
              role: 'system',
              content: `You are a hotel review writer creating authentic, natural-sounding reviews.
                            Write in first person, be specific but not overly detailed.
                            Keep reviews between 150-200 words.
                            Include personal touches and specific observations.
                            Avoid clichés and overly promotional language.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 300,
          presence_penalty: 0.6,
          frequency_penalty: 0.3,
        }),
      },
      this.models.primary.timeout
    );

    if (!response.ok) {
      throw new Error(`OpenAI proxy error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Generate review using Groq Mixtral model (ultra-fast, free)
   *
   * @private
   * @async
   * @param {Object} params - Review generation parameters
   * @returns {Promise<string>} Generated review text
   * @throws {Error} Throws if Groq API call fails or API key missing
   * @since 1.0.0
   */
  async generateWithGroq(params) {
    const prompt = this.buildPrompt(params);

    const response = await this.fetchWithTimeout(
      this.models.fallback.url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Security: No Authorization header - proxy handles API keys server-side
        },
        body: JSON.stringify({
          provider: 'groq', // Tell proxy which provider to use
          model: this.models.fallback.model,
          messages: [
            {
              role: 'user',
              content: `Write a natural hotel review. ${prompt}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 250,
          stream: false,
        }),
      },
      this.models.fallback.timeout
    );

    if (!response.ok) {
      throw new Error(`Groq proxy error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Build a structured prompt from review parameters
   *
   * @private
   * @param {Object} params - Review generation parameters
   * @returns {string} Formatted prompt for LLM
   * @since 1.0.0
   */
  buildPrompt(params) {
    const {
      hotelName = 'Grand Hotel',
      rating = 5,
      tripType = 'leisure',
      highlights = [],
      nights = 3,
      voice = 'friendly',
      language = 'en',
    } = params;

    let prompt = `Write a ${this.getRatingTone(rating)} hotel review for ${hotelName}. `;

    // Add context
    prompt += `This was a ${nights}-night ${tripType} stay. `;

    // Add highlights if provided
    if (highlights.length > 0) {
      prompt += `Highlight these aspects: ${highlights.join(', ')}. `;
    }

    // Add voice instruction
    const voiceMap = {
      professional: 'Use a professional, businesslike tone.',
      friendly: 'Use a friendly, warm, conversational tone.',
      enthusiastic: 'Use an enthusiastic, excited, energetic tone.',
      detailed: 'Be detailed, thorough and analytical.',
    };
    prompt += voiceMap[voice] || voiceMap.friendly;

    // Language instruction
    if (language !== 'en') {
      prompt += ` Write in ${this.getLanguageName(language)}.`;
    }

    return prompt;
  }

  /**
   * Get tone description based on rating for prompt construction
   *
   * @private
   * @param {number} rating - Hotel rating from 1-5
   * @returns {string} Tone description for the rating
   * @since 1.0.0
   */
  getRatingTone(rating) {
    const tones = {
      5: 'very positive and enthusiastic',
      4: 'positive with minor observations',
      3: 'balanced with pros and cons',
      2: 'disappointed but constructive',
      1: 'negative but professional',
    };
    return tones[rating] || tones[3];
  }

  /**
   * Convert language code to full language name
   *
   * @private
   * @param {string} code - ISO language code (e.g., 'en', 'es', 'fr')
   * @returns {string} Full language name (e.g., 'English', 'Spanish', 'French')
   * @since 1.0.0
   */
  getLanguageName(code) {
    const languages = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      nl: 'Dutch',
      ja: 'Japanese',
      zh: 'Chinese',
      el: 'Greek',
    };
    return languages[code] || 'English';
  }

  /**
   * Perform HTTP fetch with automatic timeout handling
   *
   * @private
   * @async
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Response>} Fetch response
   * @throws {Error} Throws if request times out or fails
   * @since 1.0.0
   */
  async fetchWithTimeout(url, options, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Generate cache key from review parameters
   *
   * @private
   * @param {Object} params - Review generation parameters
   * @returns {string} JSON string cache key
   * @since 1.0.0
   */
  getCacheKey(params) {
    return JSON.stringify({
      hotel: params.hotelName,
      rating: params.rating,
      tripType: params.tripType,
      highlights: params.highlights?.sort(),
      voice: params.voice,
    });
  }

  /**
   * Cache a generated result with automatic expiration
   *
   * @private
   * @param {string} key - Cache key
   * @param {string} value - Generated review text to cache
   * @since 1.0.0
   */
  cacheResult(key, value) {
    this.cache.set(key, value);

    // Auto-clear after timeout
    setTimeout(() => {
      this.cache.delete(key);
    }, this.cacheTimeout);
  }

  /**
   * Update average latency statistics
   *
   * @private
   * @param {number} latency - Request latency in milliseconds
   * @since 1.0.0
   */
  updateAvgLatency(latency) {
    const total = this.stats.avgLatency * (this.stats.requests - 1) + latency;
    this.stats.avgLatency = total / this.stats.requests;
  }

  /**
   * Get comprehensive statistics about generator performance
   *
   * @returns {Object} Statistics object
   * @returns {number} returns.requests - Total requests made
   * @returns {number} returns.successes - Successful generations
   * @returns {number} returns.failures - Failed generations
   * @returns {number} returns.cacheHits - Cache hits
   * @returns {string} returns.successRate - Success rate percentage
   * @returns {string} returns.cacheHitRate - Cache hit rate percentage
   * @returns {string} returns.avgLatency - Average latency with units
   * @returns {string} returns.totalCost - Total cost with currency symbol
   * @since 1.0.0
   *
   * @example
   * const stats = generator.getStats();
   * console.log(`Success Rate: ${stats.successRate}`);
   * console.log(`Cache Hit Rate: ${stats.cacheHitRate}`);
   * console.log(`Average Latency: ${stats.avgLatency}`);
   * console.log(`Total Cost: ${stats.totalCost}`);
   */
  getStats() {
    return {
      ...this.stats,
      successRate: ((this.stats.successes / this.stats.requests) * 100).toFixed(1) + '%',
      cacheHitRate: ((this.stats.cacheHits / this.stats.requests) * 100).toFixed(1) + '%',
      avgLatency: Math.round(this.stats.avgLatency) + 'ms',
      totalCost: '$' + this.stats.totalCost.toFixed(4),
    };
  }

  /**
   * Update API keys and configuration at runtime
   *
   * @param {Object} config - Configuration updates
   * @param {string} [config.openaiKey] - New OpenAI API key
   * @param {string} [config.groqKey] - New Groq API key
   * @param {string} [config.proxyUrl] - New proxy URL
   * @since 1.0.0
   *
   * @example
   * generator.configure({
   *   proxyUrl: '/api/llm-proxy'
   * });
   */
  configure(config) {
    // Security: Never store API keys client-side - they're handled server-side via proxy
    if (config.proxyUrl) this.proxyUrl = config.proxyUrl;

    // Update model URLs to use secure proxy
    this.models.primary.url = this.proxyUrl;
    this.models.fallback.url = this.proxyUrl;
  }
}

/**
 * Template-based Review Generator (Emergency Fallback)
 *
 * A lightweight, deterministic review generator that creates reviews using
 * pre-defined templates. Used as the final fallback when all LLM providers
 * are unavailable, ensuring the application always produces results.
 *
 * @class TemplateReviewGenerator
 * @since 1.0.0
 * @author Hotel Review Generator Team
 *
 * @example
 * const templateGen = new TemplateReviewGenerator();
 * const review = templateGen.generate({
 *   hotelName: 'Beach Resort',
 *   rating: 4,
 *   tripType: 'family',
 *   highlights: ['pool', 'kids club'],
 *   nights: 5
 * });
 */
class TemplateReviewGenerator {
  /**
   * Generate a review using pre-defined templates
   *
   * @param {Object} params - Review generation parameters
   * @param {string} params.hotelName - Name of the hotel
   * @param {number} params.rating - Hotel rating from 1-5
   * @param {string} [params.tripType='leisure'] - Type of trip
   * @param {string[]} [params.highlights=[]] - Aspects to highlight
   * @param {number} [params.nights=3] - Number of nights stayed
   * @returns {string} Generated review text
   * @since 1.0.0
   *
   * @example
   * const review = generator.generate({
   *   hotelName: 'Grand Plaza',
   *   rating: 3,
   *   tripType: 'business',
   *   highlights: ['wifi', 'location'],
   *   nights: 2
   * });
   */
  generate(params) {
    const { hotelName, rating, tripType, highlights = [], nights } = params;

    // Simple template generation as emergency fallback
    const templates = {
      5: `My ${nights}-night stay at ${hotelName} was absolutely wonderful. ${this.highlightsToText(highlights)} Everything exceeded my expectations, and I can't wait to return.`,
      4: `I really enjoyed my ${nights}-night ${tripType} stay at ${hotelName}. ${this.highlightsToText(highlights)} While there were minor areas for improvement, overall it was a great experience.`,
      3: `My ${nights}-night stay at ${hotelName} was satisfactory. ${this.highlightsToText(highlights)} There were both positives and negatives, but it met my basic needs.`,
      2: `Unfortunately, my ${nights}-night stay at ${hotelName} didn't meet expectations. ${this.highlightsToText(highlights)} Several improvements are needed.`,
      1: `I was disappointed with my stay at ${hotelName}. Despite ${nights} nights there, the experience fell short in multiple areas.`,
    };

    return templates[rating] || templates[3];
  }

  /**
   * Convert highlights array to natural language text
   *
   * @private
   * @param {string[]} highlights - Array of highlight strings
   * @returns {string} Natural language description of highlights
   * @since 1.0.0
   */
  highlightsToText(highlights) {
    if (highlights.length === 0) return 'The overall experience was as expected.';
    if (highlights.length === 1) return `The ${highlights[0]} stood out.`;
    if (highlights.length === 2) return `The ${highlights[0]} and ${highlights[1]} were notable.`;
    return `Several aspects impressed me, including the ${highlights.slice(0, -1).join(', ')}, and ${highlights[highlights.length - 1]}.`;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LLMReviewGenerator, TemplateReviewGenerator };
}
