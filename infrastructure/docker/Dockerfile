# Multi-stage Docker build for production-optimized hotel review generator
FROM node:20-alpine AS base

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init tini && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S app -u 1001 -G nodejs

WORKDIR /app

# Set ownership
RUN chown -R app:nodejs /app

# ================================
# Dependencies stage
# ================================
FROM base AS deps

USER app

# Copy package files
COPY --chown=app:nodejs package*.json ./

# Install dependencies with specific npm settings for security
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# ================================
# Development stage
# ================================
FROM base AS development

USER app

# Copy package files
COPY --chown=app:nodejs package*.json ./

# Install all dependencies for development
RUN npm ci --no-audit --no-fund

# Copy source code
COPY --chown=app:nodejs . .

# Expose development port
EXPOSE 3000

# Development command
CMD ["npm", "run", "dev"]

# ================================
# Build stage
# ================================
FROM base AS builder

USER app

# Copy package files
COPY --chown=app:nodejs package*.json ./

# Install all dependencies for build
RUN npm ci --no-audit --no-fund

# Copy source code
COPY --chown=app:nodejs . .

# Build the application
RUN npm run build || echo "No build script found, using public directory"

# Optimize static assets
RUN npm install -g terser html-minifier-terser cssnano-cli && \
    mkdir -p dist && \
    cp -r public/* dist/ 2>/dev/null || cp -r src/* dist/ 2>/dev/null || cp -r . dist/ && \
    # Minify JavaScript files
    find dist -name "*.js" -not -name "*.min.js" -exec sh -c 'terser "$1" -o "${1%.js}.min.js" -c -m' _ {} \; 2>/dev/null || true && \
    # Minify CSS files
    find dist -name "*.css" -not -name "*.min.css" -exec sh -c 'cssnano "$1" "${1%.css}.min.css"' _ {} \; 2>/dev/null || true && \
    # Minify HTML files
    find dist -name "*.html" -exec html-minifier-terser --collapse-whitespace --remove-comments --minify-css --minify-js {} -o {} \; 2>/dev/null || true

# Create build info
RUN echo "{\"version\":\"$(date -u +%Y%m%d-%H%M%S)\",\"buildTime\":\"$(date -u +\"%Y-%m-%dT%H:%M:%SZ\")\",\"nodeVersion\":\"$(node --version)\"}" > dist/build-info.json

# ================================
# Production stage
# ================================
FROM nginx:1.25-alpine AS production

# Install security updates
RUN apk update && apk upgrade && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S app && \
    adduser -S app -u 1001 -G app

# Copy custom nginx configuration
COPY --chown=root:root docker/nginx.conf /etc/nginx/nginx.conf
COPY --chown=root:root docker/default.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder --chown=app:app /app/dist /usr/share/nginx/html

# Copy health check script
COPY --chown=root:root docker/healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

# Security hardening
RUN chown -R app:app /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    # Remove default nginx files
    rm -f /etc/nginx/conf.d/default.conf.backup

# Create directories for nginx to run as non-root
RUN mkdir -p /var/cache/nginx /var/run/nginx /var/log/nginx && \
    chown -R app:app /var/cache/nginx /var/run/nginx /var/log/nginx && \
    chmod -R 755 /var/cache/nginx /var/run/nginx

# Labels for better container management
LABEL maintainer="chris@example.com" \
      version="2.0.0" \
      description="Production-ready hotel review generator" \
      org.opencontainers.image.title="MVP Hotel Review Generator" \
      org.opencontainers.image.description="Lightweight hotel review generator with modern UI" \
      org.opencontainers.image.vendor="MVP Hotel" \
      org.opencontainers.image.licenses="MIT"

# Switch to non-root user
USER app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Use tini as init system for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["nginx", "-g", "daemon off;"]

# ================================
# Standalone static server (alternative)
# ================================
FROM base AS static-server

USER app

# Install serve globally
RUN npm install -g serve

# Copy built application
COPY --from=builder --chown=app:nodejs /app/dist ./public

# Expose port
EXPOSE 3000

# Health check for static server
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health.html || exit 1

# Command to serve static files
CMD ["serve", "-s", "public", "-p", "3000"]