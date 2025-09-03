/**
 * Main application entry point with lazy loading and performance optimizations
 * Provides the core application framework with modular loading and performance monitoring
 * @author Hotel Review Generator Team
 * @since 2.0.0
 */

import { createLogger } from '../utils/logger.js';
import { confirmModal } from '../utils/modal.js';

const logger = createLogger('Main');

/**
 * Inlines critical CSS for immediate rendering
 * Improves perceived performance by styling above-the-fold content immediately
 * @returns {void}
 */
function inlineCriticalCSS() {
  const criticalCSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .loading-spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.appendChild(style);
}

/**
 * Performance monitoring utility class
 * Tracks application performance metrics and identifies slow operations
 */
class PerformanceMonitor {
  /**
   * Creates a new PerformanceMonitor instance
   */
  constructor() {
    this.metrics = {};
    this.observer = null;
    this.initializeObserver();
  }

  /**
   * Initializes the PerformanceObserver for tracking metrics
   * @returns {void}
   */
  initializeObserver() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics[entry.name] = entry;

          // Log slow operations
          if (entry.duration > 100) {
            logger.warn(`Slow operation detected: ${entry.name} took ${entry.duration}ms`);
          }
        }
      });

      try {
        this.observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      } catch (e) {
        logger.warn('Performance observer not supported for all entry types');
      }
    }
  }

  /**
   * Creates a performance mark
   * @param {string} name - The name of the mark
   * @returns {void}
   */
  mark(name) {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  }

  /**
   * Creates a performance measure between two marks
   * @param {string} name - The name of the measure
   * @param {string} startMark - The start mark name
   * @param {string} endMark - The end mark name
   * @returns {void}
   */
  measure(name, startMark, endMark) {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (e) {
        logger.warn(`Could not measure ${name}:`, e.message);
      }
    }
  }

  /**
   * Gets all collected performance metrics
   * @returns {Object} Object containing all metrics, memory info, and timing data
   */
  getMetrics() {
    return {
      ...this.metrics,
      memory: 'memory' in performance ? performance.memory : null,
      timing: 'timing' in performance ? performance.timing : null
    };
  }
}

/**
 * Lazy loading utility for dynamic module imports
 * Manages module loading state and prevents duplicate loads
 */
class LazyLoader {
  /**
   * Creates a new LazyLoader instance
   */
  constructor() {
    this.loadedModules = new Set();
    this.loadingPromises = new Map();
  }

  /**
   * Loads a module dynamically with caching and error handling
   * @param {string} moduleName - The name of the module to load
   * @returns {Promise<Object>} The loaded module
   */
  async loadModule(moduleName) {
    // Prevent duplicate loading
    if (this.loadedModules.has(moduleName)) {
      return Promise.resolve();
    }

    // Return existing promise if already loading
    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName);
    }

    const loadingPromise = this.dynamicImport(moduleName);
    this.loadingPromises.set(moduleName, loadingPromise);

    try {
      const result = await loadingPromise;
      this.loadedModules.add(moduleName);
      this.loadingPromises.delete(moduleName);
      return result;
    } catch (error) {
      this.loadingPromises.delete(moduleName);
      logger.error(`Failed to load module ${moduleName}:`, error);
      throw error;
    }
  }

  /**
   * Performs the actual dynamic import with performance tracking
   * @param {string} moduleName - The name of the module to import
   * @returns {Promise<Object>} The imported module
   */
  async dynamicImport(moduleName) {
    const performanceMonitor = window.performanceMonitor;
    performanceMonitor.mark(`${moduleName}-load-start`);

    let module;

    switch (moduleName) {
      case 'hybrid-generator':
        module = await import(
          /* webpackChunkName: "hybrid-generator" */
          /* webpackPreload: true */
          '../nlg-engine/index.js'
        );
        break;

      case 'security-auth':
        module = await import(
          /* webpackChunkName: "security-auth" */
          '../security/modules/AuthenticationManager.js'
        );
        break;

      case 'security-validation':
        module = await import(
          /* webpackChunkName: "security-validation" */
          '../security/modules/ValidationManager.js'
        );
        break;

      case 'monitoring':
        module = await import(
          /* webpackChunkName: "monitoring" */
          './monitoring.js'
        );
        break;

      case 'analytics':
        module = await import(
          /* webpackChunkName: "analytics" */
          './analytics.js'
        );
        break;

      default:
        throw new Error(`Unknown module: ${moduleName}`);
    }

    performanceMonitor.mark(`${moduleName}-load-end`);
    performanceMonitor.measure(
      `${moduleName}-load-time`,
      `${moduleName}-load-start`,
      `${moduleName}-load-end`
    );

    return module;
  }
}

