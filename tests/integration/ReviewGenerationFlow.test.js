/**
 * Integration Tests for Review Generation Flow
 * Tests the complete flow from user input to review output
 */

const { HybridGenerator } = require('../../src/services/HybridGenerator.js');
const { LLMReviewGenerator } = require('../../src/services/LLMReviewGenerator.js');
const ReviewModel = require('../../src/models/ReviewModel.js');

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock performance API
global.performance = {
  now: jest.fn(() => 1500)
};

// Mock AbortController
global.AbortController = jest.fn(() => ({
  abort: jest.fn(),
  signal: { aborted: false }
}));

describe('Review Generation Flow Integration', () => {
  let hybridGenerator;
  let llmGenerator;
  let reviewModel;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Initialize components
    hybridGenerator = new HybridGenerator({
      openaiKey: 'test-openai-key',
      groqKey: 'test-groq-key',
      useProxy: false
    });
    
    llmGenerator = new LLMReviewGenerator({
      openaiKey: 'test-openai-key',
      groqKey: 'test-groq-key'
    });
    
    reviewModel = new ReviewModel();
  });

  afterEach(() => {
    if (hybridGenerator) {
      hybridGenerator.destroy();
    }
  });

  describe('Complete Review Generation Flow', () => {
    test('should generate review through complete flow with valid input', async () => {
      // Setup mock API response
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Amazing stay at the Grand Hotel! The location was perfect and the service exceeded all expectations. I highly recommend this hotel for business travelers.' } }],
          usage: { total_tokens: 125 }
        })
      });

      // Step 1: Set up review parameters in model
      reviewModel.setHotelInfo('Grand Hotel', 'direct');
      reviewModel.setRating(5);
      reviewModel.setTripDetails('business', 3, 2);
      reviewModel.toggleHighlight('location');
      reviewModel.toggleHighlight('service');
      reviewModel.setLanguage('en');
      reviewModel.setVoice('professional');

      // Step 2: Validate model state
      const validation = reviewModel.validate();
      expect(validation.valid).toBe(true);

      // Step 3: Generate review using HybridGenerator
      const params = {
        hotelName: reviewModel.getState().hotelName,
        rating: reviewModel.getState().rating,
        tripType: reviewModel.getState().tripType,
        highlights: reviewModel.getState().highlights,
        nights: reviewModel.getState().nights,
        language: reviewModel.getState().language,
        voice: reviewModel.getState().voice
      };

      const result = await hybridGenerator.generate(params);

      // Step 4: Verify result structure
      expect(result.text).toBeTruthy();
      expect(result.text.length).toBeGreaterThan(50);
      expect(result.source).toBe('openai');
      expect(result.latency).toBeGreaterThan(0);
      expect(result.requestId).toBeTruthy();

      // Step 5: Store result in model
      reviewModel.setGeneratedReview(result);

      // Step 6: Verify model was updated
      const finalState = reviewModel.getState();
      expect(finalState.generatedReview).toEqual(result);
      expect(finalState.statistics.totalGenerated).toBe(1);
    });

    test('should handle API failure and fallback to template', async () => {
      // Setup failing API responses
      fetch.mockRejectedValue(new Error('API Error'));

      // Setup review parameters
      reviewModel.setHotelInfo('Fallback Hotel');
      reviewModel.setRating(4);
      reviewModel.toggleHighlight('location');

      const params = {
        hotelName: reviewModel.getState().hotelName,
        rating: reviewModel.getState().rating,
        tripType: reviewModel.getState().tripType,
        highlights: reviewModel.getState().highlights
      };

      const result = await hybridGenerator.generate(params);

      // Should fallback to template
      expect(result.source).toBe('template');
      expect(result.text).toContain('Fallback Hotel');
      expect(result.cost).toBe(0);

      // Store and verify
      reviewModel.setGeneratedReview(result);
      expect(reviewModel.getState().generatedReview.source).toBe('template');
    });

    test('should maintain cache consistency across multiple requests', async () => {
      // Setup consistent API response
      const mockReview = 'Excellent hotel experience with great amenities!';
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: mockReview } }],
          usage: { total_tokens: 100 }
        })
      });

      const params = {
        hotelName: 'Cache Test Hotel',
        rating: 5,
        tripType: 'leisure',
        highlights: ['amenities']
      };

      // First request - should hit API
      const result1 = await hybridGenerator.generate(params);
      expect(result1.source).toBe('openai');
      expect(result1.cached).toBe(false);
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second request - should use cache
      const result2 = await hybridGenerator.generate(params);
      expect(result2.source).toBe('cache');
      expect(result2.cached).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(1); // No additional API call

      // Results should be identical
      expect(result2.text).toBe(result1.text);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle network timeouts gracefully', async () => {
      // Mock timeout
      fetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 5000))
      );

      const params = {
        hotelName: 'Timeout Hotel',
        rating: 3,
        highlights: ['wifi']
      };

      const result = await hybridGenerator.generate(params);

      // Should fallback to template due to timeout
      expect(result.source).toBe('template');
      expect(result.text).toContain('Timeout Hotel');
    });

    test('should handle malformed API responses', async () => {
      // Mock malformed response
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [] // Empty choices array
        })
      });

      const params = {
        hotelName: 'Malformed Response Hotel',
        rating: 4,
        highlights: ['service']
      };

      const result = await hybridGenerator.generate(params);

      // Should fallback to template due to malformed response
      expect(result.source).toBe('template');
    });

    test('should handle API rate limiting with retry logic', async () => {
      // Mock rate limit then success
      fetch
        .mockResolvedValueOnce({ ok: false, status: 429 })
        .mockResolvedValueOnce({ ok: false, status: 429 })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Rate limit recovered!' } }],
            usage: { total_tokens: 80 }
          })
        });

      const params = {
        hotelName: 'Rate Limit Hotel',
        rating: 5,
        highlights: ['recovery']
      };

      const result = await hybridGenerator.generate(params);

      expect(result.source).toBe('openai');
      expect(result.text).toBe('Rate limit recovered!');
      expect(fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Multi-Provider Flow', () => {
    test('should fallback from OpenAI to Groq to template', async () => {
      // OpenAI fails
      fetch
        .mockRejectedValueOnce(new Error('OpenAI Error'))
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Groq generated review!' } }],
            usage: { total_tokens: 75 }
          })
        });

      const params = {
        hotelName: 'Fallback Test Hotel',
        rating: 4,
        highlights: ['location', 'food']
      };

      const result = await hybridGenerator.generate(params);

      expect(result.source).toBe('groq');
      expect(result.text).toBe('Groq generated review!');
    });

    test('should track costs and metrics across providers', async () => {
      // Test OpenAI success
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'OpenAI review' } }],
          usage: { total_tokens: 150 }
        })
      });

      await hybridGenerator.generate({
        hotelName: 'Metrics Hotel',
        rating: 5
      });

      const metrics = hybridGenerator.getMetricsSummary();
      expect(metrics.providers.openai.success).toBe(1);
      expect(parseFloat(metrics.cost.total.replace('$', ''))).toBeGreaterThan(0);
    });
  });

  describe('Data Flow Validation', () => {
    test('should maintain data integrity through complete flow', async () => {
      const testData = {
        hotelName: 'Data Integrity Hotel',
        rating: 4,
        tripType: 'family',
        highlights: ['pool', 'kids'],
        nights: 5,
        guests: 4,
        language: 'es',
        voice: 'friendly'
      };

      // Setup model
      reviewModel.setHotelInfo(testData.hotelName);
      reviewModel.setRating(testData.rating);
      reviewModel.setTripDetails(testData.tripType, testData.nights, testData.guests);
      testData.highlights.forEach(h => reviewModel.toggleHighlight(h));
      reviewModel.setLanguage(testData.language);
      reviewModel.setVoice(testData.voice);

      // Verify model state
      const modelState = reviewModel.getState();
      expect(modelState.hotelName).toBe(testData.hotelName);
      expect(modelState.rating).toBe(testData.rating);
      expect(modelState.tripType).toBe(testData.tripType);
      expect(modelState.highlights).toEqual(expect.arrayContaining(testData.highlights));

      // Mock successful API response
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Spanish family review' } }],
          usage: { total_tokens: 120 }
        })
      });

      // Generate review
      const result = await hybridGenerator.generate({
        hotelName: modelState.hotelName,
        rating: modelState.rating,
        tripType: modelState.tripType,
        highlights: modelState.highlights,
        nights: modelState.nights,
        language: modelState.language,
        voice: modelState.voice
      });

      expect(result.text).toBeTruthy();
      expect(result.requestId).toBeTruthy();
      
      // Verify API call included correct parameters
      const [, requestOptions] = fetch.mock.calls[0];
      const requestBody = JSON.parse(requestOptions.body);
      const prompt = requestBody.messages[1].content;
      
      expect(prompt).toContain('Data Integrity Hotel');
      expect(prompt).toContain('5-night family');
      expect(prompt).toContain('pool, kids');
      expect(prompt).toContain('Spanish');
    });

    test('should handle concurrent review generations', async () => {
      // Mock API responses
      fetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Concurrent review' } }],
            usage: { total_tokens: 90 }
          })
        })
      );

      const params1 = { hotelName: 'Hotel A', rating: 5, highlights: ['location'] };
      const params2 = { hotelName: 'Hotel B', rating: 4, highlights: ['service'] };
      const params3 = { hotelName: 'Hotel C', rating: 3, highlights: ['value'] };

      // Generate multiple reviews concurrently
      const [result1, result2, result3] = await Promise.all([
        hybridGenerator.generate(params1),
        hybridGenerator.generate(params2),
        hybridGenerator.generate(params3)
      ]);

      // All should succeed
      expect(result1.text).toBeTruthy();
      expect(result2.text).toBeTruthy();
      expect(result3.text).toBeTruthy();

      // Should have unique request IDs
      expect(result1.requestId).not.toBe(result2.requestId);
      expect(result2.requestId).not.toBe(result3.requestId);

      // Metrics should reflect all requests
      const metrics = hybridGenerator.getMetricsSummary();
      expect(metrics.requests.total).toBe(3);
    });
  });

  describe('LLM Generator Integration', () => {
    test('should work with LLMReviewGenerator independently', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'LLM direct review' } }],
          usage: { total_tokens: 110 }
        })
      });

      const params = {
        hotelName: 'LLM Test Hotel',
        rating: 5,
        tripType: 'business',
        highlights: ['location', 'wifi'],
        voice: 'professional'
      };

      const result = await llmGenerator.generateReview(params);

      expect(result.text).toBe('LLM direct review');
      expect(result.source).toBe('openai');
      expect(result.model).toBe('gpt-4o-mini');
      expect(result.latency).toBeGreaterThan(0);
      expect(result.cost).toBeGreaterThan(0);
    });

    test('should handle LLM generator cache properly', async () => {
      const mockReview = 'Cached LLM review';
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: mockReview } }]
        })
      });

      const params = {
        hotelName: 'Cache Test',
        rating: 4,
        highlights: ['test']
      };

      // First call
      const result1 = await llmGenerator.generateReview(params);
      expect(result1.source).toBe('openai');

      // Second call should use cache
      const result2 = await llmGenerator.generateReview(params);
      expect(result2.source).toBe('cache');
      expect(result2.text).toBe(mockReview);
    });
  });

  describe('Model Integration', () => {
    test('should update model statistics correctly through flow', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Statistics test review' } }],
          usage: { total_tokens: 95 }
        })
      });

      // Generate multiple reviews to test statistics
      const testCases = [
        { rating: 5, highlights: ['location'] },
        { rating: 4, highlights: ['service'] },
        { rating: 5, highlights: ['location', 'amenities'] },
        { rating: 3, highlights: ['value'] }
      ];

      for (const testCase of testCases) {
        reviewModel.setRating(testCase.rating);
        testCase.highlights.forEach(h => reviewModel.toggleHighlight(h));
        
        const result = await hybridGenerator.generate({
          hotelName: 'Stats Hotel',
          rating: testCase.rating,
          highlights: testCase.highlights
        });

        reviewModel.setGeneratedReview(result);
        
        // Clear highlights for next iteration
        testCase.highlights.forEach(h => reviewModel.toggleHighlight(h));
      }

      const finalStats = reviewModel.getState().statistics;
      
      expect(finalStats.totalGenerated).toBe(4);
      expect(finalStats.averageRating).toBeCloseTo(4.25); // (5+4+5+3)/4
      
      // Check popular highlights
      const locationHighlight = finalStats.popularHighlights.find(h => h.name === 'location');
      expect(locationHighlight.count).toBe(2);
    });

    test('should handle model validation in integration flow', async () => {
      // Invalid state
      reviewModel.setState({
        hotelName: '',
        rating: 0,
        highlights: []
      });

      const validation = reviewModel.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);

      // Should not proceed with generation for invalid state
      const params = {
        hotelName: reviewModel.getState().hotelName,
        rating: reviewModel.getState().rating,
        highlights: reviewModel.getState().highlights
      };

      // Even if generator succeeds, the model state is invalid
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Should not use this' } }]
        })
      });

      // Business logic should validate before calling generator
      if (!validation.valid) {
        expect(validation.errors).toContain('Hotel name is required');
        expect(validation.errors).toContain('Valid rating is required');
        expect(validation.errors).toContain('At least one highlight must be selected');
      }
    });
  });
});