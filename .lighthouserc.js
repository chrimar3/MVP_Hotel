/**
 * Lighthouse CI Configuration
 * Performance monitoring and Core Web Vitals tracking for the Hotel Review Generator
 */

module.exports = {
  ci: {
    collect: {
      // URLs to test
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/review-generator.html'
      ],
      
      // Collection settings
      numberOfRuns: 3,
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'Available on',
      startServerReadyTimeout: 30000,
      
      // Chrome settings
      settings: {
        chromeFlags: [
          '--headless',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ],
        
        // Throttling to simulate mobile 3G
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
          requestLatencyMs: 562.5,
          downloadThroughputKbps: 1474.56,
          uploadThroughputKbps: 675.84
        },
        
        // Additional Lighthouse config
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        skipAudits: [
          'screenshot-thumbnails',
          'final-screenshot'
        ]
      }
    },
    
    assert: {
      // Performance budgets
      assertions: {
        // Core Web Vitals
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-input-delay': ['error', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        
        // Other performance metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 1000 }],
        'speed-index': ['warn', { maxNumericValue: 2000 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'time-to-interactive': ['error', { maxNumericValue: 3000 }],
        
        // Resource budgets
        'total-byte-weight': ['warn', { maxNumericValue: 512000 }], // 512KB
        'dom-size': ['warn', { maxNumericValue: 800 }],
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }], // 20KB
        'unused-javascript': ['warn', { maxNumericValue: 40000 }], // 40KB
        
        // Network requests
        'network-requests': ['warn', { maxNumericValue: 50 }],
        'network-rtt': ['warn', { maxNumericValue: 150 }],
        
        // Modern best practices
        'uses-webp-images': ['warn', { minScore: 0.8 }],
        'uses-optimized-images': ['warn', { minScore: 0.8 }],
        'uses-text-compression': ['warn', { minScore: 0.8 }],
        'uses-responsive-images': ['warn', { minScore: 0.8 }],
        
        // JavaScript optimizations
        'unminified-javascript': ['warn', { maxNumericValue: 0 }],
        'unminified-css': ['warn', { maxNumericValue: 0 }],
        'render-blocking-resources': ['warn', { maxNumericValue: 0 }],
        
        // Category scores
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }]
      }
    },
    
    upload: {
      // Configuration for storing results
      target: 'filesystem',
      outputDir: './lighthouse-results',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%'
    },
    
    server: {
      // Local server configuration
      port: 9001,
      storage: './lighthouse-server'
    }
  }
};

// Environment-specific overrides
if (process.env.CI) {
  // CI/CD environment settings
  module.exports.ci.collect.numberOfRuns = 1; // Single run in CI for speed
  module.exports.ci.collect.startServerCommand = null; // Assume server is already running
  module.exports.ci.collect.url = [
    process.env.DEPLOY_URL || 'https://hotel-review-generator.netlify.app/',
    (process.env.DEPLOY_URL || 'https://hotel-review-generator.netlify.app/') + 'review-generator.html'
  ];
  
  // Stricter assertions in CI
  module.exports.ci.assert.assertions['categories:performance'][1].minScore = 0.85;
}

if (process.env.NODE_ENV === 'development') {
  // Development settings - more lenient
  module.exports.ci.assert.assertions['largest-contentful-paint'][1].maxNumericValue = 4000;
  module.exports.ci.assert.assertions['time-to-interactive'][1].maxNumericValue = 5000;
  module.exports.ci.assert.assertions['categories:performance'][1].minScore = 0.7;
}