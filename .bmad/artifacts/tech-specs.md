# Hotel Review Generator - Technical Specifications

## API Specifications

### Internal API Structure
The application uses a client-side architecture with well-defined internal APIs for component communication.

#### Event API
```javascript
// Event system for component communication
interface EventAPI {
  emit(event: string, data?: any): void;
  on(event: string, handler: Function): () => void;
  off(event: string, handler: Function): void;
}

// Core events
const Events = {
  // Application lifecycle
  'app:initialized': null,
  'app:ready': null,
  'app:error': { error: Error, context: string },
  
  // Form events
  'form:step-started': { step: number, stepName: string },
  'form:step-completed': { step: number, timeSpent: number },
  'form:validated': { step: number, isValid: boolean, errors: object },
  'form:data-changed': { field: string, value: any, step: number },
  
  // Review generation events
  'review:generation-started': { context: object },
  'review:generated': { review: string, method: 'template'|'ai' },
  'review:regenerated': { review: string, attempt: number },
  'review:submitted': { platform: string, reviewLength: number },
  
  // Platform events
  'platform:detected': { platform: string, confidence: number },
  'platform:redirect-attempted': { platform: string, url: string },
  'platform:redirect-failed': { platform: string, error: string },
  
  // Analytics events
  'analytics:track': { event: string, properties: object },
  'analytics:conversion': { sessionId: string, totalTime: number }
};
```

#### Storage API
```javascript
interface StorageAPI {
  // Session management
  createSession(): string;
  getSession(): SessionData | null;
  updateSession(data: Partial<SessionData>): void;
  clearSession(): void;
  
  // Form data persistence
  saveFormData(step: number, data: object): void;
  getFormData(step?: number): object;
  clearFormData(): void;
  
  // User preferences
  setPreference(key: string, value: any): void;
  getPreference(key: string, defaultValue?: any): any;
  clearPreferences(): void;
}

// Storage schema
interface SessionData {
  id: string;
  startTime: number;
  platform: string;
  language: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
}

interface FormData {
  step1: {
    rating: number;
    experience: 'excellent' | 'good' | 'average';
    timestamp: number;
  };
  step2: {
    roomType: string;
    stayDuration: string;
    travelPurpose: string;
    timestamp: number;
  };
  step3: {
    staffMembers: string[];
    additionalComments: string;
    generatedReview: string;
    timestamp: number;
  };
}
```

#### AI Service API
```javascript
interface AIServiceAPI {
  // Template-based generation (MVP)
  generateFromTemplate(context: ReviewContext): Promise<string>;
  
  // AI-powered generation (v1.1)
  generateWithAI(context: ReviewContext, options?: AIOptions): Promise<string>;
  
  // Suggestion system
  getSuggestions(type: 'staff' | 'amenities' | 'highlights'): Promise<string[]>;
  
  // Language support
  translate(text: string, targetLanguage: string): Promise<string>;
  detectLanguage(text: string): Promise<string>;
}

interface ReviewContext {
  rating: number;
  roomType: string;
  stayDuration: string;
  travelPurpose: string;
  staffMembers: string[];
  language: string;
  hotelType?: string;
  amenitiesUsed?: string[];
}

interface AIOptions {
  temperature: number;
  maxTokens: number;
  style: 'formal' | 'casual' | 'enthusiastic';
  includeDetails: boolean;
}
```

## Data Models

### Core Data Structures

#### Review Model
```typescript
interface Review {
  id: string;
  sessionId: string;
  timestamp: number;
  
  // User input
  rating: number; // 1-5
  experience: 'excellent' | 'good' | 'average';
  roomType: string;
  stayDuration: string;
  travelPurpose: 'business' | 'leisure' | 'other';
  
  // Staff recognition
  staffMembers: StaffMember[];
  departments: string[];
  
  // Generated content
  generatedText: string;
  generationMethod: 'template' | 'ai';
  language: string;
  wordCount: number;
  
  // Platform information
  targetPlatform: string;
  platformUrl?: string;
  submitted: boolean;
  submissionTime?: number;
}

interface StaffMember {
  name: string;
  department?: string;
  role?: string;
  mention: string; // How they were mentioned in the review
}
```

