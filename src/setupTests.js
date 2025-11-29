// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

globalThis.localStorage = localStorageMock;

// Mock window.dispatchEvent
globalThis.dispatchEvent = jest.fn();

// Mock window.location for React Router
delete globalThis.window.location;
globalThis.window.location = {
  pathname: "/",
  search: "",
  hash: "",
  href: "http://localhost:3000",
};

// Mock fetch for API calls
globalThis.fetch = jest.fn();

// Mock console methods to reduce noise during testing
globalThis.console = {
  ...console,
  // Keep error and warn for important messages
  error: jest.fn(),
  warn: jest.fn(),
  // Suppress info and log during tests
  info: jest.fn(),
  log: jest.fn(),
  debug: jest.fn(),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
