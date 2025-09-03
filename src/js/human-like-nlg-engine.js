/**
 * Human-Like NLG Engine - Main Entry Point
 * This is a backward-compatible wrapper that imports from the modular structure
 */

// Import the modular NLG Engine
const NLGEngineModule = typeof require !== 'undefined'
    ? require('./nlg-engine')
    : (typeof window !== 'undefined' ? window.NLGEngineModule : {});

// Get the main engine class
const { HumanLikeNLGEngine: HumanLikeNLGEngineCore } = NLGEngineModule;

// Create wrapper class for backward compatibility
class HumanLikeNLGEngine extends HumanLikeNLGEngineCore {
    constructor() {
        super();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HumanLikeNLGEngine;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
    window.HumanLikeNLGEngine = HumanLikeNLGEngine;
}