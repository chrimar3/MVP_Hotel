# Hotel Review Generator - Component Design

## Component Overview

The application follows a modular, event-driven component architecture with clear separation of concerns. Each component is self-contained with defined interfaces and minimal dependencies.

## Core Component Hierarchy

```
App Controller
├── ReviewForm Component
│   ├── StepIndicator SubComponent
│   ├── ExperienceSelector SubComponent
│   ├── DetailsCapture SubComponent
│   └── StaffRecognition SubComponent
├── AIAssistant Component
│   ├── TemplateEngine SubComponent
│   ├── SuggestionProvider SubComponent
│   └── LanguageProcessor SubComponent
├── PlatformRouter Component
│   ├── PlatformDetector SubComponent
│   ├── URLGenerator SubComponent
│   └── RedirectHandler SubComponent
└── Analytics Component
    ├── EventTracker SubComponent
    ├── ConversionFunnel SubComponent
    └── ErrorLogger SubComponent
```

## 1. Review Form Component

### Purpose
Multi-step form that guides users through the review generation process with validation, progress tracking, and responsive design.

### Component Interface
```javascript
class ReviewForm {
  constructor(container, options = {}) {
    this.container = container;
    this.currentStep = 0;
    this.totalSteps = 3;
    this.data = {};
    this.options = {
      showProgress: true,
      enableValidation: true,
      autoSave: true,
      ...options
    };
  }

  // Public API
  init() { /* Initialize component */ }
  nextStep() { /* Progress to next step */ }
  previousStep() { /* Go back one step */ }
  validateStep(stepIndex) { /* Validate current step */ }
  getData() { /* Get form data */ }
  reset() { /* Reset form state */ }
  destroy() { /* Cleanup component */ }
}
```

### Step Structure

#### Step 1: Experience Selection
```javascript
const ExperienceSelector = {
  template: `
    <div class="experience-selector">
      <h2>How was your stay?</h2>
      <div class="rating-options">
        <button class="rating-btn excellent" data-rating="5">
          <span class="emoji">⭐⭐⭐⭐⭐</span>
          <span class="label">Excellent</span>
        </button>
        <button class="rating-btn good" data-rating="4">
          <span class="emoji">⭐⭐⭐⭐</span>
          <span class="label">Very Good</span>
        </button>
        <button class="rating-btn average" data-rating="3">
          <span class="emoji">⭐⭐⭐</span>
          <span class="label">Good</span>
        </button>
      </div>
    </div>
  `,
  
  validate(data) {
    return data.rating && data.rating >= 1 && data.rating <= 5;
  },
  
  onSelect(rating) {
    EventBus.emit('experience:selected', { rating });
    this.highlightSelection(rating);
  }
};
```

#### Step 2: Details & Context
```javascript
const DetailsCapture = {
  template: `
    <div class="details-capture">
      <h2>Tell us more</h2>
      <div class="form-grid">
        <div class="form-group">
          <label for="roomType">Room Type</label>
          <select id="roomType" required>
            <option value="">Select room type</option>
            <option value="standard">Standard Room</option>
            <option value="deluxe">Deluxe Room</option>
            <option value="suite">Suite</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="stayDuration">Length of Stay</label>
          <select id="stayDuration">
            <option value="1">1 night</option>
            <option value="2-3">2-3 nights</option>
            <option value="4-7">4-7 nights</option>
            <option value="7+">More than a week</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="travelPurpose">Travel Purpose</label>
          <select id="travelPurpose">
            <option value="leisure">Leisure</option>
            <option value="business">Business</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </div>
  `,
  
  validate(data) {
    return data.roomType && data.stayDuration;
  }
};
```

