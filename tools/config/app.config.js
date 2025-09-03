module.exports = {
  app: {
    name: 'MVP Hotel Review System',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },
  paths: {
    public: './public',
    src: './src',
    tests: './tests',
    docs: './docs',
    archive: './archive'
  },
  build: {
    outputDir: './dist',
    minify: true,
    sourceMaps: true,
    target: 'es2020'
  },
  features: {
    pwa: true,
    offline: true,
    analytics: true,
    errorTracking: true
  }
};