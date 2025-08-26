# Hotel Review Generator - Implementation Patterns

## State Management Pattern

### Centralized State with Event-Driven Updates

The application uses a centralized state management pattern with immutable state updates and event-driven synchronization across components.

```javascript
class StateManager {
  constructor() {
    this.state = this.getInitialState();
    this.subscribers = new Map();
    this.middleware = [];
    this.history = [];
    this.maxHistorySize = 50;
  }
  
  getInitialState() {
    return {
      // Application state
      app: {
        initialized: false,
        loading: false,
        error: null,
        platform: null,
        language: 'en'
      },
      
      // Form state
      form: {
        currentStep: 0,
        totalSteps: 3,
        data: {},
        validation: {},
        dirty: false,
        submitting: false
      },
      
      // Review state
      review: {
        generated: false,
        content: '',
        method: null,
        regenerationCount: 0,
        wordCount: 0
      },
      
      // UI state
      ui: {
        theme: 'auto',
        animations: true,
        sidebarOpen: false,
        notifications: []
      },
      
      // Analytics state
      analytics: {
        sessionId: this.generateSessionId(),
        events: [],
        funnel: {},
        performance: {}
      }
    };
  }
  
  // State update methods
  setState(updater, actionType = 'UPDATE') {
    const previousState = this.state;
    
    // Apply middleware
    let newState = typeof updater === 'function' 
      ? updater(previousState) 
      : { ...previousState, ...updater };
    
    // Run through middleware
    newState = this.middleware.reduce((state, middleware) => {
      return middleware(state, previousState, actionType);
    }, newState);
    
    // Update state
    this.state = Object.freeze(newState);
    
    // Add to history
    this.addToHistory(previousState, newState, actionType);
    
    // Notify subscribers
    this.notifySubscribers(newState, previousState);
    
    return this.state;
  }
  
  // Subscription system
  subscribe(selector, callback) {
    const subscriberId = Math.random().toString(36).substr(2, 9);
    
    this.subscribers.set(subscriberId, {
      selector: selector || ((state) => state),
      callback,
      lastValue: selector ? selector(this.state) : this.state
    });
    
    return () => this.subscribers.delete(subscriberId);
  }
  
  notifySubscribers(newState, previousState) {
    this.subscribers.forEach((subscription) => {
      const newValue = subscription.selector(newState);
      const hasChanged = newValue !== subscription.lastValue;
      
      if (hasChanged) {
        subscription.lastValue = newValue;
        subscription.callback(newValue, subscription.selector(previousState));
      }
    });
  }
  
  // Action creators
  createActions() {
    return {
      // App actions
      initializeApp: () => this.setState(
        state => ({ ...state, app: { ...state.app, initialized: true } }),
        'INITIALIZE_APP'
      ),
      
      setLoading: (loading) => this.setState(
        state => ({ ...state, app: { ...state.app, loading } }),
        'SET_LOADING'
      ),
      
      setError: (error) => this.setState(
        state => ({ ...state, app: { ...state.app, error } }),
        'SET_ERROR'
      ),
      
      // Form actions
      setFormStep: (step) => this.setState(
        state => ({ 
          ...state, 
          form: { 
            ...state.form, 
            currentStep: step,
            dirty: step > 0 
          } 
        }),
        'SET_FORM_STEP'
      ),
      
      updateFormData: (stepData) => this.setState(
        state => ({
          ...state,
          form: {
            ...state.form,
            data: { ...state.form.data, ...stepData },
            dirty: true
          }
        }),
        'UPDATE_FORM_DATA'
      ),
      
      setFormValidation: (validation) => this.setState(
        state => ({
          ...state,
          form: { ...state.form, validation }
        }),
        'SET_FORM_VALIDATION'
      ),
      
      // Review actions
      setGeneratedReview: (content, method) => this.setState(
        state => ({
          ...state,
          review: {
            ...state.review,
            generated: true,
            content,
            method,
            wordCount: content.split(' ').length,
            regenerationCount: method === 'regenerate' 
              ? state.review.regenerationCount + 1 
              : state.review.regenerationCount
          }
        }),
        'SET_GENERATED_REVIEW'
      ),
      
      // UI actions
      addNotification: (notification) => this.setState(
        state => ({
          ...state,
          ui: {
            ...state.ui,
            notifications: [...state.ui.notifications, {
              id: Date.now(),
              timestamp: Date.now(),
              ...notification
            }]
          }
        }),
        'ADD_NOTIFICATION'
      ),
      
      removeNotification: (id) => this.setState(
        state => ({
          ...state,
          ui: {
            ...state.ui,
            notifications: state.ui.notifications.filter(n => n.id !== id)
          }
        }),
        'REMOVE_NOTIFICATION'
      )
    };
  }
}

// Singleton instance
const AppState = new StateManager();
const Actions = AppState.createActions();

// Export for use in components
export { AppState, Actions };
```

