/**
 * Main application entry point with lazy loading and performance optimizations
 */

// Critical CSS inlining function
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

// Performance monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observer = null;
    this.initializeObserver();
  }

  initializeObserver() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics[entry.name] = entry;

          // Log slow operations
          if (entry.duration > 100) {
            console.warn(`Slow operation detected: ${entry.name} took ${entry.duration}ms`);
          }
        }
      });

      try {
        this.observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      } catch (e) {
        console.warn('Performance observer not supported for all entry types');
      }
    }
  }

  mark(name) {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  }

  measure(name, startMark, endMark) {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (e) {
        console.warn(`Could not measure ${name}:`, e.message);
      }
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      memory: 'memory' in performance ? performance.memory : null,
      timing: 'timing' in performance ? performance.timing : null
    };
  }
}

// Lazy loading utility
class LazyLoader {
  constructor() {
    this.loadedModules = new Set();
    this.loadingPromises = new Map();
  }

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
      console.error(`Failed to load module ${moduleName}:`, error);
      throw error;
    }
  }

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

// Application core
class HotelReviewApp {
  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.lazyLoader = new LazyLoader();
    this.modules = {};

    // Make performance monitor globally accessible
    window.performanceMonitor = this.performanceMonitor;

    this.init();
  }

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

  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('ServiceWorker registered successfully:', registration.scope);

      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, refresh the page
            if (confirm('New version available. Refresh to update?')) {
              window.location.reload();
            }
          }
        });
      });
    } catch (error) {
      console.log('ServiceWorker registration failed:', error);
    }
  }

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

  initializeCore() {
    // Initialize router
    this.initializeRouter();

    // Initialize event listeners
    this.initializeEventListeners();

    // Initialize intersection observer for lazy loading
    this.initializeIntersectionObserver();
  }

  initializeRouter() {
    // Simple hash-based routing
    const route = window.location.hash.slice(1) || 'home';
    this.handleRoute(route);

    window.addEventListener('hashchange', () => {
      const newRoute = window.location.hash.slice(1) || 'home';
      this.handleRoute(newRoute);
    });
  }

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

  async loadHomePage() {
    // Home page is already loaded, just show it
    const homeElement = document.getElementById('home-page');
    if (homeElement) {
      homeElement.style.display = 'block';
    }
  }

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
      console.error('Failed to load generator page:', error);
      this.showError('Failed to load review generator. Please refresh the page.');
    }
  }

  requiresSecurity() {
    // Check if we need security modules (e.g., user is logged in, handling sensitive data)
    return window.location.search.includes('auth=true') ||
           localStorage.getItem('user-authenticated') === 'true';
  }

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

  async preloadModules(modules) {
    for (const moduleName of modules) {
      try {
        await this.lazyLoader.loadModule(moduleName);
      } catch (error) {
        console.warn(`Failed to preload ${moduleName}:`, error);
      }
    }
  }

  initializeEventListeners() {
    // Global error handling
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.reportError(event.error);
    });

    // Unhandled promise rejection handling
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
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

  initializeReviewGenerator() {
    // Initialize the main review generator functionality
    if (this.modules.hybridGenerator && this.modules.hybridGenerator.ReviewGenerator) {
      this.reviewGenerator = new this.modules.hybridGenerator.ReviewGenerator();
    }
  }

  pauseOperations() {
    // Pause non-critical operations when page is hidden
    console.log('Page hidden - pausing operations');
  }

  resumeOperations() {
    // Resume operations when page is visible again
    console.log('Page visible - resuming operations');
  }

  reportError(error) {
    // Report errors to monitoring service
    if (this.modules.monitoring && this.modules.monitoring.reportError) {
      this.modules.monitoring.reportError(error);
    }
  }

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

  // Public API for accessing loaded modules
  getModule(name) {
    return this.modules[name];
  }

  // Performance reporting
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