/**
 * Service Mocks for Integration Tests
 * Comprehensive mocks that simulate real service behavior
 */

// Mock HybridGenerator
class MockHybridGenerator {
    constructor(options = {}) {
        this.options = options;
        this.metrics = {
            requests: { total: 0, successful: 0, failed: 0 },
            providers: { openai: { success: 0, errors: 0 }, groq: { success: 0, errors: 0 } },
            cost: { total: '$0.00', openai: '$0.00', groq: '$0.00' }
        };
        this.cache = new Map();
        this.destroyed = false;
    }

    async generate(params) {
        if (this.destroyed) {
            throw new Error('Generator has been destroyed');
        }

        // Simulate request tracking
        this.metrics.requests.total++;

        const cacheKey = JSON.stringify(params);
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            return {
                ...cached,
                source: 'cache',
                cached: true,
                latency: 5
            };
        }

        // Simulate generation delay
        await new Promise(resolve => setTimeout(resolve, 50));

        // Generate mock review based on parameters
        const review = this.generateMockReview(params);
        
        const result = {
            text: review,
            source: 'openai',
            model: 'gpt-4o-mini',
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            latency: Math.random() * 200 + 100,
            cost: 0.002,
            cached: false,
            tokens: Math.floor(review.length / 4) // Rough token estimate
        };

        // Cache the result
        this.cache.set(cacheKey, { ...result, source: 'openai' });

        // Update metrics
        this.metrics.requests.successful++;
        this.metrics.providers.openai.success++;
        this.updateCostMetrics(result.cost);

        return result;
    }

    generateMockReview(params) {
        const { hotelName, rating, tripType, highlights = [], language = 'en', additionalContext = {} } = params;
        
        const templates = {
            en: {
                opening: `I had a wonderful stay at ${hotelName}!`,
                highlights: {
                    location: 'The location was perfect',
                    service: 'The service was exceptional',
                    cleanliness: 'Everything was spotlessly clean',
                    comfort: 'The room was very comfortable',
                    facilities: 'The facilities were excellent',
                    value: 'Great value for money',
                    breakfast: 'The breakfast was delicious',
                    wifi: 'The wifi was fast and reliable',
                    pool: 'The pool was excellent',
                    kids: 'Great for kids'
                },
                closing: 'I would definitely recommend this hotel and look forward to returning!'
            },
            es: {
                opening: `¡Tuve una estancia maravillosa en ${hotelName}!`,
                highlights: {
                    location: 'La ubicación era perfecta',
                    service: 'El servicio fue excepcional',
                    cleanliness: 'Todo estaba impecablemente limpio',
                    pool: 'La piscina era excelente',
                    kids: 'Perfecto para niños'
                },
                closing: '¡Definitivamente recomendaría este hotel!'
            }
        };

        const t = templates[language] || templates.en;
        let review = t.opening + ' ';

        // Add rating context
        if (rating >= 5) {
            review += 'This hotel exceeded all my expectations. ';
        } else if (rating >= 4) {
            review += 'This was a very good hotel. ';
        }

        // Add trip type context
        if (tripType === 'business') {
            review += 'Perfect for business travelers. ';
        } else if (tripType === 'family') {
            if (language === 'es') {
                review += 'Perfecto para familias con niños. ';
            } else {
                review += 'Great for families with children. ';
            }
        }

        // Add highlights
        if (highlights.length > 0) {
            const highlightTexts = highlights.map(h => t.highlights[h] || h).filter(Boolean);
            if (highlightTexts.length > 0) {
                review += highlightTexts.join('. ') + '. ';
            }
        }

        // Add staff recognition
        if (additionalContext.staffName) {
            review += `Special thanks to ${additionalContext.staffName} for their excellent service. `;
        }

        // Add additional comments
        if (additionalContext.comments) {
            review += `${additionalContext.comments} `;
        }

        review += t.closing;

        return review;
    }

    updateCostMetrics(cost) {
        const current = parseFloat(this.metrics.cost.total.replace('$', ''));
        const newTotal = current + cost;
        this.metrics.cost.total = `$${newTotal.toFixed(4)}`;
        this.metrics.cost.openai = `$${newTotal.toFixed(4)}`;
    }

    getMetricsSummary() {
        return this.metrics;
    }

    clearCache() {
        this.cache.clear();
    }

    destroy() {
        this.destroyed = true;
        this.cache.clear();
    }
}