### State Middleware Pattern

```javascript
// Logging middleware
const loggingMiddleware = (newState, previousState, actionType) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`State Update: ${actionType}`);
    console.log('Previous state:', previousState);
    console.log('New state:', newState);
    console.groupEnd();
  }
  return newState;
};

// Persistence middleware
const persistenceMiddleware = (newState, previousState, actionType) => {
  // Persist certain parts of state to localStorage
  const persistableState = {
    form: newState.form.data,
    ui: {
      theme: newState.ui.theme,
      language: newState.app.language
    }
  };
  
  try {
    localStorage.setItem('app-state', JSON.stringify(persistableState));
  } catch (error) {
    console.warn('Failed to persist state:', error);
  }
  
  return newState;
};

// Analytics middleware
const analyticsMiddleware = (newState, previousState, actionType) => {
  // Track state changes that affect user experience
  const trackableActions = [
    'SET_FORM_STEP',
    'SET_GENERATED_REVIEW',
    'UPDATE_FORM_DATA'
  ];
  
  if (trackableActions.includes(actionType)) {
    EventBus.emit('analytics:track', {
      event: 'state_change',
      action: actionType,
      properties: {
        formStep: newState.form.currentStep,
        formComplete: newState.form.currentStep === newState.form.totalSteps - 1,
        reviewGenerated: newState.review.generated
      }
    });
  }
  
  return newState;
};

// Apply middleware
AppState.middleware = [
  loggingMiddleware,
  persistenceMiddleware,
  analyticsMiddleware
];
```

## Error Handling Strategy

### Hierarchical Error Boundaries

```javascript
class ErrorBoundary {
  constructor(name, fallbackUI) {
    this.name = name;
    this.fallbackUI = fallbackUI;
    this.errorCount = 0;
    this.lastError = null;
    this.setupGlobalHandlers();
  }
  
  setupGlobalHandlers() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now()
      });
    });
    
    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: Date.now()
      });
    });
  }
  
  handleError(error) {
    this.errorCount++;
    this.lastError = error;
    
    // Log error
    this.logError(error);
    
    // Track error
    this.trackError(error);
    
    // Show fallback UI if needed
    if (this.shouldShowFallback(error)) {
      this.showFallback(error);
    }
    
    // Attempt recovery
    this.attemptRecovery(error);
  }
  
  logError(error) {
    console.error(`[${this.name}] Error:`, error);
    
    // Send to error logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(error);
    }
  }
  
  trackError(error) {
    EventBus.emit('analytics:track', {
      event: 'error_occurred',
      properties: {
        boundary: this.name,
        error_type: error.type,
        error_message: error.message,
        error_count: this.errorCount,
        user_agent: navigator.userAgent,
        timestamp: error.timestamp
      }
    });
  }
  
  shouldShowFallback(error) {
    // Show fallback for critical errors or repeated failures
    return error.type === 'critical' || this.errorCount >= 3;
  }
  
  showFallback(error) {
    const fallbackElement = document.createElement('div');
    fallbackElement.className = 'error-fallback';
    fallbackElement.innerHTML = this.fallbackUI(error);
    
    // Replace main content with fallback
    const mainContent = document.querySelector('#app');
    if (mainContent) {
      mainContent.style.display = 'none';
      mainContent.parentNode.insertBefore(fallbackElement, mainContent.nextSibling);
    }
  }
  
  attemptRecovery(error) {
    switch (error.type) {
      case 'network':
        setTimeout(() => this.retryNetworkOperation(error), 2000);
        break;
      case 'storage':
        this.clearCorruptedStorage();
        break;
      case 'component':
        this.reinitializeComponent(error.component);
        break;
    }
  }
  
  retry() {
    if (this.errorCount > 0) {
      this.errorCount = 0;
      this.hideFallback();
      this.reinitializeApp();
    }
  }
}

// Error boundary instances
const AppErrorBoundary = new ErrorBoundary('App', (error) => `
  <div class="error-boundary">
    <h2>Something went wrong</h2>
    <p>We encountered an unexpected error. Please try refreshing the page.</p>
    <button onclick="window.location.reload()">Refresh Page</button>
    <details>
      <summary>Error Details</summary>
      <pre>${error.message}</pre>
    </details>
  </div>
