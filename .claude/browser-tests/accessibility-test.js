#!/usr/bin/env node

/**
 * Accessibility Testing Suite
 * WCAG AA Compliance Checks
 */

const { execSync } = require('child_process');
const path = require('path');

const BRIDGE_PATH = path.join(__dirname, '../browser-bridge.js');
const FILE_URL = `file://${path.resolve(__dirname, '../../src/ultimate-ux-enhanced.html')}`;

console.log('♿ Running Accessibility Tests...\n');

// Run accessibility audit
try {
  const output = execSync(`node ${BRIDGE_PATH} checkAccessibility url="${FILE_URL}"`, { encoding: 'utf-8' });
  const result = JSON.parse(output);
  
  console.log('='.repeat(50));
  console.log('ACCESSIBILITY AUDIT RESULTS');
  console.log('='.repeat(50));
  
  // ARIA Issues
  console.log('\n📋 ARIA Label Check:');
  if (result.issues.aria.length === 0) {
    console.log('✅ All interactive elements have proper ARIA labels');
  } else {
    console.log(`❌ Found ${result.issues.aria.length} ARIA issues:`);
    result.issues.aria.forEach(issue => {
      console.log(`   - ${issue.element}: ${issue.issue}`);
      if (issue.text) console.log(`     Text: "${issue.text}"`);
    });
  }
  
  // Alt Text Issues
  console.log('\n🖼️ Image Alt Text Check:');
  if (result.issues.images.length === 0) {
    console.log('✅ All images have alt text');
  } else {
    console.log(`❌ Found ${result.issues.images.length} images without alt text:`);
    result.issues.images.forEach(issue => {
      console.log(`   - ${issue.src}`);
    });
  }
  
  // Contrast Issues
  console.log('\n🎨 Color Contrast Check:');
  if (result.issues.contrast.length === 0) {
    console.log('✅ No contrast issues detected');
  } else {
    console.log(`⚠️  Potential contrast issues found: ${result.issues.contrast.length}`);
    result.issues.contrast.forEach(issue => {
      console.log(`   - ${issue.element}: ${issue.issue}`);
    });
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Issues: ${result.summary.total}`);
  console.log(`- ARIA Issues: ${result.summary.ariaIssues}`);
  console.log(`- Image Issues: ${result.summary.imageIssues}`);
  console.log(`- Contrast Issues: ${result.summary.contrastIssues}`);
  
  if (result.success) {
    console.log('\n✅ WCAG AA Compliance: PASSED');
  } else {
    console.log('\n❌ WCAG AA Compliance: FAILED');
    console.log('Please fix the issues above to ensure accessibility.');
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  console.log('1. Add aria-label to all buttons and interactive elements');
  console.log('2. Ensure all images have descriptive alt text');
  console.log('3. Maintain color contrast ratio of at least 4.5:1');
  console.log('4. Test with screen readers for full accessibility');
  
  process.exit(result.success ? 0 : 1);
} catch (error) {
  console.error('❌ Error running accessibility tests:', error.message);
  process.exit(1);
}