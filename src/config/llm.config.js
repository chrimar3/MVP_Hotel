/**
 * LLM Configuration
 * Manages API keys and settings for review generation
 */

const LLM_CONFIG = {
    // API Keys (should be stored securely, not in code)
    // These are placeholders - replace with actual keys or use environment variables
    apis: {
        openai: {
            key: process.env.OPENAI_API_KEY || 'sk-YOUR-KEY-HERE',
            endpoint: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-4o-mini',
            enabled: true
        },
        groq: {
            key: process.env.GROQ_API_KEY || 'gsk_YOUR-KEY-HERE',
            endpoint: 'https://api.groq.com/openai/v1/chat/completions',
            model: 'mixtral-8x7b-32768',
            enabled: true
        },
        proxy: {
            // Use a CORS proxy for client-side calls
            url: 'https://your-proxy.pipedream.net/llm',
            enabled: false
        }
    },
    
    // Generation settings
    generation: {
        maxTokens: 300,
        temperature: 0.8,
        topP: 0.9,
        frequencyPenalty: 0.3,
        presencePenalty: 0.6,
        timeout: 3000,
        retries: 2
    },
    
    // Cache settings
    cache: {
        enabled: true,
        ttl: 3600000, // 1 hour
        maxSize: 100 // Maximum cached responses
    },
    
    // Cost tracking
    costs: {
        'gpt-4o-mini': 0.000015, // per 1K tokens input
        'gpt-3.5-turbo': 0.0015, // per 1K tokens
        'mixtral-8x7b': 0, // Free tier
        budget: {
            daily: 1.00, // $1 per day
            monthly: 30.00 // $30 per month
        }
    },
    
    // Feature flags
    features: {
        useLLM: true, // Master switch for LLM usage
        fallbackToTemplate: true, // Use templates if LLM fails
        trackAnalytics: true, // Track usage statistics
        abTesting: false, // A/B test LLM vs templates
        multiLanguage: true, // Support multiple languages
        cacheResponses: true // Cache generated reviews
    },
    
    // Language support
    languages: {
        supported: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ja', 'zh', 'el'],
        default: 'en'
    },
    
    // Quality settings
    quality: {
        minLength: 100, // Minimum words
        maxLength: 250, // Maximum words
        readabilityTarget: 8, // Flesch-Kincaid grade level
        sentimentAlignment: true, // Align sentiment with rating
        personalityConsistency: true // Maintain consistent voice
    },
    
    // Rate limiting
    rateLimits: {
        openai: {
            rpm: 500, // Requests per minute
            tpm: 40000 // Tokens per minute
        },
        groq: {
            rpm: 30, // Free tier limit
            tpm: 10000
        }
    },
    
    // Monitoring
    monitoring: {
        logErrors: true,
        logPerformance: true,
        alertThreshold: {
            errorRate: 0.1, // 10% error rate
            latency: 5000, // 5 second response time
            cost: 1.00 // $1 per day
        }
    }
};

/**
 * Initialize configuration from environment or localStorage
 */
function initializeConfig() {
    // Try to load from environment variables (Node.js)
    if (typeof process !== 'undefined' && process.env) {
        if (process.env.OPENAI_API_KEY) {
            LLM_CONFIG.apis.openai.key = process.env.OPENAI_API_KEY;
        }
        if (process.env.GROQ_API_KEY) {
            LLM_CONFIG.apis.groq.key = process.env.GROQ_API_KEY;
        }
    }
    
    // Try to load from localStorage (Browser)
    if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('llm_config');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                Object.assign(LLM_CONFIG, parsed);
            } catch (e) {
                console.warn('Failed to parse stored LLM config:', e);
            }
        }
    }
    
    return LLM_CONFIG;
}

/**
 * Save configuration to localStorage
 */
function saveConfig(config) {
    if (typeof window !== 'undefined' && window.localStorage) {
        // Don't save API keys in localStorage for security
        const toSave = { ...config };
        delete toSave.apis.openai.key;
        delete toSave.apis.groq.key;
        
        localStorage.setItem('llm_config', JSON.stringify(toSave));
    }
}

/**
 * Validate API keys
 */
async function validateAPIKeys() {
    const results = {
        openai: false,
        groq: false
    };
    
    // Test OpenAI
    if (LLM_CONFIG.apis.openai.key && LLM_CONFIG.apis.openai.key !== 'sk-YOUR-KEY-HERE') {
        try {
            const response = await fetch(LLM_CONFIG.apis.openai.endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${LLM_CONFIG.apis.openai.key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 5
                })
            });
            results.openai = response.ok;
        } catch (e) {
            console.warn('OpenAI validation failed:', e);
        }
    }
    
    // Test Groq
    if (LLM_CONFIG.apis.groq.key && LLM_CONFIG.apis.groq.key !== 'gsk_YOUR-KEY-HERE') {
        try {
            const response = await fetch(LLM_CONFIG.apis.groq.endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${LLM_CONFIG.apis.groq.key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'mixtral-8x7b-32768',
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 5
                })
            });
            results.groq = response.ok;
        } catch (e) {
            console.warn('Groq validation failed:', e);
        }
    }
    
    return results;
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LLM_CONFIG, initializeConfig, saveConfig, validateAPIKeys };
} else {
    // Browser global
    window.LLM_CONFIG = LLM_CONFIG;
    window.initializeLLMConfig = initializeConfig;
    window.saveLLMConfig = saveConfig;
    window.validateAPIKeys = validateAPIKeys;
}