`);

const FormErrorBoundary = new ErrorBoundary('Form', (error) => `
  <div class="form-error">
    <h3>Form Error</h3>
    <p>There was an issue with the form. Please try again.</p>
    <button onclick="AppState.createActions().setFormStep(0)">Restart Form</button>
  </div>
`);
```

### Graceful Degradation Pattern

```javascript
class GracefulDegradation {
  constructor() {
    this.features = new Map();
    this.fallbacks = new Map();
  }
  
  registerFeature(name, implementation, fallback) {
    this.features.set(name, implementation);
    this.fallbacks.set(name, fallback);
  }
  
  async useFeature(name, ...args) {
    try {
      const feature = this.features.get(name);
      if (!feature) {
        throw new Error(`Feature ${name} not found`);
      }
      
      return await feature(...args);
    } catch (error) {
      console.warn(`Feature ${name} failed, using fallback:`, error.message);
      
      const fallback = this.fallbacks.get(name);
      if (fallback) {
        return await fallback(...args);
      }
      
      throw error;
    }
  }
}

// Feature registration
const Features = new GracefulDegradation();

// AI text generation with template fallback
Features.registerFeature(
  'generateReview',
  async (context) => {
    // AI API implementation
    const response = await fetch('/api/generate-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  },
  async (context) => {
    // Template fallback
    return TemplateEngine.generate(context);
  }
);

// Clipboard API with manual copy fallback
Features.registerFeature(
  'copyToClipboard',
  async (text) => {
    await navigator.clipboard.writeText(text);
    return { success: true, method: 'api' };
  },
  async (text) => {
    // Create temporary textarea for manual selection
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    return { success, method: 'manual' };
  }
);
```

## Responsive Design Approach

### Mobile-First Breakpoint System

```css
/* CSS Custom Properties for consistent spacing */
:root {
  /* Breakpoints */
  --bp-mobile: 320px;
  --bp-mobile-lg: 480px;
  --bp-tablet: 768px;
  --bp-desktop: 1024px;
  --bp-desktop-lg: 1440px;
  
  /* Container sizes */
  --container-mobile: 100%;
  --container-tablet: 90%;
  --container-desktop: 1200px;
  
  /* Spacing scale */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-xxl: 3rem;
  
  /* Font sizes */
  --font-xs: 0.75rem;
  --font-sm: 0.875rem;
  --font-base: 1rem;
  --font-lg: 1.125rem;
  --font-xl: 1.25rem;
  --font-2xl: 1.5rem;
  --font-3xl: 2rem;
}
```