/**
 * Main application class that orchestrates all functionality
 * Handles routing, module loading, performance monitoring, and core app lifecycle
 */
class HotelReviewApp {
  /**
   * Creates a new HotelReviewApp instance
   */
  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.lazyLoader = new LazyLoader();
    this.modules = {};

    // Make performance monitor globally accessible
    window.performanceMonitor = this.performanceMonitor;

    this.init();
  }

  /**
   * Initializes the application
   * Sets up performance monitoring, service worker, CSS loading, and core functionality
   * @returns {Promise<void>}
   */
  async init() {
    this.performanceMonitor.mark('app-init-start');

    // Inline critical CSS immediately
    inlineCriticalCSS();

    // Register service worker if supported and in production
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      this.registerServiceWorker();
    }

    // Load non-critical CSS asynchronously
    this.loadNonCriticalCSS();

    // Initialize core functionality
    this.initializeCore();

    // Preload critical modules
    this.preloadCriticalModules();

    this.performanceMonitor.mark('app-init-end');
    this.performanceMonitor.measure('app-init-time', 'app-init-start', 'app-init-end');
  }

  /**
   * Registers the service worker for offline functionality and caching
   * @returns {Promise<void>}
   */
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      logger.info('ServiceWorker registered successfully:', registration.scope);

      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, refresh the page
            confirmModal('New version available. Refresh to update?', {
              title: 'Update Available',
              confirmText: 'Refresh',
              cancelText: 'Later'
            }).then((confirmed) => {
              if (confirmed) {
                window.location.reload();
              }
            });
          }
        });
      });
    } catch (error) {
      logger.error('ServiceWorker registration failed:', error);
    }
  }

  /**
   * Loads non-critical CSS asynchronously to avoid blocking rendering
   * @returns {void}
   */
  loadNonCriticalCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/main.css';
    link.media = 'print';
    link.onload = function() {
      this.media = 'all';
    };
    document.head.appendChild(link);
  }

  /**
   * Initializes core application functionality
   * Sets up routing, event listeners, and intersection observers
   * @returns {void}
   */
  initializeCore() {
    // Initialize router
    this.initializeRouter();

    // Initialize event listeners
    this.initializeEventListeners();

    // Initialize intersection observer for lazy loading
    this.initializeIntersectionObserver();
  }

  /**
   * Initializes the hash-based router
   * @returns {void}
   */
  initializeRouter() {
    // Simple hash-based routing
    const route = window.location.hash.slice(1) || 'home';
    this.handleRoute(route);

    window.addEventListener('hashchange', () => {
      const newRoute = window.location.hash.slice(1) || 'home';
      this.handleRoute(newRoute);
    });
  }

  /**
   * Handles route changes and loads appropriate page content
   * @param {string} route - The route to handle
   * @returns {Promise<void>}
   */
  async handleRoute(route) {
    this.performanceMonitor.mark(`route-${route}-start`);

    switch (route) {
      case 'home':
        await this.loadHomePage();
        break;
      case 'generator':
        await this.loadGeneratorPage();
        break;
      default:
        await this.loadHomePage();
    }

    this.performanceMonitor.mark(`route-${route}-end`);
    this.performanceMonitor.measure(
      `route-${route}-time`,
      `route-${route}-start`,
      `route-${route}-end`
    );
  }

  /**
   * Loads and displays the home page
   * @returns {Promise<void>}
   */
  async loadHomePage() {
    // Home page is already loaded, just show it
    const homeElement = document.getElementById('home-page');
    if (homeElement) {
      homeElement.style.display = 'block';
    }
  }

  /**
   * Loads the review generator page with required modules
   * @returns {Promise<void>}
   */
  async loadGeneratorPage() {
    // Load the review generator with lazy-loaded modules
    try {
      // Load hybrid generator
      const hybridGenerator = await this.lazyLoader.loadModule('hybrid-generator');
      this.modules.hybridGenerator = hybridGenerator;

      // Load security modules if needed
      if (this.requiresSecurity()) {
        const securityAuth = await this.lazyLoader.loadModule('security-auth');
        const securityValidation = await this.lazyLoader.loadModule('security-validation');
        this.modules.securityAuth = securityAuth;
        this.modules.securityValidation = securityValidation;
      }

      // Initialize the review generator
      this.initializeReviewGenerator();

    } catch (error) {
      logger.error('Failed to load generator page:', error);
      this.showError('Failed to load review generator. Please refresh the page.');
    }
  }

  /**
   * Determines if security modules are required
   * @returns {boolean} True if security modules should be loaded
   */
  requiresSecurity() {
    // Check if we need security modules (e.g., user is logged in, handling sensitive data)
    return window.location.search.includes('auth=true') ||
           localStorage.getItem('user-authenticated') === 'true';
  }

  /**
   * Preloads critical modules during idle time
   * @returns {Promise<void>}
   */
  async preloadCriticalModules() {
    // Preload modules that are likely to be needed soon
    const criticalModules = ['hybrid-generator'];

    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.preloadModules(criticalModules));
    } else {
      setTimeout(() => this.preloadModules(criticalModules), 100);
    }
  }

  /**
   * Preloads an array of modules
   * @param {string[]} modules - Array of module names to preload
   * @returns {Promise<void>}
   */
  async preloadModules(modules) {
    for (const moduleName of modules) {
      try {
        await this.lazyLoader.loadModule(moduleName);
      } catch (error) {
        logger.warn(`Failed to preload ${moduleName}:`, error);
      }
    }
  }

  /**
   * Initializes global event listeners for error handling and page visibility
   * @returns {void}
   */
  initializeEventListeners() {
    // Global error handling
    window.addEventListener('error', (event) => {
      logger.error('Global error:', event.error);
      this.reportError(event.error);
    });

    // Unhandled promise rejection handling
    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled promise rejection:', event.reason);
      this.reportError(event.reason);
    });

    // Page visibility change (for pausing/resuming operations)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseOperations();
      } else {
        this.resumeOperations();
      }
    });
  }

  /**
   * Initializes intersection observer for lazy loading images
   * @returns {void}
   */
  initializeIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              this.imageObserver.unobserve(img);
            }
          }
        });
      });

      // Observe all images with data-src
      document.querySelectorAll('img[data-src]').forEach(img => {
        this.imageObserver.observe(img);
      });
    }
  }

  /**
   * Initializes the review generator with loaded modules
   * @returns {void}
   */
  initializeReviewGenerator() {
    // Initialize the main review generator functionality
    if (this.modules.hybridGenerator && this.modules.hybridGenerator.ReviewGenerator) {
      this.reviewGenerator = new this.modules.hybridGenerator.ReviewGenerator();
    }
  }

  /**
   * Pauses non-critical operations when page is hidden
   * @returns {void}
   */
  pauseOperations() {
    // Pause non-critical operations when page is hidden
    logger.debug('Page hidden - pausing operations');
  }

  /**
   * Resumes operations when page becomes visible again
   * @returns {void}
   */
  resumeOperations() {
    // Resume operations when page is visible again
    logger.debug('Page visible - resuming operations');
  }

  /**
   * Reports errors to the monitoring service
   * @param {Error} error - The error to report
   * @returns {void}
   */
  reportError(error) {
    // Report errors to monitoring service
    if (this.modules.monitoring && this.modules.monitoring.reportError) {
      this.modules.monitoring.reportError(error);
    }
  }

  /**
   * Displays a user-friendly error message
   * @param {string} message - The error message to display
   * @returns {void}
   */
  showError(message) {
    // Show user-friendly error message
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
      errorContainer.innerHTML = `
        <div class="error-message">
          <p>${message}</p>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      `;
      errorContainer.style.display = 'block';
    }
  }

  /**
   * Gets a loaded module by name
   * @param {string} name - The module name
   * @returns {Object|undefined} The loaded module or undefined if not loaded
   */
  getModule(name) {
    return this.modules[name];
  }

  /**
   * Gets a comprehensive performance report
   * @returns {Object} Object containing metrics, loaded modules, and timestamp
   */
  getPerformanceReport() {
    return {
      metrics: this.performanceMonitor.getMetrics(),
      loadedModules: Array.from(this.lazyLoader.loadedModules),
      timestamp: new Date().toISOString()
    };
  }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.hotelReviewApp = new HotelReviewApp();
  });
} else {
  window.hotelReviewApp = new HotelReviewApp();
}

// Export for testing
export { HotelReviewApp, LazyLoader, PerformanceMonitor };