#### Step 3: Staff Recognition & Review
```javascript
const StaffRecognition = {
  template: `
    <div class="staff-recognition">
      <h2>Recognize Great Service</h2>
      <div class="staff-input">
        <label for="staffMembers">Mention staff members who made your stay special</label>
        <input type="text" id="staffMembers" placeholder="e.g., Maria from reception, John from housekeeping">
        <small class="help-text">Optional - helps hotels recognize excellent service</small>
      </div>
      
      <div class="review-preview">
        <h3>Your Review Preview</h3>
        <div class="generated-review" id="reviewPreview">
          <!-- AI-generated review appears here -->
        </div>
        <button type="button" class="btn-secondary" id="regenerateBtn">✨ Generate Another</button>
      </div>
      
      <div class="form-actions">
        <button type="button" class="btn-primary" id="submitBtn">Submit Review</button>
        <button type="button" class="btn-secondary" id="copyBtn">📋 Copy to Clipboard</button>
      </div>
    </div>
  `
};
```

### Progress Indicator SubComponent
```javascript
class StepIndicator {
  constructor(totalSteps) {
    this.totalSteps = totalSteps;
    this.currentStep = 0;
  }
  
  render() {
    return `
      <div class="step-indicator">
        ${Array.from({ length: this.totalSteps }, (_, i) => `
          <div class="step ${i <= this.currentStep ? 'completed' : ''} ${i === this.currentStep ? 'active' : ''}">
            <span class="step-number">${i + 1}</span>
            <span class="step-label">${this.getStepLabel(i)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  updateStep(step) {
    this.currentStep = step;
    this.render();
  }
  
  getStepLabel(index) {
    const labels = ['Experience', 'Details', 'Review'];
    return labels[index];
  }
}
```

### Validation System
```javascript
const FormValidator = {
  rules: {
    required: (value) => value && value.trim().length > 0,
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    rating: (value) => value >= 1 && value <= 5
  },
  
  validate(data, schema) {
    const errors = {};
    
    Object.keys(schema).forEach(field => {
      const fieldRules = schema[field];
      const value = data[field];
      
      fieldRules.forEach(rule => {
        if (typeof rule === 'string') {
          if (!this.rules[rule](value)) {
            errors[field] = errors[field] || [];
            errors[field].push(`${field} ${rule} validation failed`);
          }
        }
      });
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },
  
  showErrors(errors) {
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    // Show new errors
    Object.keys(errors).forEach(field => {
      const input = document.getElementById(field);
      if (input) {
        input.classList.add('error');
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = errors[field][0];
        input.parentNode.appendChild(errorEl);
      }
    });
  }
};
```

## 2. AI Assistant Component

### Purpose
Provides intelligent writing assistance, template suggestions, and real-time review generation based on user input and context.

### Component Interface
```javascript
class AIAssistant {
  constructor(options = {}) {
    this.apiKey = options.apiKey || null;
    this.fallbackMode = !this.apiKey;
    this.templates = PromptTemplates;
    this.currentLanguage = options.language || 'en';
  }

  async generateReview(context) { /* Generate AI review */ }
  getTemplateReview(context) { /* Fallback template */ }
  updateContext(newContext) { /* Update generation context */ }
  setLanguage(language) { /* Change language */ }
}
```

### Template Engine SubComponent
```javascript
class TemplateEngine {
  constructor() {
    this.templates = {
      excellent: {
        en: [
          "Exceptional stay! The {roomType} exceeded all expectations. {staffMention} The attention to detail was remarkable, and every aspect of our {duration} stay was perfect.",
          "Outstanding experience! From check-in to check-out, everything was seamless. {staffMention} The {roomType} was immaculate and comfortable.",
          "Absolutely wonderful! This hotel sets the gold standard. {staffMention} Would definitely recommend to anyone looking for a premium experience."
        ],
        es: [
          "¡Estancia excepcional! La {roomType} superó todas las expectativas. {staffMention} La atención al detalle fue extraordinaria.",
          "¡Experiencia sobresaliente! Todo fue perfecto desde el registro hasta la salida. {staffMention}"
        ],
        fr: [
          "Séjour exceptionnel! La {roomType} a dépassé toutes nos attentes. {staffMention} L'attention aux détails était remarquable."
        ]
      },
      good: {
        en: [
          "Great stay overall! The {roomType} was comfortable and well-maintained. {staffMention} Would happily return.",
          "Very pleased with our experience. {staffMention} The hotel exceeded our expectations for the price point."
        ],
        es: [
          "¡Muy buena estancia! La {roomType} era cómoda y bien mantenida. {staffMention}"
        ],
        fr: [
          "Excellent séjour! La {roomType} était confortable et bien entretenue. {staffMention}"
        ]
      },
      average: {
        en: [
          "Pleasant stay with good service. The {roomType} met our basic needs. {staffMention}",
          "Solid choice for the area. {staffMention} Good value for money."
        ]
      }
    };
  }
  
  generate(context) {
    const { rating, roomType, staff, language = 'en', travelPurpose } = context;
    const category = this.getRatingCategory(rating);
    const templates = this.templates[category]?.[language] || this.templates[category].en;
    
    if (!templates) return null;
    
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    return this.interpolateTemplate(template, {
      roomType: roomType || 'room',
      staffMention: this.generateStaffMention(staff, language),
      duration: this.formatDuration(context.stayDuration),
      travelPurpose: travelPurpose || 'stay'
    });
  }
  
  getRatingCategory(rating) {
    if (rating >= 4.5) return 'excellent';
    if (rating >= 3.5) return 'good';
    return 'average';
  }
  
  generateStaffMention(staff, language = 'en') {
    if (!staff || staff.length === 0) return '';
    
    const mentions = {
      en: `Special thanks to ${staff.join(' and ')} for their exceptional service.`,
      es: `Agradecimiento especial a ${staff.join(' y ')} por su servicio excepcional.`,
      fr: `Remerciements spéciaux à ${staff.join(' et ')} pour leur service exceptionnel.`
    };
    
    return mentions[language] || mentions.en;
  }
  
  interpolateTemplate(template, variables) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] || match;
    });
  }
}
```

### Suggestion Provider SubComponent
```javascript
class SuggestionProvider {
  constructor() {
    this.suggestions = {
      roomTypes: ['Standard Room', 'Deluxe Room', 'Suite', 'Executive Room'],
      departments: ['Reception', 'Housekeeping', 'Restaurant', 'Concierge', 'Spa'],
      amenities: ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar', 'Room Service']
    };
  }
  
  getSuggestions(type, query = '') {
    const suggestions = this.suggestions[type] || [];
    if (!query) return suggestions;
    
    return suggestions.filter(item => 
      item.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  async getSmartSuggestions(context) {
    // Future: ML-based suggestions
    const { rating, roomType, travelPurpose } = context;
    
    return {
      highlights: this.getHighlightSuggestions(rating, travelPurpose),
      improvements: this.getImprovementSuggestions(rating),
      amenities: this.getRelevantAmenities(roomType)
    };
  }
}
```

## 3. Platform Router Component

### Purpose
Detects the originating platform, generates appropriate review URLs, and handles platform-specific formatting and redirection.

### Component Interface
```javascript
class PlatformRouter {
  constructor() {
    this.platforms = PlatformConfig;
    this.detectedPlatform = null;
  }

  detectPlatform() { /* Detect current platform */ }
  generateReviewURL(platform, data) { /* Generate review URL */ }
  redirectToReview(platform, reviewData) { /* Handle redirection */ }
  copyToClipboard(content) { /* Copy review content */ }
}
```

### Platform Detector SubComponent
```javascript
class PlatformDetector {
  constructor() {
    this.platforms = {
      booking: {
        domains: ['booking.com', 'booking.net'],
        urlPatterns: [/booking\.com/i],
        paramKeys: ['aid', 'hotel_id', 'dest_id']
      },
      tripadvisor: {
        domains: ['tripadvisor.com', 'tripadvisor.co.uk'],
        urlPatterns: [/tripadvisor\./i],
        paramKeys: ['Hotel_Review']
      },
      google: {
        domains: ['google.com', 'maps.google.com'],
        urlPatterns: [/maps\.google|google\.com\/maps/i],
        paramKeys: ['place_id', 'cid']
      }
    };
  }
  
  detect() {
    // Check referrer
    const referrer = document.referrer;
    for (const [platform, config] of Object.entries(this.platforms)) {
      if (this.matchesPlatform(referrer, config)) {
        return {
          platform,
          source: 'referrer',
          confidence: 0.9
        };
      }
    }
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    for (const [platform, config] of Object.entries(this.platforms)) {
      if (this.hasRequiredParams(urlParams, config.paramKeys)) {
        return {
          platform,
          source: 'url_params',
          confidence: 0.8
        };
      }
    }
    
    // Default fallback
    return {
      platform: 'unknown',
      source: 'default',
      confidence: 0.1
    };
  }
  
  matchesPlatform(url, config) {
    return config.urlPatterns.some(pattern => pattern.test(url)) ||
           config.domains.some(domain => url.includes(domain));
  }
  
  hasRequiredParams(urlParams, paramKeys) {
    return paramKeys.some(key => urlParams.has(key));
  }
}
```

### URL Generator SubComponent
```javascript
class URLGenerator {
  constructor() {
    this.platformUrls = {
      booking: {
        baseUrl: 'https://www.booking.com/reviewit.html',
        params: {
          aid: '{hotelId}',
          checkin: '{checkIn}',
          checkout: '{checkOut}',
          review: '{reviewText}'
        }
      },
      tripadvisor: {
        baseUrl: 'https://www.tripadvisor.com/UserReviewEdit-g{locationId}-d{hotelId}',
        params: {
          review: '{reviewText}',
          rating: '{rating}'
        }
      },
      google: {
        baseUrl: 'https://search.google.com/local/writereview',
        params: {
          placeid: '{placeId}',
          review: '{reviewText}'
        }
      }
    };
  }
  
  generate(platform, context) {
    const config = this.platformUrls[platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    
    let url = config.baseUrl;
    const params = new URLSearchParams();
    
    // Replace URL placeholders
    url = this.replacePlaceholders(url, context);
    
    // Add query parameters
    Object.entries(config.params).forEach(([key, template]) => {
      const value = this.replacePlaceholders(template, context);
      if (value !== template) { // Only add if placeholder was replaced
        params.append(key, value);
      }
    });
    
    return params.toString() ? `${url}?${params.toString()}` : url;
  }
  
  replacePlaceholders(template, context) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return context[key] || match;
    });
  }
  
  generateFallbackUrl(platform, hotelName, reviewText) {
    const fallbackUrls = {
      booking: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotelName)}`,
      tripadvisor: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(hotelName)}`,
      google: `https://www.google.com/search?q=${encodeURIComponent(hotelName + ' review')}`
    };
    
    return fallbackUrls[platform] || fallbackUrls.google;
  }
}
```

### Redirect Handler SubComponent
```javascript
class RedirectHandler {
  constructor() {
    this.methods = ['native', 'popup', 'newTab'];
    this.preferences = this.loadPreferences();
  }
  
