/**
 * LLM Provider for HybridGenerator
 * Handles API calls to OpenAI, Groq, and other LLM providers with retry logic
 */

class LLMProvider {
  constructor(configManager) {
    this.configManager = configManager;
  }

  /**
   * Call OpenAI API (with proxy support)
   */
  async callOpenAI(params) {
    const prompt = this.buildPrompt(params);
    const config = this.configManager.getProviderConfig('openai');
    const proxyConfig = this.configManager.getProxyConfig();

    const endpoint = proxyConfig.enabled
      ? `${proxyConfig.url}/openai`
      : config.endpoint;

    const requestBody = {
      model: config.model,
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
      config.maxRetries,
      config.timeout
    );

    const data = await response.json();

    return {
      text: data.choices[0].message.content,
      tokens: data.usage?.total_tokens || 0,
      model: config.model,
    };
  }

  /**
   * Call Groq API (with proxy support)
   */
  async callGroq(params) {
    const prompt = this.buildPrompt(params);
    const config = this.configManager.getProviderConfig('groq');
    const proxyConfig = this.configManager.getProxyConfig();

    const endpoint = proxyConfig.enabled
      ? `${proxyConfig.url}/groq`
      : config.endpoint;

    const requestBody = {
      model: config.model,
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
      config.maxRetries,
      config.timeout
    );

    const data = await response.json();

    return {
      text: data.choices[0].message.content,
      tokens: data.usage?.total_tokens || 0,
      model: config.model,
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
   * Get headers for API calls
   */
  getHeaders(provider) {
    const headers = {
      'Content-Type': 'application/json',
    };

    const proxyConfig = this.configManager.getProxyConfig();
    if (!proxyConfig.enabled) {
      // Direct API calls need auth headers
      if (provider === 'openai') {
        const config = this.configManager.getProviderConfig('openai');
        headers['Authorization'] = `Bearer ${config.key}`;
      } else if (provider === 'groq') {
        const config = this.configManager.getProviderConfig('groq');
        headers['Authorization'] = `Bearer ${config.key}`;
      }
    }
    // Proxy handles auth on server side

    return headers;
  }

  /**
   * Utility: Sleep function
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
   * Estimate cost for OpenAI usage
   */
  estimateCost(text) {
    const config = this.configManager.getProviderConfig('openai');
    // Rough estimate: ~4 characters per token
    const estimatedTokens = text.length / 4;
    return (estimatedTokens / 1000) * config.costPer1kTokens;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LLMProvider;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
  window.LLMProvider = LLMProvider;
}