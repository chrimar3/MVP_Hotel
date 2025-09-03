# Performance Optimization Guide

This document outlines the comprehensive performance optimization strategy implemented for the Hotel Review Generator project.

## 🎯 Performance Goals

- **Initial Page Load**: Under 100KB, interactive in under 2 seconds
- **Review Generation**: Under 2 seconds on mobile 3G
- **Core Web Vitals**: 
  - LCP < 2.5s
  - FID < 100ms  
  - CLS < 0.1

## 🏗️ Architecture Overview

### Bundle Splitting Strategy

```
dist/
├── js/
│   ├── main.[hash].js              # Core app (< 80KB)
│   ├── vendors.[hash].js           # Third-party libs (< 120KB)
│   ├── hybrid-generator.[hash].js  # NLG engine (< 100KB)
│   ├── security-auth.[hash].js     # Authentication (< 30KB)
│   ├── security-validation.[hash].js # Validation (< 30KB)
│   ├── monitoring.[hash].js        # Performance tracking
│   └── analytics.[hash].js         # User analytics
├── css/
│   ├── main.[hash].css            # Non-critical CSS (< 50KB)
│   └── critical.css               # Inlined critical CSS (< 14KB)
└── service-worker.js              # Caching & offline support
```

### Lazy Loading Strategy

1. **Critical Path** (loaded immediately):
   - Core application shell
   - Critical CSS (inlined)
   - Essential JavaScript (< 80KB)

2. **Secondary** (loaded on interaction):
   - Review generation modules
   - Security components (as needed)
   - Analytics and monitoring

3. **Progressive** (loaded in background):
   - Non-critical features
   - Additional language packs
   - Advanced configuration options

## 🚀 Quick Start

### Development

```bash
# Start development server with hot reloading
npm run dev

# Build and analyze bundle
npm run perf:budget

# Run performance audit
npm run perf:audit
```

### Production Build

```bash
# Production build with optimizations
npm run build:prod

# Analyze bundle composition
npm run analyze:bundle

# Full performance CI check
npm run perf:ci
```

## 📊 Performance Monitoring

### Bundle Analysis

```bash
# Comprehensive bundle analysis
npm run analyze:bundle
```

This generates:
- Detailed size breakdown by module
- Performance budget violations
- Optimization recommendations
- Compression analysis

### Lighthouse CI

```bash
# Run Lighthouse performance audit
npm run perf:lighthouse
```

Monitors:
- Core Web Vitals
- Performance score
- Best practices compliance
- Accessibility metrics

### CI/CD Performance Checks

```bash
# Run in CI pipeline
npm run perf:ci
```

Features:
- Automated performance budget enforcement
- Regression detection
- Performance baseline tracking
- Build failure on critical violations

## ⚡ Optimization Techniques

### 1. Code Splitting

**Implementation:**
- Route-based splitting for main pages
- Component-based splitting for heavy features
- Vendor library separation
- Dynamic imports with webpack magic comments

**Example:**
```javascript
// Lazy load NLG engine
const nlgEngine = await import(
  /* webpackChunkName: "nlg-engine" */
  /* webpackPreload: true */
  './nlg-engine/index.js'
);
```

### 2. Critical CSS Extraction

**Strategy:**
- Inline critical above-the-fold styles (< 14KB)
- Async load non-critical CSS
- Remove unused CSS rules

**Implementation:**
```html
<style>
  /* Critical CSS inlined here */
</style>
<link rel="stylesheet" href="main.css" media="print" onload="this.media='all'">
```

### 3. Resource Hints & Preloading

