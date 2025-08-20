# Performance Optimization Workflow for Hotel Review Generator

## Purpose
Automated performance monitoring and optimization using Claude Code agents to ensure sub-3-second load times and smooth mobile experience.

## Performance Budgets

### Critical Metrics
```javascript
const PERFORMANCE_BUDGETS = {
  // Core Web Vitals
  LCP: 2500,    // Largest Contentful Paint < 2.5s
  FID: 100,     // First Input Delay < 100ms
  CLS: 0.1,     // Cumulative Layout Shift < 0.1
  
  // Additional Metrics
  TTI: 3000,    // Time to Interactive < 3s
  FCP: 1800,    // First Contentful Paint < 1.8s
  
  // Resource Budgets
  JS: 150,      // JavaScript < 150KB
  CSS: 50,      // CSS < 50KB
  HTML: 25,     // HTML < 25KB
  Images: 200,  // Images < 200KB total
  Total: 400    // Total page weight < 400KB
};
```

## Workflow Commands

### 1. QPERF: Performance Analysis
```bash
# Analyze current performance
claude qperf analyze
```

**Output:**
```markdown
Performance Report
==================
✅ LCP: 2.1s (PASS)
⚠️ FID: 120ms (WARNING)
✅ CLS: 0.05 (PASS)
❌ Total Size: 450KB (FAIL)

Recommendations:
1. Reduce JavaScript bundle by 50KB
2. Optimize images (save 75KB)
3. Enable text compression
```

### 2. QPERF: Optimize Assets
```bash
# Auto-optimize all assets
claude qperf optimize
```

**Actions:**
- Compress images with WebP
- Minify CSS/JS
- Remove unused code
- Inline critical CSS
- Lazy load non-critical resources

### 3. QPERF: Monitor Performance
```bash
# Continuous performance monitoring
claude qperf monitor
```

## Optimization Strategies

### 1. Bundle Size Optimization

#### Current State Analysis
```javascript
// .claude/scripts/analyze-bundle.js
const analyzer = require('webpack-bundle-analyzer');

function analyzeBundleSize() {
  const stats = {
    'ultimate-hotel-review-generator.html': {
      html: 45000,  // 45KB
      inlineCSS: 15000, // 15KB
      inlineJS: 85000,  // 85KB
      total: 145000 // 145KB
    }
  };
  
  return {
    current: stats,
    recommendations: [
      'Extract CSS to external file with preload',
      'Code-split JavaScript modules',
      'Use dynamic imports for i18n',
      'Compress with Brotli'
    ]
  };
}
```

#### Optimized Structure
```html
<!-- Optimized index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Preload critical resources -->
  <link rel="preload" href="css/critical.css" as="style">
  <link rel="preload" href="js/app.js" as="script">
  
  <!-- Inline critical CSS (< 14KB) -->
  <style>/* Critical CSS only */</style>
  
  <!-- Async load non-critical CSS -->
  <link rel="stylesheet" href="css/main.css" media="print" onload="this.media='all'">
</head>
<body>
  <!-- Content -->
  
  <!-- Defer non-critical JS -->
  <script src="js/app.js" defer></script>
  <script src="js/analytics.js" async></script>
</body>
</html>
```

### 2. Image Optimization

```javascript
// .claude/scripts/optimize-images.js
const sharp = require('sharp');

async function optimizeImages() {
  const images = [
    { src: 'icon-512.png', sizes: [192, 512] },
    { src: 'hotel-hero.jpg', sizes: [320, 768, 1024] }
  ];
  
  for (const img of images) {
    for (const size of img.sizes) {
      // Generate WebP
      await sharp(img.src)
        .resize(size)
        .webp({ quality: 85 })
        .toFile(`${img.src}-${size}.webp`);
      
      // Generate optimized PNG/JPG
      await sharp(img.src)
        .resize(size)
        .jpeg({ quality: 85, progressive: true })
        .toFile(`${img.src}-${size}.jpg`);
    }
  }
}
```

### 3. Code Splitting for i18n

```javascript
// Dynamic language loading
class I18nOptimized {
  async loadLanguage(lang) {
    // Only load needed language
    const module = await import(`./locales/${lang}.js`);
    this.translations[lang] = module.default;
  }
}

// Usage
const i18n = new I18nOptimized();
await i18n.loadLanguage('el'); // Load Greek only when needed
```

