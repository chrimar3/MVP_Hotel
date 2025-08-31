/**
 * Unit Tests for LLMReviewGenerator Service
 * Tests LLM integration, fallback logic, and error handling
 */

const { LLMReviewGenerator, TemplateReviewGenerator } = require('../../src/services/LLMReviewGenerator.js');

// Mock performance.now for consistent timing
const mockPerformance = {
  now: jest.fn(() => 2000)
};
global.performance = mockPerformance;

// Mock AbortController
global.AbortController = jest.fn(() => ({
  abort: jest.fn(),
  signal: { aborted: false }
}));

describe('LLMReviewGenerator', () => {
  let generator;
  let fetchMock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(2000);
    
    // Mock fetch
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    
    // Initialize generator with test config
    generator = new LLMReviewGenerator({
      openaiKey: 'test-openai-key',
      groqKey: 'test-groq-key',
      proxyUrl: 'https://test-proxy.com'
    });
  });

  describe('Constructor and Configuration', () => {
    test('should initialize with default configuration', () => {
      const gen = new LLMReviewGenerator();
      expect(gen.models.primary.provider).toBe('openai');
      expect(gen.models.fallback.provider).toBe('groq');
      expect(gen.cache).toBeInstanceOf(Map);
      expect(gen.stats.requests).toBe(0);
    });

    test('should initialize with custom configuration', () => {
      const config = {
        openaiKey: 'custom-openai',
        groqKey: 'custom-groq',
        proxyUrl: 'https://custom-proxy.com'
      };
      const gen = new LLMReviewGenerator(config);
      
      expect(gen.openaiKey).toBe('custom-openai');
      expect(gen.groqKey).toBe('custom-groq');
      expect(gen.proxyUrl).toBe('https://custom-proxy.com');
    });

    test('should configure API keys after initialization', () => {
      generator.configure({
        openaiKey: 'new-openai-key',
        groqKey: 'new-groq-key'
      });
      
      expect(generator.openaiKey).toBe('new-openai-key');
      expect(generator.groqKey).toBe('new-groq-key');
    });
  });

  describe('Cache Management', () => {
    const testParams = {
      hotelName: 'Test Hotel',
      rating: 5,
      tripType: 'business',
      highlights: ['location', 'service'],
      voice: 'friendly'
    };

    test('should generate consistent cache keys', () => {
      const key1 = generator.getCacheKey(testParams);
      const key2 = generator.getCacheKey(testParams);
      
      expect(key1).toBe(key2);
      expect(key1).toContain('Test Hotel');
    });

    test('should cache results with expiration', () => {
      generator.cacheResult('test-key', 'test-review');
      
      expect(generator.cache.get('test-key')).toBe('test-review');
    });

    test('should clear cache after timeout', (done) => {
      // Use short timeout for test
      generator.cacheTimeout = 100;
      generator.cacheResult('test-key', 'test-review');
      
      setTimeout(() => {
        expect(generator.cache.has('test-key')).toBe(false);
        done();
      }, 150);
    });
  });

  describe('Prompt Building', () => {
    test('should build comprehensive prompt with all parameters', () => {
      const params = {
        hotelName: 'Luxury Resort',
        rating: 5,
        tripType: 'leisure',
        highlights: ['location', 'amenities'],
        nights: 4,
        voice: 'enthusiastic',
        language: 'es'
      };
      
      const prompt = generator.buildPrompt(params);
      
      expect(prompt).toContain('Luxury Resort');
      expect(prompt).toContain('very positive and enthusiastic');
      expect(prompt).toContain('4-night leisure stay');
      expect(prompt).toContain('location, amenities');
      expect(prompt).toContain('excited, energetic tone');
      expect(prompt).toContain('Write in Spanish');
    });

    test('should handle default values gracefully', () => {
      const params = {};
      const prompt = generator.buildPrompt(params);
      
      expect(prompt).toContain('Grand Hotel');
      expect(prompt).toContain('very positive and enthusiastic');
      expect(prompt).toContain('3-night leisure stay');
      expect(prompt).toContain('warm, conversational tone');
    });

    test('should handle different voice types', () => {
      const voices = ['professional', 'friendly', 'enthusiastic', 'detailed'];
      const expectedTexts = [
        'professional, businesslike tone',
        'warm, conversational tone',
        'excited, energetic tone',
        'thorough and analytical'
      ];
      
      voices.forEach((voice, index) => {
        const params = { hotelName: 'Test', rating: 5, voice };
        const prompt = generator.buildPrompt(params);
        expect(prompt).toContain(expectedTexts[index]);
      });
    });

    test('should map language codes correctly', () => {
      const languages = {
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'unknown': 'English'
      };
      
      Object.entries(languages).forEach(([code, name]) => {
        const result = generator.getLanguageName(code);
        expect(result).toBe(name);
      });
    });

    test('should map rating to appropriate tones', () => {
      const ratingTones = {
        1: 'negative but professional',
        2: 'disappointed but constructive',
        3: 'balanced with pros and cons',
        4: 'positive with minor observations',
        5: 'very positive and enthusiastic',
        0: 'balanced with pros and cons' // Default
      };
      
      Object.entries(ratingTones).forEach(([rating, tone]) => {
        const result = generator.getRatingTone(parseInt(rating));
        expect(result).toBe(tone);
      });
    });
  });

  describe('OpenAI API Integration', () => {
    test('should successfully generate review with OpenAI', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Amazing hotel with excellent service!' } }],
          usage: { total_tokens: 120 }
        })
      };
      fetchMock.mockResolvedValue(mockResponse);
      
      const params = { hotelName: 'Test Hotel', rating: 5 };
      const result = await generator.generateWithOpenAI(params);
      
      expect(result).toBe('Amazing hotel with excellent service!');
      expect(fetchMock).toHaveBeenCalledWith(
        generator.models.primary.url,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-openai-key',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    test('should throw error when OpenAI API key is missing', async () => {
      const gen = new LLMReviewGenerator({ openaiKey: null });
      
      await expect(gen.generateWithOpenAI({}))
        .rejects.toThrow('OpenAI API key not configured');
    });

    test('should handle OpenAI API errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429
      });
      
      const params = { hotelName: 'Test Hotel', rating: 5 };
      
      await expect(generator.generateWithOpenAI(params))
        .rejects.toThrow('OpenAI API error: 429');
    });

    test('should send proper request body to OpenAI', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test review' } }]
        })
      });
      
      const params = {
        hotelName: 'Grand Hotel',
        rating: 4,
        tripType: 'business'
      };
      
      await generator.generateWithOpenAI(params);
      
      const [, options] = fetchMock.mock.calls[0];
      const requestBody = JSON.parse(options.body);
      
      expect(requestBody.model).toBe('gpt-4o-mini');
      expect(requestBody.messages).toHaveLength(2);
      expect(requestBody.messages[0].role).toBe('system');
      expect(requestBody.messages[1].role).toBe('user');
      expect(requestBody.temperature).toBe(0.8);
      expect(requestBody.max_tokens).toBe(300);
    });
  });

  describe('Groq API Integration', () => {
    test('should successfully generate review with Groq', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Fast and excellent hotel review!' } }],
          usage: { total_tokens: 85 }
        })
      };
      fetchMock.mockResolvedValue(mockResponse);
      
      const params = { hotelName: 'Speed Hotel', rating: 4 };
      const result = await generator.generateWithGroq(params);
      
      expect(result).toBe('Fast and excellent hotel review!');
      expect(fetchMock).toHaveBeenCalledWith(
        generator.models.fallback.url,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-groq-key'
          })
        })
      );
    });

    test('should throw error when Groq API key is missing', async () => {
      const gen = new LLMReviewGenerator({ groqKey: null });
      
      await expect(gen.generateWithGroq({}))
        .rejects.toThrow('Groq API key not configured');
    });

    test('should handle Groq API errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500
      });
      
      const params = { hotelName: 'Test Hotel', rating: 3 };
      
      await expect(generator.generateWithGroq(params))
        .rejects.toThrow('Groq API error: 500');
    });

    test('should send proper request body to Groq', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test review' } }]
        })
      });
      
      const params = { hotelName: 'Test Hotel', rating: 5 };
      await generator.generateWithGroq(params);
      
      const [, options] = fetchMock.mock.calls[0];
      const requestBody = JSON.parse(options.body);
      
      expect(requestBody.model).toBe('mixtral-8x7b-32768');
      expect(requestBody.messages).toHaveLength(1);
      expect(requestBody.messages[0].role).toBe('user');
      expect(requestBody.temperature).toBe(0.7);
      expect(requestBody.max_tokens).toBe(250);
      expect(requestBody.stream).toBe(false);
    });
  });

  describe('Timeout Handling', () => {
    test('should handle request timeouts', async () => {
      // Mock AbortController to properly simulate timeout
      const mockAbort = jest.fn();
      const mockSignal = { aborted: false };
      
      global.AbortController = jest.fn(() => ({
        abort: mockAbort,
        signal: mockSignal
      }));
      
      // Mock fetch to throw AbortError when aborted
      fetchMock.mockImplementation(() => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });
      
      await expect(
        generator.fetchWithTimeout('https://test.com', {}, 100)
      ).rejects.toThrow('Request timeout');
    });

    test('should clear timeout on successful response', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      fetchMock.mockResolvedValue({ ok: true });
      
      await generator.fetchWithTimeout('https://test.com', {}, 1000);
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });

    test('should handle AbortError specifically', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      
      fetchMock.mockRejectedValue(abortError);
      
      await expect(
        generator.fetchWithTimeout('https://test.com', {}, 1000)
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('Main Generation Method', () => {
    test('should return cached result when available', async () => {
      const params = { hotelName: 'Cached Hotel', rating: 5 };
      generator.cache.set(generator.getCacheKey(params), 'Cached review text');
      
      const result = await generator.generateReview(params);
      
      expect(result.text).toBe('Cached review text');
      expect(result.source).toBe('cache');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    test('should try OpenAI first and return result', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'OpenAI generated review' } }],
          usage: { total_tokens: 150 }
        })
      });
      
      const params = { hotelName: 'Primary Hotel', rating: 5 };
      const result = await generator.generateReview(params);
      
      expect(result.text).toBe('OpenAI generated review');
      expect(result.source).toBe('openai');
      expect(result.model).toBe('gpt-4o-mini');
      expect(result.cost).toBe(generator.models.primary.costPerRequest);
      expect(result.latency).toBeGreaterThan(0);
    });

    test('should fallback to Groq when OpenAI fails', async () => {
      fetchMock
        .mockRejectedValueOnce(new Error('OpenAI failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Groq fallback review' } }],
            usage: { total_tokens: 90 }
          })
        });
      
      const params = { hotelName: 'Fallback Hotel', rating: 4 };
      const result = await generator.generateReview(params);
      
      expect(result.text).toBe('Groq fallback review');
      expect(result.source).toBe('groq');
      expect(result.model).toBe('mixtral-8x7b');
      expect(result.cost).toBe(0);
    });

    test('should fallback to template when all APIs fail', async () => {
      fetchMock.mockRejectedValue(new Error('All APIs failed'));
      
      const params = { hotelName: 'Template Hotel', rating: 3, nights: 2 };
      const result = await generator.generateReview(params);
      
      expect(result.source).toBe('template');
      expect(result.text).toContain('Template Hotel');
      expect(result.text).toContain('2-night');
      expect(result.cost).toBe(0);
      expect(result.model).toBeNull();
    });

    test('should update statistics correctly', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Success review' } }],
          usage: { total_tokens: 100 }
        })
      });
      
      const initialRequests = generator.stats.requests;
      const initialSuccesses = generator.stats.successes;
      
      await generator.generateReview({ hotelName: 'Stats Hotel', rating: 5 });
      
      expect(generator.stats.requests).toBe(initialRequests + 1);
      expect(generator.stats.successes).toBe(initialSuccesses + 1);
    });

    test('should track cache hits', async () => {
      const params = { hotelName: 'Cache Hotel', rating: 5 };
      generator.cache.set(generator.getCacheKey(params), 'Cached content');
      
      const initialHits = generator.stats.cacheHits;
      await generator.generateReview(params);
      
      expect(generator.stats.cacheHits).toBe(initialHits + 1);
    });
  });

  describe('Statistics Tracking', () => {
    test('should update average latency correctly', () => {
      generator.stats.requests = 2;
      generator.stats.avgLatency = 1000;
      
      generator.updateAvgLatency(2000);
      
      expect(generator.stats.avgLatency).toBe(1500);
    });

    test('should generate comprehensive stats', () => {
      generator.stats = {
        requests: 100,
        successes: 95,
        failures: 5,
        cacheHits: 20,
        totalCost: 0.05,
        avgLatency: 750
      };
      
      const stats = generator.getStats();
      
      expect(stats.requests).toBe(100);
      expect(stats.successRate).toBe('95.0%');
      expect(stats.cacheHitRate).toBe('20.0%');
      expect(stats.avgLatency).toBe('750ms');
      expect(stats.totalCost).toBe('$0.0500');
    });
  });
});

