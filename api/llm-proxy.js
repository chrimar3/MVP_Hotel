/**
 * Secure Server-Side Proxy for LLM API Calls
 * Handles API key management and CORS for client-side calls
 * 
 * Deploy this as a serverless function (Vercel, Netlify, AWS Lambda)
 * or as an Express.js endpoint
 */

// For Vercel/Netlify Functions
export default async function handler(req, res) {
    // Enhanced CORS headers with security
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
        process.env.ALLOWED_ORIGINS.split(',') : 
        ['http://localhost:3000', 'http://127.0.0.1:3000'];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    } else {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Handle health checks
    if (req.method === 'GET' && req.url.includes('/health')) {
        return handleHealthCheck(req, res);
    }

    // Only allow POST for LLM requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { provider, ...requestBody } = req.body;

        // Validate provider
        if (!['openai', 'groq'].includes(provider)) {
            return res.status(400).json({ error: 'Invalid provider' });
        }

        // Rate limiting (simple implementation - use Redis in production)
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (!checkRateLimit(clientIp)) {
            return res.status(429).json({ error: 'Too many requests' });
        }

        let response;

        if (provider === 'openai') {
            response = await callOpenAI(requestBody);
        } else if (provider === 'groq') {
            response = await callGroq(requestBody);
        }

        // Log usage for monitoring
        logUsage(provider, clientIp, response.usage);

        res.status(200).json(response);

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(requestBody) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            ...requestBody,
            // Enforce limits
            max_tokens: Math.min(requestBody.max_tokens || 300, 500),
            temperature: Math.min(Math.max(requestBody.temperature || 0.7, 0), 1)
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    return response.json();
}

/**
 * Call Groq API
 */
async function callGroq(requestBody) {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
        throw new Error('Groq API key not configured');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'mixtral-8x7b-32768',
            ...requestBody,
            // Enforce limits
            max_tokens: Math.min(requestBody.max_tokens || 250, 400),
            temperature: Math.min(Math.max(requestBody.temperature || 0.7, 0), 1)
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    return response.json();
}

/**
 * Simple rate limiting (use Redis/Memcached in production)
 */
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

function checkRateLimit(clientIp) {
    const now = Date.now();
    const userLimits = rateLimitMap.get(clientIp) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

    // Reset if window expired
    if (now > userLimits.resetTime) {
        userLimits.count = 0;
        userLimits.resetTime = now + RATE_LIMIT_WINDOW;
    }

    // Check limit
    if (userLimits.count >= RATE_LIMIT_MAX) {
        return false;
    }

    // Increment and save
    userLimits.count++;
    rateLimitMap.set(clientIp, userLimits);

    // Clean old entries periodically
    if (rateLimitMap.size > 1000) {
        for (const [ip, limits] of rateLimitMap.entries()) {
            if (now > limits.resetTime) {
                rateLimitMap.delete(ip);
            }
        }
    }

    return true;
}

/**
 * Log usage for monitoring and cost tracking
 */
function logUsage(provider, clientIp, usage) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        provider: provider,
        clientIp: clientIp,
        tokens: usage?.total_tokens || 0,
        cost: calculateCost(provider, usage)
    };

    // In production, send to logging service (DataDog, CloudWatch, etc.)
    console.log('API Usage:', logEntry);

    // Track daily costs
    trackDailyCost(logEntry.cost);
}

/**
 * Calculate cost based on provider and usage
 */
function calculateCost(provider, usage) {
    if (!usage) return 0;

    const costs = {
        'openai': {
            'gpt-4o-mini': 0.00015 // per 1k tokens
        },
        'groq': {
            'mixtral-8x7b-32768': 0 // free tier
        }
    };

    const providerCosts = costs[provider];
    if (!providerCosts) return 0;

    const modelCost = Object.values(providerCosts)[0]; // Use first model cost
    return (usage.total_tokens / 1000) * modelCost;
}

/**
 * Track daily costs (simple implementation)
 */
const dailyCosts = new Map();

function trackDailyCost(cost) {
    const today = new Date().toISOString().split('T')[0];
    const currentCost = dailyCosts.get(today) || 0;
    dailyCosts.set(today, currentCost + cost);

    // Alert if daily limit exceeded
    const DAILY_LIMIT = parseFloat(process.env.DAILY_COST_LIMIT || '1.00');
    if (currentCost + cost > DAILY_LIMIT) {
        console.error(`Daily cost limit exceeded: $${(currentCost + cost).toFixed(2)}`);
        // In production, send alert to admin
    }
}

/**
 * Handle health check requests
 */
async function handleHealthCheck(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const provider = url.searchParams.get('provider');
    
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        proxy: 'operational'
    };

    // Check specific provider if requested
    if (provider === 'openai') {
        health.openai = {
            configured: !!process.env.OPENAI_API_KEY,
            status: process.env.OPENAI_API_KEY ? 'available' : 'not_configured'
        };
    } else if (provider === 'groq') {
        health.groq = {
            configured: !!process.env.GROQ_API_KEY,
            status: process.env.GROQ_API_KEY ? 'available' : 'not_configured'
        };
    } else {
        // General health check
        health.providers = {
            openai: {
                configured: !!process.env.OPENAI_API_KEY,
                status: process.env.OPENAI_API_KEY ? 'available' : 'not_configured'
            },
            groq: {
                configured: !!process.env.GROQ_API_KEY,
                status: process.env.GROQ_API_KEY ? 'available' : 'not_configured'
            }
        };
    }

    res.status(200).json(health);
}

// Express.js version (if not using serverless)
if (typeof module !== 'undefined' && require.main === module) {
    const express = require('express');
    const cors = require('cors');
    const app = express();

    app.use(cors());
    app.use(express.json());

    app.post('/api/llm-proxy/:provider', async (req, res) => {
        req.body.provider = req.params.provider;
        await handler(req, res);
    });

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`LLM Proxy server running on port ${PORT}`);
    });
}

// Environment variables needed:
// OPENAI_API_KEY=sk-...
// GROQ_API_KEY=gsk_...
// ALLOWED_ORIGIN=https://yourdomain.com
// DAILY_COST_LIMIT=1.00
// NODE_ENV=production