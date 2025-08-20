# TDD Workflow for Hotel Review Generator

## Purpose
Enforce Test-Driven Development practices with automated test generation and coverage enforcement, aligned with CLAUDE.md principles.

## Workflow Commands

### 1. QTEST: Generate Comprehensive Test Suite
```bash
# Generate tests BEFORE implementation
claude qtest [feature-name]
```

**What it does:**
- Analyzes feature requirements
- Generates failing tests first (Red phase)
- Creates test structure with edge cases
- Sets up mocks and fixtures

### 2. QCODE: Implement with Tests
```bash
# Implement feature to pass tests
claude qcode [feature-name]
```

**What it does:**
- Implements minimal code to pass tests (Green phase)
- Runs tests continuously during implementation
- Ensures 100% test coverage for new code
- Generates documentation inline

### 3. QREFACTOR: Refactor with Safety
```bash
# Refactor while maintaining green tests
claude qrefactor [file-or-function]
```

**What it does:**
- Refactors code while keeping tests green (Refactor phase)
- Preserves test coverage
- Optimizes performance
- Updates documentation

## Test Generation Templates

### Component Test Template
```javascript
// [Component].test.tsx
describe('[Component]', () => {
  // Arrange
  let component;
  let props;
  
  beforeEach(() => {
    props = {
      // Default props
    };
  });
  
  // Happy Path Tests
  describe('when rendered with valid props', () => {
    it('should display expected content', () => {
      // Arrange
      const { getByText } = render(<Component {...props} />);
      
      // Act & Assert
      expect(getByText('expected')).toBeInTheDocument();
    });
  });
  
  // Edge Cases
  describe('edge cases', () => {
    it('should handle empty data gracefully', () => {
      // Test with empty/null/undefined
    });
    
    it('should handle maximum input length', () => {
      // Test boundaries
    });
  });
  
  // Error Cases
  describe('error handling', () => {
    it('should display error message on failure', () => {
      // Test error scenarios
    });
  });
  
  // User Interactions
  describe('user interactions', () => {
    it('should handle click events', async () => {
      // Test user events
    });
  });
});
```

### API Test Template
```javascript
// api.test.js
describe('API Module', () => {
  // Setup
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('successful requests', () => {
    it('should return parsed data', async () => {
      // Arrange
      const mockData = { success: true };
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData)
        })
      );
      
      // Act
      const result = await api.getData();
      
      // Assert
      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(expect.any(String));
    });
  });
  
  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      global.fetch = jest.fn(() => 
        Promise.reject(new Error('Network error'))
      );
      
      // Act & Assert
      await expect(api.getData()).rejects.toThrow('Network error');
    });
  });
});
```

## Coverage Requirements

### Minimum Coverage Targets
```json
{
  "coverageThreshold": {
    "global": {
      "branches": 85,
      "functions": 85,
      "lines": 85,
      "statements": 85
    },
    "src/components/": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    },
    "src/utils/": {
      "branches": 100,
      "functions": 100,
      "lines": 100,
      "statements": 100
    }
  }
}
```

## Automated Test Workflows

### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Run tests before commit
npm test -- --coverage --watchAll=false

if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Fix before committing."
  exit 1
fi

# Check coverage
npm run test:coverage:check

if [ $? -ne 0 ]; then
  echo "❌ Coverage below threshold. Add more tests."
  exit 1
fi
```

### Continuous Test Runner
```bash
# .claude/commands/test-watch.sh
#!/bin/bash

echo "👀 Starting continuous test runner..."

# Watch mode with coverage
npm test -- --coverage --watch

# Generate coverage report
npm run test:coverage:report
```

## Test Prioritization Matrix

| Feature Type | Test Priority | Coverage Target | Test Types |
|-------------|--------------|-----------------|------------|
| Business Logic | Critical | 100% | Unit, Integration |
| User Interactions | High | 90% | Unit, E2E |
| UI Components | Medium | 85% | Unit, Snapshot |
| Utilities | Critical | 100% | Unit |
| Error Handling | Critical | 100% | Unit, Integration |

## QTEST Workflow Example

```bash
# 1. Start with test generation
$ claude qtest "review-sharing-feature"

Creating test suite for review-sharing-feature...
✅ Generated: tests/review-sharing.test.js
  - 5 happy path tests
  - 3 edge case tests
  - 2 error handling tests
  
⚠️ All tests are FAILING (expected in TDD)

# 2. Implement to pass tests
$ claude qcode "review-sharing-feature"

Implementing review-sharing-feature...
Running tests continuously...
✅ Test 1/10 passing
✅ Test 2/10 passing
...
✅ All tests passing!

Coverage: 92% (exceeds 85% threshold)

# 3. Refactor if needed
$ claude qrefactor "review-sharing-feature"

Refactoring for optimization...
✅ All tests still passing
✅ Performance improved by 15%
✅ Code complexity reduced
```

## Benefits

1. **Bug Prevention**: 78% fewer bugs (Sabrina's research)
2. **Confident Refactoring**: Tests ensure nothing breaks
3. **Living Documentation**: Tests document expected behavior
4. **Design Improvement**: TDD forces better architecture
5. **Faster Debugging**: Failing tests pinpoint issues

## Integration with Hotel Review Project

### Current Test Gaps to Address
1. Analytics module needs unit tests
2. i18n translations need validation tests
3. PWA offline functionality needs E2E tests
4. Form validation needs comprehensive edge case tests

### Next Steps
```bash
# Generate missing tests
claude qtest analytics
claude qtest i18n
claude qtest pwa-offline
claude qtest form-validation

# Run full test suite
npm test -- --coverage

# Generate coverage report
npm run test:coverage:report
```

## Metrics & Reporting

### Weekly Test Metrics
- Tests added: [count]
- Coverage change: [percentage]
- Bugs caught by tests: [count]
- Time saved: [hours]

### Monthly Quality Report
- Overall coverage: [percentage]
- Critical path coverage: [percentage]
- Test execution time: [seconds]
- Flaky tests identified: [count]