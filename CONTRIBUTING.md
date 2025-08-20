# Contributing to MVP Hotel Review Generator

First off, thank you for considering contributing to our project! 🎉

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**When reporting bugs, include:**
- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser/device information
- Error messages from console

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues.

**When suggesting enhancements, include:**
- Use case and motivation
- Detailed description of the solution
- Alternative solutions considered
- Mockups/examples if applicable

### Pull Requests

1. **Fork the repository**
2. **Create your feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow existing code style
   - Add/update tests if applicable
   - Update documentation

4. **Test your changes**
   ```bash
   # Run browser tests
   .claude/commands/browser-test.sh all
   ```

5. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes
   - `refactor:` Code refactoring
   - `perf:` Performance improvements
   - `test:` Test additions/changes
   - `chore:` Maintenance tasks

6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**

## 📋 Development Setup

### Prerequisites
- Node.js 18+ (for testing tools)
- Modern web browser
- Git

### Local Development
```bash
# Clone repository
git clone https://github.com/yourusername/MVP_Hotel.git
cd MVP_Hotel

# Install Puppeteer for testing
npm install puppeteer

# Open in browser
open src/ultimate-ux-enhanced.html

# Run tests
.claude/commands/browser-test.sh all
```

## 🎨 Code Style Guidelines

### HTML
- Use semantic HTML5 elements
- Include ARIA labels for accessibility
- Maintain consistent indentation (4 spaces)
- Comment complex sections

### CSS
- Use CSS custom properties for theming
- Mobile-first responsive design
- Follow BEM naming when applicable
- Group related properties

### JavaScript
- Use ES6+ features
- Strict mode enabled
- Clear variable/function names
- JSDoc comments for functions
- Handle errors gracefully

## 🧪 Testing Requirements

All contributions must:
1. Pass visual regression tests
2. Maintain WCAG AA accessibility
3. Work on mobile devices
4. Have no console errors
5. Maintain performance score above 85

Run tests with:
```bash
.claude/commands/browser-test.sh all
```

## 📝 Documentation

- Update README.md for new features
- Add inline code comments
- Update CHANGELOG.md
- Include examples/screenshots

## 🌐 Language Support

When adding translations:
1. Follow existing Greek translation pattern
2. Maintain professional tone
3. Test special characters
4. Verify mobile layout

## 🔄 Review Process

All submissions will be reviewed for:
- Code quality and style
- Test coverage
- Documentation completeness
- Security implications
- Performance impact
- Accessibility compliance

## 📊 Quality Standards

Maintain our high standards:
- ✅ 100% accessibility score
- ✅ A+ performance grade
- ✅ Zero console errors
- ✅ Mobile responsive
- ✅ Cross-browser compatible

## 🚀 Getting Your PR Merged

To increase merge likelihood:
1. Keep changes focused and small
2. Write clear commit messages
3. Update tests and docs
4. Respond to feedback promptly
5. Be patient and respectful

## 💡 First-Time Contributors

Looking for a good first issue? Check issues labeled:
- `good first issue`
- `help wanted`
- `documentation`

## 📜 Code of Conduct

Please note we have a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to abide by its terms.

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Appreciated eternally! 

## ❓ Questions?

Feel free to:
- Open a discussion issue
- Contact maintainers
- Check existing documentation

Thank you for making MVP Hotel Review Generator better! 🏨✨