```javascript
class ResponsiveManager {
  constructor() {
    this.breakpoints = {
      mobile: 320,
      mobileLg: 480,
      tablet: 768,
      desktop: 1024,
      desktopLg: 1440
    };
    
    this.currentBreakpoint = this.getCurrentBreakpoint();
    this.setupBreakpointListener();
  }
  
  getCurrentBreakpoint() {
    const width = window.innerWidth;
    
    if (width >= this.breakpoints.desktopLg) return 'desktopLg';
    if (width >= this.breakpoints.desktop) return 'desktop';
    if (width >= this.breakpoints.tablet) return 'tablet';
    if (width >= this.breakpoints.mobileLg) return 'mobileLg';
    return 'mobile';
  }
  
  setupBreakpointListener() {
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const newBreakpoint = this.getCurrentBreakpoint();
        
        if (newBreakpoint !== this.currentBreakpoint) {
          const previousBreakpoint = this.currentBreakpoint;
          this.currentBreakpoint = newBreakpoint;
          
          EventBus.emit('breakpoint:changed', {
            current: newBreakpoint,
            previous: previousBreakpoint,
            width: window.innerWidth,
            height: window.innerHeight
          });
        }
      }, 100);
    });
  }
  
  isMobile() {
    return ['mobile', 'mobileLg'].includes(this.currentBreakpoint);
  }
  
  isTablet() {
    return this.currentBreakpoint === 'tablet';
  }
  
  isDesktop() {
    return ['desktop', 'desktopLg'].includes(this.currentBreakpoint);
  }
  
  // Responsive component loading
  async loadComponent(baseName) {
    const suffix = this.isMobile() ? 'Mobile' : 'Desktop';
    const componentName = `${baseName}${suffix}`;
    
    try {
      const module = await import(`./components/${componentName}.js`);
      return module.default;
    } catch (error) {
      // Fallback to base component
      const module = await import(`./components/${baseName}.js`);
      return module.default;
    }
  }
}
```

### Adaptive Form Layout

```javascript
class AdaptiveForm {
  constructor(container) {
    this.container = container;
    this.layout = 'mobile'; // default
    this.setupAdaptiveLayout();
  }
  
  setupAdaptiveLayout() {
    EventBus.on('breakpoint:changed', ({ current }) => {
      this.adaptLayout(current);
    });
    
    // Initial layout
    this.adaptLayout(ResponsiveManager.getCurrentBreakpoint());
  }
  
  adaptLayout(breakpoint) {
    switch (breakpoint) {
      case 'mobile':
      case 'mobileLg':
        this.applyMobileLayout();
        break;
      case 'tablet':
        this.applyTabletLayout();
        break;
      case 'desktop':
      case 'desktopLg':
        this.applyDesktopLayout();
        break;
    }
  }
  
  applyMobileLayout() {
    this.layout = 'mobile';
    
    // Single column layout
    this.container.className = 'form-container mobile-layout';
    
    // Larger touch targets
    this.updateButtonSizes('large');
    
    // Full-width inputs
    this.updateInputLayout('full-width');
    
    // Simplified step indicator
    this.updateStepIndicator('minimal');
  }
  
  applyTabletLayout() {
    this.layout = 'tablet';
    
    // Two-column layout where appropriate
    this.container.className = 'form-container tablet-layout';
    
    // Medium touch targets
    this.updateButtonSizes('medium');
    
    // Grid inputs
    this.updateInputLayout('grid');
    
    // Standard step indicator
    this.updateStepIndicator('standard');
  }
  
  applyDesktopLayout() {
    this.layout = 'desktop';
    
    // Multi-column layout
    this.container.className = 'form-container desktop-layout';
    
    // Standard button sizes
    this.updateButtonSizes('standard');
    
    // Inline inputs where appropriate
    this.updateInputLayout('inline');
    
    // Enhanced step indicator
    this.updateStepIndicator('enhanced');
  }
}
```

## Progressive Enhancement

### Feature Detection and Polyfill Loading

