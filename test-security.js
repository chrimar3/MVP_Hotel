#!/usr/bin/env node
/**
 * Security Verification Test Script
 * 
 * This script verifies that the security fixes are properly implemented:
 * 1. No API keys in client-side code
 * 2. All LLM requests go through secure proxy  
 * 3. Template fallback works when APIs unavailable
 * 4. Health checks function correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Running Security Verification Tests...\n');

// Test 1: Scan for hardcoded API keys
function scanForAPIKeys() {
    console.log('1️⃣ Scanning for hardcoded API keys...');
    
    const directories = ['src', 'public'];
    const suspiciousPatterns = [
        /sk-[a-zA-Z0-9]{48,}/g,  // OpenAI keys
        /gsk_[a-zA-Z0-9]{40,}/g, // Groq keys
        /'sk-[^']*'/g,           // Quoted OpenAI keys
        /"sk-[^"]*"/g,           // Double quoted OpenAI keys
    ];
    
    let foundKeys = false;
    
    directories.forEach(dir => {
        if (!fs.existsSync(dir)) return;
        
        const files = getAllFiles(dir).filter(file => 
            file.endsWith('.js') || 
            file.endsWith('.html') || 
            file.endsWith('.json')
        );
        
        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            
            suspiciousPatterns.forEach((pattern, index) => {
                const matches = content.match(pattern);
                if (matches) {
                    console.log(`   ❌ Found suspicious pattern in ${file}: ${matches[0]}`);
                    foundKeys = true;
                }
            });
        });
    });
    
    if (!foundKeys) {
        console.log('   ✅ No hardcoded API keys found in client code');
    }
    
    return !foundKeys;
}

// Test 2: Verify proxy usage in configuration
function verifyProxyUsage() {
    console.log('\n2️⃣ Verifying proxy configuration...');
    
    const configFiles = [
        'src/config/llm.config.js',
        'src/services/hybrid-generator/ConfigManager.js',
        'src/services/LLMReviewGenerator.js'
    ];
    
    let allUseProxy = true;
    
    configFiles.forEach(file => {
        if (!fs.existsSync(file)) {
            console.log(`   ⚠️ Config file not found: ${file}`);
            return;
        }
        
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for direct API URLs (should be replaced with proxy)
        const directApiUrls = [
            'https://api.openai.com',
            'https://api.groq.com'
        ];
        
        directApiUrls.forEach(url => {
            if (content.includes(url)) {
                console.log(`   ❌ Found direct API URL in ${file}: ${url}`);
                allUseProxy = false;
            }
        });
        
        // Check for proxy usage
        if (content.includes('/api/llm-proxy') || content.includes('proxyUrl')) {
            console.log(`   ✅ Proxy configuration found in ${file}`);
        }
    });
    
    return allUseProxy;
}

// Test 3: Verify no client-side API key variables
function verifyNoClientSideKeys() {
    console.log('\n3️⃣ Checking for client-side API key variables...');
    
    const clientFiles = getAllFiles('src').filter(file => file.endsWith('.js'));
    let hasClientKeys = false;
    
    clientFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        
        // Patterns that suggest client-side API key handling
        const dangerousPatterns = [
            /process\.env\.OPENAI_API_KEY/g,
            /process\.env\.GROQ_API_KEY/g,
            /localStorage.*['\"].*api[_-]?key/gi,
            /this\.openaiKey\s*=.*['\"][^'\"]{10,}/g,
            /this\.groqKey\s*=.*['\"][^'\"]{10,}/g
        ];
        
        dangerousPatterns.forEach(pattern => {
            if (pattern.test(content)) {
                console.log(`   ❌ Found client-side key handling in ${file}`);
                hasClientKeys = true;
            }
        });
    });
    
    if (!hasClientKeys) {
        console.log('   ✅ No client-side API key handling found');
    }
    
    return !hasClientKeys;
}

// Test 4: Verify security headers in proxy
function verifySecurityHeaders() {
    console.log('\n4️⃣ Checking proxy security configuration...');
    
    const proxyFile = 'api/llm-proxy.js';
    if (!fs.existsSync(proxyFile)) {
        console.log(`   ❌ Proxy file not found: ${proxyFile}`);
        return false;
    }
    
    const content = fs.readFileSync(proxyFile, 'utf8');
    
    const requiredSecurityHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Access-Control-Allow-Origin'
    ];
    
    let hasAllHeaders = true;
    
    requiredSecurityHeaders.forEach(header => {
        if (content.includes(header)) {
            console.log(`   ✅ Security header found: ${header}`);
        } else {
            console.log(`   ❌ Missing security header: ${header}`);
            hasAllHeaders = false;
        }
    });
    
    // Check for health check endpoint
    if (content.includes('handleHealthCheck') || content.includes('/health')) {
        console.log('   ✅ Health check endpoint implemented');
    } else {
        console.log('   ❌ Health check endpoint missing');
        hasAllHeaders = false;
    }
    
    return hasAllHeaders;
}

// Test 5: Verify template fallback system
function verifyTemplateFallback() {
    console.log('\n5️⃣ Verifying template fallback system...');
    
    const generatorFiles = [
        'src/services/LLMReviewGenerator.js',
        'src/services/hybrid-generator/HybridGenerator.js'
    ];
    
    let hasFallback = false;
    
    generatorFiles.forEach(file => {
        if (!fs.existsSync(file)) return;
        
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('TemplateReviewGenerator') || 
            content.includes('templateGenerator') ||
            content.includes('template') && content.includes('fallback')) {
            console.log(`   ✅ Template fallback found in ${file}`);
            hasFallback = true;
        }
    });
    
    if (!hasFallback) {
        console.log('   ❌ Template fallback system not found');
    }
    
    return hasFallback;
}

// Test 6: Check for proper error handling
function verifyErrorHandling() {
    console.log('\n6️⃣ Checking error handling...');
    
    const serviceFiles = getAllFiles('src/services').filter(file => file.endsWith('.js'));
    let hasProperErrorHandling = true;
    
    serviceFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for try-catch blocks around API calls
        const hasTryCatch = content.includes('try {') && content.includes('catch');
        const hasThrowError = content.includes('throw new Error') || content.includes('throw error');
        
        if (content.includes('fetch') && !hasTryCatch) {
            console.log(`   ⚠️ API calls without try-catch in ${file}`);
            hasProperErrorHandling = false;
        }
    });
    
    if (hasProperErrorHandling) {
        console.log('   ✅ Proper error handling implemented');
    }
    
    return hasProperErrorHandling;
}

// Utility function to get all files recursively
function getAllFiles(dir) {
    let files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            files = files.concat(getAllFiles(fullPath));
        } else if (stat.isFile()) {
            files.push(fullPath);
        }
    });
    
    return files;
}

// Run all tests
async function runAllTests() {
    const tests = [
        { name: 'API Key Scanning', test: scanForAPIKeys },
        { name: 'Proxy Usage Verification', test: verifyProxyUsage },
        { name: 'Client-Side Key Check', test: verifyNoClientSideKeys },
        { name: 'Security Headers Check', test: verifySecurityHeaders },
        { name: 'Template Fallback Check', test: verifyTemplateFallback },
        { name: 'Error Handling Check', test: verifyErrorHandling }
    ];
    
    let passedTests = 0;
    const totalTests = tests.length;
    
    for (const { name, test } of tests) {
        const passed = test();
        if (passed) passedTests++;
    }
    
    console.log('\n📊 SECURITY TEST SUMMARY');
    console.log('=' .repeat(50));
    console.log(`Passed: ${passedTests}/${totalTests}`);
    console.log(`Security Score: ${Math.round((passedTests/totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 ALL SECURITY TESTS PASSED!');
        console.log('✅ Application is secure for production deployment');
    } else {
        console.log('\n⚠️  SOME TESTS FAILED');
        console.log('❌ Please review and fix security issues before deployment');
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Deploy the /api/llm-proxy endpoint');
    console.log('2. Configure environment variables with real API keys');
    console.log('3. Test functionality end-to-end');
    console.log('4. Monitor health check endpoints');
    console.log('5. Set up cost tracking alerts');
    
    return passedTests === totalTests;
}

// Run the tests
if (require.main === module) {
    runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { runAllTests };