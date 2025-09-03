# Contributing to Hotel Reviews AI

Welcome to Hotel Reviews AI! We're excited that you're interested in contributing. This guide will help you get started and ensure your contributions align with our enterprise-grade standards.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it to understand expectations for interactions within our community.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js >= 14.0.0
- npm >= 6.0.0
- Git installed and configured
- A GitHub account
- Basic knowledge of JavaScript/HTML/CSS
- Familiarity with Git workflows

### First-Time Contributors

New to open source? We recommend:

1. Read [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
2. Look for issues labeled `good first issue` or `help wanted`
3. Join our [discussions](https://github.com/chrimar3/MVP_Hotel/discussions)
4. Ask questions - we're here to help!

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR-USERNAME/MVP_Hotel.git
cd MVP_Hotel

# Add upstream remote
git remote add upstream https://github.com/chrimar3/MVP_Hotel.git
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm test
```

### 3. Create Development Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 4. Configure Development Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env
```

### 5. Start Development Server

```bash
# Start with hot reload
npm run dev

# Open http://localhost:3000
```

## How to Contribute

### Reporting Bugs

Found a bug? Help us fix it!

#### Before Submitting

- Check [existing issues](https://github.com/chrimar3/MVP_Hotel/issues)
- Verify the bug still exists in the latest version
- Collect relevant information

#### Bug Report Template

```markdown
**Description**
Clear and concise description of the bug.

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What should happen instead.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g., Windows 10, macOS 12.0]
- Browser: [e.g., Chrome 96, Firefox 95]
- Version: [e.g., 2.0.0]

**Additional Context**
Any other relevant information.
```

### Suggesting Enhancements

Have an idea to improve the project?

#### Enhancement Proposal Template

```markdown
**Problem Statement**
What problem does this solve?

**Proposed Solution**
Describe your solution in detail.

**Alternatives Considered**
What other solutions did you consider?

**Benefits**
- Benefit 1
- Benefit 2

**Potential Drawbacks**
- Drawback 1
- Drawback 2

**Implementation Notes**
Technical details if applicable.
```

### Contributing Code

#### Types of Contributions

- **Features**: New functionality
- **Bug Fixes**: Resolving reported issues
- **Performance**: Optimization improvements
- **Documentation**: Docs, comments, examples
- **Tests**: New or improved tests
- **Refactoring**: Code quality improvements

## Development Workflow

### TDD Approach (Test-Driven Development)

We follow TDD principles:

```bash
# 1. Write failing test
npm run test:watch

# 2. Write minimal code to pass
# Edit source files

# 3. Refactor while keeping tests green
# Improve code quality

# 4. Commit when complete
git commit -m "feat: implement feature with tests"
```

### Typical Workflow

```bash
# 1. Start with latest code
git fetch upstream
git rebase upstream/main

# 2. Make changes
# Edit files...

# 3. Run tests
npm test

# 4. Check code quality
npm run lint
npm run format

# 5. Commit changes
git add .
git commit -m "feat: descriptive message"

# 6. Push to your fork
git push origin feature/your-feature

# 7. Create Pull Request on GitHub
```

## Coding Standards

### JavaScript Style Guide

```javascript
// Use ES6+ features
const functionName = (param1, param2) => {
  // Function body
};

// Async/await over promises
const fetchData = async () => {
  try {
    const data = await api.getData();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};

// Destructuring
const { property1, property2 } = object;

// Template literals
const message = `Hello, ${name}!`;

// Use meaningful variable names
const userEmail = 'user@example.com'; // Good
const e = 'user@example.com'; // Bad
```

### HTML/CSS Guidelines

```html
<!-- Semantic HTML -->
<article class="review-card">
  <header class="review-header">
    <h2>Review Title</h2>
  </header>
  <section class="review-content">
    <!-- Content -->
  </section>
</article>
```

```css
/* Use CSS variables for theming */
:root {
  --primary-color: #1e40af;
  --secondary-color: #3b82f6;
}

/* Mobile-first responsive design */
.container {
  width: 100%;
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
  }
}
```

### Documentation Standards

```javascript
/**
 * Generates a hotel review based on provided parameters
 * 
 * @param {Object} params - Review generation parameters
 * @param {string} params.platform - Target platform (google, tripadvisor, etc.)
 * @param {string} params.language - Language code (en, es, fr, etc.)
 * @param {number} params.rating - Rating value (1-5)
 * @param {string[]} params.highlights - Array of highlight keywords
 * @returns {Promise<Object>} Generated review object
 * @throws {ValidationError} If parameters are invalid
 * 
 * @example
 * const review = await generateReview({
 *   platform: 'google',
 *   language: 'en',
 *   rating: 5,
 *   highlights: ['cleanliness', 'staff']
 * });
 */
async function generateReview(params) {
  // Implementation
}
```

## Testing Guidelines

### Test Structure

```javascript
// Test file: ComponentName.test.js
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Test setup
  });

  // Teardown
  afterEach(() => {
    // Cleanup
  });

  describe('methodName', () => {
    it('should handle normal case', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = component.method(input);
      
      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge case', () => {
      // Test edge cases
    });

    it('should handle error case', () => {
      // Test error handling
    });
  });
});
```

### Testing Checklist

- [ ] Unit tests for new functions
- [ ] Integration tests for workflows
- [ ] E2E tests for critical paths
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Performance benchmarks (if applicable)
- [ ] Accessibility tests (WCAG compliance)

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch mode
npm run test:watch

# Debug mode
npm run test:debug
```

## Documentation

### What to Document

1. **Code Comments**
   - Complex algorithms
   - Business logic decisions
   - Workarounds and hacks
   - TODOs with issue references

2. **README Updates**
   - New features
   - Configuration changes
   - Breaking changes
   - Usage examples

3. **API Documentation**
   - Endpoint changes
   - Parameter additions
   - Response format changes
   - Example requests/responses

### Documentation Template

```markdown
## Feature Name

### Overview
Brief description of the feature.

### Usage
```javascript
// Code example
const example = new Feature();
example.use();
```

### API Reference
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| method() | param: Type | Type | Description |

### Configuration
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| option | Type | value | Description |

### Examples
See `/examples/feature-name/` for complete examples.
```

## Pull Request Process

### Before Submitting

- [ ] Tests pass locally (`npm test`)
- [ ] Code follows style guide (`npm run lint`)
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Branch is up-to-date with main
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Security vulnerabilities checked (`npm audit`)

### PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing unit tests pass locally
- [ ] Any dependent changes have been merged

## Screenshots (if applicable)
Add screenshots here.

## Additional Notes
Any additional information.
```

### Review Process

1. **Automated Checks**: CI/CD runs tests, linting, and security scans
2. **Code Review**: Maintainer reviews code quality and architecture
3. **Testing**: Manual testing of functionality
4. **Feedback**: Address review comments
5. **Approval**: Two approvals required for merge
6. **Merge**: Squash and merge to main

### After Merge

- Delete your feature branch
- Pull latest changes
- Celebrate your contribution! 🎉

## Community

### Getting Help

- **Documentation**: Check [docs/](./docs/) first
- **Issues**: Search [existing issues](https://github.com/chrimar3/MVP_Hotel/issues)
- **Discussions**: Ask in [GitHub Discussions](https://github.com/chrimar3/MVP_Hotel/discussions)
- **Email**: contribute@mvphotel.com

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Requests**: Code contributions
- **Wiki**: Extended documentation

### Recognition

We value all contributions! Contributors are:
- Listed in [CONTRIBUTORS.md](./CONTRIBUTORS.md)
- Mentioned in release notes
- Given credit in commits

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `build`: Build system or dependencies
- `ci`: CI/CD configuration
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

### Examples
```bash
# Feature
git commit -m "feat(generator): add multi-language support"

# Bug fix
git commit -m "fix(ui): correct rating star alignment on mobile"

# Documentation
git commit -m "docs(api): update endpoint documentation"

# Breaking change
git commit -m "feat(api)!: change response format

BREAKING CHANGE: Response now returns nested object structure"
```

## Version Control Best Practices

### Branch Naming
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes
- `perf/` - Performance improvements

### Keep History Clean
```bash
# Interactive rebase to clean commits
git rebase -i HEAD~3

# Amend last commit
git commit --amend

# Squash commits before PR
git rebase -i upstream/main
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Hotel Review Generator! Your efforts help make this project better for everyone. 🙏

**Questions?** Open an issue or reach out to the maintainers.

---

*Last updated: 2024*