/**
 * NLG Engine Module Index - Optimized for lazy loading
 * Main entry point for all NLG engine components with performance optimizations
 */

// Dynamic imports for lazy loading
let HumanLikeNLGEngine, VocabularyManager, TransitionManager, NarrativeBuilder;

// Cache for loaded modules to prevent duplicate imports
const moduleCache = new Map();

/**
 * Lazy load a specific NLG component
 */
async function loadComponent(componentName) {
  if (moduleCache.has(componentName)) {
    return moduleCache.get(componentName);
  }

  let component;

  try {
    switch (componentName) {
      case 'HumanLikeNLGEngine': {
        const { HumanLikeNLGEngine: Engine } = await import('./HumanLikeNLGEngine.js');
        component = Engine;
        break;
      }
      case 'VocabularyManager': {
        const { VocabularyManager: VM } = await import('./VocabularyManager.js');
        component = VM;
        break;
      }
      case 'TransitionManager': {
        const { TransitionManager: TM } = await import('./TransitionManager.js');
        component = TM;
        break;
      }
      case 'NarrativeBuilder': {
        const { NarrativeBuilder: NB } = await import('./NarrativeBuilder.js');
        component = NB;
        break;
      }
      default:
        throw new Error(`Unknown component: ${componentName}`);
    }

    moduleCache.set(componentName, component);
    return component;
  } catch (error) {
    console.error(`Failed to load NLG component ${componentName}:`, error);
    throw error;
  }
}

/**
 * Initialize all NLG components (for compatibility)
 */
async function initializeAll() {
  if (!HumanLikeNLGEngine) {
    HumanLikeNLGEngine = await loadComponent('HumanLikeNLGEngine');
  }
  if (!VocabularyManager) {
    VocabularyManager = await loadComponent('VocabularyManager');
  }
  if (!TransitionManager) {
    TransitionManager = await loadComponent('TransitionManager');
  }
  if (!NarrativeBuilder) {
    NarrativeBuilder = await loadComponent('NarrativeBuilder');
  }

  return {
    HumanLikeNLGEngine,
    VocabularyManager,
    TransitionManager,
    NarrativeBuilder
  };
}

/**
 * Review Generator Factory - optimized for lazy loading
 */
class ReviewGenerator {
  constructor() {
    this.nlgEngine = null;
    this.vocabularyManager = null;
    this.transitionManager = null;
    this.narrativeBuilder = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // Load core NLG engine first
    const Engine = await loadComponent('HumanLikeNLGEngine');
    this.nlgEngine = new Engine();

    // Load supporting components
    const [VM, TM, NB] = await Promise.all([
      loadComponent('VocabularyManager'),
      loadComponent('TransitionManager'),
      loadComponent('NarrativeBuilder')
    ]);

    this.vocabularyManager = new VM();
    this.transitionManager = new TM();
    this.narrativeBuilder = new NB();

    this.initialized = true;
  }

  async generateReview(options) {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.nlgEngine.generateReview(options);
  }

  async getVocabulary(language = 'en') {
    if (!this.vocabularyManager) {
      const VM = await loadComponent('VocabularyManager');
      this.vocabularyManager = new VM();
    }

    return this.vocabularyManager.getVocabulary(language);
  }
}

// For ES modules
export {
  loadComponent,
  initializeAll,
  ReviewGenerator
};

// Export lazy-loaded components
export const getLazyHumanLikeNLGEngine = () => loadComponent('HumanLikeNLGEngine');
export const getLazyVocabularyManager = () => loadComponent('VocabularyManager');
export const getLazyTransitionManager = () => loadComponent('TransitionManager');
export const getLazyNarrativeBuilder = () => loadComponent('NarrativeBuilder');

// Default export for backward compatibility
export default ReviewGenerator;

// CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadComponent,
    initializeAll,
    ReviewGenerator,
    getLazyHumanLikeNLGEngine,
    getLazyVocabularyManager,
    getLazyTransitionManager,
    getLazyNarrativeBuilder,
    default: ReviewGenerator
  };
}

// Browser global compatibility (fallback)
if (typeof window !== 'undefined') {
  window.NLGEngineModule = {
    loadComponent,
    initializeAll,
    ReviewGenerator,
    getLazyHumanLikeNLGEngine,
    getLazyVocabularyManager,
    getLazyTransitionManager,
    getLazyNarrativeBuilder
  };
}