```javascript
class ProgressiveEnhancement {
  constructor() {
    this.features = this.detectFeatures();
    this.polyfillsLoaded = new Set();
  }
  
  detectFeatures() {
    return {
      // JavaScript APIs
      fetch: typeof fetch !== 'undefined',
      promises: typeof Promise !== 'undefined',
      asyncAwait: this.supportsAsyncAwait(),
      modules: this.supportsModules(),
      
      // Storage APIs
      localStorage: this.supportsLocalStorage(),
      sessionStorage: this.supportsSessionStorage(),
      indexedDB: 'indexedDB' in window,
      
      // Modern APIs
      serviceWorker: 'serviceWorker' in navigator,
      clipboard: navigator.clipboard && navigator.clipboard.writeText,
      intersectionObserver: 'IntersectionObserver' in window,
      
      // CSS features
      cssGrid: CSS.supports('display', 'grid'),
      cssFlexbox: CSS.supports('display', 'flex'),
      cssCustomProperties: CSS.supports('color', 'var(--test)'),
      
      // Device capabilities
      touchEvents: 'ontouchstart' in window,
      deviceMotion: 'DeviceMotionEvent' in window,
      geolocation: 'geolocation' in navigator
    };
  }
  
  async enhance() {
    // Load polyfills for missing features
    await this.loadRequiredPolyfills();
    
    // Initialize progressive features
    this.initializeProgressiveFeatures();
    
    // Setup feature-specific enhancements
    this.setupEnhancements();
  }
  
  async loadRequiredPolyfills() {
    const polyfills = [];
    
    // Core JavaScript polyfills
    if (!this.features.fetch) {
      polyfills.push(this.loadPolyfill('fetch', '/polyfills/fetch.js'));
    }
    
    if (!this.features.promises) {
      polyfills.push(this.loadPolyfill('promises', '/polyfills/promises.js'));
    }
    
    if (!this.features.intersectionObserver) {
      polyfills.push(this.loadPolyfill('intersection-observer', '/polyfills/intersection-observer.js'));
    }
    
    // CSS polyfills
    if (!this.features.cssGrid) {
      document.documentElement.classList.add('no-css-grid');
    }
    
    if (!this.features.cssCustomProperties) {
      polyfills.push(this.loadPolyfill('css-vars', '/polyfills/css-vars.js'));
    }
    
    await Promise.all(polyfills);
  }
  
  async loadPolyfill(name, url) {
    if (this.polyfillsLoaded.has(name)) return;
    
    try {
      await this.loadScript(url);
      this.polyfillsLoaded.add(name);
      console.log(`Polyfill loaded: ${name}`);
    } catch (error) {
      console.warn(`Failed to load polyfill ${name}:`, error);
    }
  }
  
  loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  initializeProgressiveFeatures() {
    // Service Worker
    if (this.features.serviceWorker) {
      this.registerServiceWorker();
    }
    
    // Intersection Observer for lazy loading
    if (this.features.intersectionObserver) {
      this.setupLazyLoading();
    } else {
      this.setupFallbackLoading();
    }
    
    // Touch enhancements
    if (this.features.touchEvents) {
      this.setupTouchEnhancements();
    }
    
    // Clipboard enhancements
    if (this.features.clipboard) {
      this.setupClipboardFeatures();
    }
  }
  
  setupEnhancements() {
    // CSS Grid enhancement
    if (this.features.cssGrid) {
      document.documentElement.classList.add('has-css-grid');
      this.enableAdvancedLayouts();
    }
    
    // Animation enhancements
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      this.enableAnimations();
    }
    
    // Dark mode support
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark-mode');
    }
  }
  
  registerServiceWorker() {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  }
  
  setupLazyLoading() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          
          if (element.dataset.src) {
            element.src = element.dataset.src;
            element.removeAttribute('data-src');
          }
          
          if (element.dataset.component) {
            this.loadComponent(element.dataset.component, element);
          }
          
          observer.unobserve(element);
        }
      });
    });
    
    // Observe lazy-loadable elements
    document.querySelectorAll('[data-src], [data-component]').forEach(element => {
      observer.observe(element);
    });
  }
  
  async loadComponent(componentName, container) {
    try {
      const module = await import(`./components/${componentName}.js`);
      const Component = module.default;
      const instance = new Component(container);
      await instance.init();
    } catch (error) {
      console.error(`Failed to load component ${componentName}:`, error);
    }
  }
}
```

