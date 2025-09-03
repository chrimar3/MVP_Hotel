/**
 * Jest Test Setup
 * Configures testing environment for all test suites
 */

// Import testing utilities
require('@testing-library/jest-dom');

// Enhanced localStorage mock with internal store
const createMockStorage = () => {
    const store = new Map();
    
    const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        key: jest.fn(),
        get length() {
            return store.size;
        },
        // Direct access to internal store for testing
        store
    };
    
    // Set up implementations that use the store
    mockStorage.getItem.mockImplementation((key) => store.get(key) || null);
    mockStorage.setItem.mockImplementation((key, value) => {
        store.set(key, typeof value === 'string' ? value : String(value));
    });
    mockStorage.removeItem.mockImplementation((key) => {
        store.delete(key);
    });
    mockStorage.clear.mockImplementation(() => {
        store.clear();
    });
    mockStorage.key.mockImplementation((index) => {
        const keys = Array.from(store.keys());
        return keys[index] || null;
    });
    
    return mockStorage;
};

// Set up window first (JSDOM provides window)
global.window = global.window || {};

const localStorageMock = createMockStorage();

// Set on window first, then alias to global 
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true
});

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true
});

global.window.localStorage = localStorageMock;

// Mock fetch API - will be overridden by individual tests as needed
global.fetch = jest.fn();

// Mock crypto API
global.crypto = {
    getRandomValues: (arr) => {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
    },
    subtle: {
        generateKey: jest.fn().mockResolvedValue({}),
        importKey: jest.fn().mockResolvedValue({}),
        sign: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
        verify: jest.fn().mockResolvedValue(true),
        encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
        decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32))
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

// Mock performance API
global.performance = {
    now: jest.fn(() => Date.now()),
    memory: {
        usedJSHeapSize: 50000000, // 50MB default
        totalJSHeapSize: 100000000, // 100MB total
        jsHeapSizeLimit: 2000000000 // 2GB limit
    },
    timing: {
        navigationStart: Date.now() - 1000,
        loadEventEnd: Date.now()
    }
};

// Mock sessionStorage with separate store
const sessionStorageMock = createMockStorage();

Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
    configurable: true
});

Object.defineProperty(global, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
    configurable: true
});

global.window.sessionStorage = sessionStorageMock;

// Mock TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = class TextEncoder {
    encode(str) {
        return new Uint8Array(Buffer.from(str, 'utf8'));
    }
};

global.TextDecoder = class TextDecoder {
    decode(buffer) {
        return Buffer.from(buffer).toString('utf8');
    }
};

// Mock btoa/atob
global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
global.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');

// Mock navigator properties
Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Test Environment)',
    configurable: true
});

Object.defineProperty(navigator, 'language', {
    value: 'en-US',
    configurable: true
});

// Mock screen object with proper properties
Object.defineProperty(global, 'screen', {
    writable: true,
    configurable: true,
    value: {
        width: 1920,
        height: 1080
    }
});

// Mock document methods
Object.defineProperty(document, 'referrer', {
    value: 'http://test.com',
    writable: true,
    configurable: true
});

// Mock document.createElement for testing
const originalCreateElement = document.createElement;
document.createElement = jest.fn(originalCreateElement);

// Don't mock setInterval/clearInterval here - let the ErrorTracking test spy on them
// The test will create its own spies with jest.spyOn()

// Mock URL constructor
global.URL = class URL {
    constructor(url) {
        if (url.startsWith('javascript:') || url.startsWith('data:')) {
            throw new Error('Invalid URL');
        }
        
        // Parse the URL string
        const match = url.match(/^(https?:\/\/)([^\/\?]+)(.*)/);
        if (match) {
            this.protocol = match[1].includes('https') ? 'https:' : 'http:';
            this.hostname = match[2];
            const pathAndQuery = match[3] || '';
            
            // Parse search params
            const queryStart = pathAndQuery.indexOf('?');
            if (queryStart !== -1) {
                const queryString = pathAndQuery.slice(queryStart + 1);
                this.searchParams = new URLSearchParams(queryString);
            } else {
                this.searchParams = new URLSearchParams();
            }
        } else if (url === 'https://api.openai.com' || url === 'https://api.groq.com' || url === 'https://mvp-hotel.netlify.app') {
            // Fallback for specific URLs
            this.protocol = 'https:';
            this.hostname = url.replace('https://', '');
            this.searchParams = new URLSearchParams();
        } else {
            // Try to handle as best as possible
            this.protocol = 'https:';
            this.hostname = 'example.com';
            this.searchParams = new URLSearchParams();
        }
    }
};

