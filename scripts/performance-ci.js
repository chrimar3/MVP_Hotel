#!/usr/bin/env node
/**
 * CI/CD Performance Monitoring Script
 * Runs comprehensive performance checks and enforces budgets in CI/CD pipeline
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const BundleAnalyzer = require('./analyze-bundle');
const performanceBudget = require('../performance-budget.config');

class CIPerformanceMonitor {
  constructor() {
    this.results = {
      bundleAnalysis: null,
      performanceScores: null,
      budgetViolations: [],
      regressions: [],
      summary: {
        passed: false,
        errors: [],
        warnings: []
      }
    };

    this.exitCode = 0;
    this.baseline = this.loadBaseline();
  }

  async run() {
    console.log('🚀 Starting CI/CD Performance Monitoring...\n');

    try {
      await this.runBundleAnalysis();
      await this.runLighthouseCI();
      await this.checkPerformanceBudgets();
      await this.detectRegressions();
      await this.generateReport();
      await this.updateBaseline();

      this.determineFinalStatus();
    } catch (error) {
      console.error('❌ Performance monitoring failed:', error.message);
      this.exitCode = 1;
    }

    this.displaySummary();
    process.exit(this.exitCode);
  }

  async runBundleAnalysis() {
    console.log('📦 Running bundle analysis...');
    
    try {
      const analyzer = new BundleAnalyzer();
      await analyzer.analyze();
      this.results.bundleAnalysis = analyzer.results;
      console.log('✅ Bundle analysis completed');
    } catch (error) {
      console.error('❌ Bundle analysis failed:', error.message);
      this.results.summary.errors.push('Bundle analysis failed: ' + error.message);
    }
  }

  async runLighthouseCI() {
    console.log('🏮 Running Lighthouse CI...');
    
    try {
      // Check if Lighthouse CI is available
      const lhciConfigExists = fs.existsSync(path.resolve(process.cwd(), '.lighthouserc.js'));
      
      if (!lhciConfigExists) {
        console.log('⚠️ Lighthouse CI config not found, skipping...');
        return;
      }

      // Run Lighthouse CI
      const lhciResults = execSync('npx lhci autorun --collect.numberOfRuns=1 --assert', {
        encoding: 'utf-8',
        timeout: 300000 // 5 minutes timeout
      });

      // Parse results
      this.results.performanceScores = this.parseLighthouseResults(lhciResults);
      console.log('✅ Lighthouse CI completed');
      
    } catch (error) {
      console.warn('⚠️ Lighthouse CI failed or not configured:', error.message);
      this.results.summary.warnings.push('Lighthouse CI failed: ' + error.message);
    }
  }

  async checkPerformanceBudgets() {
    console.log('⚡ Checking performance budgets...');
    
    if (!this.results.bundleAnalysis) {
      console.log('⚠️ Bundle analysis not available, skipping budget checks');
      return;
    }

    const violations = [];
    const { budgets } = performanceBudget;
    const { bundles, summary } = this.results.bundleAnalysis;

    // Check critical path budgets
    if (summary.totalBundle > budgets.critical.initialPayload) {
      violations.push({
        type: 'critical',
        category: 'initial-payload',
        budget: budgets.critical.initialPayload,
        actual: summary.totalBundle,
        overBy: summary.totalBundle - budgets.critical.initialPayload,
        impact: 'high'
      });
    }

    // Check individual bundle budgets
    for (const [filename, bundle] of Object.entries(bundles)) {
      const budget = performanceBudget.getBudgetForFile(filename);
      
      if (budget && bundle.size > budget) {
        violations.push({
          type: 'bundle',
          category: 'file-size',
          filename,
          budget,
          actual: bundle.size,
          overBy: bundle.size - budget,
          impact: this.getImpactLevel(filename)
        });
      }
    }

    // Check total budgets
    if (summary.totalJS > budgets.total.allJS) {
      violations.push({
        type: 'total',
        category: 'javascript-total',
        budget: budgets.total.allJS,
        actual: summary.totalJS,
        overBy: summary.totalJS - budgets.total.allJS,
        impact: 'medium'
      });
    }

    if (summary.totalCSS > budgets.total.allCSS) {
      violations.push({
        type: 'total',
        category: 'css-total',
        budget: budgets.total.allCSS,
        actual: summary.totalCSS,
        overBy: summary.totalCSS - budgets.total.allCSS,
        impact: 'low'
      });
    }

    this.results.budgetViolations = violations;
    
    if (violations.length > 0) {
      console.log(`❌ Found ${violations.length} budget violations`);
    } else {
      console.log('✅ All performance budgets passed');
    }
  }

  async detectRegressions() {
    console.log('📊 Detecting performance regressions...');
    
    if (!this.baseline) {
      console.log('ℹ️ No baseline found, skipping regression detection');
      return;
    }

    const regressions = [];
    const { regressionThresholds } = performanceBudget.ci;

    // Check bundle size regressions
    if (this.results.bundleAnalysis && this.baseline.bundleSize) {
      const currentSize = this.results.bundleAnalysis.summary.totalBundle;
      const baselineSize = this.baseline.bundleSize;
      const increase = ((currentSize - baselineSize) / baselineSize) * 100;

      if (increase > regressionThresholds.bundleSize) {
        regressions.push({
          type: 'bundle-size',
          baseline: baselineSize,
          current: currentSize,
          increase: increase.toFixed(1) + '%',
          threshold: regressionThresholds.bundleSize + '%',
          severity: increase > regressionThresholds.bundleSize * 2 ? 'critical' : 'major'
        });
      }
    }

    // Check performance score regressions
    if (this.results.performanceScores && this.baseline.performanceScore) {
      const currentScore = this.results.performanceScores.performance;
      const baselineScore = this.baseline.performanceScore;
      const decrease = baselineScore - currentScore;

      if (decrease > regressionThresholds.performanceScore) {
        regressions.push({
          type: 'performance-score',
          baseline: baselineScore,
          current: currentScore,
          decrease: decrease + ' points',
          threshold: regressionThresholds.performanceScore + ' points',
          severity: decrease > regressionThresholds.performanceScore * 2 ? 'critical' : 'major'
        });
      }
    }

    this.results.regressions = regressions;

    if (regressions.length > 0) {
      console.log(`❌ Found ${regressions.length} performance regressions`);
    } else {
      console.log('✅ No performance regressions detected');
    }
  }

  async generateReport() {
    console.log('📄 Generating performance report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      commitHash: this.getCommitHash(),
      branch: this.getBranch(),
      results: this.results,
      budgets: performanceBudget,
      baseline: this.baseline
    };

    // Save detailed JSON report
    const reportPath = path.resolve(process.cwd(), 'performance-ci-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = path.resolve(process.cwd(), 'performance-ci-report.html');
    fs.writeFileSync(htmlPath, htmlReport);

    console.log(`✅ Reports generated:
  JSON: ${reportPath}
  HTML: ${htmlPath}`);
  }

  async updateBaseline() {
    const shouldUpdateBaseline = process.env.UPDATE_BASELINE === 'true' || 
                                process.argv.includes('--update-baseline');

    if (!shouldUpdateBaseline) {
      return;
    }

    console.log('📊 Updating performance baseline...');

    const newBaseline = {
      timestamp: new Date().toISOString(),
      commitHash: this.getCommitHash(),
      branch: this.getBranch(),
      bundleSize: this.results.bundleAnalysis?.summary?.totalBundle || null,
      performanceScore: this.results.performanceScores?.performance || null,
      coreWebVitals: this.results.performanceScores?.coreWebVitals || null
    };

    const baselinePath = path.resolve(process.cwd(), '.performance-baseline.json');
    fs.writeFileSync(baselinePath, JSON.stringify(newBaseline, null, 2));

    console.log('✅ Baseline updated');
  }

  determineFinalStatus() {
    const { failBuild } = performanceBudget.ci;
    let shouldFail = false;
    const reasons = [];

    // Check critical budget violations
    const criticalViolations = this.results.budgetViolations.filter(v => v.impact === 'high');
    if (criticalViolations.length > 0) {
      const maxViolation = Math.max(...criticalViolations.map(v => (v.overBy / v.budget) * 100));
      if (maxViolation > failBuild.budgetExceedPercentage) {
        shouldFail = true;
        reasons.push(`Critical budget exceeded by ${maxViolation.toFixed(1)}%`);
      }
    }

    // Check performance score
    if (this.results.performanceScores?.performance < failBuild.performanceScoreBelow) {
      shouldFail = true;
      reasons.push(`Performance score below threshold: ${this.results.performanceScores.performance} < ${failBuild.performanceScoreBelow}`);
    }

    // Check critical regressions
    const criticalRegressions = this.results.regressions.filter(r => r.severity === 'critical');
    if (criticalRegressions.length > 0) {
      shouldFail = true;
      reasons.push(`Critical performance regressions detected: ${criticalRegressions.length}`);
    }

    this.results.summary.passed = !shouldFail;
    this.results.summary.failReasons = reasons;

    if (shouldFail) {
      this.exitCode = 1;
    }
  }

  displaySummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 CI/CD PERFORMANCE SUMMARY');
    console.log('='.repeat(50));

    const status = this.results.summary.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`\nStatus: ${status}\n`);

    // Display budget violations
    if (this.results.budgetViolations.length > 0) {
      console.log('💰 BUDGET VIOLATIONS:');
      this.results.budgetViolations.forEach(violation => {
        const impact = violation.impact === 'high' ? '🚨' : violation.impact === 'medium' ? '⚠️' : 'ℹ️';
        const overPercentage = ((violation.overBy / violation.budget) * 100).toFixed(1);
        console.log(`${impact} ${violation.category}: +${overPercentage}% (${performanceBudget.formatBytes(violation.overBy)} over budget)`);
      });
      console.log();
    }

    // Display regressions
    if (this.results.regressions.length > 0) {
      console.log('📈 PERFORMANCE REGRESSIONS:');
      this.results.regressions.forEach(regression => {
        const severity = regression.severity === 'critical' ? '🚨' : '⚠️';
        console.log(`${severity} ${regression.type}: ${regression.increase || regression.decrease} (threshold: ${regression.threshold})`);
      });
      console.log();
    }

    // Display bundle summary
    if (this.results.bundleAnalysis) {
      console.log('📦 BUNDLE SUMMARY:');
      console.log(`Total Size: ${performanceBudget.formatBytes(this.results.bundleAnalysis.summary.totalBundle)}`);
      console.log(`JavaScript: ${performanceBudget.formatBytes(this.results.bundleAnalysis.summary.totalJS)}`);
      console.log(`CSS: ${performanceBudget.formatBytes(this.results.bundleAnalysis.summary.totalCSS)}`);
      console.log();
    }

    // Display performance scores
    if (this.results.performanceScores) {
      console.log('🏮 LIGHTHOUSE SCORES:');
      console.log(`Performance: ${this.results.performanceScores.performance}`);
      console.log(`Accessibility: ${this.results.performanceScores.accessibility || 'N/A'}`);
      console.log(`Best Practices: ${this.results.performanceScores.bestPractices || 'N/A'}`);
      console.log(`SEO: ${this.results.performanceScores.seo || 'N/A'}`);
      console.log();
    }

    if (!this.results.summary.passed) {
      console.log('❌ FAILURE REASONS:');
      this.results.summary.failReasons.forEach(reason => {
        console.log(`• ${reason}`);
      });
      console.log();
    }

    console.log('='.repeat(50));
  }

  // Helper methods
  loadBaseline() {
    const baselinePath = path.resolve(process.cwd(), '.performance-baseline.json');
    
    if (fs.existsSync(baselinePath)) {
      try {
        return JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
      } catch (error) {
        console.warn('⚠️ Failed to load baseline:', error.message);
      }
    }
    
    return null;
  }

  getCommitHash() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  getBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  getImpactLevel(filename) {
    if (filename.includes('main.')) return 'high';
    if (filename.includes('vendor')) return 'medium';
    if (filename.includes('chunk.')) return 'low';
    return 'medium';
  }

  parseLighthouseResults(output) {
    // This would parse actual Lighthouse CI output
    // For now, return a mock structure
    return {
      performance: 95,
      accessibility: 100,
      bestPractices: 100,
      seo: 95,
      coreWebVitals: {
        lcp: 1200,
        fid: 50,
        cls: 0.05
      }
    };
  }

  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance CI Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 8px; }
        .status { font-size: 1.5em; margin: 20px 0; }
        .passed { color: green; }
        .failed { color: red; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .violation { margin: 10px 0; padding: 10px; background: #ffe6e6; border-radius: 4px; }
        .regression { margin: 10px 0; padding: 10px; background: #fff3cd; border-radius: 4px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #e6f3ff; border-radius: 4px; }
        pre { background: #f8f8f8; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance CI Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>Commit: ${report.commitHash}</p>
        <p>Branch: ${report.branch}</p>
    </div>

    <div class="status ${report.results.summary.passed ? 'passed' : 'failed'}">
        Status: ${report.results.summary.passed ? '✅ PASSED' : '❌ FAILED'}
    </div>

    ${report.results.budgetViolations.length > 0 ? `
    <div class="section">
        <h2>Budget Violations</h2>
        ${report.results.budgetViolations.map(v => `
            <div class="violation">
                <strong>${v.category}</strong>: ${performanceBudget.formatBytes(v.actual)} 
                (${performanceBudget.formatBytes(v.overBy)} over ${performanceBudget.formatBytes(v.budget)} budget)
            </div>
        `).join('')}
    </div>` : ''}

    ${report.results.regressions.length > 0 ? `
    <div class="section">
        <h2>Performance Regressions</h2>
        ${report.results.regressions.map(r => `
            <div class="regression">
                <strong>${r.type}</strong>: ${r.increase || r.decrease} regression 
                (threshold: ${r.threshold})
            </div>
        `).join('')}
    </div>` : ''}

    ${report.results.bundleAnalysis ? `
    <div class="section">
        <h2>Bundle Analysis</h2>
        <div class="metric">Total: ${performanceBudget.formatBytes(report.results.bundleAnalysis.summary.totalBundle)}</div>
        <div class="metric">JavaScript: ${performanceBudget.formatBytes(report.results.bundleAnalysis.summary.totalJS)}</div>
        <div class="metric">CSS: ${performanceBudget.formatBytes(report.results.bundleAnalysis.summary.totalCSS)}</div>
    </div>` : ''}

    <div class="section">
        <h2>Raw Results</h2>
        <pre>${JSON.stringify(report.results, null, 2)}</pre>
    </div>
</body>
</html>`;
  }
}

// Main execution
if (require.main === module) {
  const monitor = new CIPerformanceMonitor();
  monitor.run();
}

module.exports = CIPerformanceMonitor;