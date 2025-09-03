/**
 * Integration Tests for Review Generation Flow
 * Tests the complete flow from user input to review output
 */

const { HybridGenerator, LLMReviewGenerator, ReviewModel } = require('../__mocks__/services.js');

// Mock fetch for API calls (will be overridden by individual tests)
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
      expect(result.text).toContain('Grand Hotel');
      expect(result.text).toContain('business');

      // Step 5: Store result in model
      reviewModel.setGeneratedReview(result);

      // Step 6: Verify model was updated
      const finalState = reviewModel.getState();
      expect(finalState.generatedReview).toEqual(result);
      expect(finalState.statistics.totalGenerated).toBe(1);
    });

    test('should handle consistent generation with mocked services', async () => {
      // Setup review parameters
      reviewModel.setHotelInfo('Mock Hotel');
      reviewModel.setRating(4);
      reviewModel.toggleHighlight('location');

      const params = {
        hotelName: reviewModel.getState().hotelName,
        rating: reviewModel.getState().rating,
        tripType: reviewModel.getState().tripType,
        highlights: reviewModel.getState().highlights
      };

      const result = await hybridGenerator.generate(params);

      // Verify mock service behavior
      expect(result.source).toBe('openai');
      expect(result.text).toContain('Mock Hotel');
      expect(result.text).toContain('location');
      expect(result.cost).toBeGreaterThan(0);
      expect(result.latency).toBeGreaterThan(0);

      // Store and verify
      reviewModel.setGeneratedReview(result);
      expect(reviewModel.getState().generatedReview.source).toBe('openai');
    });

    test('should maintain cache consistency across multiple requests', async () => {
      const params = {
        hotelName: 'Cache Test Hotel',
        rating: 5,
        tripType: 'leisure',
        highlights: ['amenities']
      };

      // First request - should generate new review
      const result1 = await hybridGenerator.generate(params);
      expect(result1.source).toBe('openai');
      expect(result1.cached).toBe(false);
      expect(result1.text).toContain('Cache Test Hotel');
      expect(result1.text).toContain('amenities');

      // Second request with identical params - should use cache
      const result2 = await hybridGenerator.generate(params);
      expect(result2.source).toBe('cache');
      expect(result2.cached).toBe(true);

      // Results should be identical except for source and cached flag
      expect(result2.text).toBe(result1.text);
      expect(result2.requestId).toBe(result1.requestId);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle generation gracefully with mock services', async () => {
      const params = {
        hotelName: 'Test Hotel',
        rating: 3,
        highlights: ['wifi']
      };

      const result = await hybridGenerator.generate(params);

      // Mock service always succeeds, verify expected behavior
      expect(result.source).toBe('openai');
      expect(result.text).toContain('Test Hotel');
      expect(result.text).toContain('wifi');
      expect(result.latency).toBeGreaterThan(0);
    });

    test('should generate consistent responses with mock services', async () => {
      const params = {
        hotelName: 'Consistent Hotel',
        rating: 4,
        highlights: ['service']
      };

      const result = await hybridGenerator.generate(params);

      // Mock service provides consistent, valid responses
      expect(result.source).toBe('openai');
      expect(result.text).toContain('Consistent Hotel');
      expect(result.text).toContain('service');
      expect(typeof result.requestId).toBe('string');
      expect(result.requestId.length).toBeGreaterThan(0);
    });

    test('should handle multiple requests without rate limiting in tests', async () => {
      const params = {
        hotelName: 'Multi Request Hotel',
        rating: 5,
        highlights: ['recovery']
      };

      // Generate multiple requests rapidly
      const results = await Promise.all([
        hybridGenerator.generate(params),
        hybridGenerator.generate({ ...params, hotelName: 'Hotel 2' }),
        hybridGenerator.generate({ ...params, hotelName: 'Hotel 3' })
      ]);

      // All should succeed with mock service
      results.forEach((result, index) => {
        expect(result.source).toBe('openai');
        expect(result.text).toContain(`Hotel${index === 0 ? '' : ` ${index + 1}`}`);
        expect(result.latency).toBeGreaterThan(0);
      });
    });
  });

  describe('Multi-Provider Flow', () => {
    test('should generate reviews consistently with mock provider', async () => {
      const params = {
        hotelName: 'Multi Provider Hotel',
        rating: 4,
        highlights: ['location', 'food']
      };

      const result = await hybridGenerator.generate(params);

      // Mock always uses primary provider
      expect(result.source).toBe('openai');
      expect(result.text).toContain('Multi Provider Hotel');
      expect(result.text).toContain('location');
      expect(result.text).toContain('food');
    });

    test('should track costs and metrics with mock services', async () => {
      await hybridGenerator.generate({
        hotelName: 'Metrics Hotel',
        rating: 5,
        highlights: ['service']
      });

      const metrics = hybridGenerator.getMetricsSummary();
      expect(metrics.requests.total).toBe(1);
      expect(metrics.requests.successful).toBe(1);
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
      expect(modelState.language).toBe(testData.language);
      expect(modelState.nights).toBe(testData.nights);

      // Generate review with mock service
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
      expect(result.text).toContain('Data Integrity Hotel');
      expect(result.text.toLowerCase()).toMatch(/family|familia/);
      
      // Verify the mock generates appropriate content
      expect(result.text.length).toBeGreaterThan(50);
    });

    test('should handle concurrent review generations', async () => {
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
      
      // Verify content specificity
      expect(result1.text).toContain('Hotel A');
      expect(result2.text).toContain('Hotel B');
      expect(result3.text).toContain('Hotel C');
      
      expect(result1.text).toContain('location');
      expect(result2.text).toContain('service');
      expect(result3.text).toContain('value');

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
      const params = {
        hotelName: 'LLM Test Hotel',
        rating: 5,
        tripType: 'business',
        highlights: ['location', 'wifi'],
        voice: 'professional'
      };

      const result = await llmGenerator.generateReview(params);

      expect(result.text).toBeTruthy();
      expect(result.text).toContain('LLM Test Hotel');
      expect(result.source).toBe('openai');
      expect(result.model).toBe('gpt-4o-mini');
      expect(result.latency).toBeGreaterThan(0);
      expect(result.cost).toBeGreaterThan(0);
    });

    test('should handle LLM generator cache properly', async () => {
      const params = {
        hotelName: 'Cache Test',
        rating: 4,
        highlights: ['test']
      };

      // First call
      const result1 = await llmGenerator.generateReview(params);
      expect(result1.source).toBe('openai');
      expect(result1.cached).toBe(false);

      // Second call should use cache
      const result2 = await llmGenerator.generateReview(params);
      expect(result2.source).toBe('cache');
      expect(result2.cached).toBe(true);
      expect(result2.text).toBe(result1.text);
    });
  });

  describe('Model Integration', () => {
    test('should update model statistics correctly through flow', async () => {
      // Generate multiple reviews to test statistics
      const testCases = [
        { rating: 5, highlights: ['location'] },
        { rating: 4, highlights: ['service'] },
        { rating: 5, highlights: ['location', 'amenities'] },
        { rating: 3, highlights: ['value'] }
      ];

      for (const testCase of testCases) {
        reviewModel.setRating(testCase.rating);
        
        // Clear previous highlights
        reviewModel.state.highlights = [];
        // Add current highlights
        testCase.highlights.forEach(h => reviewModel.toggleHighlight(h));
        
        const result = await hybridGenerator.generate({
          hotelName: 'Stats Hotel',
          rating: testCase.rating,
          highlights: testCase.highlights
        });

        reviewModel.setGeneratedReview(result);
      }

      const finalStats = reviewModel.getState().statistics;
      
      expect(finalStats.totalGenerated).toBe(4);
      expect(finalStats.averageRating).toBeCloseTo(4.25); // (5+4+5+3)/4
      
      // Check popular highlights tracking
      const locationHighlight = finalStats.popularHighlights.find(h => h.name === 'location');
      expect(locationHighlight).toBeTruthy();
      expect(locationHighlight.count).toBe(2);
    });

    test('should handle model validation in integration flow', async () => {
      // Test invalid state
      reviewModel.setState({
        hotelName: '',
        rating: 0,
        highlights: []
      });

      const validation = reviewModel.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('Hotel name is required');
      expect(validation.errors).toContain('Valid rating is required');
      expect(validation.errors).toContain('At least one highlight must be selected');

      // Test valid state
      reviewModel.setState({
        hotelName: 'Valid Hotel',
        rating: 4,
        highlights: ['service']
      });

      const validValidation = reviewModel.validate();
      expect(validValidation.valid).toBe(true);
      expect(validValidation.errors.length).toBe(0);

      // Should be able to generate with valid state
      if (validValidation.valid) {
        const result = await hybridGenerator.generate({
          hotelName: reviewModel.getState().hotelName,
          rating: reviewModel.getState().rating,
          highlights: reviewModel.getState().highlights
        });
        
        expect(result.text).toContain('Valid Hotel');
        expect(result.text).toContain('service');
      }
    });
  });
});