## Accessibility Standards

### WCAG 2.1 AA Compliance Pattern

```javascript
class AccessibilityManager {
  constructor() {
    this.focusManagement = new FocusManager();
    this.announcements = new AnnouncementManager();
    this.keyboardNav = new KeyboardNavigation();
    this.setupAccessibility();
  }
  
  setupAccessibility() {
    // Semantic HTML enhancement
    this.enhanceSemanticMarkup();
    
    // ARIA attributes
    this.setupARIAAttributes();
    
    // Keyboard navigation
    this.keyboardNav.init();
    
    // Focus management
    this.focusManagement.init();
    
    // Screen reader announcements
    this.announcements.init();
    
    // High contrast support
    this.setupHighContrastSupport();
  }
  
  enhanceSemanticMarkup() {
    // Ensure proper heading hierarchy
    this.validateHeadingStructure();
    
    // Add landmark roles where needed
    this.addLandmarkRoles();
    
    // Enhance form labels
    this.enhanceFormLabels();
  }
  
  setupARIAAttributes() {
    // Progress indicator
    const progressElement = document.querySelector('.step-indicator');
    if (progressElement) {
      progressElement.setAttribute('role', 'progressbar');
      progressElement.setAttribute('aria-label', 'Review form progress');
    }
    
    // Form validation messages
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => {
      error.setAttribute('role', 'alert');
      error.setAttribute('aria-live', 'polite');
    });
    
    // Dynamic content areas
    const reviewPreview = document.querySelector('#reviewPreview');
    if (reviewPreview) {
      reviewPreview.setAttribute('aria-live', 'polite');
      reviewPreview.setAttribute('aria-label', 'Generated review preview');
    }
  }
  
  validateHeadingStructure() {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let currentLevel = 0;
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (level > currentLevel + 1) {
        console.warn(`Heading level skip detected: ${heading.tagName} after h${currentLevel}`);
        // Auto-correct if possible
        if (currentLevel > 0) {
          heading.setAttribute('role', 'heading');
          heading.setAttribute('aria-level', currentLevel + 1);
        }
      }
      
      currentLevel = level;
    });
  }
}

class FocusManager {
  constructor() {
    this.focusStack = [];
    this.focusTrap = null;
  }
  
  init() {
    // Skip link
    this.setupSkipLink();
    
    // Focus trap for modals
    this.setupFocusTraps();
    
    // Focus restoration
    this.setupFocusRestoration();
  }
  
  setupSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      border-radius: 0 0 4px 4px;
      z-index: 1000;
      transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '0';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }
  
  trapFocus(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    firstFocusable?.focus();
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }
}

class AnnouncementManager {
  constructor() {
    this.announcer = null;
  }
  
  init() {
    // Create screen reader announcement region
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    this.announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    
    document.body.appendChild(this.announcer);
    
    // Listen for announcement events
    EventBus.on('accessibility:announce', (message) => {
      this.announce(message);
    });
  }
  
  announce(message, priority = 'polite') {
    if (!this.announcer) return;
    
    // Clear previous message
    this.announcer.textContent = '';
    
    // Set priority
    this.announcer.setAttribute('aria-live', priority);
    
    // Announce new message
    setTimeout(() => {
      this.announcer.textContent = message;
    }, 100);
  }
}
```

## Testing Strategy

### Component Testing Pattern