#### Platform Configuration Model
```typescript
interface PlatformConfig {
  id: string;
  name: string;
  displayName: string;
  
  // Detection
  domains: string[];
  urlPatterns: RegExp[];
  parameterKeys: string[];
  
  // URL generation
  reviewUrl: string;
  parameterMapping: Record<string, string>;
  
  // Formatting
  maxReviewLength: number;
  allowedCharacters: string;
  requiresRating: boolean;
  ratingScale: [number, number];
  
  // Features
  supportsStaffMention: boolean;
  supportsDepartments: boolean;
  supportsPhotos: boolean;
  
  // Display
  icon: string;
  color: string;
  description: string;
}

// Platform configurations
const PlatformConfigs: Record<string, PlatformConfig> = {
  booking: {
    id: 'booking',
    name: 'booking',
    displayName: 'Booking.com',
    domains: ['booking.com', 'booking.net'],
    urlPatterns: [/booking\.com/i],
    parameterKeys: ['aid', 'hotel_id', 'dest_id'],
    reviewUrl: 'https://www.booking.com/reviewit.html',
    parameterMapping: {
      hotelId: 'aid',
      checkIn: 'checkin',
      checkOut: 'checkout'
    },
    maxReviewLength: 4000,
    allowedCharacters: 'alphanumeric+punctuation',
    requiresRating: true,
    ratingScale: [1, 10],
    supportsStaffMention: true,
    supportsDepartments: true,
    supportsPhotos: false,
    icon: '/assets/icons/booking.svg',
    color: '#003B95',
    description: 'Share your experience on Booking.com'
  },
  tripadvisor: {
    id: 'tripadvisor',
    name: 'tripadvisor',
    displayName: 'TripAdvisor',
    domains: ['tripadvisor.com', 'tripadvisor.co.uk'],
    urlPatterns: [/tripadvisor\./i],
    parameterKeys: ['Hotel_Review'],
    reviewUrl: 'https://www.tripadvisor.com/UserReviewEdit',
    parameterMapping: {
      hotelId: 'd{hotelId}',
      locationId: 'g{locationId}'
    },
    maxReviewLength: 50000,
    allowedCharacters: 'all',
    requiresRating: true,
    ratingScale: [1, 5],
    supportsStaffMention: true,
    supportsDepartments: false,
    supportsPhotos: true,
    icon: '/assets/icons/tripadvisor.svg',
    color: '#00AA6C',
    description: 'Write a review on TripAdvisor'
  }
};
```

#### Analytics Event Model
```typescript
interface AnalyticsEvent {
  // Event identification
  eventId: string;
  eventName: string;
  eventCategory: string;
  timestamp: number;
  
  // Session context
  sessionId: string;
  userId?: string;
  deviceId: string;
  
  // Event properties
  properties: Record<string, any>;
  
  // Technical context
  userAgent: string;
  screenResolution: string;
  viewportSize: string;
  url: string;
  referrer: string;
  
  // Performance data
  pageLoadTime?: number;
  renderTime?: number;
  networkLatency?: number;
}

// Predefined event schemas
const EventSchemas = {
  page_view: {
    page_title: 'string',
    page_location: 'string',
    platform_detected: 'string?'
  },
  form_step_completed: {
    step: 'number',
    step_name: 'string',
    time_spent: 'number',
    validation_errors: 'number'
  },
  review_generated: {
    generation_method: 'string',
    review_length: 'number',
    language: 'string',
    regeneration_count: 'number'
  },
  conversion: {
    total_time: 'number',
    platform: 'string',
    ai_assistance_used: 'boolean',
    steps_completed: 'number'
  }
};
```

### Configuration Schema

#### Application Configuration
```typescript
interface AppConfig {
  // Environment
  environment: 'development' | 'staging' | 'production';
  version: string;
  buildDate: string;
  
  // Features flags
  features: {
    aiAssistance: boolean;
    multiLanguage: boolean;
    staffRecognition: boolean;
    analytics: boolean;
    offlineMode: boolean;
  };
  
  // API endpoints
  endpoints: {
    ai?: string;
    analytics?: string;
    feedback?: string;
  };
  
  // Platform settings
  platforms: {
    enabled: string[];
    default: string;
    fallback: string;
  };
  
  // UI settings
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    animations: boolean;
    reducedMotion: boolean;
  };
  
  // Performance settings
  performance: {
    lazy_loading: boolean;
    image_optimization: boolean;
    bundle_splitting: boolean;
    service_worker: boolean;
  };
  
  // Analytics configuration
  analytics: {
    google_analytics_id?: string;
    custom_endpoint?: string;
    sample_rate: number;
    batch_size: number;
    flush_interval: number;
  };
}

// Default configuration
const defaultConfig: AppConfig = {
  environment: 'production',
  version: '1.0.0',
  buildDate: '2025-08-25',
  features: {
    aiAssistance: false,
    multiLanguage: false,
    staffRecognition: true,
    analytics: true,
    offlineMode: false
  },
  endpoints: {},
  platforms: {
    enabled: ['booking', 'tripadvisor', 'google'],
    default: 'booking',
    fallback: 'google'
  },
  ui: {
    theme: 'auto',
    language: 'en',
    animations: true,
    reducedMotion: false
  },
  performance: {
    lazy_loading: true,
    image_optimization: true,
    bundle_splitting: false,
    service_worker: true
  },
  analytics: {
    sample_rate: 1.0,
    batch_size: 10,
    flush_interval: 30000
  }
};
```

