#!/usr/bin/env node
/**
 * Bundle Analysis Script - Comprehensive bundle size and performance analysis
 * Provides detailed insights into bundle composition, optimization opportunities, and performance metrics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BundleAnalyzer {
  constructor() {
    this.distPath = path.resolve(process.cwd(), 'dist');
    this.results = {
      bundles: {},
      assets: {},
      performance: {},
      recommendations: [],
      summary: {}
    };
  }

  async analyze() {
    console.log('🔍 Starting comprehensive bundle analysis...\n');

    // Check if dist directory exists
    if (!fs.existsSync(this.distPath)) {
      console.error('❌ Error: dist directory not found. Run "npm run build:prod" first.');
      process.exit(1);
    }

    try {
      await this.analyzeBundleSizes();
      await this.analyzeAssets();
      await this.checkPerformanceBudgets();
      await this.generateRecommendations();
      await this.displayResults();
      await this.saveReport();
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      process.exit(1);
    }
  }

  async analyzeBundleSizes() {
    console.log('📦 Analyzing bundle sizes...');
    
    const jsFiles = this.getFilesByExtension('.js');
    const cssFiles = this.getFilesByExtension('.css');
    
    let totalJSSize = 0;
    let totalCSSSize = 0;

    // Analyze JavaScript bundles
    for (const file of jsFiles) {
      const stats = fs.statSync(file.path);
      const gzipSize = this.getGzipSize(file.path);
      
      this.results.bundles[file.name] = {
        type: 'javascript',
        size: stats.size,
        gzipSize: gzipSize,
        path: file.relativePath,
        isChunk: file.name.includes('.chunk.'),
        isVendor: file.name.includes('vendor'),
        isMain: file.name.includes('main')
      };
      
      totalJSSize += stats.size;
    }

    // Analyze CSS bundles
    for (const file of cssFiles) {
      const stats = fs.statSync(file.path);
      const gzipSize = this.getGzipSize(file.path);
      
      this.results.bundles[file.name] = {
        type: 'stylesheet',
        size: stats.size,
        gzipSize: gzipSize,
        path: file.relativePath,
        isChunk: file.name.includes('.chunk.'),
        isMain: file.name.includes('main')
      };
      
      totalCSSSize += stats.size;
    }

    this.results.summary.totalJS = totalJSSize;
    this.results.summary.totalCSS = totalCSSSize;
    this.results.summary.totalBundle = totalJSSize + totalCSSSize;

    console.log(`✅ Analyzed ${jsFiles.length} JS files and ${cssFiles.length} CSS files`);
  }

  async analyzeAssets() {
    console.log('🖼️ Analyzing static assets...');
    
    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
    const fontExts = ['.woff', '.woff2', '.ttf', '.eot'];
    const otherExts = ['.json', '.xml', '.txt'];
    
    let totalImageSize = 0;
    let totalFontSize = 0;
    let totalOtherSize = 0;

    // Analyze images
    for (const ext of imageExts) {
      const files = this.getFilesByExtension(ext);
      for (const file of files) {
        const stats = fs.statSync(file.path);
        this.results.assets[file.name] = {
          type: 'image',
          extension: ext,
          size: stats.size,
          path: file.relativePath
        };
        totalImageSize += stats.size;
      }
    }

    // Analyze fonts
    for (const ext of fontExts) {
      const files = this.getFilesByExtension(ext);
      for (const file of files) {
        const stats = fs.statSync(file.path);
        this.results.assets[file.name] = {
          type: 'font',
          extension: ext,
          size: stats.size,
          path: file.relativePath
        };
        totalFontSize += stats.size;
      }
    }

    // Analyze other assets
    for (const ext of otherExts) {
      const files = this.getFilesByExtension(ext);
      for (const file of files) {
        const stats = fs.statSync(file.path);
        this.results.assets[file.name] = {
          type: 'other',
          extension: ext,
          size: stats.size,
          path: file.relativePath
        };
        totalOtherSize += stats.size;
      }
    }

    this.results.summary.totalImages = totalImageSize;
    this.results.summary.totalFonts = totalFontSize;
    this.results.summary.totalOther = totalOtherSize;
    this.results.summary.totalAssets = totalImageSize + totalFontSize + totalOtherSize;

    console.log('✅ Asset analysis completed');
  }

  async checkPerformanceBudgets() {
    console.log('⚡ Checking performance budgets...');
    
    const budgets = {
      totalBundle: 250 * 1024, // 250KB
      mainJS: 100 * 1024,      // 100KB
      mainCSS: 50 * 1024,      // 50KB
      vendorJS: 150 * 1024,    // 150KB
      totalAssets: 2 * 1024 * 1024, // 2MB
      chunkSize: 100 * 1024    // 100KB per chunk
    };

    const results = {};

    // Check total bundle size
    results.totalBundle = {
      budget: budgets.totalBundle,
      actual: this.results.summary.totalBundle,
      passed: this.results.summary.totalBundle <= budgets.totalBundle,
      overBy: Math.max(0, this.results.summary.totalBundle - budgets.totalBundle)
    };

    // Check main JS bundle
    const mainJS = Object.values(this.results.bundles).find(b => b.isMain && b.type === 'javascript');
    if (mainJS) {
      results.mainJS = {
        budget: budgets.mainJS,
        actual: mainJS.size,
        passed: mainJS.size <= budgets.mainJS,
        overBy: Math.max(0, mainJS.size - budgets.mainJS)
      };
    }

    // Check main CSS bundle
    const mainCSS = Object.values(this.results.bundles).find(b => b.isMain && b.type === 'stylesheet');
    if (mainCSS) {
      results.mainCSS = {
        budget: budgets.mainCSS,
        actual: mainCSS.size,
        passed: mainCSS.size <= budgets.mainCSS,
        overBy: Math.max(0, mainCSS.size - budgets.mainCSS)
      };
    }

    // Check vendor bundle
    const vendorJS = Object.values(this.results.bundles).find(b => b.isVendor && b.type === 'javascript');
    if (vendorJS) {
      results.vendorJS = {
        budget: budgets.vendorJS,
        actual: vendorJS.size,
        passed: vendorJS.size <= budgets.vendorJS,
        overBy: Math.max(0, vendorJS.size - budgets.vendorJS)
      };
    }

    // Check individual chunk sizes
    const chunks = Object.values(this.results.bundles).filter(b => b.isChunk);
    results.chunks = chunks.map(chunk => ({
      name: path.basename(chunk.path),
      budget: budgets.chunkSize,
      actual: chunk.size,
      passed: chunk.size <= budgets.chunkSize,
      overBy: Math.max(0, chunk.size - budgets.chunkSize)
    }));

    // Check total assets
    results.totalAssets = {
      budget: budgets.totalAssets,
      actual: this.results.summary.totalAssets,
      passed: this.results.summary.totalAssets <= budgets.totalAssets,
      overBy: Math.max(0, this.results.summary.totalAssets - budgets.totalAssets)
    };

    this.results.performance = results;
    console.log('✅ Performance budget analysis completed');
  }

  async generateRecommendations() {
    console.log('💡 Generating optimization recommendations...');
    
    const recommendations = [];

    // Bundle size recommendations
    if (!this.results.performance.totalBundle.passed) {
      recommendations.push({
        type: 'critical',
        category: 'bundle-size',
        message: `Total bundle size exceeds budget by ${this.formatBytes(this.results.performance.totalBundle.overBy)}`,
        suggestions: [
          'Enable code splitting for non-critical features',
          'Implement lazy loading for heavy components',
          'Remove unused dependencies and dead code',
          'Consider using dynamic imports for large libraries'
        ]
      });
    }

    // Main bundle recommendations
    if (this.results.performance.mainJS && !this.results.performance.mainJS.passed) {
      recommendations.push({
        type: 'warning',
        category: 'main-bundle',
        message: `Main JavaScript bundle is too large (${this.formatBytes(this.results.performance.mainJS.actual)})`,
        suggestions: [
          'Move non-critical code to async chunks',
          'Use tree shaking to remove unused exports',
          'Defer loading of analytics and tracking scripts',
          'Consider polyfill optimization'
        ]
      });
    }

    // Large chunk recommendations
    const largeChunks = this.results.performance.chunks.filter(c => !c.passed);
    if (largeChunks.length > 0) {
      recommendations.push({
        type: 'warning',
        category: 'chunk-size',
        message: `${largeChunks.length} chunks exceed size budget`,
        suggestions: [
          'Split large chunks into smaller modules',
          'Use route-based code splitting',
          'Implement component-level lazy loading',
          'Review third-party library usage'
        ]
      });
    }

    // Asset optimization recommendations
    const largeImages = Object.values(this.results.assets)
      .filter(a => a.type === 'image' && a.size > 100 * 1024);
    
    if (largeImages.length > 0) {
      recommendations.push({
        type: 'info',
        category: 'image-optimization',
        message: `${largeImages.length} images are larger than 100KB`,
        suggestions: [
          'Implement WebP format with fallbacks',
          'Use responsive images with srcset',
          'Add image compression to build process',
          'Consider lazy loading for below-fold images'
        ]
      });
    }

    // Compression recommendations
    const uncompressedBundles = Object.values(this.results.bundles)
      .filter(b => b.gzipSize / b.size > 0.7); // Poor compression ratio
    
    if (uncompressedBundles.length > 0) {
      recommendations.push({
        type: 'info',
        category: 'compression',
        message: 'Some bundles have poor compression ratios',
        suggestions: [
          'Enable Brotli compression in addition to Gzip',
          'Optimize JavaScript minification settings',
          'Use modern JavaScript syntax where possible',
          'Consider precompression for static assets'
        ]
      });
    }

    // Performance best practices
    recommendations.push({
      type: 'info',
      category: 'performance',
      message: 'Additional performance optimizations',
      suggestions: [
        'Implement resource hints (preload, prefetch, preconnect)',
        'Use service worker for aggressive caching',
        'Optimize critical rendering path',
        'Monitor Core Web Vitals metrics'
      ]
    });

    this.results.recommendations = recommendations;
    console.log(`✅ Generated ${recommendations.length} recommendations`);
  }

  async displayResults() {
    console.log('\n📊 BUNDLE ANALYSIS RESULTS\n');
    console.log('='.repeat(50));
    
    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`Total Bundle Size: ${this.formatBytes(this.results.summary.totalBundle)}`);
    console.log(`JavaScript: ${this.formatBytes(this.results.summary.totalJS)}`);
    console.log(`CSS: ${this.formatBytes(this.results.summary.totalCSS)}`);
    console.log(`Static Assets: ${this.formatBytes(this.results.summary.totalAssets)}`);

    // Performance budgets
    console.log('\n⚡ PERFORMANCE BUDGETS:');
    for (const [name, result] of Object.entries(this.results.performance)) {
      if (name === 'chunks') continue;
      
      const status = result.passed ? '✅' : '❌';
      const budget = this.formatBytes(result.budget);
      const actual = this.formatBytes(result.actual);
      
      console.log(`${status} ${name}: ${actual} / ${budget}`);
      
      if (!result.passed) {
        console.log(`   Over by: ${this.formatBytes(result.overBy)}`);
      }
    }

    // Large chunks
    const largeChunks = this.results.performance.chunks.filter(c => !c.passed);
    if (largeChunks.length > 0) {
      console.log('\n📦 LARGE CHUNKS:');
      largeChunks.forEach(chunk => {
        console.log(`❌ ${chunk.name}: ${this.formatBytes(chunk.actual)} (over by ${this.formatBytes(chunk.overBy)})`);
      });
    }

    // Top 10 largest files
    console.log('\n📂 LARGEST FILES:');
    const allFiles = [
      ...Object.entries(this.results.bundles).map(([name, info]) => ({ name, ...info })),
      ...Object.entries(this.results.assets).map(([name, info]) => ({ name, ...info }))
    ].sort((a, b) => b.size - a.size).slice(0, 10);

    allFiles.forEach((file, index) => {
      const size = this.formatBytes(file.size);
      const gzipInfo = file.gzipSize ? ` (${this.formatBytes(file.gzipSize)} gzipped)` : '';
      console.log(`${index + 1}. ${file.name}: ${size}${gzipInfo}`);
    });

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    this.results.recommendations.forEach((rec, index) => {
      const icon = rec.type === 'critical' ? '🚨' : rec.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`\n${icon} ${rec.message}`);
      rec.suggestions.forEach(suggestion => {
        console.log(`   • ${suggestion}`);
      });
    });

    console.log('\n' + '='.repeat(50));
  }

  async saveReport() {
    const reportPath = path.join(process.cwd(), 'bundle-analysis-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      ...this.results
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);

    // Also create a summary CSV
    const csvPath = path.join(process.cwd(), 'bundle-summary.csv');
    const csvContent = this.generateCSVReport();
    fs.writeFileSync(csvPath, csvContent);
    console.log(`📊 CSV summary saved to: ${csvPath}`);
  }

  getFilesByExtension(extension) {
    const files = [];
    
    function findFiles(dir) {
      const entries = fs.readdirSync(dir);
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          findFiles(fullPath);
        } else if (entry.endsWith(extension)) {
          files.push({
            name: entry,
            path: fullPath,
            relativePath: path.relative(process.cwd(), fullPath)
          });
        }
      }
    }
    
    findFiles(this.distPath);
    return files;
  }

  getGzipSize(filePath) {
    try {
      const result = execSync(`gzip -c "${filePath}" | wc -c`, { encoding: 'utf-8' });
      return parseInt(result.trim());
    } catch (error) {
      return null;
    }
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  generateCSVReport() {
    const lines = [];
    lines.push('File,Type,Size,Gzip Size,Status,Budget,Over By');
    
    // Add bundles
    for (const [name, bundle] of Object.entries(this.results.bundles)) {
      const budget = bundle.isMain ? (bundle.type === 'javascript' ? 100 * 1024 : 50 * 1024) : 
                    bundle.isVendor ? 150 * 1024 : 100 * 1024;
      const status = bundle.size <= budget ? 'PASS' : 'FAIL';
      const overBy = Math.max(0, bundle.size - budget);
      
      lines.push(`${name},${bundle.type},${bundle.size},${bundle.gzipSize || ''},${status},${budget},${overBy}`);
    }
    
    return lines.join('\n');
  }
}

// Main execution
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze().catch(error => {
    console.error('❌ Bundle analysis failed:', error);
    process.exit(1);
  });
}

module.exports = BundleAnalyzer;