```javascript
class ComponentTester {
  constructor(component) {
    this.component = component;
    this.testContainer = null;
    this.originalConsole = { ...console };
  }
  
  setup() {
    // Create isolated test container
    this.testContainer = document.createElement('div');
    this.testContainer.id = 'test-container';
    document.body.appendChild(this.testContainer);
    
    // Mock console to capture logs
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
  
  teardown() {
    // Clean up test container
    if (this.testContainer) {
      document.body.removeChild(this.testContainer);
      this.testContainer = null;
    }
    
    // Restore console
    Object.assign(console, this.originalConsole);
    
    // Clear event bus
    EventBus.clear();
    
    // Reset state
    AppState.setState(AppState.getInitialState());
  }
  
  // Test utilities
  simulateUserInput(selector, value) {
    const element = this.testContainer.querySelector(selector);
    if (element) {
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return element;
  }
  
  simulateClick(selector) {
    const element = this.testContainer.querySelector(selector);
    if (element) {
      element.click();
    }
    return element;
  }
  
  waitForElement(selector, timeout = 1000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkElement = () => {
        const element = this.testContainer.querySelector(selector);
        if (element) {
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        } else {
          setTimeout(checkElement, 50);
        }
      };
      
      checkElement();
    });
  }
  
  waitForStateChange(selector, expectedState, timeout = 1000) {
    return new Promise((resolve, reject) => {
      let unsubscribe;
      const timer = setTimeout(() => {
        if (unsubscribe) unsubscribe();
        reject(new Error(`State change not detected within ${timeout}ms`));
      }, timeout);
      
      unsubscribe = AppState.subscribe(selector, (newValue) => {
        if (JSON.stringify(newValue) === JSON.stringify(expectedState)) {
          clearTimeout(timer);
          unsubscribe();
          resolve(newValue);
        }
      });
    });
  }
}

// Example test suite
describe('ReviewForm Component', () => {
  let tester;
  let reviewForm;
  
  beforeEach(async () => {
    tester = new ComponentTester();
    tester.setup();
    
    // Initialize component
    reviewForm = new ReviewForm(tester.testContainer);
    await reviewForm.init();
  });
  
  afterEach(() => {
    tester.teardown();
  });
  
  test('should initialize with first step active', () => {
    const stepIndicator = tester.testContainer.querySelector('.step-indicator .step.active');
    expect(stepIndicator).toBeTruthy();
    expect(stepIndicator.textContent).toContain('1');
  });
  
  test('should validate required fields', async () => {
    const nextButton = tester.testContainer.querySelector('.btn-next');
    
    // Try to proceed without selecting rating
    tester.simulateClick('.btn-next');
    
    await tester.waitForElement('.error-message');
    
    const errorMessage = tester.testContainer.querySelector('.error-message');
    expect(errorMessage.textContent).toContain('required');
  });
  
  test('should progress to next step after valid input', async () => {
    // Select rating
    tester.simulateClick('[data-rating="5"]');
    
    // Proceed to next step
    tester.simulateClick('.btn-next');
    
    // Wait for step change
    await tester.waitForStateChange(
      state => state.form.currentStep,
      1
    );
    
    const activeStep = tester.testContainer.querySelector('.step-indicator .step.active');
    expect(activeStep.textContent).toContain('2');
  });
  
  test('should generate review with template', async () => {
    // Complete form steps
    await this.completeFormSteps();
    
    // Check review generation
    const reviewPreview = await tester.waitForElement('#reviewPreview');
    expect(reviewPreview.textContent.length).toBeGreaterThan(10);
    
    // Verify state update
    const reviewState = AppState.state.review;
    expect(reviewState.generated).toBe(true);
    expect(reviewState.method).toBe('template');
  });
  
  async completeFormSteps() {
    // Step 1: Select rating
    tester.simulateClick('[data-rating="5"]');
    tester.simulateClick('.btn-next');
    
    await tester.waitForStateChange(state => state.form.currentStep, 1);
    
    // Step 2: Fill details
    tester.simulateUserInput('#roomType', 'deluxe');
    tester.simulateUserInput('#stayDuration', '2-3');
    tester.simulateClick('.btn-next');
    
    await tester.waitForStateChange(state => state.form.currentStep, 2);
    
    // Step 3: Add staff mention
    tester.simulateUserInput('#staffMembers', 'Maria, John');
  }
});
```

**Implementation Patterns Prepared**: 2025-08-25  
**Version**: 1.0.0  
**Next Phase**: Architect Handoff