/**
 * Performance Budget Configuration
 * Defines performance thresholds and monitoring rules for the Hotel Review Generator
 */

module.exports = {
  // Bundle size budgets (in bytes)
  budgets: {
    // Critical path resources - must be under these limits
    critical: {
      // Main JavaScript bundle (critical functionality only)
      mainJS: 80 * 1024,        // 80KB - Target: First load under 100KB
      
      // Critical CSS (inline, above-the-fold styles)
      criticalCSS: 14 * 1024,   // 14KB - Target: Critical CSS under 14KB
      
      // Total initial payload (JS + CSS + HTML)
      initialPayload: 100 * 1024, // 100KB - Target: Interactive under 2s on 3G
    },
    
    // Secondary resources - loaded after critical path
    secondary: {
      // Non-critical CSS
      mainCSS: 50 * 1024,       // 50KB
      
      // Vendor libraries
      vendorJS: 120 * 1024,     // 120KB
      
      // Individual lazy-loaded chunks
      lazyChunk: 75 * 1024,     // 75KB per chunk
      
      // NLG engine modules
      nlgEngine: 100 * 1024,    // 100KB for all NLG components
      
      // Security modules
      securityModules: 60 * 1024, // 60KB for all security modules
    },
    
    // Static assets
    assets: {
      // Images (per file)
      imageMax: 150 * 1024,     // 150KB per image
      
      // Fonts (per family)
      fontFamily: 100 * 1024,   // 100KB per font family
      
      // Total images budget
      totalImages: 1 * 1024 * 1024, // 1MB total for all images
      
      // Total fonts budget
      totalFonts: 200 * 1024,   // 200KB total for all fonts
    },
    
    // Overall application budget
    total: {
      // Total JavaScript (all bundles)
      allJS: 300 * 1024,        // 300KB for all JavaScript
      
      // Total CSS (all stylesheets)
      allCSS: 80 * 1024,        // 80KB for all CSS
      
      // Complete application (excluding images)
      application: 500 * 1024,  // 500KB for complete application
      
      // Everything including assets
      everything: 2 * 1024 * 1024, // 2MB total budget
    }
  },

  // Performance timing budgets (in milliseconds)
  timings: {
    // Core Web Vitals thresholds
    coreWebVitals: {
      // Largest Contentful Paint
      lcp: {
        good: 2500,      // Good: under 2.5s
        needsImprovement: 4000 // Needs improvement: 2.5s-4s
      },
      
      // First Input Delay
      fid: {
        good: 100,       // Good: under 100ms
        needsImprovement: 300 // Needs improvement: 100ms-300ms
      },
      
      // Cumulative Layout Shift
      cls: {
        good: 0.1,       // Good: under 0.1
        needsImprovement: 0.25 // Needs improvement: 0.1-0.25
      }
    },
    
    // Custom performance metrics
    custom: {
      // Time to Interactive
      tti: 3000,         // Target: under 3s on mobile 3G
      
      // First Contentful Paint
      fcp: 1000,         // Target: under 1s
      
      // Speed Index
      speedIndex: 2000,  // Target: under 2s
      
      // Review generation time
      reviewGeneration: 2000, // Target: under 2s
      
      // Module load time (lazy loaded)
      moduleLoad: 500,   // Target: under 500ms per module
    },
    
    // Network conditions for testing
    networkConditions: {
      // Slow 3G (target condition)
      slow3G: {
        downloadThroughput: 500 * 1024,    // 500KB/s
        uploadThroughput: 500 * 1024,      // 500KB/s
        latency: 400                        // 400ms RTT
      },
      
      // Fast 3G
      fast3G: {
        downloadThroughput: 1.6 * 1024 * 1024, // 1.6MB/s
        uploadThroughput: 750 * 1024,           // 750KB/s
        latency: 150                            // 150ms RTT
      }
    }
  },

  // Lighthouse performance score targets
  lighthouse: {
    performance: 95,     // Target Lighthouse performance score
    accessibility: 100,  // Target accessibility score
    bestPractices: 100,  // Target best practices score
    seo: 95,            // Target SEO score
    pwa: 90             // Target PWA score
  },

  // Bundle composition rules
  composition: {
    // Maximum allowed percentage of vendor code
    maxVendorPercentage: 40, // 40% of total JS can be vendor code
    
    // Minimum code coverage threshold
    minCodeCoverage: 80,     // 80% of loaded code should be used
    
    // Maximum unused CSS
    maxUnusedCSS: 20,        // Max 20% unused CSS allowed
    
    // Tree shaking efficiency
    minTreeShakingEfficiency: 85, // 85% of imported code should be used
  },

  // Performance monitoring rules
  monitoring: {
    // Real User Monitoring (RUM) thresholds
    rum: {
      // Page load time percentiles
      pageLoad: {
        p50: 2000,       // 50% of users load under 2s
        p75: 3000,       // 75% of users load under 3s
        p95: 5000,       // 95% of users load under 5s
        p99: 8000        // 99% of users load under 8s
      },
      
      // Review generation percentiles
      reviewGeneration: {
        p50: 1000,       // 50% of generations under 1s
        p75: 1500,       // 75% of generations under 1.5s
        p95: 2000,       // 95% of generations under 2s
        p99: 3000        // 99% of generations under 3s
      }
    },
    
    // Error rate thresholds
    errorRates: {
      javascript: 0.1,   // Max 0.1% JavaScript error rate
      network: 0.5,      // Max 0.5% network error rate
      generation: 0.01,  // Max 0.01% review generation error rate
    },
    
    // Performance regression detection
    regression: {
      // Alert if metrics degrade by more than these percentages
      bundleSize: 10,    // 10% increase in bundle size
      loadTime: 15,      // 15% increase in load time
      memoryUsage: 20,   // 20% increase in memory usage
    }
  },

  // Build-time performance checks
  build: {
    // Webpack performance hints
    webpack: {
      maxAssetSize: 250 * 1024,      // 250KB max asset size
      maxEntrypointSize: 250 * 1024, // 250KB max entrypoint size
      hints: 'error'                  // Fail build on budget violations
    },
    
    // Bundle analyzer thresholds
    analyzer: {
      // Flag bundles larger than these sizes
      warnSize: 200 * 1024,   // 200KB warning threshold
      errorSize: 300 * 1024,  // 300KB error threshold
      
      // Code splitting recommendations
      recommendSplitSize: 150 * 1024, // Recommend splitting at 150KB
    },
    
    // Compression targets
    compression: {
      gzip: {
        minRatio: 0.3,       // Minimum compression ratio (30% of original)
        targetRatio: 0.2     // Target compression ratio (20% of original)
      },
      
      brotli: {
        minRatio: 0.25,      // Minimum Brotli compression ratio
        targetRatio: 0.15    // Target Brotli compression ratio
      }
    }
  },

  // Testing performance budgets
  testing: {
    // Unit test performance
    unitTests: {
      maxDuration: 30000,    // 30s max for all unit tests
      maxSingleTest: 5000,   // 5s max for single test
    },
    
    // Integration test performance
    integrationTests: {
      maxDuration: 120000,   // 2min max for integration tests
      maxSingleTest: 30000,  // 30s max for single test
    },
    
    // E2E test performance
    e2eTests: {
      maxDuration: 300000,   // 5min max for E2E tests
      maxPageLoad: 5000,     // 5s max page load in tests
      maxGeneration: 3000,   // 3s max review generation in tests
    }
  },

  // Environment-specific budgets
  environments: {
    development: {
      // More lenient budgets for development
      bundleMultiplier: 1.5,  // 50% larger bundles allowed
      timingMultiplier: 2.0,  // 2x longer times allowed
      disableHints: false     // Keep performance hints enabled
    },
    
    production: {
      // Strict budgets for production
      bundleMultiplier: 1.0,  // Exact budget enforcement
      timingMultiplier: 1.0,  // Exact timing enforcement
      failOnBudgetExceed: true // Fail deployment if budgets exceeded
    }
  },

  // Performance optimization priorities
  optimization: {
    // High priority optimizations (biggest impact)
    high: [
      'code-splitting',
      'lazy-loading',
      'tree-shaking',
      'minification',
      'compression',
      'critical-css-inlining'
    ],
    
    // Medium priority optimizations
    medium: [
      'image-optimization',
      'font-loading-optimization',
      'service-worker-caching',
      'preloading-critical-resources'
    ],
    
    // Low priority optimizations (nice to have)
    low: [
      'prefetching-non-critical-resources',
      'http2-push',
      'resource-hints',
      'third-party-optimization'
    ]
  },

  // Reporting configuration
  reporting: {
    // Output formats
    formats: ['json', 'csv', 'html'],
    
    // Report frequency
    frequency: {
      development: 'on-demand',  // Manual trigger in dev
      staging: 'on-build',      // Every build in staging
      production: 'daily'       // Daily reports in production
    },
    
    // Alert thresholds
    alerts: {
      critical: {
        budgetExceedPercentage: 20,  // Alert if 20% over budget
        performanceScoreDrop: 10     // Alert if perf score drops 10 points
      },
      
      warning: {
        budgetExceedPercentage: 10,  // Warn if 10% over budget
        performanceScoreDrop: 5      // Warn if perf score drops 5 points
      }
    }
  },

  // CI/CD integration
  ci: {
    // Fail build conditions
    failBuild: {
      budgetExceedPercentage: 25,    // Fail if 25% over budget
      performanceScoreBelow: 85,     // Fail if perf score below 85
      errorRateAbove: 1.0           // Fail if error rate above 1%
    },
    
    // Performance regression detection
    regressionThresholds: {
      bundleSize: 15,        // 15% increase fails build
      loadTime: 20,          // 20% increase fails build
      performanceScore: 10   // 10 point decrease fails build
    }
  }
};

// Export additional utilities
module.exports.getBudgetForFile = function(filename) {
  const config = module.exports;
  
  if (filename.includes('main.') && filename.includes('.js')) {
    return config.budgets.critical.mainJS;
  } else if (filename.includes('vendor') && filename.includes('.js')) {
    return config.budgets.secondary.vendorJS;
  } else if (filename.includes('chunk.') && filename.includes('.js')) {
    return config.budgets.secondary.lazyChunk;
  } else if (filename.includes('main.') && filename.includes('.css')) {
    return config.budgets.secondary.mainCSS;
  } else if (filename.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
    return config.budgets.assets.imageMax;
  } else if (filename.match(/\.(woff|woff2|ttf|eot)$/)) {
    return config.budgets.assets.fontFamily;
  }
  
  return null;
};

module.exports.formatBytes = function(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};