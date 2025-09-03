/**
 * Hybrid Generator Module Index
 * Main entry point for all hybrid generator components
 */

// Import all components
const HybridGenerator = typeof require !== 'undefined' ? require('./HybridGenerator').HybridGenerator : window.HybridGenerator;
const ConfigManager = typeof require !== 'undefined' ? require('./ConfigManager') : window.ConfigManager;
const LLMProvider = typeof require !== 'undefined' ? require('./LLMProvider') : window.LLMProvider;
const CacheManager = typeof require !== 'undefined' ? require('./CacheManager') : window.CacheManager;
const MetricsManager = typeof require !== 'undefined' ? require('./MetricsManager') : window.MetricsManager;
const TemplateGenerator = typeof require !== 'undefined' ? require('./TemplateGenerator') : window.TemplateGenerator;

// Export all components
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    HybridGenerator,
    ConfigManager,
    LLMProvider,
    CacheManager,
    MetricsManager,
    TemplateGenerator,
    // For backward compatibility, export HybridGenerator as default
    default: HybridGenerator,
  };
}

// For browser compatibility
if (typeof window !== 'undefined') {
  window.HybridGeneratorModule = {
    HybridGenerator,
    ConfigManager,
    LLMProvider,
    CacheManager,
    MetricsManager,
    TemplateGenerator,
  };
}