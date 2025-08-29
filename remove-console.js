#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Directories to process
const directories = ['src/services', 'src/components', 'src/models', 'src/views'];

// Function to remove console statements
function removeConsoleStatements(content) {
    // Remove console.log, console.warn, console.error, console.info, console.debug
    // But keep console.error in catch blocks for error handling
    return content
        // Remove standalone console statements
        .replace(/^\s*console\.(log|info|debug|warn)\(.*?\);?\s*$/gm, '')
        // Remove console statements in if blocks
        .replace(/if\s*\([^)]*\)\s*{\s*console\.(log|info|debug|warn)\(.*?\);\s*}/g, '')
        // Keep console.error in catch blocks but comment them for production
        .replace(/(catch.*?{\s*)(console\.error\()/gm, '$1// Production: $2');
}

// Function to remove TODO comments
function removeTodoComments(content) {
    return content
        .replace(/\/\/\s*TODO:.*$/gm, '')
        .replace(/\/\*\s*TODO:[\s\S]*?\*\//gm, '');
}

// Process a file
function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // Remove console statements
        content = removeConsoleStatements(content);
        
        // Remove TODO comments
        content = removeTodoComments(content);
        
        // Only write if content changed
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ Processed: ${filePath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Walk through directories
function walkDir(dir) {
    let processedCount = 0;
    
    try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                processedCount += walkDir(filePath);
            } else if (file.endsWith('.js') && !file.includes('.test.')) {
                if (processFile(filePath)) {
                    processedCount++;
                }
            }
        }
    } catch (error) {
        console.error(`✗ Error walking directory ${dir}:`, error.message);
    }
    
    return processedCount;
}

// Main execution
console.log('🧹 Removing console statements and TODO comments from production code...\n');

let totalProcessed = 0;

for (const dir of directories) {
    if (fs.existsSync(dir)) {
        console.log(`Processing ${dir}...`);
        totalProcessed += walkDir(dir);
    }
}

console.log(`\n✅ Complete! Processed ${totalProcessed} files.`);
console.log('Note: console.error statements in catch blocks have been commented for production.');