// Add window.errorTracking global mock and additional window properties
global.window = global.window || {};
global.window.errorTracking = {
    logError: jest.fn(),
    logEvent: jest.fn(),
    captureError: jest.fn(),
    track: jest.fn(),
    clearErrors: jest.fn()
};

// Mock window methods for ErrorTracking tests
global.window.addEventListener = jest.fn();
global.window.removeEventListener = jest.fn();

// Mock window.location with proper setter support
delete global.window.location;
global.window.location = {
  hostname: 'localhost',
  href: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000'
};

// Mock window dimensions
Object.defineProperty(global.window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1920
});

Object.defineProperty(global.window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1080
});

// Add other window properties for completeness
global.window.analytics = {
    track: jest.fn()
};

global.window.monitoring = {
    alert: jest.fn(),
    report: jest.fn()
};

// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear storage stores
    localStorageMock.store.clear();
    sessionStorageMock.store.clear();
    
    // Reset mock functions
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    
    sessionStorageMock.getItem.mockClear();
    sessionStorageMock.setItem.mockClear();
    sessionStorageMock.removeItem.mockClear();
    sessionStorageMock.clear.mockClear();
    
    fetch.mockClear();
    
    // Reset window mocks
    global.window.errorTracking.logError.mockClear();
    global.window.errorTracking.logEvent.mockClear();
    global.window.errorTracking.captureError.mockClear();
    global.window.errorTracking.track.mockClear();
    global.window.errorTracking.clearErrors.mockClear();
    
    // Reset additional window mocks
    if (global.window.addEventListener) global.window.addEventListener.mockClear();
    if (global.window.removeEventListener) global.window.removeEventListener.mockClear();
    
    // Reset performance memory values (only if the memory object exists)
    if (global.performance && global.performance.memory) {
        global.performance.memory.usedJSHeapSize = 50000000;
        global.performance.memory.totalJSHeapSize = 100000000;
    }
});

// Track active timers and intervals
global.activeTimers = new Set();
global.activeIntervals = new Set();

// Override setTimeout to track timers
const originalSetTimeout = global.setTimeout;
global.setTimeout = (fn, delay, ...args) => {
    const timer = originalSetTimeout(fn, delay, ...args);
    global.activeTimers.add(timer);
    return timer;
};

// Override clearTimeout to track cleanup
const originalClearTimeout = global.clearTimeout;
global.clearTimeout = (timer) => {
    global.activeTimers.delete(timer);
    return originalClearTimeout(timer);
};

// Override setInterval to track intervals
const originalSetInterval = global.setInterval;
global.setInterval = (fn, delay, ...args) => {
    const interval = originalSetInterval(fn, delay, ...args);
    global.activeIntervals.add(interval);
    return interval;
};

// Override clearInterval to track cleanup
const originalClearInterval = global.clearInterval;
global.clearInterval = (interval) => {
    global.activeIntervals.delete(interval);
    return originalClearInterval(interval);
};

// Clean up after each test
afterEach(() => {
    // Clear all active timers
    global.activeTimers.forEach(timer => originalClearTimeout(timer));
    global.activeTimers.clear();
    
    // Clear all active intervals
    global.activeIntervals.forEach(interval => originalClearInterval(interval));
    global.activeIntervals.clear();
});

// Clean up after all tests
afterAll(() => {
    // Final cleanup of any remaining timers
    global.activeTimers.forEach(timer => originalClearTimeout(timer));
    global.activeIntervals.forEach(interval => originalClearInterval(interval));
    
    jest.restoreAllMocks();
});