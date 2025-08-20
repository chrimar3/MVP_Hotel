#!/usr/bin/env node

/**
 * Performance Testing Suite
 * Core Web Vitals and Metrics
 */

const { execSync } = require('child_process');
const path = require('path');

const BRIDGE_PATH = path.join(__dirname, '../browser-bridge.js');
const FILE_URL = `file://${path.resolve(__dirname, '../../src/ultimate-ux-enhanced.html')}`;

console.log('⚡ Running Performance Tests...\n');

// Performance thresholds (based on OneRedOak standards)
const THRESHOLDS = {
  firstPaint: 1800,        // < 1.8s
  firstContentfulPaint: 2500, // < 2.5s
  domContentLoaded: 3000,  // < 3s
  loadComplete: 4000,      // < 4s
  heapUsed: 50            // < 50MB
};

async function runTests() {
  // 1. Get Performance Metrics
  console.log('📊 Collecting Performance Metrics...\n');
  
  try {
    const metricsOutput = execSync(`node ${BRIDGE_PATH} getMetrics url="${FILE_URL}"`, { encoding: 'utf-8' });
    const metrics = JSON.parse(metricsOutput);
    
    console.log('='.repeat(50));
    console.log('PERFORMANCE METRICS');
    console.log('='.repeat(50));
    
    // Display metrics
    console.log('\n⏱️ Load Times:');
    console.log(`   First Paint: ${metrics.performance.firstPaint?.toFixed(2)}ms ${checkThreshold(metrics.performance.firstPaint, THRESHOLDS.firstPaint)}`);
    console.log(`   First Contentful Paint: ${metrics.performance.firstContentfulPaint?.toFixed(2)}ms ${checkThreshold(metrics.performance.firstContentfulPaint, THRESHOLDS.firstContentfulPaint)}`);
    console.log(`   DOM Content Loaded: ${metrics.performance.domContentLoaded}ms ${checkThreshold(metrics.performance.domContentLoaded, THRESHOLDS.domContentLoaded)}`);
    console.log(`   Page Load Complete: ${metrics.performance.loadComplete}ms ${checkThreshold(metrics.performance.loadComplete, THRESHOLDS.loadComplete)}`);
    
    console.log('\n💾 Memory Usage:');
    console.log(`   Heap Used: ${metrics.summary.heapUsed}`);
    console.log(`   Total Heap: ${Math.round(metrics.metrics.JSHeapTotalSize / 1024 / 1024)}MB`);
    
    console.log('\n📈 Additional Metrics:');
    console.log(`   Nodes: ${metrics.metrics.Nodes}`);
    console.log(`   Listeners: ${metrics.metrics.JSEventListeners}`);
    console.log(`   Documents: ${metrics.metrics.Documents}`);
    console.log(`   Frames: ${metrics.metrics.Frames}`);
    
    // 2. Check Console Errors
    console.log('\n🔍 Checking Console Errors...\n');
    
    const consoleOutput = execSync(`node ${BRIDGE_PATH} checkConsole url="${FILE_URL}"`, { encoding: 'utf-8' });
    const consoleResult = JSON.parse(consoleOutput);
    
    if (consoleResult.errors.length === 0) {
      console.log('✅ No console errors detected');
    } else {
      console.log(`❌ Found ${consoleResult.errors.length} console errors:`);
      consoleResult.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    // 3. Check Critical Elements
    console.log('\n🔍 Checking Critical Elements...\n');
    
    const elementsOutput = execSync(`node ${BRIDGE_PATH} checkElements url="${FILE_URL}"`, { encoding: 'utf-8' });
    const elements = JSON.parse(elementsOutput);
    
    console.log('Critical Elements Check:');
    elements.results.forEach(element => {
      console.log(`   ${element.exists ? '✅' : '❌'} ${element.selector}`);
    });
    
    // Performance Score Calculation
    console.log('\n' + '='.repeat(50));
    console.log('PERFORMANCE SCORE');
    console.log('='.repeat(50));
    
    let score = 100;
    let issues = [];
    
    // Check against thresholds
    if (metrics.performance.firstPaint > THRESHOLDS.firstPaint) {
      score -= 10;
      issues.push(`First Paint too slow (${metrics.performance.firstPaint?.toFixed(0)}ms > ${THRESHOLDS.firstPaint}ms)`);
    }
    
    if (metrics.performance.firstContentfulPaint > THRESHOLDS.firstContentfulPaint) {
      score -= 15;
      issues.push(`FCP too slow (${metrics.performance.firstContentfulPaint?.toFixed(0)}ms > ${THRESHOLDS.firstContentfulPaint}ms)`);
    }
    
    if (metrics.performance.loadComplete > THRESHOLDS.loadComplete) {
      score -= 20;
      issues.push(`Page load too slow (${metrics.performance.loadComplete}ms > ${THRESHOLDS.loadComplete}ms)`);
    }
    
    if (consoleResult.errors.length > 0) {
      score -= 10;
      issues.push(`${consoleResult.errors.length} console errors`);
    }
    
    if (!elements.success) {
      score -= 15;
      issues.push('Missing critical elements');
    }
    
    // Display score
    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
    const gradeEmoji = score >= 90 ? '🏆' : score >= 80 ? '✅' : score >= 70 ? '⚠️' : '❌';
    
    console.log(`\nPerformance Score: ${score}/100 ${gradeEmoji}`);
    console.log(`Grade: ${grade}`);
    
    if (issues.length > 0) {
      console.log('\n⚠️ Issues Found:');
      issues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
    }
    
    // Recommendations
    console.log('\n💡 Optimization Recommendations:');
    if (metrics.performance.firstPaint > THRESHOLDS.firstPaint) {
      console.log('   - Optimize critical rendering path');
      console.log('   - Reduce render-blocking resources');
    }
    if (metrics.performance.loadComplete > THRESHOLDS.loadComplete) {
      console.log('   - Minimize JavaScript bundle size');
      console.log('   - Enable compression (gzip/brotli)');
      console.log('   - Optimize images and use WebP format');
    }
    if (parseInt(metrics.summary.heapUsed) > THRESHOLDS.heapUsed) {
      console.log('   - Reduce memory usage');
      console.log('   - Check for memory leaks');
    }
    
    process.exit(score >= 70 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Error running performance tests:', error.message);
    process.exit(1);
  }
}

function checkThreshold(value, threshold) {
  if (!value) return '⚠️';
  return value <= threshold ? '✅' : '❌';
}

runTests();