  async redirect(url, method = 'auto') {
    const selectedMethod = method === 'auto' ? this.selectBestMethod() : method;
    
    try {
      switch (selectedMethod) {
        case 'native':
          return await this.nativeRedirect(url);
        case 'popup':
          return await this.popupRedirect(url);
        case 'newTab':
          return await this.newTabRedirect(url);
        default:
          return await this.fallbackRedirect(url);
      }
    } catch (error) {
      return await this.fallbackRedirect(url);
    }
  }
  
  async nativeRedirect(url) {
    // For mobile apps or when platform supports deep linking
    window.location.href = url;
    return { success: true, method: 'native' };
  }
  
  async popupRedirect(url) {
    const popup = window.open(url, 'reviewWindow', 'width=800,height=600,scrollbars=yes');
    if (!popup) {
      throw new Error('Popup blocked');
    }
    return { success: true, method: 'popup', window: popup };
  }
  
  async newTabRedirect(url) {
    const newTab = window.open(url, '_blank');
    if (!newTab) {
      throw new Error('New tab blocked');
    }
    return { success: true, method: 'newTab', window: newTab };
  }
  
  async fallbackRedirect(url) {
    // Copy URL to clipboard as last resort
    try {
      await navigator.clipboard.writeText(url);
      this.showCopyNotification(url);
      return { success: true, method: 'clipboard' };
    } catch (error) {
      // Show URL for manual copying
      this.showManualCopy(url);
      return { success: false, method: 'manual' };
    }
  }
  
