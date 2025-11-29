# Testing Guide for Buy My Skills

This guide explains how to run tests for the Buy My Skills application.

## 🧪 Test Structure

```
src/
├── __tests__/           # API Integration Tests
│   └── api.test.js
├── components/          # Component Tests
│   └── UserProfileCard.test.js
├── utils/               # Utility Tests
│   └── validation.test.js
└── setupTests.js        # Test Configuration
```

## 🚀 Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Types

#### Unit Tests (Utilities)
```bash
npm run test:unit
# Tests: validation functions, pure utilities
```

#### Component Tests
```bash
npm run test:components
# Tests: React components, user interactions
```

#### API Integration Tests
```bash
npm run test:api
# Tests: API endpoints, HTTP requests
```

### Test Coverage Report
```bash
npm run test:coverage
# Generates coverage report in coverage/ directory
```

### Watch Mode (Continuous Testing)
```bash
npm run test:watch
# Re-runs tests on file changes
```

## 📊 Test Categories

### 1. Unit Tests (`src/utils/`)
- **Purpose**: Test pure functions and utilities
- **Examples**: Email validation, password strength, data formatting
- **Framework**: Jest (built-in assertions)

### 2. Component Tests (`src/components/`)
- **Purpose**: Test React components and user interactions
- **Examples**: Button clicks, form submissions, UI state changes
- **Framework**: React Testing Library + Jest

### 3. Integration Tests (`src/__tests__/`)
- **Purpose**: Test API endpoints and data flow
- **Examples**: HTTP requests, server responses, data persistence
- **Framework**: MSW (Mock Service Worker) + Jest

## 🛠 Test Configuration

### Setup File (`src/setupTests.js`)
- Configures Jest environment
- Mocks browser APIs (localStorage, fetch, etc.)
- Sets up global test utilities

### Test Dependencies
```json
{
  "@testing-library/jest-dom": "^5.17.0",
  "@testing-library/react": "^13.4.0",
  "@testing-library/user-event": "^13.5.0",
  "msw": "^1.x.x"
}
```

## 📝 Writing Tests

### Component Test Example
```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MyComponent from './MyComponent';

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('MyComponent', () => {
  test('renders correctly', () => {
    renderWithRouter(<MyComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  test('handles user interaction', () => {
    renderWithRouter(<MyComponent />);
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    expect(screen.getByText('Button clicked!')).toBeInTheDocument();
  });
});
```

### API Test Example
```javascript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/test', (req, res, ctx) => {
    return res(ctx.json({ data: 'test response' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('API Integration', () => {
  test('fetches data successfully', async () => {
    const response = await fetch('/api/test');
    const data = await response.json();
    expect(data.data).toBe('test response');
  });
});
```

## 🎯 Best Practices

### Test Naming
- Use descriptive test names: `"should validate email format"`
- Group related tests in `describe` blocks
- Use `test()` or `it()` consistently

### Component Testing
- Test user interactions, not implementation details
- Use `screen.getByRole()` for accessibility
- Mock external dependencies (APIs, localStorage)
- Test error states and loading states

### API Testing
- Mock external services with MSW
- Test both success and error responses
- Verify request/response structure
- Test authentication and authorization

### Code Coverage
- Aim for 80%+ coverage on critical paths
- Focus on business logic over UI styling
- Use coverage reports to identify gaps

## 🔧 Troubleshooting

### Common Issues

#### Tests not running
```bash
# Clear Jest cache
npx jest --clearCache

# Run with verbose output
npm test -- --verbose
```

#### MSW setup issues
```javascript
// Make sure MSW is properly configured
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

#### Component mocking
```javascript
// Mock external modules
jest.mock('../utils/api', () => ({
  fetchData: jest.fn(),
}));
```

## 📈 CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v2
```

## 🎉 Test Results

After running tests, you'll see:
- ✅ Passed tests (green)
- ❌ Failed tests (red)
- 📊 Coverage report (percentage by file)
- 🐛 Error details with stack traces

Example output:
```
PASS src/utils/validation.test.js
PASS src/components/UserProfileCard.test.js
PASS src/__tests__/api.test.js

Test Suites: 3 passed, 3 total
Tests: 25 passed, 25 total
Snapshots: 0 total
Time: 3.2s
```

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/docs/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

Happy testing! 🧪✨
