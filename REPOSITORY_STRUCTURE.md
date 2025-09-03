# 🏗️ Repository Structure

This document outlines the professional monorepo structure and organization of the Hotel Reviews AI platform.

## 📁 Directory Overview

```
hotel-reviews-ai/
├── .github/                    # GitHub workflows, templates, and automation
│   ├── workflows/              
│   │   ├── ci.yml             # CI/CD pipeline
│   │   ├── release.yml        # Automated releases
│   │   └── security.yml       # Security scanning
│   ├── ISSUE_TEMPLATE/        # Issue templates
│   ├── PULL_REQUEST_TEMPLATE/ # PR templates
│   └── dependabot.yml         # Dependency updates
│
├── .vscode/                   # VS Code workspace configuration
│   ├── settings.json          # Workspace settings
│   ├── extensions.json        # Recommended extensions
│   ├── launch.json           # Debug configurations
│   └── tasks.json            # Task definitions
│
├── apps/                      # Application packages
│   └── web/                   # Main web application
│       ├── public/            # Static assets
│       ├── assets/            # Application assets
│       ├── components/        # React components
│       ├── js/               # JavaScript modules
│       ├── css/              # Stylesheets
│       ├── views/            # View templates
│       ├── package.json      # App dependencies
│       └── index.html        # Application entry point
│
├── packages/                  # Shared packages (monorepo)
│   ├── core/                 # Business logic and services
│   │   ├── src/
│   │   │   ├── services/     # Core services
│   │   │   ├── models/       # Data models
│   │   │   ├── utils/        # Utility functions
│   │   │   └── index.ts      # Package entry point
│   │   ├── tests/            # Package tests
│   │   ├── package.json      # Package configuration
│   │   └── tsconfig.json     # TypeScript config
│   │
│   ├── ui/                   # Reusable UI components
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── styles/       # Component styles
│   │   │   └── index.ts      # Package entry point
│   │   ├── storybook/        # Storybook configuration
│   │   ├── package.json      # Package configuration
│   │   └── .storybook/       # Storybook config
│   │
│   └── utils/                # Shared utilities
│       ├── src/
│       │   ├── helpers/      # Helper functions
│       │   ├── constants/    # Shared constants
│       │   ├── types/        # TypeScript definitions
│       │   └── index.ts      # Package entry point
│       ├── tests/            # Utility tests
│       └── package.json      # Package configuration
│
├── infrastructure/           # Infrastructure as Code
│   ├── docker/              # Docker configurations
│   │   ├── Dockerfile       # Production container
│   │   ├── docker-compose.yml # Development stack
│   │   └── .dockerignore    # Docker ignore rules
│   │
│   ├── terraform/           # Infrastructure definitions
│   │   ├── main.tf          # Main configuration
│   │   ├── variables.tf     # Variable definitions
│   │   ├── outputs.tf       # Output values
│   │   └── modules/         # Reusable modules
│   │
│   └── monitoring/          # Observability setup
│       ├── grafana/         # Grafana dashboards
│       ├── prometheus/      # Prometheus configuration
│       └── alerts/          # Alert definitions
│
├── tools/                   # Development tools and utilities
│   ├── scripts/            # Build and utility scripts
│   │   ├── dev-setup.js    # Development environment setup
│   │   ├── build.js        # Production build script
│   │   ├── test-runner.js  # Test execution
│   │   └── deploy.js       # Deployment automation
│   │
│   └── config/             # Shared configurations
│       ├── webpack.config.js    # Webpack configuration
│       ├── jest.config.js       # Jest testing config
│       ├── playwright.config.js # E2E testing config
│       ├── .eslintrc.js         # ESLint configuration
│       ├── .prettierrc          # Prettier configuration
│       └── tsconfig.json        # TypeScript base config
│
├── docs/                    # Comprehensive documentation
│   ├── api/                # API documentation
│   │   ├── endpoints/      # API endpoint docs
│   │   └── schemas/        # Data schemas
│   │
│   ├── guides/             # User and developer guides
│   │   ├── getting-started.md   # Quick start guide
│   │   ├── deployment.md        # Deployment guide
│   │   ├── contributing.md      # Contribution guide
│   │   └── troubleshooting.md   # Common issues
│   │
│   └── examples/           # Code examples
│       ├── basic-usage/    # Simple examples
│       └── advanced/       # Complex implementations
│
├── tests/                  # Test suites
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   ├── e2e/              # End-to-end tests
│   ├── fixtures/         # Test data
│   └── setup.js          # Test configuration
│
├── coverage/              # Test coverage reports (generated)
├── dist/                  # Built application (generated)
├── node_modules/          # Dependencies (generated)
│
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules
├── .npmrc                 # NPM configuration
├── LICENSE                # MIT license
├── Makefile              # Development automation
├── README.md             # Project documentation
├── CONTRIBUTING.md       # Contribution guidelines
├── CODE_OF_CONDUCT.md    # Community guidelines
├── SECURITY.md           # Security policy
├── CHANGELOG.md          # Version history
├── package.json          # Root package configuration
├── package-lock.json     # Dependency lock file
└── tsconfig.json         # TypeScript configuration
```

