# How to Achieve Playwright/Browser Automation MCP Integration

## 🎯 The Reality of Browser Automation in Claude Code

After thorough investigation, here's what we need to understand about browser automation with Claude:

## Option 1: Puppeteer MCP Server (Most Realistic)

The MCP ecosystem includes a **Puppeteer** server (similar to Playwright) for browser automation. Here's how to set it up:

### Step 1: Install the MCP Puppeteer Server

```bash
# Clone the MCP servers repository
git clone https://github.com/modelcontextprotocol/servers.git
cd servers

# Navigate to puppeteer server
cd src/puppeteer

# Install dependencies
npm install

# Build the server
npm run build
```

### Step 2: Configure Claude Desktop

You need to add the Puppeteer MCP server to Claude's configuration:

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json (Mac)
// or %APPDATA%/Claude/claude_desktop_config.json (Windows)
{
  "mcpServers": {
    "puppeteer": {
      "command": "node",
      "args": ["/path/to/mcp-servers/src/puppeteer/dist/index.js"],
      "env": {}
    }
  }
}
```

### Step 3: Restart Claude Desktop

After adding the configuration, restart Claude Desktop to load the MCP server.

### Step 4: Use Browser Automation Commands

Once configured, you'll have access to commands like:
- `mcp_puppeteer_navigate`
- `mcp_puppeteer_screenshot`
- `mcp_puppeteer_click`
- `mcp_puppeteer_type`
- `mcp_puppeteer_evaluate`

## Option 2: Web Scraping MCP (Alternative)

There's also a web scraping MCP that might be available:

```bash
# Install via npm
npm install -g @modelcontextprotocol/server-webscraper

# Add to Claude config
{
  "mcpServers": {
    "webscraper": {
      "command": "mcp-server-webscraper"
    }
  }
}
```

## Option 3: Create Custom Browser Automation (What We Can Do NOW)

Since MCP server configuration requires Claude Desktop app configuration (not available in CLI), here's what we CAN implement immediately:

### A. Headless Browser Testing with Puppeteer Directly

```bash
# Install Puppeteer in your project
npm install puppeteer
```

```javascript
// .claude/browser-tests/visual-test.js
const puppeteer = require('puppeteer');
const fs = require('fs');

async function runVisualTests() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport for mobile testing
  await page.setViewport({ width: 375, height: 812 });
  
  // Navigate to local file
  await page.goto(`file://${__dirname}/../../src/ultimate-ux-enhanced.html`);
  
  // Wait for content to load
  await page.waitForSelector('#hotel-name');
  
  // Take screenshots
  await page.screenshot({ path: 'mobile-view.png' });
  
  // Test interactions
  await page.click('.aspect-card:first-child');
  await page.screenshot({ path: 'after-interaction.png' });
  
  // Get console logs
  page.on('console', msg => console.log('Console:', msg.text()));
  
  // Check for errors
  page.on('error', err => console.error('Error:', err));
  
  // Run accessibility audit
  const accessibility = await page.accessibility.snapshot();
  console.log('Accessibility tree:', accessibility);
  
  // Get performance metrics
  const metrics = await page.metrics();
  console.log('Performance metrics:', metrics);
  
  await browser.close();
  
  return {
    screenshots: ['mobile-view.png', 'after-interaction.png'],
    metrics,
    accessibility
  };
}

// Run the tests
runVisualTests().then(results => {
  console.log('Visual tests completed:', results);
});
```

### B. Create a Bridge Script for Claude

```javascript
// .claude/browser-bridge.js
#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

// This script acts as a bridge between Claude and Puppeteer
async function executeBrowserCommand(command, args) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  let result;
  
  switch(command) {
    case 'screenshot':
      await page.goto(args.url);
      result = await page.screenshot({ path: args.output });
      break;
      
    case 'test-mobile':
      await page.setViewport({ width: 375, height: 812 });
      await page.goto(args.url);
      result = await page.screenshot({ path: 'mobile-test.png' });
      break;
      
    case 'get-metrics':
      await page.goto(args.url);
      result = await page.metrics();
      break;
      
    case 'check-accessibility':
      await page.goto(args.url);
      result = await page.accessibility.snapshot();
      break;
      
    case 'console-logs':
      const logs = [];
      page.on('console', msg => logs.push(msg.text()));
      await page.goto(args.url);
      result = logs;
      break;
  }
  
  await browser.close();
  return result;
}

