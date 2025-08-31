/**
 * Hybrid Review Generator with Intelligent Routing
 * Manages LLM calls, fallbacks, caching, and performance monitoring
 */

class HybridGenerator {
  constructor(config = {}) {
    // API Configuration
    this.config = {
      openai: {
        key: config.openaiKey || process.env.OPENAI_API_KEY,
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4o-mini',
        timeout: 3000,
        maxRetries: 2,
        costPer1kTokens: 0.00015,
      },
      groq: {
        key: config.groqKey || process.env.GROQ_API_KEY,
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

    // Initialize services
    this.cache = new Map();
    this.metrics = this.initializeMetrics();
    this.templateGenerator = new TemplateGenerator();

    // Performance monitoring
    this.performanceObserver = this.setupPerformanceObserver();

    // Cost tracking
    this.costTracker = {
      daily: new Map(),
      monthly: new Map(),
      total: 0,
    };

    // Initialize
    this.initialize();
  }

  /**
   * Initialize the hybrid generator
   */
  async initialize() {
    // Validate API keys
    this.availability = await this.checkAvailability();

    // Load historical metrics
    this.loadMetrics();

    // Start monitoring
    if (this.config.monitoring.enabled) {
      this.startMonitoring();
    }

  }

  /**
   * Main generation method with intelligent routing
   */
  async generate(params) {
    const startTime = performance.now();
    const requestId = this.generateRequestId();

    try {
      // Record request
      this.recordMetric('requests.total', 1);

      // Check cache first
      const cached = await this.checkCache(params);
      if (cached) {
        this.recordMetric('cache.hits', 1);
        return this.formatResponse(cached, 'cache', performance.now() - startTime, requestId);
      }

      // A/B Testing logic
      if (this.config.abTesting.enabled) {
        const useTemplate = !this.shouldUseLLM();
        if (useTemplate) {
          const result = await this.generateFromTemplate(params);
          this.recordABTestResult('template', requestId);
          return this.formatResponse(result, 'template', performance.now() - startTime, requestId);
        }
      }

      // Try primary LLM (OpenAI)
      if (this.availability.openai) {
        try {
          const result = await this.callOpenAI(params);
          await this.cacheResult(params, result);
          this.recordMetric('llm.openai.success', 1);
          this.trackCost('openai', result.tokens);
          return this.formatResponse(
            result.text,
            'openai',
            performance.now() - startTime,
            requestId
          );
        } catch (error) {
          this.recordMetric('llm.openai.errors', 1);
          this.logError('OpenAI failed', error, requestId);
        }
      }

      // Try fallback LLM (Groq)
      if (this.availability.groq) {
        try {
          const result = await this.callGroq(params);
          await this.cacheResult(params, result);
          this.recordMetric('llm.groq.success', 1);
          return this.formatResponse(result.text, 'groq', performance.now() - startTime, requestId);
        } catch (error) {
          this.recordMetric('llm.groq.errors', 1);
          this.logError('Groq failed', error, requestId);
        }
      }

      // Emergency fallback to templates
      this.recordMetric('fallback.template', 1);
      const templateResult = await this.generateFromTemplate(params);
      return this.formatResponse(
        templateResult,
        'template',
        performance.now() - startTime,
        requestId
      );
    } catch (error) {
      this.recordMetric('errors.total', 1);
      this.logError('Generation failed', error, requestId);

      // Last resort fallback
      const fallback = this.getEmergencyFallback(params);
      return this.formatResponse(fallback, 'emergency', performance.now() - startTime, requestId);
    } finally {
      // Record latency
      const latency = performance.now() - startTime;
      this.recordMetric('latency.ms', latency);

      // Check alert thresholds
      this.checkAlertThresholds();
    }
  }

  /**
   * Call OpenAI API (with proxy support)
   */
  async callOpenAI(params) {
    const prompt = this.buildPrompt(params);
    const endpoint = this.config.proxy.enabled
      ? `${this.config.proxy.url}/openai`
      : this.config.openai.endpoint;

    const requestBody = {
      model: this.config.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are a hotel review writer. Create authentic, natural-sounding reviews.',
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
    };

    const response = await this.fetchWithRetry(
      endpoint,
      {
        method: 'POST',
        headers: this.getHeaders('openai'),
        body: JSON.stringify(requestBody),
      },
      this.config.openai.maxRetries,
      this.config.openai.timeout
    );

    const data = await response.json();

    return {
      text: data.choices[0].message.content,
      tokens: data.usage?.total_tokens || 0,
      model: this.config.openai.model,
    };
  }

  /**
   * Call Groq API (with proxy support)
   */
  async callGroq(params) {
    const prompt = this.buildPrompt(params);
    const endpoint = this.config.proxy.enabled
      ? `${this.config.proxy.url}/groq`
      : this.config.groq.endpoint;

    const requestBody = {
      model: this.config.groq.model,
      messages: [
        {
          role: 'user',
          content: `Write a natural hotel review. ${prompt}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 250,
      stream: false,
    };

    const response = await this.fetchWithRetry(
      endpoint,
      {
        method: 'POST',
        headers: this.getHeaders('groq'),
        body: JSON.stringify(requestBody),
      },
      this.config.groq.maxRetries,
      this.config.groq.timeout
    );

    const data = await response.json();

    return {
      text: data.choices[0].message.content,
      tokens: data.usage?.total_tokens || 0,
      model: this.config.groq.model,
    };
  }

  /**
   * Fetch with retry logic
   */
  async fetchWithRetry(url, options, maxRetries, timeout) {
    let lastError;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
      } catch (error) {
        lastError = error;

        if (i < maxRetries) {
          // Exponential backoff
          await this.sleep(Math.pow(2, i) * 1000);
        }
      }
    }

    throw lastError;
  }

  /**
   * Generate from template system
   */
  async generateFromTemplate(params) {
    return this.templateGenerator.generate(params);
  }

  /**
   * Get emergency fallback response
   */
  getEmergencyFallback(params) {
    const { hotelName, rating } = params;
    return `Thank you for staying at ${hotelName}. ${
      rating >= 4 ? 'We had a wonderful experience.' : 'Our stay was satisfactory.'
    } We appreciate the hospitality and service provided.`;
  }

  /**
   * Build prompt for LLM
   */
  buildPrompt(params) {
    const { hotelName, rating, tripType, highlights, nights = 3, language = 'en' } = params;

    let prompt = `Write a ${this.getRatingTone(rating)} review for ${hotelName}. `;
    prompt += `This was a ${nights}-night ${tripType} stay. `;

    if (highlights && highlights.length > 0) {
      prompt += `Highlight these aspects: ${highlights.join(', ')}. `;
    }

    prompt += `Write naturally and authentically. `;

    if (language !== 'en') {
      prompt += `Write in ${this.getLanguageName(language)}.`;
    }

    return prompt;
  }

  /**
   * Get rating tone
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
   * Get language name
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
    };
    return languages[code] || 'English';
  }

  /**
   * Cache management
   */
  async checkCache(params) {
    if (!this.config.cache.enabled) return null;

    const key = this.getCacheKey(params);
    const cached = this.cache.get(key);

    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }

    return null;
  }

  async cacheResult(params, result) {
    if (!this.config.cache.enabled) return;

    const key = this.getCacheKey(params);

    // Enforce cache size limit
    if (this.cache.size >= this.config.cache.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value: result.text,
      expires: Date.now() + this.config.cache.ttl,
    });
  }

  getCacheKey(params) {
    return JSON.stringify({
      hotel: params.hotelName,
      rating: params.rating,
      tripType: params.tripType,
      highlights: params.highlights?.sort(),
    });
  }

  /**
   * Performance monitoring
   */
  setupPerformanceObserver() {
    if (typeof PerformanceObserver === 'undefined') return null;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('llm-generation')) {
          this.recordMetric('performance.duration', entry.duration);
        }
      }
    });

    observer.observe({ entryTypes: ['measure'] });
    return observer;
  }

  /**
   * Metrics management
   */
  initializeMetrics() {
    return {
      requests: { total: 0, success: 0, errors: 0 },
      cache: { hits: 0, misses: 0 },
      llm: {
        openai: { success: 0, errors: 0, totalTokens: 0 },
        groq: { success: 0, errors: 0 },
      },
      fallback: { template: 0, emergency: 0 },
      latency: { sum: 0, count: 0, max: 0, min: Infinity },
      cost: { daily: 0, monthly: 0, total: 0 },
      abTesting: { llm: 0, template: 0 },
    };
  }

  recordMetric(path, value) {
    const parts = path.split('.');
    let current = this.metrics;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    const key = parts[parts.length - 1];
    if (key === 'ms') {
      // Handle latency metrics
      current.sum = (current.sum || 0) + value;
      current.count = (current.count || 0) + 1;
      current.max = Math.max(current.max || 0, value);
      current.min = Math.min(current.min || Infinity, value);
    } else {
      current[key] = (current[key] || 0) + value;
    }

    // Persist metrics
    this.saveMetrics();
  }

  /**
   * Cost tracking
   */
  trackCost(provider, tokens) {
    if (provider === 'openai') {
      const cost = (tokens / 1000) * this.config.openai.costPer1kTokens;
      this.updateCostTracking(cost);
    }
    // Groq is free tier, no cost tracking needed
  }

  updateCostTracking(cost) {
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7);

    // Update daily cost
    const dailyCost = this.costTracker.daily.get(today) || 0;
    this.costTracker.daily.set(today, dailyCost + cost);

    // Update monthly cost
    const monthlyCost = this.costTracker.monthly.get(month) || 0;
    this.costTracker.monthly.set(month, monthlyCost + cost);

    // Update total cost
    this.costTracker.total += cost;

    // Update metrics
    this.metrics.cost.daily = this.costTracker.daily.get(today);
    this.metrics.cost.monthly = this.costTracker.monthly.get(month);
    this.metrics.cost.total = this.costTracker.total;
  }

  /**
   * A/B Testing
   */
  shouldUseLLM() {
    if (!this.config.abTesting.enabled) return true;

    const random = Math.random() * 100;
    return random < this.config.abTesting.llmPercentage;
  }

  recordABTestResult(variant, requestId) {
    if (!this.config.abTesting.trackingEnabled) return;

    this.metrics.abTesting[variant] = (this.metrics.abTesting[variant] || 0) + 1;

    // Send to analytics if configured
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('AB_Test_Variant', {
        test: 'llm_vs_template',
        variant: variant,
        requestId: requestId,
      });
    }
  }

  /**
   * Alert monitoring
   */
  checkAlertThresholds() {
    const { alertThresholds } = this.config.monitoring;

    // Check error rate
    const errorRate = this.metrics.requests.errors / this.metrics.requests.total;
    if (errorRate > alertThresholds.errorRate) {
      this.sendAlert('error_rate', `Error rate ${(errorRate * 100).toFixed(1)}% exceeds threshold`);
    }

    // Check latency
    const avgLatency = this.metrics.latency.sum / this.metrics.latency.count;
    if (avgLatency > alertThresholds.latency) {
      this.sendAlert('latency', `Average latency ${avgLatency.toFixed(0)}ms exceeds threshold`);
    }

    // Check daily cost
    if (this.metrics.cost.daily > alertThresholds.costPerDay) {
      this.sendAlert('cost', `Daily cost $${this.metrics.cost.daily.toFixed(2)} exceeds threshold`);
    }
  }

  sendAlert(type, message) {

    // Send to monitoring service if configured
    if (typeof window !== 'undefined' && window.monitoring) {
      window.monitoring.alert({
        type: type,
        message: message,
        timestamp: new Date().toISOString(),
        metrics: this.getMetricsSummary(),
      });
    }
  }

  /**
   * Monitoring lifecycle
   */
  startMonitoring() {
    // Report metrics every minute
    this.monitoringInterval = setInterval(() => {
      this.reportMetrics();
    }, 60000);

    // Clean old cache entries every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupCache();
    }, 3600000);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  reportMetrics() {
    const summary = this.getMetricsSummary();

    // Send to monitoring service
    if (typeof window !== 'undefined' && window.monitoring) {
      window.monitoring.report(summary);
    }
  }

  /**
   * Utility methods
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getHeaders(provider) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (!this.config.proxy.enabled) {
      // Direct API calls need auth headers
      if (provider === 'openai') {
        headers['Authorization'] = `Bearer ${this.config.openai.key}`;
      } else if (provider === 'groq') {
        headers['Authorization'] = `Bearer ${this.config.groq.key}`;
      }
    }
    // Proxy handles auth on server side

    return headers;
  }

  formatResponse(text, source, latency, requestId) {
    return {
      text: text,
      source: source,
      latency: Math.round(latency),
      requestId: requestId,
      timestamp: new Date().toISOString(),
      cached: source === 'cache',
      cost: source === 'openai' ? this.estimateCost(text) : 0,
    };
  }

  estimateCost(text) {
    // Rough estimate: ~4 characters per token
    const estimatedTokens = text.length / 4;
    return (estimatedTokens / 1000) * this.config.openai.costPer1kTokens;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  logError(message, error, requestId) {
    console.error(`[${requestId}] ${message}:`, error);

    // Send to error tracking service
    if (typeof window !== 'undefined' && window.errorTracking) {
      window.errorTracking.logError({
        message: message,
        error: error.message,
        stack: error.stack,
        requestId: requestId,
        timestamp: new Date().toISOString(),
      });
    }
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

      }
    }

    // Check Groq
    if (this.config.groq.key && this.config.groq.key !== '') {
      try {
        // Quick validation without actual API call
        availability.groq = true;
      } catch (error) {

      }
    }

    return availability;
  }

  /**
   * Persistence methods
   */
  saveMetrics() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('hybrid_metrics', JSON.stringify(this.metrics));
        localStorage.setItem(
          'hybrid_cost',
          JSON.stringify({
            daily: Array.from(this.costTracker.daily.entries()),
            monthly: Array.from(this.costTracker.monthly.entries()),
            total: this.costTracker.total,
          })
        );
      } catch (error) {

      }
    }
  }

  loadMetrics() {
    if (typeof localStorage !== 'undefined') {
      try {
        const metricsStr = localStorage.getItem('hybrid_metrics');
        if (metricsStr) {
          this.metrics = JSON.parse(metricsStr);
        }

        const costStr = localStorage.getItem('hybrid_cost');
        if (costStr) {
          const costData = JSON.parse(costStr);
          this.costTracker.daily = new Map(costData.daily);
          this.costTracker.monthly = new Map(costData.monthly);
          this.costTracker.total = costData.total;
        }
      } catch (error) {

      }
    }
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    const avgLatency =
      this.metrics.latency.count > 0 ? this.metrics.latency.sum / this.metrics.latency.count : 0;

    const successRate =
      this.metrics.requests.total > 0
        ? (this.metrics.requests.total - this.metrics.requests.errors) / this.metrics.requests.total
        : 0;

    const cacheHitRate =
      this.metrics.cache.hits + this.metrics.cache.misses > 0
        ? this.metrics.cache.hits / (this.metrics.cache.hits + this.metrics.cache.misses)
        : 0;

    return {
      requests: this.metrics.requests,
      successRate: (successRate * 100).toFixed(1) + '%',
      cacheHitRate: (cacheHitRate * 100).toFixed(1) + '%',
      avgLatency: avgLatency.toFixed(0) + 'ms',
      maxLatency: this.metrics.latency.max + 'ms',
      cost: {
        daily: '$' + this.metrics.cost.daily.toFixed(4),
        monthly: '$' + this.metrics.cost.monthly.toFixed(2),
        total: '$' + this.metrics.cost.total.toFixed(2),
      },
      providers: {
        openai: this.metrics.llm.openai,
        groq: this.metrics.llm.groq,
      },
      fallbacks: this.metrics.fallback,
      abTesting: this.config.abTesting.enabled ? this.metrics.abTesting : null,
      availability: this.availability,
    };
  }

  /**
   * Cleanup methods
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expires < now) {
        this.cache.delete(key);
      }
    }
  }

  destroy() {
    this.stopMonitoring();
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.cache.clear();
  }
}

/**
 * Template Generator (for fallback)
 */
class TemplateGenerator {
  generate(params) {
    const { hotelName, rating, tripType, highlights = [], nights = 3 } = params;

    const templates = {
      5: [
        `My ${nights}-night stay at ${hotelName} was absolutely wonderful! ${this.highlightsToText(highlights)} The ${tripType} trip exceeded all my expectations. I would definitely recommend this hotel to anyone looking for an exceptional experience.`,
        `${hotelName} provided an outstanding ${nights}-night experience! ${this.highlightsToText(highlights)} Perfect for ${tripType} travelers. The attention to detail and quality of service made this truly memorable. Will definitely return!`,
      ],
      4: [
        `I had a great ${nights}-night stay at ${hotelName}. ${this.highlightsToText(highlights)} While there were minor areas for improvement, overall it was a very good ${tripType} experience. Would recommend.`,
        `${hotelName} was really good for my ${nights}-night ${tripType} trip. ${this.highlightsToText(highlights)} Most aspects met or exceeded expectations.`,
      ],
      3: [
        `My ${nights}-night stay at ${hotelName} was satisfactory. ${this.highlightsToText(highlights)} Some aspects could be better, but it met my basic needs for a ${tripType} trip.`,
      ],
      2: [
        `Unfortunately, my stay at ${hotelName} didn't meet expectations. While ${this.highlightsToText(highlights, true)}, several areas need improvement for ${tripType} travelers.`,
      ],
      1: [
        `I was disappointed with ${hotelName}. Despite ${this.highlightsToText(highlights, true)}, significant improvements are needed across multiple areas.`,
      ],
    };

    const ratingTemplates = templates[rating] || templates[3];
    return ratingTemplates[Math.floor(Math.random() * ratingTemplates.length)];
  }

  highlightsToText(highlights, minimal = false) {
    if (highlights.length === 0) return 'The overall experience was as expected.';

    const highlightMap = {
      location: 'the location was perfect',
      cleanliness: 'the room was spotlessly clean',
      comfort: 'the bed was extremely comfortable',
      service: 'the staff provided excellent service',
      breakfast: 'the breakfast was delicious',
      wifi: 'the WiFi was fast and reliable',
      value: 'it offered great value for money',
      amenities: 'the amenities were modern and well-maintained',
    };

    const sentences = highlights.map((h) => highlightMap[h] || h);

    if (minimal) return sentences[0];

    if (sentences.length === 1) {
      return sentences[0].charAt(0).toUpperCase() + sentences[0].slice(1) + '.';
    } else if (sentences.length === 2) {
      return (
        sentences[0].charAt(0).toUpperCase() + sentences[0].slice(1) + ' and ' + sentences[1] + '.'
      );
    } else {
      const last = sentences.pop();
      return (
        sentences.join(', ').charAt(0).toUpperCase() +
        sentences.join(', ').slice(1) +
        ', and ' +
        last +
        '.'
      );
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HybridGenerator, TemplateGenerator };
}
