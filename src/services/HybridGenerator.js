/**
 * Hybrid Review Generator - Main Entry Point
 * This is a backward-compatible wrapper that imports from the modular structure
 */

// Import the modular HybridGenerator
const HybridGeneratorModule = typeof require !== 'undefined'
  ? require('./hybrid-generator')
  : (typeof window !== 'undefined' ? window.HybridGeneratorModule : {});

// Re-export for backward compatibility
const { HybridGenerator, TemplateGenerator } = HybridGeneratorModule;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HybridGenerator, TemplateGenerator };
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
  window.HybridGenerator = HybridGenerator;
  window.TemplateGenerator = TemplateGenerator;
}