## 🎯 Design Principles

### 1. **Monorepo Architecture**
- **Shared packages**: Core functionality, UI components, utilities
- **Workspace management**: npm workspaces for dependency management
- **Build optimization**: Incremental builds and caching

### 2. **Separation of Concerns**
- **Apps**: End-user applications
- **Packages**: Reusable business logic and components
- **Infrastructure**: Deployment and operations code
- **Tools**: Development and build utilities

### 3. **Professional Standards**
- **Configuration management**: Centralized config files
- **Development experience**: IDE integration and automation
- **Quality gates**: Testing, linting, security scanning
- **Documentation**: Comprehensive guides and API docs

## 📦 Package Management

### Workspace Structure
```json
{
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

### Package Naming Convention
- `@hotel-reviews/core` - Core business logic
- `@hotel-reviews/ui` - UI component library
- `@hotel-reviews/utils` - Shared utilities
- `@hotel-reviews/web` - Main web application

### Dependency Management
- **Root level**: Development tools and shared dependencies
- **Package level**: Package-specific dependencies
- **Workspace dependencies**: Cross-package references

## 🔧 Development Workflow

### Getting Started
```bash
# Clone and setup
git clone https://github.com/chrimar3/MVP_Hotel.git
cd MVP_Hotel
make setup

# Start development
make dev
```

### Common Commands
```bash
# Development
make dev                    # Start dev server
make build                  # Production build
make test                   # Run all tests

# Quality
make lint                   # Run ESLint
make format                 # Format code
make typecheck              # TypeScript check

# Infrastructure
make docker-build           # Build container
make infra-plan            # Plan infrastructure
```

## 🏗️ Build System

### Webpack Configuration
- **Development**: Hot module replacement, source maps
- **Production**: Minification, code splitting, optimization
- **Analysis**: Bundle analysis and performance metrics

### Package Building
- **TypeScript**: Compilation with type declarations
- **Babel**: JavaScript transformation
- **Rollup**: Package bundling for distribution

## 🧪 Testing Strategy

### Test Types
1. **Unit Tests**: Individual function testing
2. **Integration Tests**: Component interaction testing
3. **E2E Tests**: Full user journey testing
4. **Visual Tests**: UI regression testing

### Coverage Requirements
- **Minimum**: 85% line coverage
- **Critical paths**: 100% coverage
- **New code**: 90%+ coverage required

## 🔒 Security

### Security Measures
- **Dependency scanning**: Automated vulnerability detection
- **Code analysis**: Static security analysis
- **Container security**: Image vulnerability scanning
- **Access control**: Proper permissions and secrets management

### Security Tools
- **npm audit**: Dependency vulnerability scanning
- **ESLint security**: Code security rules
- **Trivy**: Container image scanning
- **GitHub Security**: Automated security alerts

## 📊 Performance

### Optimization Strategies
- **Code splitting**: Lazy loading of application chunks
- **Tree shaking**: Removal of unused code
- **Caching**: Aggressive caching strategies
- **CDN**: Content delivery optimization

### Performance Monitoring
- **Lighthouse CI**: Continuous performance monitoring
- **Bundle analysis**: Size and dependency tracking
- **Core Web Vitals**: User experience metrics

## 🚀 Deployment

### Deployment Targets
- **Development**: Local development environment
- **Staging**: Pre-production testing environment  
- **Production**: Live application environment

### Deployment Methods
- **Docker**: Containerized deployments
- **Static**: JAMstack deployments (Netlify/Vercel)
- **Kubernetes**: Orchestrated container deployments

## 📈 Monitoring

### Observability Stack
- **Logs**: Structured logging with context
- **Metrics**: Application and infrastructure metrics
- **Traces**: Request tracing and performance
- **Alerts**: Proactive issue detection

### Tools Integration
- **Sentry**: Error tracking and performance monitoring
- **Grafana**: Visualization and dashboards
- **Prometheus**: Metrics collection and alerting

## 🤝 Collaboration

### Developer Experience
- **IDE integration**: VS Code configuration and extensions
- **Git hooks**: Pre-commit quality checks
- **Documentation**: Comprehensive guides and examples
- **Automation**: Makefile for common tasks

### Code Quality
- **Linting**: ESLint with security rules
- **Formatting**: Prettier with consistent styles
- **Type checking**: TypeScript strict mode
- **Testing**: Comprehensive test coverage

---

This structure ensures the Hotel Reviews AI platform maintains enterprise-grade standards while providing an excellent developer experience and professional codebase organization.