// Mock LLMReviewGenerator
class MockLLMReviewGenerator {
    constructor(options = {}) {
        this.options = options;
        this.cache = new Map();
    }

    async generateReview(params) {
        const cacheKey = JSON.stringify(params);
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            return {
                ...cached,
                source: 'cache',
                cached: true
            };
        }

        // Simulate generation delay
        await new Promise(resolve => setTimeout(resolve, 30));

        const review = this.generateBasicReview(params);
        
        const result = {
            text: review,
            source: 'openai',
            model: 'gpt-4o-mini',
            requestId: `llm_${Date.now()}`,
            latency: Math.random() * 150 + 75,
            cost: 0.0015,
            cached: false
        };

        // Cache the result
        this.cache.set(cacheKey, result);

        return result;
    }

    generateBasicReview(params) {
        const { hotelName, rating = 5, highlights = [] } = params;
        
        let review = `Amazing stay at ${hotelName}! `;
        
        if (rating >= 5) {
            review += 'Everything was perfect. ';
        }

        if (highlights.includes('location')) {
            review += 'Great location. ';
        }
        if (highlights.includes('service')) {
            review += 'Excellent service. ';
        }

        review += 'Highly recommend!';
        
        return review;
    }
}

// Mock ReviewModel with proper state management
class MockReviewModel {
    constructor() {
        this.state = {
            hotelName: '',
            rating: 0,
            tripType: '',
            nights: 0,
            guests: 0,
            language: 'en',
            voice: 'neutral',
            highlights: [],
            generatedReview: null,
            statistics: {
                totalGenerated: 0,
                averageRating: 0,
                lastGenerationTime: 0,
                popularHighlights: []
            }
        };
    }

    setHotelInfo(name, source = 'direct') {
        this.state.hotelName = name;
        this.state.source = source;
    }

    setRating(rating) {
        this.state.rating = rating;
    }

    setTripDetails(type, nights = 1, guests = 1) {
        this.state.tripType = type;
        this.state.nights = nights;
        this.state.guests = guests;
    }

    toggleHighlight(highlight) {
        const index = this.state.highlights.indexOf(highlight);
        if (index > -1) {
            this.state.highlights.splice(index, 1);
        } else {
            this.state.highlights.push(highlight);
        }
    }

    setLanguage(language) {
        this.state.language = language;
    }

    setVoice(voice) {
        this.state.voice = voice;
    }

    setGeneratedReview(review, latency = 0) {
        this.state.generatedReview = review;
        
        // Update statistics
        this.state.statistics.totalGenerated++;
        this.state.statistics.lastGenerationTime = latency || (review && review.latency) || 0;
        
        // Update average rating
        const currentAvg = this.state.statistics.averageRating;
        const totalCount = this.state.statistics.totalGenerated;
        this.state.statistics.averageRating = 
            (currentAvg * (totalCount - 1) + this.state.rating) / totalCount;
        
        // Update popular highlights
        this.updatePopularHighlights();
    }

    updatePopularHighlights() {
        const existing = this.state.statistics.popularHighlights;
        
        this.state.highlights.forEach(highlight => {
            const found = existing.find(h => h.name === highlight);
            if (found) {
                found.count++;
            } else {
                existing.push({ name: highlight, count: 1 });
            }
        });
    }

    validate() {
        const errors = [];
        
        if (!this.state.hotelName) {
            errors.push('Hotel name is required');
        }
        
        if (!this.state.rating || this.state.rating < 1 || this.state.rating > 5) {
            errors.push('Valid rating is required');
        }
        
        if (this.state.highlights.length === 0) {
            errors.push('At least one highlight must be selected');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    getState() {
        return { ...this.state };
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
    }
}

// Export mocks for use in tests
module.exports = {
    HybridGenerator: MockHybridGenerator,
    LLMReviewGenerator: MockLLMReviewGenerator,
    ReviewModel: MockReviewModel
};