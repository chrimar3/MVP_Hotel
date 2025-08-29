/**
 * Unit Tests for LLMService
 * Tests LLM integration, fallback mechanisms, and template generation
 */

const { LLMReviewGenerator } = require('../../src/services/LLMReviewGenerator');

describe('LLMService', () => {
    let llmService;
    let mockFetch;

    beforeEach(() => {
        llmService = new LLMReviewGenerator({
            openaiKey: 'test-openai-key',
            groqKey: 'test-groq-key'
        });
        
        mockFetch = jest.fn();
        global.fetch = mockFetch;
        
        // Clear cache
        llmService.cache.clear();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generateReview', () => {
        const testParams = {
            hotelName: 'Test Hotel',
            rating: 5,
            tripType: 'leisure',
            highlights: ['location', 'service']
        };

        it('should return cached result if available', async () => {
            const cachedReview = 'Cached review text';
            const cacheKey = llmService.getCacheKey(testParams);
            llmService.cache.set(cacheKey, cachedReview);

            const result = await llmService.generateReview(testParams);

            expect(result.text).toBe(cachedReview);
            expect(result.source).toBe('cache');
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('should try OpenAI first when configured', async () => {
            const openAIResponse = 'OpenAI generated review';
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: openAIResponse } }]
                })
            });

            const result = await llmService.generateReview(testParams);

            expect(result.text).toBe(openAIResponse);
            expect(result.source).toBe('openai');
            expect(result.model).toBe('gpt-4o-mini');
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.openai.com/v1/chat/completions',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-openai-key'
                    })
                })
            );
        });

        it('should fall back to Groq when OpenAI fails', async () => {
            const groqResponse = 'Groq generated review';
            
            // OpenAI fails
            mockFetch.mockRejectedValueOnce(new Error('OpenAI error'));
            
            // Groq succeeds
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: groqResponse } }]
                })
            });

            const result = await llmService.generateReview(testParams);

            expect(result.text).toBe(groqResponse);
            expect(result.source).toBe('groq');
            expect(result.model).toBe('mixtral-8x7b');
        });

        it('should fall back to templates when all APIs fail', async () => {
            // Both APIs fail
            mockFetch.mockRejectedValue(new Error('API error'));

            const result = await llmService.generateReview(testParams);

            expect(result.text).toBeDefined();
            expect(result.source).toBe('template');
            expect(result.model).toBeNull();
            expect(result.text).toContain('Test Hotel');
        });

        it('should track cost for OpenAI', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Review' } }]
                })
            });

            llmService.stats.totalCost = 0;
            await llmService.generateReview(testParams);

            expect(llmService.stats.totalCost).toBe(0.000045);
        });

        it('should not add cost for Groq (free tier)', async () => {
            llmService.openaiKey = null; // Disable OpenAI
            
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Review' } }]
                })
            });

            llmService.stats.totalCost = 0;
            await llmService.generateReview(testParams);

            expect(llmService.stats.totalCost).toBe(0);
        });
    });

    describe('generateWithOpenAI', () => {
        it('should build correct prompt', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Review' } }]
                })
            });

            await llmService.generateWithOpenAI({
                hotelName: 'Grand Hotel',
                rating: 4,
                tripType: 'business',
                highlights: ['wifi', 'location']
            });

            const callArgs = mockFetch.mock.calls[0][1];
            const body = JSON.parse(callArgs.body);
            
            expect(body.messages[1].content).toContain('Grand Hotel');
            expect(body.messages[1].content).toContain('business');
            expect(body.messages[1].content).toContain('wifi, location');
        });

        it('should handle API errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429
            });

            await expect(llmService.generateWithOpenAI({
                hotelName: 'Test',
                rating: 5,
                tripType: 'leisure',
                highlights: []
            })).rejects.toThrow('OpenAI API error: 429');
        });

        it('should respect timeout', async () => {
            jest.useFakeTimers();
            
            mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

            const promise = llmService.generateWithOpenAI({
                hotelName: 'Test',
                rating: 5,
                tripType: 'leisure',
                highlights: []
            });

            jest.advanceTimersByTime(3001);

            await expect(promise).rejects.toThrow();
            
            jest.useRealTimers();
        });
    });

    describe('generateWithGroq', () => {
        it('should use correct model and endpoint', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Review' } }]
                })
            });

            await llmService.generateWithGroq({
                hotelName: 'Test Hotel',
                rating: 3,
                tripType: 'family',
                highlights: ['breakfast']
            });

            const callArgs = mockFetch.mock.calls[0];
            expect(callArgs[0]).toBe('https://api.groq.com/openai/v1/chat/completions');
            
            const body = JSON.parse(callArgs[1].body);
            expect(body.model).toBe('mixtral-8x7b-32768');
        });

        it('should handle Groq-specific parameters', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Review' } }]
                })
            });

            await llmService.generateWithGroq({
                hotelName: 'Test',
                rating: 5,
                tripType: 'leisure',
                highlights: []
            });

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.stream).toBe(false);
            expect(body.temperature).toBe(0.7);
            expect(body.max_tokens).toBe(250);
        });
    });

    describe('buildPrompt', () => {
        it('should build appropriate prompt for each rating', () => {
            const ratings = [1, 2, 3, 4, 5];
            const tones = [
                'negative but professional',
                'disappointed but constructive',
                'balanced with pros and cons',
                'positive with minor observations',
                'very positive and enthusiastic'
            ];

            ratings.forEach((rating, index) => {
                const prompt = llmService.buildPrompt({
                    hotelName: 'Test Hotel',
                    rating,
                    tripType: 'leisure',
                    highlights: []
                });

                expect(prompt).toContain(tones[index]);
            });
        });

        it('should include language instruction for non-English', () => {
            const prompt = llmService.buildPrompt({
                hotelName: 'Test',
                rating: 5,
                tripType: 'leisure',
                highlights: [],
                language: 'es'
            });

            expect(prompt).toContain('Spanish');
        });

        it('should include voice instruction', () => {
            const voices = ['professional', 'friendly', 'enthusiastic', 'detailed'];
            
            voices.forEach(voice => {
                const prompt = llmService.buildPrompt({
                    hotelName: 'Test',
                    rating: 5,
                    tripType: 'leisure',
                    highlights: [],
                    voice
                });

                expect(prompt.toLowerCase()).toContain(voice);
            });
        });
    });

    describe('caching', () => {
        it('should cache successful API responses', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Review text' } }]
                })
            });

            const params = {
                hotelName: 'Test',
                rating: 5,
                tripType: 'leisure',
                highlights: ['location']
            };

            await llmService.generateReview(params);
            
            const cacheKey = llmService.getCacheKey(params);
            expect(llmService.cache.has(cacheKey)).toBe(true);
            expect(llmService.cache.get(cacheKey)).toBe('Review text');
        });

        it('should generate consistent cache keys', () => {
            const params1 = {
                hotelName: 'Test',
                rating: 5,
                tripType: 'leisure',
                highlights: ['b', 'a'] // Order shouldn't matter
            };

            const params2 = {
                hotelName: 'Test',
                rating: 5,
                tripType: 'leisure',
                highlights: ['a', 'b'] // Different order
            };

            const key1 = llmService.getCacheKey(params1);
            const key2 = llmService.getCacheKey(params2);

            expect(key1).toBe(key2);
        });
    });

    describe('statistics', () => {
        it('should track request statistics', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Review' } }]
                })
            });

            llmService.stats = {
                requests: 0,
                successes: 0,
                failures: 0,
                cacheHits: 0,
                totalCost: 0,
                avgLatency: 0
            };

            await llmService.generateReview({
                hotelName: 'Test',
                rating: 5,
                tripType: 'leisure',
                highlights: []
            });

            expect(llmService.stats.requests).toBe(1);
            expect(llmService.stats.successes).toBe(1);
            expect(llmService.stats.failures).toBe(0);
        });

        it('should calculate success rate', () => {
            llmService.stats = {
                requests: 10,
                successes: 8,
                failures: 2,
                cacheHits: 3,
                totalCost: 0.001,
                avgLatency: 250
            };

            const stats = llmService.getStats();
            
            expect(stats.successRate).toBe('80.0%');
            expect(stats.cacheHitRate).toBe('30.0%');
            expect(stats.avgLatency).toBe('250ms');
            expect(stats.totalCost).toBe('$0.0010');
        });
    });

    describe('configuration', () => {
        it('should allow reconfiguration of API keys', () => {
            llmService.configure({
                openaiKey: 'new-openai-key',
                groqKey: 'new-groq-key',
                proxyUrl: 'https://new-proxy.com'
            });

            expect(llmService.openaiKey).toBe('new-openai-key');
            expect(llmService.groqKey).toBe('new-groq-key');
            expect(llmService.proxyUrl).toBe('https://new-proxy.com');
        });

        it('should skip API if key not configured', async () => {
            llmService.openaiKey = null;
            llmService.groqKey = null;

            const result = await llmService.generateReview({
                hotelName: 'Test',
                rating: 5,
                tripType: 'leisure',
                highlights: ['location']
            });

            expect(result.source).toBe('template');
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('template fallback', () => {
        let templateGenerator;

        beforeEach(() => {
            templateGenerator = llmService.templateGenerator;
        });

        it('should generate appropriate templates for each rating', () => {
            const ratings = [1, 2, 3, 4, 5];
            
            ratings.forEach(rating => {
                const review = templateGenerator.generate({
                    hotelName: 'Test Hotel',
                    rating,
                    tripType: 'business',
                    highlights: ['location'],
                    nights: 3
                });

                expect(review).toContain('Test Hotel');
                expect(review.length).toBeGreaterThan(50);
            });
        });

        it('should handle empty highlights', () => {
            const review = templateGenerator.generate({
                hotelName: 'Test Hotel',
                rating: 4,
                tripType: 'leisure',
                highlights: [],
                nights: 2
            });

            expect(review).toContain('Test Hotel');
            expect(review).toContain('2-night');
        });

        it('should format multiple highlights correctly', () => {
            const text = templateGenerator.highlightsToText(['location', 'service', 'breakfast']);
            expect(text).toContain('location');
            expect(text).toContain('service');
            expect(text).toContain('breakfast');
            expect(text).toMatch(/and/);
        });
    });
});