// Parse command line arguments
const [,, command, ...args] = process.argv;
const parsedArgs = {};
args.forEach(arg => {
  const [key, value] = arg.split('=');
  parsedArgs[key] = value;
});

// Execute and output results
executeBrowserCommand(command, parsedArgs)
  .then(result => console.log(JSON.stringify(result, null, 2)))
  .catch(err => console.error('Error:', err));
```

### C. Use the Bridge from Claude

```bash
# Make the bridge executable
chmod +x .claude/browser-bridge.js

# Use it in Claude commands
node .claude/browser-bridge.js screenshot url=http://localhost:3000 output=screenshot.png
node .claude/browser-bridge.js test-mobile url=http://localhost:3000
node .claude/browser-bridge.js get-metrics url=http://localhost:3000
```

## Option 4: Playwright Direct Integration (Without MCP)

```bash
# Install Playwright
npm install playwright

# Install browsers
npx playwright install
```

```javascript
// .claude/playwright-tests/e2e-test.js
const { chromium, devices } = require('playwright');

async function runE2ETests() {
  // Launch browser
  const browser = await chromium.launch();
  
  // Test on iPhone 12
  const context = await browser.newContext({
    ...devices['iPhone 12'],
  });
  
  const page = await context.newPage();
  
  // Start tracing for debugging
  await context.tracing.start({ screenshots: true, snapshots: true });
  
  // Navigate to app
  await page.goto('http://localhost:3000');
  
  // Test user flow
  await page.click('.aspect-card:first-child');
  await page.fill('#hotel-name', 'Test Hotel');
  await page.click('#generate-btn');
  
  // Wait for result
  await page.waitForSelector('#review-output');
  
  // Take screenshot
  await page.screenshot({ path: 'e2e-test.png', fullPage: true });
  
  // Stop tracing
  await context.tracing.stop({ path: 'trace.zip' });
  
  await browser.close();
}

runE2ETests();
```

## 🎯 Recommended Approach for NOW

Since MCP server configuration requires access to Claude Desktop's config file (which may not be accessible from CLI), here's the pragmatic approach:

### 1. Install Puppeteer/Playwright Locally
```bash
cd /Users/chrism/MVP_Hotel
npm install puppeteer playwright
```

### 2. Create Test Scripts
```bash
mkdir -p .claude/browser-tests
touch .claude/browser-tests/visual.js
touch .claude/browser-tests/accessibility.js
touch .claude/browser-tests/performance.js
```

### 3. Create Wrapper Commands
```bash
# .claude/commands/browser-test.sh
#!/bin/bash

echo "🌐 Running Browser Tests..."

# Start local server
python3 -m http.server 8000 &
SERVER_PID=$!

# Wait for server
sleep 2

# Run Puppeteer tests
node .claude/browser-tests/visual.js
node .claude/browser-tests/accessibility.js
node .claude/browser-tests/performance.js

# Kill server
kill $SERVER_PID

echo "✅ Browser tests complete"
```

### 4. Integrate with Claude Workflows
```javascript
// Use Bash tool to run browser tests
await claude.bash('npm run browser-test');

// Read the results
const screenshots = await claude.read('.claude/test-results/screenshots.json');
const metrics = await claude.read('.claude/test-results/metrics.json');

// Analyze results
const issues = analyzeResults(screenshots, metrics);
```

## Summary

**The Truth:** Full Playwright MCP integration requires:
1. Claude Desktop app (not CLI)
2. Access to app configuration file
3. Running MCP servers locally

**What We Can Do:** 
1. Install Puppeteer/Playwright directly in the project
2. Create bridge scripts that Claude can call via Bash
3. Build our own browser testing automation
4. Get 90% of the benefits without waiting for full MCP support

**The Path Forward:**
Start with Option 3 (Custom Browser Automation) - it works TODAY and gives us the browser testing capabilities we need!