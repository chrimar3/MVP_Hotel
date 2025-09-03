#!/usr/bin/env node
/**
 * Developer Environment Setup Script
 * 
 * This script automates the setup of the development environment,
 * ensuring all dependencies, configurations, and tools are properly installed.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class DevSetup {
  constructor() {
    this.rootDir = path.resolve(__dirname, '../..');
    this.log = this.createLogger();
  }

  createLogger() {
    return {
      info: (msg) => console.log(`ℹ️  ${msg}`),
      success: (msg) => console.log(`✅ ${msg}`),
      error: (msg) => console.error(`❌ ${msg}`),
      warning: (msg) => console.warn(`⚠️  ${msg}`),
      step: (msg) => console.log(`🚀 ${msg}\n`)
    };
  }

  async run() {
    try {
      this.log.step('Setting up Hotel Reviews AI development environment...');
      
      await this.checkPrerequisites();
      await this.setupEnvironment();
      await this.installDependencies();
      await this.setupGitHooks();
      await this.runInitialTests();
      await this.setupIDEConfiguration();
      
      this.log.success('Development environment setup completed successfully!');
      this.printNextSteps();
      
    } catch (error) {
      this.log.error(`Setup failed: ${error.message}`);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    this.log.step('Checking prerequisites...');
    
    const requirements = [
      { command: 'node --version', name: 'Node.js', minVersion: 'v18' },
      { command: 'npm --version', name: 'npm', minVersion: '9' },
      { command: 'git --version', name: 'Git', required: true }
    ];

    for (const req of requirements) {
      try {
        const version = execSync(req.command, { encoding: 'utf8' }).trim();
        
        if (req.minVersion && !this.isVersionCompatible(version, req.minVersion)) {
          throw new Error(`${req.name} version ${version} is below minimum required ${req.minVersion}`);
        }
        
        this.log.success(`${req.name}: ${version}`);
      } catch (error) {
        if (req.required) {
          throw new Error(`${req.name} is required but not installed`);
        }
        this.log.warning(`${req.name} not found - some features may not work`);
      }
    }
  }

  isVersionCompatible(current, minimum) {
    const currentParts = current.replace('v', '').split('.').map(Number);
    const minimumParts = minimum.replace('v', '').split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, minimumParts.length); i++) {
      const cur = currentParts[i] || 0;
      const min = minimumParts[i] || 0;
      
      if (cur > min) return true;
      if (cur < min) return false;
    }
    return true;
  }

  async setupEnvironment() {
    this.log.step('Setting up environment configuration...');
    
    const envFile = path.join(this.rootDir, '.env.local');
    const envExample = path.join(this.rootDir, '.env.example');
    
    if (!fs.existsSync(envFile) && fs.existsSync(envExample)) {
      fs.copyFileSync(envExample, envFile);
      this.log.success('Created .env.local from template');
      this.log.info('Please update .env.local with your configuration values');
    } else if (fs.existsSync(envFile)) {
      this.log.info('.env.local already exists');
    }
  }

  async installDependencies() {
    this.log.step('Installing dependencies...');
    
    this.execCommand('npm ci', 'Installing root dependencies');
    
    // Install playwright browsers if not already installed
    try {
      this.execCommand('npx playwright install --with-deps', 'Installing Playwright browsers');
    } catch (error) {
      this.log.warning('Failed to install Playwright browsers - E2E tests may not work');
    }
    
    this.log.success('Dependencies installed successfully');
  }

  async setupGitHooks() {
    this.log.step('Setting up Git hooks...');
    
    try {
      // Install husky if not already set up
      if (!fs.existsSync(path.join(this.rootDir, '.husky'))) {
        this.execCommand('npx husky install', 'Installing Husky');
        this.execCommand('npx husky add .husky/pre-commit "npx lint-staged"', 'Setting up pre-commit hook');
        this.execCommand('npx husky add .husky/commit-msg "npx commitlint --edit $1"', 'Setting up commit-msg hook');
      }
      this.log.success('Git hooks configured');
    } catch (error) {
      this.log.warning('Failed to setup Git hooks - commit validation may not work');
    }
  }

  async runInitialTests() {
    this.log.step('Running initial test suite to verify setup...');
    
    try {
      // Run linting
      this.execCommand('npm run lint', 'Running ESLint');
      
      // Run unit tests
      this.execCommand('npm run test:ci', 'Running unit tests');
      
      this.log.success('Initial tests passed');
    } catch (error) {
      this.log.warning('Some tests failed - please check the output above');
    }
  }

  async setupIDEConfiguration() {
    this.log.step('Setting up IDE configuration...');
    
    const vscodeDir = path.join(this.rootDir, '.vscode');
    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir, { recursive: true });
    }

    // VS Code settings
    const vscodeSettings = {
      "typescript.preferences.importModuleSpecifier": "relative",
      "editor.formatOnSave": true,
      "editor.defaultFormatter": "esbenp.prettier-vscode",
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
      },
      "files.exclude": {
        "**/node_modules": true,
        "**/dist": true,
        "**/coverage": true
      },
      "search.exclude": {
        "**/node_modules": true,
        "**/dist": true,
        "**/coverage": true,
        "**/*.min.js": true
      }
    };

    fs.writeFileSync(
      path.join(vscodeDir, 'settings.json'),
      JSON.stringify(vscodeSettings, null, 2)
    );

    // VS Code extensions recommendations
    const extensions = {
      "recommendations": [
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "ms-vscode.vscode-typescript-next",
        "bradlc.vscode-tailwindcss",
        "ms-playwright.playwright",
        "ms-vscode.test-adapter-converter"
      ]
    };

    fs.writeFileSync(
      path.join(vscodeDir, 'extensions.json'),
      JSON.stringify(extensions, null, 2)
    );

    this.log.success('IDE configuration created');
  }

  execCommand(command, description) {
    try {
      this.log.info(description || command);
      execSync(command, { 
        cwd: this.rootDir,
        stdio: 'inherit'
      });
    } catch (error) {
      throw new Error(`Command failed: ${command}`);
    }
  }

  printNextSteps() {
    console.log('\n🎉 Setup Complete! Next steps:\n');
    console.log('1. Start the development server:');
    console.log('   npm run dev\n');
    console.log('2. Run tests:');
    console.log('   npm test\n');
    console.log('3. Build for production:');
    console.log('   npm run build\n');
    console.log('4. Open http://localhost:3000 in your browser\n');
    console.log('📖 Documentation: ./docs/');
    console.log('🐛 Issues: https://github.com/chrimar3/MVP_Hotel/issues\n');
  }
}

// Run setup if called directly
if (require.main === module) {
  new DevSetup().run();
}

module.exports = DevSetup;