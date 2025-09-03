/**
 * ESLint Configuration - MVP Optimized
 * 
 * This configuration balances code quality with development velocity:
 * - Keeps critical security and error prevention rules
 * - Relaxes documentation requirements (can be re-enabled post-launch)
 * - Increases limits for file sizes and complexity for rapid prototyping
 * 
 * Key MVP Optimizations:
 * - JSDoc requirements: OFF (focus on functionality first)
 * - File size limit: 1000 lines (up from 500)  
 * - Complexity limit: 15 (up from 10)
 * - Async/await pedantic checks: relaxed
 */
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  plugins: [],
  rules: {
    // Security Rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Best Practices
    'no-console': ['warn', { allow: ['warn', 'error', 'info', 'group', 'groupEnd', 'table', 'debug'] }],
    'no-debugger': 'error',
    'no-alert': 'warn',
    'no-var': 'error',
    'prefer-const': 'error',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-multiple-empty-lines': ['error', { max: 1 }],
    'no-trailing-spaces': 'error',
    
    // Code Quality (MVP-relaxed)
    'complexity': ['warn', 15], // Increased from 10
    'max-depth': ['warn', 6],   // Increased from 4
    'max-lines': ['warn', 1000], // Increased from 500
    'max-params': ['warn', 6],  // Increased from 4
    'no-duplicate-imports': 'error',
    
    // Error Prevention (MVP-relaxed)
    'no-undef': 'warn',
    'no-unreachable': 'error',
    'no-unused-expressions': 'warn', // Relaxed from error
    'no-return-await': 'warn',       // Relaxed from error  
    'require-await': 'off',          // Turned off for MVP
    'no-empty': 'warn',
    'no-control-regex': 'warn',
    
    // Documentation (MVP-optimized: only for public APIs)
    'require-jsdoc': ['off'], // Turned off for MVP - focus on functionality
    'valid-jsdoc': ['off']    // Turned off for MVP - can add back post-launch
  },
  overrides: [
    {
      files: ['*.test.js', '*.spec.js'],
      rules: {
        'no-console': 'off',
        'max-lines': 'off'
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.min.js',
    'vendor/'
  ]
};