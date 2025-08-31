/**
 * Unit Tests for HybridGenerator Service
 * Tests all core functionality, error handling, and edge cases
 */

const { HybridGenerator, TemplateGenerator } = require('../../src/services/HybridGenerator.js');

// Mock performance.now for consistent timing
const mockPerformance = {
  now: jest.fn(() => 1000)
};
global.performance = mockPerformance;

// Use the global localStorage mock from setup.js

// Mock AbortController
global.AbortController = jest.fn(() => ({
  abort: jest.fn(),
  signal: { aborted: false }
}));

describe('HybridGenerator', () => {
  let generator;
  let fetchMock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
    
    // Reset localStorage mocks (global from setup.js)
    if (localStorage.getItem.mockReturnValue) {
      localStorage.getItem.mockReturnValue(null);
    }
    if (localStorage.setItem.mockClear) {
      localStorage.setItem.mockClear();
      localStorage.removeItem.mockClear();
      localStorage.clear.mockClear();
    }
    
    // Mock fetch
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    
    // Initialize generator with test config
    generator = new HybridGenerator({
      openaiKey: 'test-openai-key',
      groqKey: 'test-groq-key',
      useProxy: false
    });
  });

  afterEach(() => {
    if (generator) {
      generator.destroy();
    }
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with default configuration', () => {
      const gen = new HybridGenerator();
      expect(gen.config.openai.model).toBe('gpt-4o-mini');
      expect(gen.config.groq.model).toBe('mixtral-8x7b-32768');
      expect(gen.config.cache.enabled).toBe(true);
    });

    test('should initialize with custom configuration', () => {
      const config = {
        openaiKey: 'custom-key',
        enableAB: true
      };
      const gen = new HybridGenerator(config);
      
      expect(gen.config.openai.key).toBe('custom-key');
      expect(gen.config.abTesting.enabled).toBe(true);
    });

    test('should initialize metrics properly', () => {
      expect(generator.metrics.requests.total).toBe(0);
      expect(generator.metrics.cache.hits).toBe(0);
      expect(generator.cache).toBeInstanceOf(Map);
    });
  });

  describe('Availability Checking', () => {
    test('should detect OpenAI availability when key is provided', async () => {
      const availability = await generator.checkAvailability();
      expect(availability.openai).toBe(true);
      expect(availability.template).toBe(true);
    });

    test('should detect unavailability when keys are missing', async () => {
      const gen = new HybridGenerator({ openaiKey: '', groqKey: '' });
      const availability = await gen.checkAvailability();
      
      expect(availability.openai).toBe(false);
      expect(availability.groq).toBe(false);
      expect(availability.template).toBe(true);
    });
  });

  describe('Cache Management', () => {
    const testParams = {
      hotelName: 'Test Hotel',
      rating: 5,
      tripType: 'business',
      highlights: ['location', 'service']
    };

    test('should generate cache key consistently', () => {
      const key1 = generator.getCacheKey(testParams);
      const key2 = generator.getCacheKey(testParams);
      
      expect(key1).toBe(key2);
      expect(key1).toContain('Test Hotel');
    });

    test('should cache and retrieve results', async () => {
      const result = 'Test review text';
      await generator.cacheResult(testParams, { text: result });
      
      const cached = await generator.checkCache(testParams);
      expect(cached).toBe(result);
    });

    test('should respect cache expiry', async () => {
      const result = 'Test review text';
      await generator.cacheResult(testParams, { text: result });
      
      // Mock expired cache
      const key = generator.getCacheKey(testParams);
      const cachedItem = generator.cache.get(key);
      cachedItem.expires = Date.now() - 1000; // Expired 1 second ago
      
      const cached = await generator.checkCache(testParams);
      expect(cached).toBeNull();
    });

    test('should enforce cache size limit', async () => {
      // Fill cache beyond limit
      for (let i = 0; i < generator.config.cache.maxSize + 5; i++) {
        const params = { hotelName: `Hotel ${i}`, rating: 5 };
        await generator.cacheResult(params, { text: `Review ${i}` });
      }
      
      expect(generator.cache.size).toBeLessThanOrEqual(generator.config.cache.maxSize);
    });
  });

  describe('Prompt Building', () => {
    test('should build basic prompt with required parameters', () => {
      const params = {
        hotelName: 'Grand Hotel',
        rating: 4,
        tripType: 'leisure',
        highlights: ['location', 'service'],
        nights: 2
      };
      
      const prompt = generator.buildPrompt(params);
      
      expect(prompt).toContain('Grand Hotel');
      expect(prompt).toContain('positive with minor observations');
      expect(prompt).toContain('2-night leisure stay');
      expect(prompt).toContain('location, service');
    });

    test('should handle different rating tones', () => {
      const ratings = [1, 2, 3, 4, 5];
      const expectedTones = [
        'negative but professional',
        'disappointed but constructive',
        'balanced with pros and cons',
        'positive with minor observations',
        'very positive and enthusiastic'
      ];
      
      ratings.forEach((rating, index) => {
        const tone = generator.getRatingTone(rating);
        expect(tone).toBe(expectedTones[index]);
      });
    });

    test('should handle language specification', () => {
      const params = { hotelName: 'Hotel', rating: 5, language: 'es' };
      const prompt = generator.buildPrompt(params);
      
      expect(prompt).toContain('Write in Spanish');
    });

    test('should handle empty highlights gracefully', () => {
      const params = {
        hotelName: 'Test Hotel',
        rating: 5,
        tripType: 'business',
        highlights: []
      };
      
      const prompt = generator.buildPrompt(params);
      expect(prompt).not.toContain('Highlight these aspects:');
    });
  });

  describe('OpenAI API Integration', () => {
    test('should successfully call OpenAI API', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Great hotel review!' } }],
          usage: { total_tokens: 150 }
        })
      };
      fetchMock.mockResolvedValue(mockResponse);
      
      const params = { hotelName: 'Test Hotel', rating: 5 };
      const result = await generator.callOpenAI(params);
      
      expect(result.text).toBe('Great hotel review!');
      expect(result.tokens).toBe(150);
      expect(result.model).toBe('gpt-4o-mini');
    });

    test('should handle OpenAI API errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429
      });
      
      const params = { hotelName: 'Test Hotel', rating: 5 };
      
      await expect(generator.callOpenAI(params)).rejects.toThrow('HTTP error! status: 429');
    });

    test('should include proper headers for direct API calls', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test' } }],
          usage: { total_tokens: 50 }
        })
      });
      
      await generator.callOpenAI({ hotelName: 'Test', rating: 5 });
      
      const [url, options] = fetchMock.mock.calls[0];
      expect(options.headers.Authorization).toBe('Bearer test-openai-key');
      expect(options.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Groq API Integration', () => {
    test('should successfully call Groq API', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Fast hotel review!' } }],
          usage: { total_tokens: 100 }
        })
      };
      fetchMock.mockResolvedValue(mockResponse);
      
      const params = { hotelName: 'Test Hotel', rating: 4 };
      const result = await generator.callGroq(params);
      
      expect(result.text).toBe('Fast hotel review!');
      expect(result.tokens).toBe(100);
      expect(result.model).toBe('mixtral-8x7b-32768');
    });

    test('should handle Groq API errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500
      });
      
      const params = { hotelName: 'Test Hotel', rating: 5 };
      
      await expect(generator.callGroq(params)).rejects.toThrow('HTTP error! status: 500');
    });
  });

  describe('Fetch with Retry Logic', () => {
    test('should retry failed requests', async () => {
      fetchMock
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true });
      
      const result = await generator.fetchWithRetry('https://test.com', {}, 2, 5000);
      
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(result.ok).toBe(true);
    });

    test('should handle timeout', async () => {
      fetchMock.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 2000))
      );
      
      await expect(
        generator.fetchWithRetry('https://test.com', {}, 0, 100)
      ).rejects.toThrow();
    });

    test('should throw last error after max retries', async () => {
      const testError = new Error('Persistent error');
      fetchMock.mockRejectedValue(testError);
      
      await expect(
        generator.fetchWithRetry('https://test.com', {}, 2, 1000)
      ).rejects.toThrow('Persistent error');
      
      expect(fetchMock).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Main Generation Method', () => {
    beforeEach(() => {
      // Mock successful API responses by default
      fetchMock.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Generated review' } }],
          usage: { total_tokens: 100 }
        })
      });
    });

    test('should return cached result when available', async () => {
      const params = { hotelName: 'Test Hotel', rating: 5 };
      
      // Pre-populate cache
      await generator.cacheResult(params, { text: 'Cached review' });
      
      const result = await generator.generate(params);
      
      expect(result.text).toBe('Cached review');
      expect(result.source).toBe('cache');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    test('should try OpenAI first when available', async () => {
      const params = { hotelName: 'Test Hotel', rating: 5 };
      
      const result = await generator.generate(params);
      
      expect(result.text).toBe('Generated review');
      expect(result.source).toBe('openai');
      expect(result.cost).toBeGreaterThan(0);
    });

    test('should fallback to Groq when OpenAI fails', async () => {
      // Clear cache and disable A/B testing to ensure clean API calls
      generator.cache.clear();
      generator.config.abTesting.enabled = false;
      
      // OpenAI has retry logic, so we need to fail it multiple times
      // Default maxRetries is likely 2, so we need 3 failures total (initial + 2 retries)
      fetchMock
        .mockRejectedValueOnce(new Error('OpenAI error 1'))
        .mockRejectedValueOnce(new Error('OpenAI error 2'))
        .mockRejectedValueOnce(new Error('OpenAI error 3'))
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Groq review' } }],
            usage: { total_tokens: 80 }
          })
        });
      
      // Use unique parameters to avoid cache hits from other tests
      const params = { hotelName: 'Unique Test Hotel for Groq', rating: 4 };
      const result = await generator.generate(params);
      
      expect(result.text).toBe('Groq review');
      expect(result.source).toBe('groq');
    });

    test('should fallback to template when all APIs fail', async () => {
      fetchMock.mockRejectedValue(new Error('API error'));
      
      const params = { hotelName: 'Test Hotel', rating: 5 };
      const result = await generator.generate(params);
      
      expect(result.source).toBe('template');
      expect(result.text).toContain('Test Hotel');
    });

    test('should use emergency fallback when everything fails', async () => {
      // Mock template generator to throw
      generator.templateGenerator.generate = jest.fn().mockImplementation(() => {
        throw new Error('Template error');
      });
      
      fetchMock.mockRejectedValue(new Error('API error'));
      
      const params = { hotelName: 'Test Hotel', rating: 5 };
      const result = await generator.generate(params);
      
      expect(result.source).toBe('emergency');
      expect(result.text).toContain('Test Hotel');
    });
  });

  describe('A/B Testing', () => {
    test('should determine LLM usage based on percentage', () => {
      const gen = new HybridGenerator({ enableAB: true });
      gen.config.abTesting.llmPercentage = 0; // Always use template
      
      expect(gen.shouldUseLLM()).toBe(false);
      
      gen.config.abTesting.llmPercentage = 100; // Always use LLM
      expect(gen.shouldUseLLM()).toBe(true);
    });

    test('should record A/B test results', () => {
      const gen = new HybridGenerator({ enableAB: true });
      gen.recordABTestResult('template', 'test-123');
      
      expect(gen.metrics.abTesting.template).toBe(1);
    });

    test('should use template when A/B test determines', async () => {
      const gen = new HybridGenerator({ enableAB: true });
      gen.config.abTesting.llmPercentage = 0; // Force template usage
      
      const params = { hotelName: 'Test Hotel', rating: 5 };
      const result = await gen.generate(params);
      
      expect(result.source).toBe('template');
    });
  });

  describe('Metrics and Statistics', () => {
    test('should record request metrics', async () => {
      const params = { hotelName: 'Test Hotel', rating: 5 };
      
      await generator.generate(params);
      
      expect(generator.metrics.requests.total).toBe(1);
    });

    test('should track costs for OpenAI', () => {
      generator.trackCost('openai', 1000);
      
      expect(generator.metrics.cost.total).toBeGreaterThan(0);
    });

    test('should not track costs for Groq', () => {
      const initialCost = generator.metrics.cost.total;
      generator.trackCost('groq', 1000);
      
      expect(generator.metrics.cost.total).toBe(initialCost);
    });

    test('should generate metrics summary', () => {
      generator.metrics.requests.total = 10;
      generator.metrics.requests.errors = 1;
      generator.metrics.cache.hits = 5;
      generator.metrics.cache.misses = 3;
      generator.metrics.latency.sum = 5000;
      generator.metrics.latency.count = 10;
      
      const summary = generator.getMetricsSummary();
      
      expect(summary.successRate).toBe('90.0%');
      expect(summary.cacheHitRate).toBe('62.5%');
      expect(summary.avgLatency).toBe('500ms');
    });
  });

  describe('Error Handling and Monitoring', () => {
    test('should log errors with proper context', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      generator.logError('Test error', new Error('Something went wrong'), 'req-123');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[req-123] Test error:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    test('should check alert thresholds', () => {
      // Mock sendAlert
      generator.sendAlert = jest.fn();
      
      // Simulate high error rate
      generator.metrics.requests.total = 10;
      generator.metrics.requests.errors = 5; // 50% error rate
      
      generator.checkAlertThresholds();
      
      expect(generator.sendAlert).toHaveBeenCalledWith(
        'error_rate',
        expect.stringContaining('50.0%')
      );
    });
  });

  describe('Persistence', () => {
    test('should save metrics to localStorage', () => {
      const setItemSpy = jest.spyOn(localStorage, 'setItem');
      
      generator.saveMetrics();
      
      expect(setItemSpy).toHaveBeenCalledWith(
        'hybrid_metrics',
        expect.any(String)
      );
      
      setItemSpy.mockRestore();
    });

    test('should load metrics from localStorage', () => {
      const mockMetrics = { requests: { total: 5 } };
      const getItemSpy = jest.spyOn(localStorage, 'getItem').mockImplementation((key) => {
        if (key === 'hybrid_metrics') {
          return JSON.stringify(mockMetrics);
        }
        return null;
      });
      
      generator.loadMetrics();
      
      expect(generator.metrics.requests.total).toBe(5);
      
      getItemSpy.mockRestore();
    });

    test('should handle localStorage errors gracefully', () => {
      const setItemSpy = jest.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      expect(() => generator.saveMetrics()).not.toThrow();
      
      setItemSpy.mockRestore();
    });
  });

  describe('Cleanup and Monitoring', () => {
    test('should start monitoring with intervals', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      
      generator.startMonitoring();
      
      expect(setIntervalSpy).toHaveBeenCalledTimes(2); // Metrics and cleanup intervals
      
      setIntervalSpy.mockRestore();
    });

    test('should stop monitoring and clear intervals', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      generator.startMonitoring();
      generator.stopMonitoring();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      
      clearIntervalSpy.mockRestore();
    });

    test('should clean up expired cache entries', () => {
      // Add expired entry
      generator.cache.set('expired', { expires: Date.now() - 1000 });
      generator.cache.set('valid', { expires: Date.now() + 1000 });
      
      generator.cleanupCache();
      
      expect(generator.cache.has('expired')).toBe(false);
      expect(generator.cache.has('valid')).toBe(true);
    });

    test('should destroy instance properly', () => {
      generator.startMonitoring();
      generator.cache.set('test', 'value');
      
      generator.destroy();
      
      expect(generator.cache.size).toBe(0);
    });
  });

  describe('Utility Methods', () => {
    test('should generate unique request IDs', () => {
      const id1 = generator.generateRequestId();
      const id2 = generator.generateRequestId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toContain('req_');
    });

    test('should get proper headers for different providers', () => {
      const openaiHeaders = generator.getHeaders('openai');
      expect(openaiHeaders.Authorization).toBe('Bearer test-openai-key');
      
      const groqHeaders = generator.getHeaders('groq');
      expect(groqHeaders.Authorization).toBe('Bearer test-groq-key');
    });

    test('should format response properly', () => {
      const response = generator.formatResponse('Test text', 'openai', 1500, 'req-123');
      
      expect(response.text).toBe('Test text');
      expect(response.source).toBe('openai');
      expect(response.latency).toBe(1500);
      expect(response.requestId).toBe('req-123');
      expect(response.cached).toBe(false);
      expect(response.cost).toBeGreaterThan(0);
    });

    test('should estimate costs correctly', () => {
      const shortText = 'Short review';
      const longText = 'A'.repeat(400); // ~100 tokens
      
      const shortCost = generator.estimateCost(shortText);
      const longCost = generator.estimateCost(longText);
      
      expect(longCost).toBeGreaterThan(shortCost);
    });

    test('should handle sleep utility', async () => {
      const start = Date.now();
      await generator.sleep(100);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(100);
    });
  });
});

