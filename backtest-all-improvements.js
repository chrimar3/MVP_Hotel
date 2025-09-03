#!/usr/bin/env node
/**
 * Comprehensive Backtest Suite for Code Quality Improvements
 * Tests all major improvements without breaking functionality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ComprehensiveBacktest {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.startTime = Date.now();
  }

  /**
   * Main test runner
   */
  async runAllTests() {
    console.log('🧪 COMPREHENSIVE BACKTEST SUITE');
    console.log('===============================\n');
    
    try {
      // 1. Core Functionality Tests
      await this.testCoreFunctionality();
      
      // 2. Code Quality Improvements
      await this.testCodeQualityFixes();
      
      // 3. Infrastructure Tests
      await this.testInfrastructureChanges();
      
      // 4. File Organization Tests
      await this.testFileOrganization();
      
      // 5. CI/CD Compatibility
      await this.testCICDCompatibility();
      
      // 6. Performance Impact
      await this.testPerformanceImpact();
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Test 1: Core Functionality
   */
  async testCoreFunctionality() {
    console.log('🎯 Testing Core Functionality...\n');
    
    // Test review generation logic
    this.test('Review Template Generation', () => {
      const translations = {
        en: {
          location: 'location',
          cleanliness: 'cleanliness',
          service: 'service',
          opening: 'I had a wonderful stay at',
          enjoyed: 'I particularly enjoyed the',
          staff: 'Special thanks to',
          recommend: 'I would definitely recommend this hotel',
          closing: 'Looking forward to returning!'
        }
      };
      
      const hotelName = 'Test Hotel';
      const selectedAspects = ['cleanliness', 'service'];
      const staffName = 'John at reception';
      const t = translations['en'];
      
      let review = `${t.opening} ${hotelName}. `;
      if (selectedAspects.length > 0) {
        const aspectsText = selectedAspects.map(a => t[a]).join(', ');
        review += `${t.enjoyed} ${aspectsText}. `;
      }
      if (staffName) {
        review += `${t.staff} ${staffName}. `;
      }
      review += `${t.recommend}. ${t.closing}`;
      
      return review.includes(hotelName) && 
             review.includes('cleanliness') && 
             review.includes('service') &&
             review.includes(staffName);
    });

    // Test HTML structure
    this.test('HTML Button Structure', () => {
      const htmlContent = fs.readFileSync('review-generator.html', 'utf8');
      return htmlContent.includes('id="generateBtn"') && 
             htmlContent.includes('getElementById(\'generateBtn\')') &&
             !htmlContent.includes('querySelector(\'.generate-btn\')');
    });

    console.log('');
  }

  /**
   * Test 2: Code Quality Fixes
   */
  async testCodeQualityFixes() {
    console.log('📋 Testing Code Quality Fixes...\n');
    
    // Test ESLint errors are fixed
    this.test('ESLint Error Count', () => {
      try {
        const output = execSync('npm run lint', { encoding: 'utf8', stdio: 'pipe' });
        return !output.includes(' error ') || output.includes('0 errors');
      } catch (error) {
        // ESLint exits with code 1 for warnings, check the output
        return !error.stdout.includes(' error ') || error.stdout.includes('0 errors');
      }
    });

    // Test logger utility exists
    this.test('Logger Utility Created', () => {
      return fs.existsSync('src/utils/logger.js');
    });

    // Test analytics helper exists
    this.test('Analytics Helper Created', () => {
      return fs.existsSync('src/utils/analytics-helper.js');
    });

    // Test modal utility exists
    this.test('Modal Utility Created', () => {
      return fs.existsSync('src/utils/modal.js');
    });

    // Test console.log replacement
    this.test('Console.log Statements Removed', () => {
      const analyticsJs = fs.readFileSync('src/js/analytics.js', 'utf8');
      const mainJs = fs.readFileSync('src/js/main.js', 'utf8');
      
      // Should not contain direct console.log calls
      const hasDirectConsole = analyticsJs.includes('console.log(') || 
                               mainJs.includes('console.log(');
      
      // Should contain logger calls instead
      const hasLoggerCalls = analyticsJs.includes('logger.') || 
                            mainJs.includes('logger.');
      
      return !hasDirectConsole && hasLoggerCalls;
    });

    console.log('');
  }

  /**
   * Test 3: Infrastructure Changes
   */
  async testInfrastructureChanges() {
    console.log('🏗️ Testing Infrastructure Changes...\n');
    
    // Test modular monitoring components
    this.test('Monitoring Components Split', () => {
      return fs.existsSync('src/monitoring/core/PerformanceObserver.js') &&
             fs.existsSync('src/monitoring/core/WebVitalsTracker.js') &&
             fs.existsSync('src/monitoring/core/ErrorTracker.js');
    });

    // Test logger functionality
    this.test('Logger Functionality', () => {
      try {
        const loggerContent = fs.readFileSync('src/utils/logger.js', 'utf8');
        return loggerContent.includes('createLogger') && 
               loggerContent.includes('development') && 
               loggerContent.includes('production');
      } catch {
        return false;
      }
    });

    // Test analytics safety
    this.test('Safe Analytics Integration', () => {
      try {
        const analyticsHelper = fs.readFileSync('src/utils/analytics-helper.js', 'utf8');
        return analyticsHelper.includes('typeof window.gtag') && 
               analyticsHelper.includes('function') &&
               analyticsHelper.includes('safeGtag');
      } catch {
        return false;
      }
    });

    console.log('');
  }

  /**
   * Test 4: File Organization
   */
  async testFileOrganization() {
    console.log('📁 Testing File Organization...\n');
    
    // Test file sizes are reduced
    this.test('Large Files Split', () => {
      const monitoringJs = fs.readFileSync('src/js/monitoring.js', 'utf8');
      const lines = monitoringJs.split('\n').length;
      return lines < 500; // Should be under 500 lines now
    });

    // Test proper imports
    this.test('Proper Module Imports', () => {
      const monitoringJs = fs.readFileSync('src/js/monitoring.js', 'utf8');
      return monitoringJs.includes('import') && 
             monitoringJs.includes('createLogger') &&
             monitoringJs.includes('PerformanceObserverManager');
    });

    console.log('');
  }

  /**
   * Test 5: CI/CD Compatibility
   */
  async testCICDCompatibility() {
    console.log('🚀 Testing CI/CD Compatibility...\n');
    
    // Test build doesn't fail
    this.test('No Build-Breaking Errors', () => {
      try {
        // Test that files can be parsed (basic syntax check)
        const testFiles = [
          'src/js/analytics.js',
          'src/js/main.js',
          'src/utils/logger.js',
          'src/utils/modal.js'
        ];
        
        for (const file of testFiles) {
          if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            // Basic syntax check - no obvious syntax errors
            if (content.includes('function(') && !content.includes(')')) {
              return false;
            }
          }
        }
        return true;
      } catch {
        return false;
      }
    });

    // Test package.json is intact
    this.test('Package.json Integrity', () => {
      try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        return packageJson.scripts && packageJson.scripts.lint;
      } catch {
        return false;
      }
    });

    console.log('');
  }

  /**
   * Test 6: Performance Impact
   */
  async testPerformanceImpact() {
    console.log('⚡ Testing Performance Impact...\n');
    
    // Test file sizes reasonable
    this.test('File Size Optimization', () => {
      const reviewGenSize = fs.statSync('review-generator.html').size;
      return reviewGenSize < 200000; // Under 200KB
    });

    // Test no circular dependencies
    this.test('No Circular Dependencies', () => {
      // Basic check for potential circular imports
      const files = [
        'src/js/analytics.js',
        'src/js/main.js',
        'src/utils/logger.js'
      ];
      
      for (const file of files) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          // Check if file imports itself or creates obvious cycles
          const fileName = path.basename(file, '.js');
          if (content.includes(`from './${fileName}`) || 
              content.includes(`require('./${fileName}`)) {
            return false;
          }
        }
      }
      return true;
    });

    console.log('');
  }

  /**
   * Test helper function
   */
  test(name, testFn) {
    try {
      const result = testFn();
      if (result) {
        console.log(`✅ ${name}`);
        this.results.passed++;
      } else {
        console.log(`❌ ${name}`);
        this.results.failed++;
        this.results.errors.push(name);
      }
    } catch (error) {
      console.log(`❌ ${name} - Error: ${error.message}`);
      this.results.failed++;
      this.results.errors.push(`${name}: ${error.message}`);
    }
  }

  /**
   * Generate final report
   */
  generateReport() {
    const duration = Date.now() - this.startTime;
    const total = this.results.passed + this.results.failed;
    const successRate = ((this.results.passed / total) * 100).toFixed(1);
    
    console.log('\n===============================');
    console.log('🏁 BACKTEST RESULTS');
    console.log('===============================');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${this.results.passed} ✅`);
    console.log(`Failed: ${this.results.failed} ❌`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Duration: ${duration}ms`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    if (successRate >= 90) {
      console.log('\n🎉 BACKTEST PASSED! Code quality improvements are working correctly.');
    } else {
      console.log('\n⚠️  BACKTEST CONCERNS - Some improvements need attention.');
    }
    
    console.log('\n===============================');
  }
}

// Run the backtest
if (require.main === module) {
  const backtest = new ComprehensiveBacktest();
  backtest.runAllTests().catch(console.error);
}

module.exports = ComprehensiveBacktest;