## Browser Requirements

### Minimum Browser Support

| Browser | Version | Notes |
|---------|---------|--------|
| Chrome | 88+ | Full ES6+ support |
| Firefox | 85+ | CSS Grid support required |
| Safari | 14+ | iOS Safari included |
| Edge | 88+ | Chromium-based Edge |

### Required Browser APIs

#### Essential APIs (Must be supported)
```typescript
interface RequiredAPIs {
  // Core JavaScript features
  ES6_modules: boolean;
  async_await: boolean;
  arrow_functions: boolean;
  template_literals: boolean;
  destructuring: boolean;
  
  // DOM APIs
  querySelector: boolean;
  addEventListener: boolean;
  fetch: boolean;
  localStorage: boolean;
  
  // Mobile-specific
  touch_events: boolean;
  viewport_meta: boolean;
  
  // Form APIs
  form_validation: boolean;
  input_events: boolean;
}
```

#### Progressive Enhancement APIs
```typescript
interface OptionalAPIs {
  // Service Worker (PWA)
  service_worker: boolean;
  cache_api: boolean;
  
  // Modern JavaScript
  modules: boolean;
  intersection_observer: boolean;
  
  // Clipboard
  clipboard_api: boolean;
  
  // Notifications
  notifications: boolean;
  
  // Geolocation
  geolocation: boolean;
  
  // Camera (future feature)
  media_devices: boolean;
}
```

### Feature Detection Pattern
```javascript
class FeatureDetection {
  static detect() {
    return {
      // JavaScript features
      es6Modules: this.supportsModules(),
      asyncAwait: this.supportsAsyncAwait(),
      fetch: typeof fetch !== 'undefined',
      
      // Storage
      localStorage: this.supportsLocalStorage(),
      sessionStorage: this.supportsSessionStorage(),
      
      // APIs
      serviceWorker: 'serviceWorker' in navigator,
      clipboard: navigator.clipboard && navigator.clipboard.writeText,
      touchEvents: 'ontouchstart' in window,
      
      // CSS features
      cssGrid: CSS.supports('display', 'grid'),
      cssCustomProperties: CSS.supports('color', 'var(--test)'),
      cssFlexbox: CSS.supports('display', 'flex')
    };
  }
  
  static supportsModules() {
    const script = document.createElement('script');
    return 'noModule' in script;
  }
  
  static supportsLocalStorage() {
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

## Performance Targets

### Core Web Vitals

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Largest Contentful Paint (LCP) | < 2.5s | Chrome DevTools, Lighthouse |
| First Input Delay (FID) | < 100ms | Real User Monitoring |
| Cumulative Layout Shift (CLS) | < 0.1 | Performance Observer API |

### Additional Performance Metrics

| Metric | Target | Business Impact |
|--------|--------|-----------------|
| First Contentful Paint | < 1.8s | User engagement |
| Time to Interactive | < 3.0s | Form completion rate |
| Speed Index | < 2.0s | Perceived performance |
| Total Blocking Time | < 300ms | User experience |

### Bundle Size Targets

```typescript
interface BundleTargets {
  // JavaScript
  main_bundle: '< 50KB gzipped';
  vendor_bundle: '< 30KB gzipped';
  total_js: '< 80KB gzipped';
  
  // CSS
  main_styles: '< 15KB gzipped';
  critical_css: '< 8KB inline';
  
  // Assets
  images: '< 100KB total';
  fonts: '< 20KB subset';
  icons: '< 5KB sprite';
  
  // Total page weight
  first_load: '< 200KB';
  cached_load: '< 50KB';
}
```

### Performance Monitoring Implementation
```javascript
class PerformanceMonitor {
  static init() {
    // Monitor Core Web Vitals
    this.monitorLCP();
    this.monitorFID();
    this.monitorCLS();
    
    // Custom metrics
    this.monitorCustomMetrics();
    
    // Report to analytics
    this.setupReporting();
  }
  