  selectBestMethod() {
    // Mobile devices: prefer native
    if (this.isMobile()) return 'native';
    
    // Desktop: prefer new tab
    return 'newTab';
  }
  
  isMobile() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}
```

## 4. Analytics Component

### Purpose
Tracks user interactions, conversion events, and provides insights into user behavior and system performance.

### Component Interface
```javascript
class Analytics {
  constructor(config = {}) {
    this.config = {
      gaTrackingId: config.gaTrackingId,
      customEndpoint: config.customEndpoint,
      batchSize: 10,
      flushInterval: 30000,
      ...config
    };
    this.eventQueue = [];
    this.sessionId = this.generateSessionId();
  }

  track(event, properties) { /* Track single event */ }
  trackConversion(data) { /* Track conversion event */ }
  trackError(error) { /* Track error event */ }
  flush() { /* Send queued events */ }
}
```

### Event Tracker SubComponent
```javascript
class EventTracker {
  constructor(analytics) {
    this.analytics = analytics;
    this.setupAutoTracking();
  }
  
  setupAutoTracking() {
    // Page views
    this.trackPageView();
    
    // Form interactions
    this.setupFormTracking();
    
    // Performance metrics
    this.trackPerformance();
    
    // Error tracking
    this.setupErrorTracking();
  }
  
