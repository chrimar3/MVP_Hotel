#!/usr/bin/env node

/**
 * Visual Testing Suite
 * Based on OneRedOak design review principles
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const BRIDGE_PATH = path.join(__dirname, '../browser-bridge.js');
const FILE_URL = `file://${path.resolve(__dirname, '../../src/ultimate-ux-enhanced.html')}`;

console.log('🎨 Running Visual Tests...\n');

// Test suite
const tests = [
  {
    name: 'Desktop Screenshot',
    command: `node ${BRIDGE_PATH} screenshot url="${FILE_URL}" output=desktop-view.png`,
    description: 'Capture desktop view'
  },
  {
    name: 'Mobile Screenshot',
    command: `node ${BRIDGE_PATH} screenshot url="${FILE_URL}" output=mobile-view.png mobile=true`,
    description: 'Capture mobile view'
  },
  {
    name: 'Full Page Screenshot',
    command: `node ${BRIDGE_PATH} screenshot url="${FILE_URL}" output=full-page.png fullPage=true`,
    description: 'Capture entire page'
  },
  {
    name: 'Mobile Responsiveness',
    command: `node ${BRIDGE_PATH} testMobile url="${FILE_URL}"`,
    description: 'Test on multiple devices'
  },
  {
    name: 'Visual Regression',
    command: `node ${BRIDGE_PATH} compareVisual url="${FILE_URL}" baseline=baseline.png current=current.png`,
    description: 'Compare against baseline'
  }
];

// Run tests
let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  console.log(`\n[${index + 1}/${tests.length}] ${test.name}`);
  console.log(`📝 ${test.description}`);
  
  try {
    const output = execSync(test.command, { encoding: 'utf-8' });
    const result = JSON.parse(output);
    
    if (result.success) {
      console.log(`✅ PASSED`);
      
      // Show additional info
      if (result.path) {
        console.log(`   Screenshot saved: ${result.path}`);
      }
      if (result.results) {
        result.results.forEach(r => {
          console.log(`   - ${r.device}: ${r.screenshot}`);
        });
      }
      if (result.difference) {
        console.log(`   Visual difference: ${result.difference}`);
      }
      
      passed++;
    } else {
      console.log(`❌ FAILED`);
      if (result.message) {
        console.log(`   ${result.message}`);
      }
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failed++;
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Visual Test Results');
console.log('='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

// Check if screenshots were created
const screenshots = ['desktop-view.png', 'mobile-view.png', 'full-page.png'];
console.log('\n📸 Generated Screenshots:');
screenshots.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`   ✅ ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
  }
});

process.exit(failed > 0 ? 1 : 0);