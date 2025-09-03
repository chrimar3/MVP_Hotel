/**
 * Security Module Index - Optimized for code splitting and lazy loading
 * Separates authentication, validation, and core security functionality
 */

// Module cache for preventing duplicate imports
const securityModuleCache = new Map();

/**
 * Security module loader with intelligent caching
 */
class SecurityModuleLoader {
  constructor() {
    this.loadingPromises = new Map();
    this.loadedModules = new Set();
  }

  async loadModule(moduleName) {
    // Return cached module if already loaded
    if (securityModuleCache.has(moduleName)) {
      return securityModuleCache.get(moduleName);
    }

    // Return existing loading promise if already in progress
    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName);
    }

    const loadingPromise = this.dynamicImportModule(moduleName);
    this.loadingPromises.set(moduleName, loadingPromise);

    try {
      const module = await loadingPromise;
      securityModuleCache.set(moduleName, module);
      this.loadedModules.add(moduleName);
      this.loadingPromises.delete(moduleName);
      return module;
    } catch (error) {
      this.loadingPromises.delete(moduleName);
      console.error(`Failed to load security module ${moduleName}:`, error);
      throw error;
    }
  }

  async dynamicImportModule(moduleName) {
    switch (moduleName) {
      case 'authentication':
        return import(
          /* webpackChunkName: "security-auth" */
          /* webpackPreload: true */
          './modules/AuthenticationManager.js'
        );

      case 'validation':
        return import(
          /* webpackChunkName: "security-validation" */
          './modules/ValidationManager.js'
        );

      case 'crypto':
        return import(
          /* webpackChunkName: "security-crypto" */
          './modules/CryptoUtils.js'
        );

      case 'headers':
        return import(
          /* webpackChunkName: "security-headers" */
          './modules/SecurityHeaders.js'
        );

      case 'logger':
        return import(
          /* webpackChunkName: "security-logger" */
          './modules/SecurityLogger.js'
        );

      default:
        throw new Error(`Unknown security module: ${moduleName}`);
    }
  }

  isLoaded(moduleName) {
    return this.loadedModules.has(moduleName);
  }

  getLoadedModules() {
    return Array.from(this.loadedModules);
  }
}

// Singleton instance
const securityLoader = new SecurityModuleLoader();

/**
 * Security Manager Factory - lazy loads components as needed
 */
class LazySecurityManager {
  constructor() {
    this.authManager = null;
    this.validationManager = null;
    this.cryptoUtils = null;
    this.securityHeaders = null;
    this.securityLogger = null;
    this.initialized = false;
  }

  /**
   * Initialize core security components
   */
  async initialize(options = {}) {
    if (this.initialized && !options.force) return;

    const { enableAuth = true, enableValidation = true, enableLogging = true } = options;

    const promises = [];

    if (enableAuth) {
      promises.push(this.loadAuthManager());
    }

    if (enableValidation) {
      promises.push(this.loadValidationManager());
    }

    if (enableLogging) {
      promises.push(this.loadSecurityLogger());
    }

    await Promise.all(promises);
    this.initialized = true;
  }

  /**
   * Lazy load authentication manager
   */
  async loadAuthManager() {
    if (!this.authManager) {
      const authModule = await securityLoader.loadModule('authentication');
      this.authManager = new authModule.AuthenticationManager();
    }
    return this.authManager;
  }

  /**
   * Lazy load validation manager
   */
  async loadValidationManager() {
    if (!this.validationManager) {
      const validationModule = await securityLoader.loadModule('validation');
      this.validationManager = new validationModule.ValidationManager();
    }
    return this.validationManager;
  }

  /**
   * Lazy load crypto utilities
   */
  async loadCryptoUtils() {
    if (!this.cryptoUtils) {
      const cryptoModule = await securityLoader.loadModule('crypto');
      this.cryptoUtils = new cryptoModule.CryptoUtils();
    }
    return this.cryptoUtils;
  }

  /**
   * Lazy load security headers manager
   */
  async loadSecurityHeaders() {
    if (!this.securityHeaders) {
      const headersModule = await securityLoader.loadModule('headers');
      this.securityHeaders = new headersModule.SecurityHeaders();
    }
    return this.securityHeaders;
  }

  /**
   * Lazy load security logger
   */
  async loadSecurityLogger() {
    if (!this.securityLogger) {
      const loggerModule = await securityLoader.loadModule('logger');
      this.securityLogger = new loggerModule.SecurityLogger();
    }
    return this.securityLogger;
  }