**Resource Hints:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="//www.google-analytics.com">
<link rel="preload" href="/js/main.js" as="script">
<link rel="prefetch" href="/js/nlg-engine.js">
<link rel="modulepreload" href="/js/main.js">
```

### 4. Service Worker Caching

**Caching Strategy:**
- **Static Assets**: Cache First (1 year expiry)
- **App Shell**: Stale While Revalidate
- **API Responses**: Network First (5 min expiry)
- **Images**: Cache First (30 days)

### 5. Image Optimization

**Techniques:**
- WebP format with fallbacks
- Responsive images with `srcset`
- Lazy loading with Intersection Observer
- Compression and size limits

### 6. JavaScript Optimizations

**Tree Shaking:**
- ES modules for better dead code elimination
- Webpack bundle analysis
- Unused code removal

**Minification:**
- Terser for JavaScript compression
- Dead code elimination
- Variable name mangling

## 📈 Performance Budgets

### Bundle Size Limits

| Resource Type | Budget | Critical Threshold |
|---------------|--------|-------------------|
| Main JS Bundle | 80KB | 100KB |
| Critical CSS | 14KB | 20KB |
| Vendor Bundle | 120KB | 150KB |
| Lazy Chunks | 75KB | 100KB |
| Images (each) | 150KB | 200KB |
| Total App | 500KB | 600KB |

### Performance Metrics

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | < 2.5s | 2.5s - 4s | > 4s |
| FID | < 100ms | 100ms - 300ms | > 300ms |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 |
| TTI | < 3s | 3s - 5s | > 5s |
| FCP | < 1s | 1s - 2s | > 2s |

## 🔧 Configuration Files

### Webpack Configuration
- `webpack.config.js` - Complete build configuration
- Code splitting and optimization settings
- Performance hints and budgets

### Performance Budgets
- `performance-budget.config.js` - Detailed budget configuration
- Environment-specific settings
- Monitoring thresholds

### Lighthouse CI
- `.lighthouserc.js` - Lighthouse CI configuration
- Performance assertions
- Core Web Vitals monitoring

## 📋 Performance Checklist

### Before Deployment

- [ ] Bundle sizes within budget
- [ ] No performance budget violations
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals in "Good" range
- [ ] No performance regressions
- [ ] Service worker functioning
- [ ] Critical CSS under 14KB
- [ ] Images optimized and compressed

### Regular Monitoring

- [ ] Weekly performance audits
- [ ] Bundle analysis on major changes
- [ ] Performance baseline updates
- [ ] User experience metrics tracking
- [ ] Error rate monitoring

## 🛠️ Development Guidelines

### 1. Lazy Loading Best Practices

```javascript
// ✅ Good: Conditional lazy loading
if (userNeedsAdvancedFeature) {
  const advanced = await import('./advanced-feature.js');
  advanced.init();
}

// ❌ Bad: Loading everything upfront
import advancedFeature from './advanced-feature.js';
```

### 2. Bundle Size Monitoring

```bash
# Check impact before committing
npm run analyze:bundle

# Compare with baseline
npm run perf:ci
```

### 3. Image Guidelines

- Use WebP with JPEG/PNG fallback
- Implement lazy loading for below-fold images
- Optimize images before committing
- Use appropriate sizing and compression

### 4. CSS Best Practices

- Keep critical CSS under 14KB
- Use CSS containment for performance isolation
- Avoid layout-triggering CSS changes
- Minimize reflows and repaints

## 🚨 Troubleshooting

### Bundle Size Issues

**Problem**: Bundle exceeds budget
**Solutions**:
1. Check for duplicate dependencies
2. Implement code splitting
3. Use dynamic imports
4. Remove unused code

### Slow Performance

**Problem**: Poor Core Web Vitals
**Solutions**:
1. Analyze with Lighthouse
2. Check for layout shifts
3. Optimize critical rendering path
4. Reduce main thread work

### Build Failures

**Problem**: Performance CI fails
**Solutions**:
1. Check budget violations
2. Review performance regressions
3. Update baseline if intentional
4. Optimize offending resources

## 📚 Resources

- [Web.dev Performance](https://web.dev/performance/)
- [Webpack Bundle Analysis](https://webpack.js.org/guides/code-splitting/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Core Web Vitals](https://web.dev/vitals/)

## 🔄 Continuous Improvement

The performance optimization strategy is continuously evolving. Regular audits and updates ensure the application maintains optimal performance as it scales and new features are added.

For questions or suggestions, please refer to the development team or create an issue in the project repository.