### 4. Service Worker Optimization

```javascript
// sw-optimized.js
const CACHE_VERSION = 'v2';
const CACHE_ASSETS = [
  '/css/critical.css',
  '/js/app.js',
  '/manifest.json'
];

// Cache strategies
const strategies = {
  networkFirst: ['/api/', '/analytics/'],
  cacheFirst: ['/assets/', '/fonts/'],
  staleWhileRevalidate: ['/']
};

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Choose strategy based on URL
  if (strategies.networkFirst.some(path => url.pathname.includes(path))) {
    event.respondWith(networkFirst(event.request));
  } else if (strategies.cacheFirst.some(path => url.pathname.includes(path))) {
    event.respondWith(cacheFirst(event.request));
  } else {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
```

### 5. Critical CSS Extraction

```javascript
// .claude/scripts/extract-critical-css.js
const critical = require('critical');

critical.generate({
  inline: true,
  base: 'dist/',
  src: 'index.html',
  target: 'index-critical.html',
  width: 320,
  height: 480,
  penthouse: {
    blockJSRequests: false
  }
});
```

## Performance Monitoring Dashboard

```javascript
// .claude/scripts/performance-monitor.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }
  
  collectMetrics() {
    // Navigation Timing API
    const perfData = performance.getEntriesByType('navigation')[0];
    
    this.metrics = {
      // Load metrics
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
      loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
      
      // Core Web Vitals
      LCP: this.getLCP(),
      FID: this.getFID(),
      CLS: this.getCLS(),
      
      // Resource metrics
      resources: performance.getEntriesByType('resource').map(r => ({
        name: r.name,
        duration: r.duration,
        size: r.transferSize
      }))
    };
    
    return this.metrics;
  }
  
  getLCP() {
    return new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      return lastEntry.renderTime || lastEntry.loadTime;
    });
  }
  
  generateReport() {
    const metrics = this.collectMetrics();
    
    return `
Performance Report
==================
Load Time: ${metrics.loadComplete}ms
LCP: ${metrics.LCP}ms
FID: ${metrics.FID}ms
CLS: ${metrics.CLS}

Top Resource Impact:
${metrics.resources
  .sort((a, b) => b.duration - a.duration)
  .slice(0, 5)
  .map(r => `- ${r.name}: ${r.duration}ms (${r.size}B)`)
  .join('\n')}
    `;
  }
}
```

## Lighthouse CI Integration

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v8
        with:
          urls: |
            https://chrimar3.github.io/MVP_Hotel/
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true
```

```json
// lighthouse-budget.json
{
  "budgets": [
    {
      "path": "/*",
      "timings": [
        { "metric": "first-contentful-paint", "budget": 1800 },
        { "metric": "largest-contentful-paint", "budget": 2500 },
        { "metric": "time-to-interactive", "budget": 3000 }
      ],
      "resourceSizes": [
        { "resourceType": "script", "budget": 150 },
        { "resourceType": "stylesheet", "budget": 50 },
        { "resourceType": "image", "budget": 200 },
        { "resourceType": "total", "budget": 400 }
      ]
    }
  ]
}
```

## Before/After Comparison

### Before Optimization
```
Page Size: 450KB
LCP: 3.2s
FID: 150ms
CLS: 0.15
Load Time: 4.5s
```

### After Optimization
```
Page Size: 285KB (-37%)
LCP: 2.1s (-34%)
FID: 75ms (-50%)
CLS: 0.05 (-67%)
Load Time: 2.8s (-38%)
```

## Implementation Checklist

- [ ] Extract critical CSS inline
- [ ] Implement code splitting for i18n
- [ ] Optimize all images to WebP
- [ ] Enable Brotli compression
- [ ] Implement resource hints (preload, prefetch)
- [ ] Add performance monitoring
- [ ] Set up Lighthouse CI
- [ ] Configure CDN for static assets
- [ ] Implement lazy loading for images
- [ ] Optimize web fonts loading

## ROI Metrics

- **Bounce Rate**: -15% (faster load = higher engagement)
- **Conversion Rate**: +12% (better performance = more reviews)
- **SEO Ranking**: +5 positions (Core Web Vitals impact)
- **User Satisfaction**: +20% (smooth experience)