  static monitorLCP() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      Analytics.track('performance_metric', {
        metric: 'lcp',
        value: lastEntry.startTime,
        element: lastEntry.element?.tagName
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  }
  
  static monitorCustomMetrics() {
    // Time to form ready
    EventBus.on('form:ready', () => {
      const formReadyTime = performance.now();
      Analytics.track('performance_metric', {
        metric: 'form_ready_time',
        value: formReadyTime
      });
    });
    
    // Review generation time
    EventBus.on('review:generation-started', () => {
      this.generationStartTime = performance.now();
    });
    
    EventBus.on('review:generated', () => {
      const generationTime = performance.now() - this.generationStartTime;
      Analytics.track('performance_metric', {
        metric: 'review_generation_time',
        value: generationTime
      });
    });
  }
}
```

### Optimization Strategies

#### Loading Optimization
```javascript
// Critical resource prioritization
const ResourcePriorities = {
  critical: [
    { type: 'css', url: '/app.css', preload: true },
    { type: 'script', url: '/app.js', preload: true }
  ],
  important: [
    { type: 'script', url: '/components.js', defer: true },
    { type: 'font', url: '/fonts/inter.woff2', preload: true }
  ],
  lazy: [
    { type: 'script', url: '/analytics.js', async: true },
    { type: 'image', url: '/hero-bg.webp', loading: 'lazy' }
  ]
};

// Dynamic imports for code splitting
const ComponentLoader = {
  async loadAIAssistant() {
    const { AIAssistant } = await import('./components/AIAssistant.js');
    return AIAssistant;
  },
  
  async loadAdvancedFeatures() {
    const [
      { AdvancedAnalytics },
      { MultiLanguageSupport }
    ] = await Promise.all([
      import('./features/AdvancedAnalytics.js'),
      import('./features/MultiLanguageSupport.js')
    ]);
    
    return { AdvancedAnalytics, MultiLanguageSupport };
  }
};
```

#### Caching Strategy
```javascript
// Service Worker caching strategy
const CacheStrategy = {
  // Cache-first for static assets
  static: {
    strategy: 'cache-first',
    maxAge: 31536000, // 1 year
    resources: ['*.css', '*.js', '*.woff2', '*.svg']
  },
  
  // Network-first for API calls
  api: {
    strategy: 'network-first',
    maxAge: 300, // 5 minutes
    resources: ['/api/*']
  },
  
  // Stale-while-revalidate for content
  content: {
    strategy: 'stale-while-revalidate',
    maxAge: 86400, // 1 day
    resources: ['/', '/index.html']
  }
};
```

## Security Specifications

### Content Security Policy
```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://api.openai.com https://www.google-analytics.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

### Data Protection
```typescript
interface DataProtection {
  // GDPR compliance
  consent_required: boolean;
  data_minimization: boolean;
  right_to_erasure: boolean;
  
  // Data classification
  personal_data: string[]; // No collection in MVP
  technical_data: string[]; // Session ID, device type
  analytics_data: string[]; // Interaction events
  
  // Storage encryption
  local_storage_encryption: boolean; // Future feature
  session_encryption: boolean; // HTTPS only
  
  // Data retention
  session_data_ttl: number; // 24 hours
  analytics_data_ttl: number; // 26 months (GA4)
  error_logs_ttl: number; // 30 days
}
```

### Input Validation
```javascript
class InputValidator {
  static rules = {
    rating: {
      type: 'number',
      min: 1,
      max: 5,
      required: true
    },
    roomType: {
      type: 'string',
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-]+$/,
      required: true
    },
    staffMembers: {
      type: 'array',
      itemType: 'string',
      maxItems: 10,
      itemMaxLength: 50,
      itemPattern: /^[a-zA-Z\s\-']+$/
    },
    reviewText: {
      type: 'string',
      minLength: 10,
      maxLength: 4000,
      sanitize: true
    }
  };
  
  static validate(field, value) {
    const rule = this.rules[field];
    if (!rule) return { valid: true };
    
    const errors = [];
    
    // Required check
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors.push(`${field} is required`);
      return { valid: false, errors };
    }
    
    // Type check
    if (value && !this.checkType(value, rule.type)) {
      errors.push(`${field} must be of type ${rule.type}`);
    }
    
    // Additional validations based on type
    if (rule.type === 'string' && value) {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${field} must be at least ${rule.minLength} characters`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${field} must not exceed ${rule.maxLength} characters`);
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${field} contains invalid characters`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
  
  static sanitize(value, rule) {
    if (rule.sanitize && typeof value === 'string') {
      // Remove potentially dangerous content
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    return value;
  }
}
```

**Technical Specifications Prepared**: 2025-08-25  
**Version**: 1.0.0  
**Next Phase**: Implementation Patterns