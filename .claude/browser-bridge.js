#!/usr/bin/env node

/**
 * Browser Bridge for Claude Code
 * Enables browser automation via Puppeteer
 * Based on OneRedOak workflow principles
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Command handlers
const commands = {
  /**
   * Take a screenshot of a page
   */
  async screenshot(args) {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Set viewport
    if (args.mobile) {
      await page.setViewport({ width: 375, height: 812 });
    } else {
      await page.setViewport({ width: 1280, height: 720 });
    }
    
    await page.goto(args.url, { waitUntil: 'networkidle2' });
    
    const outputPath = args.output || 'screenshot.png';
    await page.screenshot({ 
      path: outputPath,
      fullPage: args.fullPage === 'true'
    });
    
    await browser.close();
    return { success: true, path: outputPath };
  },

  /**
   * Test mobile responsiveness
   */
  async testMobile(args) {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    const devices = [
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'iPad', width: 768, height: 1024 },
      { name: 'Pixel 5', width: 393, height: 851 }
    ];
    
    const results = [];
    
    for (const device of devices) {
      await page.setViewport({ width: device.width, height: device.height });
      await page.goto(args.url, { waitUntil: 'networkidle2' });
      
      const screenshot = `mobile-${device.name.replace(' ', '-')}.png`;
      await page.screenshot({ path: screenshot });
      
      results.push({
        device: device.name,
        screenshot,
        viewport: `${device.width}x${device.height}`
      });
    }
    
    await browser.close();
    return { success: true, results };
  },

  /**
   * Check for console errors
   */
  async checkConsole(args) {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    const consoleLogs = [];
    const errors = [];
    
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        errors.push(text);
      }
      
      consoleLogs.push({ type, text });
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.goto(args.url, { waitUntil: 'networkidle2' });
    
    await browser.close();
    
    return {
      success: errors.length === 0,
      consoleLogs,
      errors,
      errorCount: errors.length
    };
  },

  /**
   * Get performance metrics
   */
  async getMetrics(args) {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    await page.goto(args.url, { waitUntil: 'networkidle2' });
    
    const metrics = await page.metrics();
    
    // Get more detailed performance data
    const performanceData = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime
      };
    });
    
    await browser.close();
    
    return {
      success: true,
      metrics,
      performance: performanceData,
      summary: {
        heapUsed: `${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`,
        loadTime: `${performanceData.loadComplete}ms`,
        firstPaint: `${performanceData.firstPaint}ms`
      }
    };
  },

  /**
   * Run accessibility audit
   */
  async checkAccessibility(args) {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    await page.goto(args.url, { waitUntil: 'networkidle2' });
    
    // Check for ARIA labels
    const missingAria = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const inputs = document.querySelectorAll('input');
      const missing = [];
      
      buttons.forEach(btn => {
        if (!btn.getAttribute('aria-label') && !btn.getAttribute('aria-labelledby')) {
          missing.push({
            element: 'button',
            text: btn.textContent.trim(),
            issue: 'Missing ARIA label'
          });
        }
      });
      
      inputs.forEach(input => {
        if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby') && !input.id) {
          missing.push({
            element: 'input',
            type: input.type,
            issue: 'Missing ARIA label or ID'
          });
        }
      });
      
      return missing;
    });
    
    // Check color contrast (simplified)
    const contrastIssues = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const issues = [];
      
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const bgColor = style.backgroundColor;
        const color = style.color;
        
        // This is a simplified check - real contrast calculation would be more complex
        if (bgColor && color && bgColor !== 'rgba(0, 0, 0, 0)') {
          // Check if text is too light on light background
          if (color.includes('rgb(200') || color.includes('rgb(210') || color.includes('rgb(220')) {
            if (bgColor.includes('rgb(200') || bgColor.includes('rgb(210') || bgColor.includes('rgb(220')) {
              issues.push({
                element: el.tagName.toLowerCase(),
                issue: 'Potential contrast issue'
              });
            }
          }
        }
      });
      
      return issues.slice(0, 5); // Limit to first 5 issues
    });
    
    // Check for alt text on images
    const missingAlt = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const missing = [];
      
      images.forEach(img => {
        if (!img.getAttribute('alt')) {
          missing.push({
            src: img.src,
            issue: 'Missing alt text'
          });
        }
      });
      
      return missing;
    });
    
    await browser.close();
    
    return {
      success: missingAria.length === 0 && missingAlt.length === 0,
      issues: {
        aria: missingAria,
        contrast: contrastIssues,
        images: missingAlt
      },
      summary: {
        ariaIssues: missingAria.length,
        contrastIssues: contrastIssues.length,
        imageIssues: missingAlt.length,
        total: missingAria.length + contrastIssues.length + missingAlt.length
      }
    };
  },

  /**
   * Test user interactions
   */
  async testInteraction(args) {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    await page.goto(args.url, { waitUntil: 'networkidle2' });
    
    const results = [];
    
    // Test clicking on aspect cards
    const aspectCards = await page.$$('.aspect-card');
    if (aspectCards.length > 0) {
      await aspectCards[0].click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const isSelected = await page.evaluate(() => {
        return document.querySelector('.aspect-card')?.classList.contains('selected');
      });
      
      results.push({
        test: 'Aspect card selection',
        success: isSelected,
        message: isSelected ? 'Card selects properly' : 'Card selection failed'
      });
    }
    
    // Test form input
    const hotelInput = await page.$('#hotel-name');
    if (hotelInput) {
      await hotelInput.type('Test Hotel');
      const value = await page.evaluate(() => document.querySelector('#hotel-name')?.value);
      
      results.push({
        test: 'Hotel name input',
        success: value === 'Test Hotel',
        message: value === 'Test Hotel' ? 'Input works' : 'Input failed'
      });
    }
    
    // Test generate button
    const generateBtn = await page.$('#generate-btn');
    if (generateBtn) {
      await generateBtn.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const outputVisible = await page.evaluate(() => {
        const output = document.querySelector('#review-output');
        return output && !output.classList.contains('hidden');
      });
      
      results.push({
        test: 'Generate button',
        success: outputVisible,
        message: outputVisible ? 'Button generates output' : 'Generation failed'
      });
    }
    
    await browser.close();
    
    return {
      success: results.every(r => r.success),
      results,
      summary: `${results.filter(r => r.success).length}/${results.length} tests passed`
    };
  },

  /**
   * Check page elements exist
   */
  async checkElements(args) {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    await page.goto(args.url, { waitUntil: 'networkidle2' });
    
    const elements = args.elements ? args.elements.split(',') : [
      '#hotel-name',
      '#generate-btn',
      '.aspect-card',
      '#comments',
      '#review-output'
    ];
    
    const results = [];
    
    for (const selector of elements) {
      const exists = await page.$(selector) !== null;
      results.push({
        selector,
        exists,
        message: exists ? `Found ${selector}` : `Missing ${selector}`
      });
    }
    
    await browser.close();
    
    return {
      success: results.every(r => r.exists),
      results,
      summary: `${results.filter(r => r.exists).length}/${results.length} elements found`
    };
  },

  /**
   * Compare visual regression
   */
  async compareVisual(args) {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(args.url, { waitUntil: 'networkidle2' });
    
    const baselinePath = args.baseline || 'baseline.png';
    const currentPath = args.current || 'current.png';
    
    // Take current screenshot
    await page.screenshot({ path: currentPath });
    
    // Check if baseline exists
    const baselineExists = await fs.access(baselinePath).then(() => true).catch(() => false);
    
    if (!baselineExists) {
      // Create baseline
      await fs.copyFile(currentPath, baselinePath);
      await browser.close();
      return {
        success: true,
        message: 'Baseline created',
        baseline: baselinePath
      };
    }
    
    // In a real implementation, we'd compare pixels here
    // For now, just check file sizes as a simple comparison
    const baselineStats = await fs.stat(baselinePath);
    const currentStats = await fs.stat(currentPath);
    
    const sizeDiff = Math.abs(baselineStats.size - currentStats.size);
    const percentDiff = (sizeDiff / baselineStats.size) * 100;
    
    await browser.close();
    
    return {
      success: percentDiff < 10, // Less than 10% difference
      baseline: baselinePath,
      current: currentPath,
      difference: `${percentDiff.toFixed(2)}%`,
      message: percentDiff < 10 ? 'Visual regression passed' : 'Visual changes detected'
    };
  }
};

// Main execution
async function main() {
  const [,, command, ...args] = process.argv;
  
  if (!command || !commands[command]) {
    console.log(JSON.stringify({
      error: 'Invalid command',
      availableCommands: Object.keys(commands),
      usage: 'node browser-bridge.js <command> url=<url> [options]'
    }, null, 2));
    process.exit(1);
  }
  
  // Parse arguments
  const parsedArgs = {};
  args.forEach(arg => {
    const [key, ...valueParts] = arg.split('=');
    parsedArgs[key] = valueParts.join('=');
  });
  
  if (!parsedArgs.url && command !== 'compareVisual') {
    // Default to local file
    parsedArgs.url = `file://${path.resolve(__dirname, '../src/ultimate-ux-enhanced.html')}`;
  }
  
  try {
    const result = await commands[command](parsedArgs);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.log(JSON.stringify({
      error: error.message,
      stack: error.stack
    }, null, 2));
    process.exit(1);
  }
}

main();