describe('TemplateReviewGenerator', () => {
  let templateGenerator;

  beforeEach(() => {
    templateGenerator = new TemplateReviewGenerator();
  });

  describe('Template Generation', () => {
    test('should generate appropriate review for 5-star rating', () => {
      const params = {
        hotelName: 'Amazing Resort',
        rating: 5,
        tripType: 'honeymoon',
        highlights: ['romance', 'luxury'],
        nights: 7
      };
      
      const review = templateGenerator.generate(params);
      
      expect(review).toContain('Amazing Resort');
      expect(review).toContain('7-night');
      expect(review).toContain('wonderful');
      expect(review).toContain('exceeded');
    });

    test('should generate appropriate review for 4-star rating', () => {
      const params = {
        hotelName: 'Good Hotel',
        rating: 4,
        tripType: 'business',
        highlights: ['wifi', 'location'],
        nights: 3
      };
      
      const review = templateGenerator.generate(params);
      
      expect(review).toContain('Good Hotel');
      expect(review).toContain('3-night business');
      expect(review).toContain('enjoyed');
      expect(review).toContain('great experience');
    });

    test('should generate appropriate review for 3-star rating', () => {
      const params = {
        hotelName: 'Average Hotel',
        rating: 3,
        tripType: 'leisure',
        highlights: ['pool'],
        nights: 2
      };
      
      const review = templateGenerator.generate(params);
      
      expect(review).toContain('Average Hotel');
      expect(review).toContain('2-night');
      expect(review).toContain('satisfactory');
      expect(review).toContain('basic needs');
    });

    test('should generate appropriate review for 2-star rating', () => {
      const params = {
        hotelName: 'Poor Hotel',
        rating: 2,
        tripType: 'family',
        highlights: ['price'],
        nights: 1
      };
      
      const review = templateGenerator.generate(params);
      
      expect(review).toContain('Poor Hotel');
      expect(review).toContain("didn't meet expectations");
      expect(review).toContain('improvements are needed');
    });

    test('should generate appropriate review for 1-star rating', () => {
      const params = {
        hotelName: 'Terrible Hotel',
        rating: 1,
        tripType: 'business',
        highlights: [],
        nights: 1
      };
      
      const review = templateGenerator.generate(params);
      
      expect(review).toContain('Terrible Hotel');
      expect(review).toContain('disappointed');
      expect(review).toContain('1 nights');
    });

    test('should handle missing rating with default', () => {
      const params = {
        hotelName: 'Default Hotel',
        tripType: 'leisure',
        highlights: ['location'],
        nights: 2
      };
      
      const review = templateGenerator.generate(params);
      expect(review).toContain('Default Hotel');
      expect(review).toContain('satisfactory'); // Default to 3-star template
    });
  });

  describe('Highlights Processing', () => {
    test('should handle empty highlights', () => {
      const result = templateGenerator.highlightsToText([]);
      expect(result).toBe('The overall experience was as expected.');
    });

    test('should handle single highlight', () => {
      const result = templateGenerator.highlightsToText(['location']);
      expect(result).toBe('The location stood out.');
    });

    test('should handle two highlights', () => {
      const result = templateGenerator.highlightsToText(['wifi', 'breakfast']);
      expect(result).toBe('The wifi and breakfast were notable.');
    });

    test('should handle multiple highlights', () => {
      const result = templateGenerator.highlightsToText(['service', 'cleanliness', 'location', 'food']);
      expect(result).toContain('Several aspects impressed me');
      expect(result).toContain('service, cleanliness, location');
      expect(result).toContain('and food');
    });

    test('should handle custom highlights', () => {
      const result = templateGenerator.highlightsToText(['custom_feature']);
      expect(result).toBe('The custom_feature stood out.');
    });
  });
});