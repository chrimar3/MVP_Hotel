/**
 * LLM-based Review Generator with Hybrid Fallback System
 * Primary: OpenAI GPT-4o-mini (best quality/cost)
 * Fallback: Groq Mixtral (ultra-fast, free)
 * Emergency: Template system (always available)
 */

class LLMReviewGenerator {
    constructor(config = {}) {
        // API Configuration
        this.openaiKey = config.openaiKey || null;
        this.groqKey = config.groqKey || null;
        this.proxyUrl = config.proxyUrl || 'https://api.pipedream.com/v1/proxy'; // CORS proxy
        
        // Model settings
        this.models = {
            primary: {
                provider: 'openai',
                model: 'gpt-4o-mini',
                url: 'https://api.openai.com/v1/chat/completions',
                timeout: 3000,
                costPerRequest: 0.000045
            },
            fallback: {
                provider: 'groq',
                model: 'mixtral-8x7b-32768',
                url: 'https://api.groq.com/openai/v1/chat/completions',
                timeout: 1000,
                costPerRequest: 0
            }
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
            avgLatency: 0
        };
        
        // Template fallback system
        this.templateGenerator = new TemplateReviewGenerator();
    }

    /**
     * Generate review using best available method
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
                latency: performance.now() - startTime
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
                cost: this.models.primary.costPerRequest
            };
        } catch (error) {
            console.warn('OpenAI failed, trying Groq:', error.message);
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
                cost: 0
            };
        } catch (error) {
            console.warn('Groq failed, using templates:', error.message);
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
            cost: 0
        };
    }

    /**
     * Generate with OpenAI GPT-4o-mini
     */
    async generateWithOpenAI(params) {
        if (!this.openaiKey) {
            throw new Error('OpenAI API key not configured');
        }
        
        const prompt = this.buildPrompt(params);
        
        const response = await this.fetchWithTimeout(
            this.models.primary.url,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.openaiKey}`
                },
                body: JSON.stringify({
                    model: this.models.primary.model,
                    messages: [
                        {
                            role: 'system',
                            content: `You are a hotel review writer creating authentic, natural-sounding reviews.
                            Write in first person, be specific but not overly detailed.
                            Keep reviews between 150-200 words.
                            Include personal touches and specific observations.
                            Avoid clichés and overly promotional language.`
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.8,
                    max_tokens: 300,
                    presence_penalty: 0.6,
                    frequency_penalty: 0.3
                })
            },
            this.models.primary.timeout
        );
        
        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * Generate with Groq (ultra-fast)
     */
    async generateWithGroq(params) {
        if (!this.groqKey) {
            throw new Error('Groq API key not configured');
        }
        
        const prompt = this.buildPrompt(params);
        
        const response = await this.fetchWithTimeout(
            this.models.fallback.url,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.groqKey}`
                },
                body: JSON.stringify({
                    model: this.models.fallback.model,
                    messages: [
                        {
                            role: 'user',
                            content: `Write a natural hotel review. ${prompt}`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 250,
                    stream: false
                })
            },
            this.models.fallback.timeout
        );
        
        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * Build prompt from parameters
     */
    buildPrompt(params) {
        const {
            hotelName = 'Grand Hotel',
            rating = 5,
            tripType = 'leisure',
            highlights = [],
            nights = 3,
            voice = 'friendly',
            language = 'en'
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
            friendly: 'Use a warm, conversational tone.',
            enthusiastic: 'Use an excited, energetic tone.',
            detailed: 'Be thorough and analytical.'
        };
        prompt += voiceMap[voice] || voiceMap.friendly;
        
        // Language instruction
        if (language !== 'en') {
            prompt += ` Write in ${this.getLanguageName(language)}.`;
        }
        
        return prompt;
    }

    /**
     * Get rating tone description
     */
    getRatingTone(rating) {
        const tones = {
            5: 'very positive and enthusiastic',
            4: 'positive with minor observations',
            3: 'balanced with pros and cons',
            2: 'disappointed but constructive',
            1: 'negative but professional'
        };
        return tones[rating] || tones[3];
    }

    /**
     * Get language name from code
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
            el: 'Greek'
        };
        return languages[code] || 'English';
    }

    /**
     * Fetch with timeout
     */
    async fetchWithTimeout(url, options, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
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
     * Cache management
     */
    getCacheKey(params) {
        return JSON.stringify({
            hotel: params.hotelName,
            rating: params.rating,
            tripType: params.tripType,
            highlights: params.highlights?.sort(),
            voice: params.voice
        });
    }

    cacheResult(key, value) {
        this.cache.set(key, value);
        
        // Auto-clear after timeout
        setTimeout(() => {
            this.cache.delete(key);
        }, this.cacheTimeout);
    }

    /**
     * Statistics tracking
     */
    updateAvgLatency(latency) {
        const total = this.stats.avgLatency * (this.stats.requests - 1) + latency;
        this.stats.avgLatency = total / this.stats.requests;
    }

    getStats() {
        return {
            ...this.stats,
            successRate: (this.stats.successes / this.stats.requests * 100).toFixed(1) + '%',
            cacheHitRate: (this.stats.cacheHits / this.stats.requests * 100).toFixed(1) + '%',
            avgLatency: Math.round(this.stats.avgLatency) + 'ms',
            totalCost: '$' + this.stats.totalCost.toFixed(4)
        };
    }

    /**
     * Configure API keys
     */
    configure(config) {
        if (config.openaiKey) this.openaiKey = config.openaiKey;
        if (config.groqKey) this.groqKey = config.groqKey;
        if (config.proxyUrl) this.proxyUrl = config.proxyUrl;
    }
}

/**
 * Template-based fallback generator
 */
class TemplateReviewGenerator {
    generate(params) {
        const { hotelName, rating, tripType, highlights = [], nights } = params;
        
        // Simple template generation as emergency fallback
        const templates = {
            5: `My ${nights}-night stay at ${hotelName} was absolutely wonderful. ${this.highlightsToText(highlights)} Everything exceeded my expectations, and I can't wait to return.`,
            4: `I really enjoyed my ${nights}-night ${tripType} stay at ${hotelName}. ${this.highlightsToText(highlights)} While there were minor areas for improvement, overall it was a great experience.`,
            3: `My ${nights}-night stay at ${hotelName} was satisfactory. ${this.highlightsToText(highlights)} There were both positives and negatives, but it met my basic needs.`,
            2: `Unfortunately, my ${nights}-night stay at ${hotelName} didn't meet expectations. ${this.highlightsToText(highlights)} Several improvements are needed.`,
            1: `I was disappointed with my stay at ${hotelName}. Despite ${nights} nights there, the experience fell short in multiple areas.`
        };
        
        return templates[rating] || templates[3];
    }
    
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