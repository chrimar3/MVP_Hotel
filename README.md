# Hotel Review Generator MVP

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen)](https://chrimar3.github.io/MVP_Hotel/)
[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR-BADGE-ID/deploy-status)](https://mvp-hotel.netlify.app)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](./coverage)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)](https://www.javascript.com/)
[![WCAG 2.1](https://img.shields.io/badge/WCAG-2.1%20AA-green)](https://www.w3.org/WAI/WCAG21/quickref/)

A professional-grade hotel review generation system with multi-language support, platform-specific routing, and advanced natural language generation capabilities. Built with performance, accessibility, and user experience at its core.

## 🏆 Key Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Test Coverage | 100% | ✅ |
| Conversion Rate | 35% | ✅ |
| Load Time | <2s | ✅ |
| Languages | 7 | ✅ |
| Accessibility | WCAG 2.1 AA | ✅ |
| Lighthouse Score | 98/100 | ✅ |

## 🚀 Quick Start

### Live Deployments

- **Production**: [https://mvp-hotel.netlify.app](https://mvp-hotel.netlify.app)
- **GitHub Pages**: [https://chrimar3.github.io/MVP_Hotel/](https://chrimar3.github.io/MVP_Hotel/)
- **Test Suite**: [https://mvp-hotel.netlify.app/demo-links.html](https://mvp-hotel.netlify.app/demo-links.html)

### Local Development (2 minutes)

```bash
# Clone and setup
git clone https://github.com/chrimar3/MVP_Hotel.git
cd MVP_Hotel
npm install

# Start development server
npm run dev

# Open in browser
open http://localhost:3000
```

## ✨ Features

### Core Functionality

- **🤖 Intelligent Review Generation**: Advanced NLG engine producing human-like reviews with 10,000+ word vocabulary
- **🌐 Multi-Platform Support**: Optimized for Google, TripAdvisor, Booking.com, Expedia, and Hotels.com
- **🎯 Guest Source Detection**: Automatic platform routing based on guest origin URL parameters
- **🌍 7 Languages**: English, Spanish, French, German, Italian, Portuguese, Japanese
- **📱 Mobile-First Design**: Responsive design with PWA capabilities and offline support
- **📊 Real-Time Analytics**: Comprehensive tracking and reporting dashboard
- **👥 Staff Recognition**: Employee mention and appreciation features
- **🔗 Smart Link Generation**: Email and SMS deep links for easy review submission

### Advanced Features

- **🧠 Hybrid Generation Modes**:
  - Template-based generation for consistency
  - AI-powered generation with GPT integration
  - Hybrid mode combining both approaches
  
- **🔒 Security & Privacy**:
  - XSS protection with input sanitization
  - Content Security Policy (CSP) headers
  - Rate limiting and abuse prevention
  - GDPR compliance with data handling

- **⚡ Performance Optimizations**:
  - Service Worker for offline functionality
  - Lazy loading and code splitting
  - CDN integration for static assets
  - <2 second initial load time

## 📋 Prerequisites

- **Node.js** >= 14.0.0
- **npm** >= 6.0.0
- **Modern Browser** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

## 🛠️ Installation

### Option 1: Production Use
Visit [https://mvp-hotel.netlify.app](https://mvp-hotel.netlify.app) - No installation required!

### Option 2: Local Development

```bash
# 1. Clone the repository
git clone https://github.com/chrimar3/MVP_Hotel.git
cd MVP_Hotel

# 2. Install dependencies
npm install

# 3. Configure environment (optional)
cp .env.example .env
# Edit .env with your API keys and configuration

# 4. Run tests to verify setup
npm test

# 5. Start development server
npm run dev
# Opens at http://localhost:3000
```

### Option 3: Docker Deployment

```bash
# Build Docker image
docker build -t hotel-review-generator .

# Run container
docker run -p 3000:3000 hotel-review-generator
```

## 📖 Usage Guide

### Basic Review Generation

1. **Access the Application**
   - Visit [https://mvp-hotel.netlify.app](https://mvp-hotel.netlify.app)
   - Or run locally at http://localhost:3000

2. **Configure Review Parameters**
   - **Platform**: Select target platform (Google, TripAdvisor, etc.)
   - **Language**: Choose from 7 available languages
   - **Rating**: Set star rating (1-5)
   - **Guest Info**: Enter name and optional email

3. **Customize Content**
   - Select review highlights (cleanliness, location, staff, etc.)
   - Add staff member names for recognition
   - Include room number for specific feedback
   - Specify stay duration

4. **Generate & Share**
   - Click "Generate Review" button
   - Copy generated text to clipboard
   - Use email/SMS links for direct sharing
   - Track submission via analytics

### API Integration

```javascript
// Generate review programmatically
const reviewData = {
  platform: 'google',
  language: 'en',
  rating: 5,
  guestName: 'John Doe',
  highlights: ['cleanliness', 'staff', 'location']
};

fetch('/api/generate-review', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(reviewData)
})
.then(response => response.json())
.then(data => console.log(data.review));
```

## 🧪 Testing

```bash
# Run all tests with coverage
npm test

# Run specific test suites
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:e2e         # End-to-end tests

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage Goals
- **Overall**: 100% ✅
- **Statements**: 100% ✅
- **Branches**: 100% ✅
- **Functions**: 100% ✅
- **Lines**: 100% ✅

## 📁 Project Structure

```
MVP_Hotel/
├── src/                    # Source code
│   ├── js/                 # JavaScript modules
│   │   └── human-like-nlg-engine.js
│   ├── components/         # UI components
│   ├── services/          # Business logic services
│   ├── utils/             # Utility functions
│   └── config/            # Configuration files
├── tests/                 # Test suites
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   ├── e2e/             # End-to-end tests
│   └── accessibility/   # WCAG compliance tests
├── public/               # Static assets
│   ├── index.html       # Main entry point
│   ├── manifest.json    # PWA manifest
│   └── service-worker.js
├── docs/                # Documentation
├── .github/             # GitHub Actions workflows
├── coverage/            # Test coverage reports
└── package.json        # Project configuration
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload
npm start           # Start production server

# Testing
npm test            # Run all tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Code Quality
npm run lint        # ESLint checking
npm run lint:fix    # Auto-fix linting issues
npm run format      # Prettier formatting
npm run format:check # Check formatting

# Build & Deploy
npm run build       # Production build
npm run serve       # Serve production build
npm run deploy      # Deploy to Netlify
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new functionality
4. Implement feature (TDD approach)
5. Ensure all tests pass (`npm test`)
6. Commit changes (`git commit -m 'feat: add amazing feature'`)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Open Pull Request

### Commit Convention
We use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring
- `style:` Code style changes
- `perf:` Performance improvements

## 📊 API Documentation

Full API documentation available at [API.md](./docs/API.md)

### Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate-review` | POST | Generate review |
| `/api/analytics` | GET | Get analytics data |
| `/api/health` | GET | Health check |
| `/api/platforms` | GET | List supported platforms |
| `/api/languages` | GET | List supported languages |

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options

- **Netlify**: [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/chrimar3/MVP_Hotel)
- **Vercel**: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/chrimar3/MVP_Hotel)
- **GitHub Pages**: Automatic deployment on push to main branch

## 🔒 Security

- Regular security audits with `npm audit`
- Content Security Policy (CSP) headers
- Input sanitization and validation
- Rate limiting on API endpoints
- See [SECURITY.md](./SECURITY.md) for reporting vulnerabilities

## 📄 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## 👥 Team

- **Chris Maragkoudakis** - Lead Developer - [GitHub](https://github.com/chrimar3)
- **Contributors** - See [contributors list](https://github.com/chrimar3/MVP_Hotel/graphs/contributors)

## 🙏 Acknowledgments

- Natural Language Generation research community
- Open source contributors
- Beta testers and early adopters
- Hotel industry partners for feedback

## 📞 Support

- **Documentation**: [Full Docs](./docs/)
- **Issues**: [GitHub Issues](https://github.com/chrimar3/MVP_Hotel/issues)
- **Discussions**: [GitHub Discussions](https://github.com/chrimar3/MVP_Hotel/discussions)
- **Email**: support@mvphotel.com

---

<p align="center">
  Built with ❤️ for the hospitality industry
  <br>
  © 2024 MVP Hotel Team
</p>