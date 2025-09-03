/**
 * Cache Manager for HybridGenerator
 * Handles caching of LLM responses with TTL and size limits
 */

class CacheManager {
  constructor(configManager) {
    this.configManager = configManager;
    this.cache = new Map();
  }

  /**
   * Check cache for existing result
   */
  async checkCache(params) {
    const config = this.configManager.getCacheConfig();
    if (!config.enabled) return null;

    const key = this.getCacheKey(params);
    const cached = this.cache.get(key);

    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }

    return null;
  }

  /**
   * Cache a result with TTL
   */
  async cacheResult(params, result) {
    const config = this.configManager.getCacheConfig();
    if (!config.enabled) return;

    const key = this.getCacheKey(params);

    // Enforce cache size limit
    if (this.cache.size >= config.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value: result.text,
      expires: Date.now() + config.ttl,
    });
  }

  /**
   * Generate cache key from parameters
   */
  getCacheKey(params) {
    return JSON.stringify({
      hotel: params.hotelName,
      rating: params.rating,
      tripType: params.tripType,
      highlights: params.highlights?.sort(),
    });
  }

  /**
   * Clean expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expires < now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [, value] of this.cache.entries()) {
      if (value.expires > now) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
      maxSize: this.configManager.getCacheConfig().maxSize,
    };
  }

  /**
   * Start automatic cache cleanup
   */
  startCleanup() {
    // Clean old cache entries every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupCache();
    }, 3600000);
  }

  /**
   * Stop automatic cache cleanup
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CacheManager;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
  window.CacheManager = CacheManager;
}