describe('TemplateGenerator', () => {
  let templateGenerator;

  beforeEach(() => {
    templateGenerator = new TemplateGenerator();
  });

  describe('Template Generation', () => {
    test('should generate review from template', () => {
      const params = {
        hotelName: 'Grand Resort',
        rating: 5,
        tripType: 'leisure',
        highlights: ['location', 'service'],
        nights: 3
      };
      
      const review = templateGenerator.generate(params);
      
      expect(review).toContain('Grand Resort');
      expect(review).toContain('3-night');
      expect(review).toBeTruthy();
    });

    test('should handle different ratings appropriately', () => {
      const baseParams = {
        hotelName: 'Test Hotel',
        tripType: 'business',
        highlights: ['wifi'],
        nights: 2
      };
      
      // Test each rating level
      for (let rating = 1; rating <= 5; rating++) {
        const params = { ...baseParams, rating };
        const review = templateGenerator.generate(params);
        
        expect(review).toContain('Test Hotel');
        expect(review.length).toBeGreaterThan(50);
      }
    });

    test('should handle missing rating gracefully', () => {
      const params = {
        hotelName: 'Test Hotel',
        tripType: 'leisure',
        highlights: [],
        nights: 1
      };
      
      const review = templateGenerator.generate(params);
      expect(review).toContain('Test Hotel');
    });
  });

  describe('Highlights Processing', () => {
    test('should convert single highlight to text', () => {
      const result = templateGenerator.highlightsToText(['location']);
      expect(result).toBe('The location was perfect.');
    });

    test('should convert two highlights to text', () => {
      const result = templateGenerator.highlightsToText(['location', 'service']);
      expect(result).toBe('The location was perfect and the staff provided excellent service.');
    });

    test('should convert multiple highlights to text', () => {
      const result = templateGenerator.highlightsToText(['location', 'service', 'cleanliness']);
      expect(result).toContain('The location was perfect, the staff provided excellent service, and the room was spotlessly clean.');
    });

    test('should handle empty highlights', () => {
      const result = templateGenerator.highlightsToText([]);
      expect(result).toBe('The overall experience was as expected.');
    });

    test('should handle minimal mode for negative reviews', () => {
      const result = templateGenerator.highlightsToText(['location', 'service'], true);
      expect(result).toBe('the location was perfect');
    });

    test('should handle unknown highlights', () => {
      const result = templateGenerator.highlightsToText(['unknown_feature']);
      expect(result).toBe('Unknown_feature.');
    });
  });
});