  trackPageView() {
    const pageData = {
      event: 'page_view',
      page_title: document.title,
      page_location: window.location.href,
      timestamp: Date.now(),
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`
    };
    
    this.analytics.track('page_view', pageData);
  }
  
  setupFormTracking() {
    // Track form steps
    EventBus.on('form:step-started', (data) => {
      this.analytics.track('form_step_started', {
        step: data.step,
        step_name: data.stepName,
        timestamp: Date.now()
      });
    });
    
    EventBus.on('form:step-completed', (data) => {
      this.analytics.track('form_step_completed', {
        step: data.step,
        step_name: data.stepName,
        time_spent: data.timeSpent,
        timestamp: Date.now()
      });
    });
    
    // Track field interactions
    document.addEventListener('input', this.debounce((event) => {
      if (event.target.matches('input, select, textarea')) {
        this.analytics.track('field_interaction', {
          field_name: event.target.name || event.target.id,
          field_type: event.target.type,
          timestamp: Date.now()
        });
      }
    }, 1000));
  }
  
  trackPerformance() {
    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        this.analytics.track('performance_metrics', {
          dom_content_loaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          load_complete: navigation.loadEventEnd - navigation.loadEventStart,
          first_paint: paint.find(entry => entry.name === 'first-paint')?.startTime,
          first_contentful_paint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime
        });
      }, 0);
    });
  }
  
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}
```

### Conversion Funnel SubComponent
```javascript
class ConversionFunnel {
  constructor(analytics) {
    this.analytics = analytics;
    this.funnelSteps = [
      'page_view',
      'form_started',
      'step1_completed',
      'step2_completed',
      'step3_completed',
      'review_generated',
      'review_submitted'
    ];
    this.sessionData = this.initializeSession();
  }
  
  trackFunnelStep(step, data = {}) {
    const stepIndex = this.funnelSteps.indexOf(step);
    
    if (stepIndex === -1) return;
    
    this.sessionData.funnelProgress[step] = {
      timestamp: Date.now(),
      data: data
    };
    
    this.analytics.track('funnel_step', {
      step: step,
      step_index: stepIndex,
      session_id: this.sessionData.sessionId,
      time_from_start: Date.now() - this.sessionData.startTime,
      ...data
    });
    
    // Check for conversion
    if (step === 'review_submitted') {
      this.trackConversion();
    }
  }
  
  trackConversion() {
    const conversionData = {
      event: 'conversion',
      session_id: this.sessionData.sessionId,
      total_time: Date.now() - this.sessionData.startTime,
      steps_completed: Object.keys(this.sessionData.funnelProgress).length,
      platform: this.sessionData.platform,
      review_length: this.sessionData.reviewLength,
      ai_assistance_used: this.sessionData.aiAssistanceUsed
    };
    
    this.analytics.track('conversion', conversionData);
  }
  
  getConversionRate() {
    // Calculate real-time conversion rate from local storage
    const sessions = this.getStoredSessions();
    const totalSessions = sessions.length;
    const convertedSessions = sessions.filter(s => s.converted).length;
    
    return totalSessions > 0 ? (convertedSessions / totalSessions) : 0;
  }
}
```

### Error Logger SubComponent
```javascript
class ErrorLogger {
  constructor(analytics) {
    this.analytics = analytics;
    this.setupGlobalErrorHandling();
  }
  
  setupGlobalErrorHandling() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript_error',
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
      this.logError({
        type: 'unhandled_promise_rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: Date.now()
      });
    });
    
    // Custom error tracking
    EventBus.on('error:occurred', (errorData) => {
      this.logError({
        type: 'custom_error',
        ...errorData,
        timestamp: Date.now()
      });
    });
  }
  
  logError(errorData) {
    const enrichedError = {
      ...errorData,
      user_agent: navigator.userAgent,
      url: window.location.href,
      session_id: this.analytics.sessionId,
      local_storage_available: this.isLocalStorageAvailable(),
      online: navigator.onLine
    };
    
    this.analytics.track('error', enrichedError);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', enrichedError);
    }
  }
  
  isLocalStorageAvailable() {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
}
```

## Component Communication

### Event Bus System
```javascript
class EventBus {
  static events = new Map();
  static debugMode = false;
  
  static emit(event, data = null) {
    const handlers = this.events.get(event) || [];
    
    if (this.debugMode) {
      console.log(`EventBus: Emitting '${event}'`, data);
    }
    
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for '${event}':`, error);
      }
    });
  }
  
  static on(event, handler) {
    const handlers = this.events.get(event) || [];
    handlers.push(handler);
    this.events.set(event, handlers);
    
    // Return unsubscribe function
    return () => this.off(event, handler);
  }
  
  static off(event, handler) {
    const handlers = this.events.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }
  
  static clear(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}
```

### Component Lifecycle
```javascript
class ComponentManager {
  static components = new Map();
  static initialized = false;
  
  static register(name, component) {
    this.components.set(name, component);
  }
  
  static async initialize() {
    if (this.initialized) return;
    
    const initOrder = ['Analytics', 'PlatformRouter', 'AIAssistant', 'ReviewForm'];
    
    for (const componentName of initOrder) {
      const Component = this.components.get(componentName);
      if (Component) {
        try {
          await Component.init();
          console.log(`${componentName} initialized successfully`);
        } catch (error) {
          console.error(`Failed to initialize ${componentName}:`, error);
          EventBus.emit('error:occurred', {
            component: componentName,
            error: error.message,
            type: 'initialization_error'
          });
        }
      }
    }
    
    this.initialized = true;
    EventBus.emit('app:initialized');
  }
  
  static destroy() {
    this.components.forEach((component, name) => {
      if (component.destroy) {
        try {
          component.destroy();
        } catch (error) {
          console.error(`Error destroying ${name}:`, error);
        }
      }
    });
    
    EventBus.clear();
    this.initialized = false;
  }
}
```

**Component Design Prepared**: 2025-08-25  
**Version**: 1.0.0  
**Next Phase**: Technical Specifications