  /**
   * Authenticate user (loads auth module if needed)
   */
  async authenticate(credentials) {
    const authManager = await this.loadAuthManager();
    return authManager.authenticate(credentials);
  }

  /**
   * Validate input (loads validation module if needed)
   */
  async validate(data, schema) {
    const validationManager = await this.loadValidationManager();
    return validationManager.validate(data, schema);
  }

  /**
   * Encrypt data (loads crypto module if needed)
   */
  async encrypt(data) {
    const cryptoUtils = await this.loadCryptoUtils();
    return cryptoUtils.encrypt(data);
  }

  /**
   * Set security headers (loads headers module if needed)
   */
  async setSecurityHeaders() {
    const securityHeaders = await this.loadSecurityHeaders();
    return securityHeaders.apply();
  }

  /**
   * Log security event (loads logger if needed)
   */
  async logSecurityEvent(event, details) {
    const logger = await this.loadSecurityLogger();
    return logger.log(event, details);
  }

  /**
   * Lightweight security check - only loads minimal required modules
   */
  async performLightSecurityCheck(data) {
    // Only load validation for basic checks
    const validationManager = await this.loadValidationManager();

    return {
      isValid: await validationManager.basicValidation(data),
      timestamp: Date.now()
    };
  }

  /**
   * Full security audit - loads all modules
   */
  async performFullSecurityAudit(data, options = {}) {
    // Load all security modules
    await Promise.all([
      this.loadAuthManager(),
      this.loadValidationManager(),
      this.loadCryptoUtils(),
      this.loadSecurityHeaders(),
      this.loadSecurityLogger()
    ]);

    const results = {
      authentication: null,
      validation: null,
      encryption: null,
      headers: null,
      timestamp: Date.now()
    };

    // Perform comprehensive security checks
    if (options.checkAuth !== false) {
      results.authentication = await this.authManager.validateToken(data.token);
    }

    if (options.checkValidation !== false) {
      results.validation = await this.validationManager.comprehensiveValidation(data);
    }

    if (options.checkEncryption !== false) {
      results.encryption = await this.cryptoUtils.validateEncryption(data);
    }

    if (options.checkHeaders !== false) {
      results.headers = await this.securityHeaders.validate();
    }

    // Log the audit
    await this.securityLogger.log('security_audit', {
      results,
      options,
      modules: securityLoader.getLoadedModules()
    });

    return results;
  }

  /**
   * Get performance metrics for loaded security modules
   */
  getSecurityMetrics() {
    return {
      loadedModules: securityLoader.getLoadedModules(),
      initialized: this.initialized,
      components: {
        authManager: !!this.authManager,
        validationManager: !!this.validationManager,
        cryptoUtils: !!this.cryptoUtils,
        securityHeaders: !!this.securityHeaders,
        securityLogger: !!this.securityLogger
      }
    };
  }
}

// Security factory functions for different use cases
export const createLightweightSecurity = async () => {
  const manager = new LazySecurityManager();
  await manager.initialize({ enableAuth: false, enableLogging: false });
  return manager;
};

export const createAuthOnlySecurity = async () => {
  const manager = new LazySecurityManager();
  await manager.initialize({ enableValidation: false, enableLogging: true });
  return manager;
};

export const createFullSecurity = async () => {
  const manager = new LazySecurityManager();
  await manager.initialize();
  return manager;
};

// Direct module access functions
export const getSecurityModule = (moduleName) => securityLoader.loadModule(moduleName);
export const isSecurityModuleLoaded = (moduleName) => securityLoader.isLoaded(moduleName);

// Main exports
export {
  LazySecurityManager,
  SecurityModuleLoader,
  securityLoader
};

// Default export
export default LazySecurityManager;

// CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LazySecurityManager,
    SecurityModuleLoader,
    securityLoader,
    createLightweightSecurity,
    createAuthOnlySecurity,
    createFullSecurity,
    getSecurityModule,
    isSecurityModuleLoaded,
    default: LazySecurityManager
  };
}

// Browser compatibility
if (typeof window !== 'undefined') {
  window.SecurityModule = {
    LazySecurityManager,
    SecurityModuleLoader,
    securityLoader,
    createLightweightSecurity,
    createAuthOnlySecurity,
    createFullSecurity,
    getSecurityModule,
    isSecurityModuleLoaded
  };
}