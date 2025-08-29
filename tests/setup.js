/**
 * Jest Test Setup
 * Configures testing environment for all test suites
 */

// Import testing utilities
require('@testing-library/jest-dom');

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch API
global.fetch = jest.fn();

// Mock crypto API
global.crypto = {
    getRandomValues: (arr) => {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
    }
};

// Mock navigator.clipboard
Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn().mockResolvedValue(),
        readText: jest.fn().mockResolvedValue('')
    }
});

// Mock window.open
global.open = jest.fn();

// Mock performance.now()
global.performance = {
    now: jest.fn(() => Date.now())
};

// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    fetch.mockClear();
});

// Clean up after all tests
afterAll(() => {
    jest.restoreAllMocks();
});