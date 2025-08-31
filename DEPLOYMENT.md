# Deployment Guide

This guide provides comprehensive instructions for deploying the Hotel Review Generator MVP to various platforms and environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Platforms](#deployment-platforms)
  - [Netlify](#netlify-deployment)
  - [GitHub Pages](#github-pages-deployment)
  - [Vercel](#vercel-deployment)
  - [AWS S3 + CloudFront](#aws-deployment)
  - [Docker](#docker-deployment)
  - [Traditional Server](#traditional-server-deployment)
- [Environment Configuration](#environment-configuration)
- [Performance Optimization](#performance-optimization)
- [Security Hardening](#security-hardening)
- [Monitoring & Analytics](#monitoring--analytics)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

1. **Source Code**: Clone the repository
   ```bash
   git clone https://github.com/chrimar3/MVP_Hotel.git
   cd MVP_Hotel
   ```

2. **Dependencies Installed**: 
   ```bash
   npm install
   ```

3. **Tests Passing**:
   ```bash
   npm test
   npm run test:e2e
   ```

4. **Build Verification**:
   ```bash
   npm run build
   ```

## Deployment Platforms

### Netlify Deployment

Netlify offers the easiest deployment with automatic CI/CD, SSL, and CDN.

#### Method 1: One-Click Deploy
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/chrimar3/MVP_Hotel)

#### Method 2: Manual Deploy via UI
1. Visit [app.netlify.com](https://app.netlify.com)
2. Drag and drop your project folder
3. Configure domain and SSL settings

#### Method 3: CLI Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to production
netlify deploy --prod --dir=.

# Deploy preview
netlify deploy --dir=.
```

#### Method 4: Continuous Deployment
1. Connect GitHub repository in Netlify dashboard
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `/`
   - Environment variables: Set as needed

#### Netlify Configuration
The project includes `netlify.toml` with optimized settings:
```toml
[build]
  publish = "/"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Content-Security-Policy = "..."
```

### GitHub Pages Deployment

GitHub Pages provides free hosting directly from your repository.

#### Automatic Deployment
The project includes GitHub Actions workflow for automatic deployment:

1. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` (created automatically)

2. **Push to Main Branch**:
   ```bash
   git push origin main
   ```
   
3. **Monitor Deployment**:
   - Check Actions tab for build status
   - Access at: `https://[username].github.io/MVP_Hotel/`

#### Manual Deployment
```bash
# Install gh-pages package
npm install --save-dev gh-pages

# Add deploy script to package.json
"scripts": {
  "deploy:gh": "gh-pages -d ."
}

# Deploy
npm run deploy:gh
```

### Vercel Deployment

#### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/chrimar3/MVP_Hotel)

#### CLI Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

#### Configuration
Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "."
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "headers": {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block"
      },
      "dest": "/$1"
    }
  ]
}
```

### AWS Deployment

Deploy to AWS S3 with CloudFront CDN for global distribution.

#### Step 1: Create S3 Bucket
```bash
# Create bucket
aws s3 mb s3://hotel-review-generator

# Enable static website hosting
aws s3 website s3://hotel-review-generator \
  --index-document index.html \
  --error-document 404.html
```

#### Step 2: Configure Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::hotel-review-generator/*"
    }
  ]
}
```

#### Step 3: Deploy Files
```bash
# Sync files to S3
aws s3 sync . s3://hotel-review-generator \
  --exclude ".git/*" \
  --exclude "node_modules/*" \
  --exclude "*.md" \
  --cache-control max-age=31536000

# Update HTML files with shorter cache
aws s3 cp index.html s3://hotel-review-generator/ \
  --cache-control max-age=0
```

#### Step 4: Setup CloudFront
```bash
# Create distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

### Docker Deployment

#### Create Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Create nginx.conf
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline';" always;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Build and Run
```bash
# Build Docker image
docker build -t hotel-review-generator .

# Run container
docker run -d -p 80:80 --name hotel-app hotel-review-generator

# Docker Compose (create docker-compose.yml)
version: '3.8'
services:
  web:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
```

### Traditional Server Deployment

For Apache or Nginx servers:

#### Apache Configuration
Create `.htaccess`:
```apache
# Security Headers
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"
Header set X-Content-Type-Options "nosniff"
Header set Referrer-Policy "strict-origin-when-cross-origin"

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>

# Cache Control
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 1 hour"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
</IfModule>

# Rewrite Rules
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

#### Deployment Steps
```bash
# 1. Build the project
npm run build

# 2. Upload files via FTP/SFTP
scp -r * user@server:/var/www/html/

# Or use rsync for incremental updates
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./ user@server:/var/www/html/
```

## Environment Configuration

### Environment Variables
Create `.env.production`:
```env
# API Configuration
API_URL=https://api.mvphotel.com
API_KEY=your-api-key

# Analytics
GA_TRACKING_ID=UA-XXXXXXXXX-X
SENTRY_DSN=https://xxx@sentry.io/xxx

# Feature Flags
ENABLE_AI_GENERATION=true
ENABLE_ANALYTICS=true
ENABLE_STAFF_RECOGNITION=true

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600
```

### Configuration by Environment
```javascript
// config/environment.js
const config = {
  development: {
    apiUrl: 'http://localhost:3001',
    debug: true,
    analytics: false
  },
  staging: {
    apiUrl: 'https://staging-api.mvphotel.com',
    debug: false,
    analytics: true
  },
  production: {
    apiUrl: 'https://api.mvphotel.com',
    debug: false,
    analytics: true
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

## Performance Optimization

### Pre-deployment Checklist

1. **Minification**:
   ```bash
   # JavaScript
   npx terser src/js/*.js -o dist/js/

   # CSS
   npx cssnano src/css/*.css dist/css/

   # HTML
   npx html-minifier-terser --input-dir . --output-dir dist/
   ```

2. **Image Optimization**:
   ```bash
   # Install imagemin
   npm install -g imagemin-cli

   # Optimize images
   imagemin src/images/* --out-dir=dist/images/
   ```

3. **Bundle Analysis**:
   ```bash
   # Analyze bundle size
   npx webpack-bundle-analyzer dist/stats.json
   ```

### CDN Configuration

1. **CloudFlare**:
   - Add domain to CloudFlare
   - Enable Auto Minify
   - Set up Page Rules for caching
   - Enable Brotli compression

2. **Custom CDN URLs**:
   ```javascript
   // Update asset URLs
   const CDN_URL = 'https://cdn.mvphotel.com';
   const assetUrl = `${CDN_URL}/assets/`;
   ```

### Service Worker Setup
```javascript
// sw.js
const CACHE_NAME = 'hotel-review-v2.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/css/styles.css',
  '/src/js/app.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

## Security Hardening

### Security Headers
Configure these headers on your server:

```nginx
# nginx.conf
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com;" always;
```

### SSL/TLS Configuration

1. **Let's Encrypt** (Free SSL):
   ```bash
   # Install certbot
   sudo apt-get install certbot

   # Generate certificate
   sudo certbot --nginx -d mvphotel.com -d www.mvphotel.com
   ```

2. **SSL Configuration**:
   ```nginx
   server {
       listen 443 ssl http2;
       ssl_certificate /etc/letsencrypt/live/mvphotel.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/mvphotel.com/privkey.pem;
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;
   }
   ```

## Monitoring & Analytics

### Setup Monitoring

1. **Google Analytics**:
   ```javascript
   // Add to index.html
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'GA_MEASUREMENT_ID');
   </script>
   ```

2. **Sentry Error Tracking**:
   ```javascript
   import * as Sentry from "@sentry/browser";
   
   Sentry.init({
     dsn: "YOUR_SENTRY_DSN",
     environment: "production",
     tracesSampleRate: 1.0,
   });
   ```

3. **Custom Analytics Dashboard**:
   - Access at `/analytics-dashboard.html`
   - View real-time metrics
   - Export reports

### Health Checks

1. **Endpoint Monitoring**:
   ```javascript
   // health.html
   fetch('/api/health')
     .then(response => response.json())
     .then(data => {
       if (data.status === 'healthy') {
         console.log('System operational');
       }
     });
   ```

2. **Uptime Monitoring Services**:
   - UptimeRobot
   - Pingdom
   - StatusCake

## Rollback Procedures

### Version Control Strategy

1. **Tag Releases**:
   ```bash
   # Tag current version
   git tag -a v2.0.0 -m "Release version 2.0.0"
   git push origin v2.0.0
   ```

2. **Rollback to Previous Version**:
   ```bash
   # List available tags
   git tag -l

   # Checkout previous version
   git checkout v1.9.0

   # Deploy previous version
   npm run deploy
   ```

### Netlify Rollback
```bash
# List deployments
netlify deploy --list

# Rollback to specific deployment
netlify deploy --restore=[deployment-id]
```

### Database Rollback (if applicable)
```bash
# Backup current state
pg_dump hotel_reviews > backup_$(date +%Y%m%d).sql

# Restore previous backup
psql hotel_reviews < backup_20240101.sql
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run build
```

#### 2. 404 Errors on Routes
Ensure proper server configuration for SPA routing:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

#### 3. CORS Issues
```javascript
// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
```

#### 4. Performance Issues
```bash
# Run performance audit
npm run lighthouse

# Check bundle size
npm run analyze
```

#### 5. SSL Certificate Issues
```bash
# Renew certificate
sudo certbot renew

# Test SSL configuration
openssl s_client -connect mvphotel.com:443
```

### Debug Mode
Enable debug mode for troubleshooting:
```javascript
// Add to URL: ?debug=true
if (window.location.search.includes('debug=true')) {
  window.DEBUG_MODE = true;
  console.log('Debug mode enabled');
}
```

### Support Resources

- **Documentation**: [/docs](./docs/)
- **GitHub Issues**: [Report Issues](https://github.com/chrimar3/MVP_Hotel/issues)
- **Community Forum**: [Discussions](https://github.com/chrimar3/MVP_Hotel/discussions)
- **Email Support**: deploy@mvphotel.com

---

## Post-Deployment Checklist

- [ ] Verify all pages load correctly
- [ ] Test review generation functionality
- [ ] Check all language translations
- [ ] Verify analytics tracking
- [ ] Test mobile responsiveness
- [ ] Check SSL certificate
- [ ] Verify security headers
- [ ] Test error handling
- [ ] Monitor performance metrics
- [ ] Update DNS records
- [ ] Configure CDN caching
- [ ] Set up monitoring alerts
- [ ] Document deployment details
- [ ] Notify stakeholders

---

*Last updated: 2024*