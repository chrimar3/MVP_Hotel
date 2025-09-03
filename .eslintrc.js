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
    
    // Code Quality
    'complexity': ['warn', 10],
    'max-depth': ['warn', 4],
    'max-lines': ['warn', 500],
    'max-params': ['warn', 4],
    'no-duplicate-imports': 'error',
    
    // Error Prevention
    'no-undef': 'warn',
    'no-unreachable': 'error',
    'no-unused-expressions': 'error',
    'no-return-await': 'error',
    'require-await': 'warn',
    'no-empty': 'warn',
    'no-control-regex': 'warn',
    
    // Documentation
    'require-jsdoc': ['warn', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true
      }
    }],
    'valid-jsdoc': ['warn', {
      requireReturn: false,
      requireParamDescription: true,
      requireReturnDescription: true
    }]
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