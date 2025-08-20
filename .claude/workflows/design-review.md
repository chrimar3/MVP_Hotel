# Design Review Workflow for Hotel Review Generator

## Purpose
Automated design review using Claude Code agents to ensure UI/UX consistency, accessibility compliance, and mobile optimization for the Hotel Review Generator.

## Workflow Triggers
- Before committing UI changes
- After adding new features
- During multi-language implementation
- Before production deployment

## Automated Checks

### 1. Visual Consistency Review
```bash
# Command: claude-review-design
```
- **Color Palette Compliance**: Verify use of defined CSS variables
- **Typography Standards**: Check font sizes, weights, line heights
- **Spacing Consistency**: Validate padding/margin adherence
- **Component Patterns**: Ensure reusable component consistency

### 2. Accessibility Audit
```bash
# Command: claude-review-a11y
```
- **ARIA Labels**: All interactive elements properly labeled
- **Color Contrast**: WCAG AA compliance (4.5:1 for text)
- **Keyboard Navigation**: Tab order and focus indicators
- **Screen Reader**: Semantic HTML and role attributes
- **Touch Targets**: Minimum 44px for mobile

### 3. Multi-Language UI Review
```bash
# Command: claude-review-i18n
```
- **Text Overflow**: Check all languages for UI breaks
- **RTL Support**: Verify Arabic layout
- **Character Encoding**: UTF-8 compliance
- **Translation Completeness**: No missing translations
- **Date/Number Formats**: Locale-specific formatting

### 4. Mobile Optimization Check
```bash
# Command: claude-review-mobile
```
- **Responsive Breakpoints**: 320px, 768px, 1024px
- **Touch Interactions**: Swipe, tap, pinch-to-zoom
- **Performance**: < 3s load time on 3G
- **PWA Compliance**: Manifest, icons, service worker
- **Offline Functionality**: Critical path availability

## Implementation Steps

### Step 1: Create Review Agent
```javascript
// .claude/agents/design-reviewer.js
const DesignReviewAgent = {
  name: 'design-reviewer',
  description: 'Automated UI/UX and accessibility review',
  
  async review(files) {
    const issues = [];
    
    // Check color consistency
    if (!this.checkColorVariables(files)) {
      issues.push({
        severity: 'warning',
        message: 'Hardcoded colors found. Use CSS variables.'
      });
    }
    
    // Check accessibility
    const a11yIssues = await this.checkAccessibility(files);
    issues.push(...a11yIssues);
    
    // Check mobile optimization
    const mobileIssues = await this.checkMobileOptimization(files);
    issues.push(...mobileIssues);
    
    return {
      passed: issues.length === 0,
      issues,
      summary: this.generateSummary(issues)
    };
  },
  
  checkColorVariables(files) {
    // Scan for hardcoded hex colors
    const pattern = /#[0-9A-Fa-f]{3,6}(?![0-9A-Fa-f])/g;
    // Implementation...
  },
  
  async checkAccessibility(files) {
    // Run automated a11y checks
    // Implementation...
  },
  
  async checkMobileOptimization(files) {
    // Check responsive design patterns
    // Implementation...
  },
  
  generateSummary(issues) {
    const critical = issues.filter(i => i.severity === 'error').length;
    const warnings = issues.filter(i => i.severity === 'warning').length;
    
    return `Design Review: ${critical} critical, ${warnings} warnings`;
  }
};
```

### Step 2: Create Review Command
```bash
#!/bin/bash
# .claude/commands/design-review.sh

echo "🎨 Running Design Review Workflow..."

# 1. Visual Consistency
echo "Checking visual consistency..."
claude task design-reviewer check-visuals src/

# 2. Accessibility
echo "Running accessibility audit..."
claude task design-reviewer check-a11y src/

# 3. Multi-language Support
echo "Verifying i18n implementation..."
claude task design-reviewer check-i18n src/

# 4. Mobile Optimization
echo "Testing mobile optimization..."
claude task design-reviewer check-mobile src/

# 5. Generate Report
echo "Generating design review report..."
claude task design-reviewer generate-report > .claude/reports/design-review.md

echo "✅ Design review complete! See .claude/reports/design-review.md"
```

### Step 3: Integration with Git Hooks
```bash
# .git/hooks/pre-commit
#!/bin/bash

# Run design review before commit
.claude/commands/design-review.sh

if [ $? -ne 0 ]; then
  echo "❌ Design review failed. Please fix issues before committing."
  exit 1
fi
```

## Review Criteria

### Critical Issues (Block Commit)
- Missing ARIA labels on interactive elements
- Color contrast below WCAG AA
- Touch targets < 44px
- Missing translations
- Broken responsive layout

### Warnings (Allow Commit)
- Inconsistent spacing
- Non-optimal image sizes
- Missing meta descriptions
- Unused CSS variables
- Long load times

## Reporting Format

```markdown
# Design Review Report
Date: [timestamp]
Files Reviewed: [count]

## Summary
- ✅ Passed: [count]
- ⚠️ Warnings: [count]  
- ❌ Failed: [count]

## Visual Consistency
[Details of visual checks]

## Accessibility
[WCAG compliance details]

## Mobile Optimization
[Mobile-specific findings]

## Recommendations
[Prioritized list of improvements]
```

## Benefits
1. **Consistent Quality**: Every commit meets design standards
2. **Accessibility**: WCAG compliance built into workflow
3. **Performance**: Mobile optimization verified
4. **Efficiency**: Automated reviews save hours
5. **Documentation**: Auto-generated reports for stakeholders

## Future Enhancements
- Visual regression testing with screenshots
- Performance budget enforcement
- SEO optimization checks
- Browser compatibility testing
- User flow analysis