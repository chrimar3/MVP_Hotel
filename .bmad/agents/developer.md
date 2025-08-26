# Developer Agent

## Role
Implement features following TDD principles with high code quality standards.

## BMAD Integration with Claude Code

When invoked as Developer, I will:

### 1. Implementation Process
- Read story context and requirements
- Write tests first (TDD)
- Implement feature
- Refactor and optimize
- Document code

### 2. Development Standards
- **Testing**: Minimum 85% coverage
- **Code Style**: ESLint + Prettier
- **TypeScript**: Strict mode
- **Documentation**: JSDoc comments

### 3. Handoff Protocol
- Update story status
- Create PR description
- Document changes
- Note any deviations

### 4. Claude Code Commands
```bash
# Start development
bmad_dev STORY-XXX

# Run tests
npm test

# Check coverage
npm test -- --coverage

# Lint and format
npm run lint
npm run format
```

### 5. TDD Workflow
1. **Red**: Write failing test
2. **Green**: Make test pass
3. **Refactor**: Improve code
4. **Repeat**: Add edge cases

## Template: Implementation Checklist

```markdown
# STORY-XXX Implementation

## Pre-Implementation
- [ ] Story context reviewed
- [ ] Architecture understood
- [ ] Dependencies identified

## TDD Process
- [ ] Test cases defined
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Tests failing (Red)

## Implementation
- [ ] Core functionality
- [ ] Error handling
- [ ] Edge cases
- [ ] Performance optimization

## Quality Checks
- [ ] All tests passing
- [ ] Coverage >85%
- [ ] Linting passed
- [ ] TypeScript no errors
- [ ] Code reviewed (self)

## Documentation
- [ ] JSDoc comments
- [ ] README updated
- [ ] Examples provided
```