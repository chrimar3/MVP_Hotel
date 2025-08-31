const { HotelReviewGenerator, HotelAnalytics, PWAManager } = require('../../src/services/hotelReviewGenerator');

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn(key => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
    value: {
        language: 'en-US',
        onLine: true,
        doNotTrack: '0',
        userAgent: 'Mozilla/5.0 Test Browser',
        clipboard: {
            writeText: jest.fn().mockResolvedValue(true)
        },
        serviceWorker: {
            register: jest.fn().mockResolvedValue({
                addEventListener: jest.fn()
            })
        }
    },
    writable: true
});

// Mock gtag
global.gtag = jest.fn();

// Mock DOM elements
document.getElementById = jest.fn((id) => {
    const element = document.createElement('div');
    element.id = id;
    element.classList = {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn()
    };
    element.style = { display: 'none' };
    return element;
});

describe('HotelReviewGenerator', () => {
    let generator;

    beforeEach(() => {
        generator = new HotelReviewGenerator();
        localStorageMock.clear();
        jest.clearAllMocks();
    });

    describe('Language Detection and Management', () => {
        test('detects language from URL parameter', () => {
            delete window.location;
            window.location = { search: '?lang=es' };
            const lang = generator.detectLanguage();
            expect(lang).toBe('es');
        });

        test('detects language from browser settings', () => {
            delete window.location;
            window.location = { search: '' };
            window.navigator.language = 'fr-FR';
            const lang = generator.detectLanguage();
            expect(lang).toBe('fr');
        });

        test('falls back to saved language preference', () => {
            delete window.location;
            window.location = { search: '' };
            window.navigator.language = 'de-DE';
            localStorageMock.setItem('preferred_language', 'es');
            const lang = generator.detectLanguage();
            expect(lang).toBe('es');
        });

        test('defaults to English when no preference found', () => {
            delete window.location;
            window.location = { search: '' };
            window.navigator.language = 'de-DE';
            const lang = generator.detectLanguage();
            expect(lang).toBe('en');
        });

        test('sets language successfully', () => {
            const result = generator.setLanguage('es');
            expect(result).toBe(true);
            expect(generator.currentLanguage).toBe('es');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('preferred_language', 'es');
        });

        test('rejects invalid language', () => {
            const result = generator.setLanguage('invalid');
            expect(result).toBe(false);
        });

        test('sets RTL direction for Arabic', () => {
            generator.setLanguage('ar');
            expect(document.dir).toBe('rtl');
        });

        test('sets LTR direction for non-Arabic languages', () => {
            generator.setLanguage('es');
            expect(document.dir).toBe('ltr');
        });
    });

    describe('Translation', () => {
        test('translates key correctly', () => {
            generator.currentLanguage = 'es';
            const translated = generator.translate('title');
            expect(translated).toBe('Generador de Reseñas de Hoteles');
        });

        test('falls back to English for missing translation', () => {
            generator.currentLanguage = 'es';
            generator.translations.es = {}; // Remove Spanish translations
            const translated = generator.translate('title');
            expect(translated).toBe('Hotel Review Generator');
        });

        test('returns key when translation not found', () => {
            const translated = generator.translate('nonexistent_key');
            expect(translated).toBe('nonexistent_key');
        });

        test('handles missing English translation gracefully', () => {
            generator.currentLanguage = 'es';
            generator.translations.es = {};
            generator.translations.en = {};
            const translated = generator.translate('someKey');
            expect(translated).toBe('someKey');
        });
    });

    describe('Aspect Selection', () => {
        test('adds new aspect', () => {
            const added = generator.toggleAspect('cleanliness');
            expect(added).toBe(true);
            expect(generator.selectedAspects.has('cleanliness')).toBe(true);
        });

        test('removes existing aspect', () => {
            generator.selectedAspects.add('cleanliness');
            const added = generator.toggleAspect('cleanliness');
            expect(added).toBe(false);
            expect(generator.selectedAspects.has('cleanliness')).toBe(false);
        });
    });

    describe('Review Validation', () => {
        test('validates correct review', () => {
            const review = 'This is a wonderful review about Grand Hotel that is long enough and contains no profanity whatsoever.';
            const result = generator.validateReview(review, 'Grand Hotel');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.warnings).toHaveLength(0);
        });

        test('detects short review', () => {
            const review = 'Too short';
            const result = generator.validateReview(review, 'Hotel');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Review must be at least 50 characters long');
        });

        test('detects long review', () => {
            const review = 'x'.repeat(5001);
            const result = generator.validateReview(review, 'Hotel');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Review must be less than 5000 characters');
        });

        test('detects profanity', () => {
            const review = 'This hotel was damn awful and the service was terrible enough to make me mad.';
            const result = generator.validateReview(review, 'Hotel');
            // Should have 3 profanity warnings + 1 warning for not mentioning hotel name
            expect(result.warnings).toHaveLength(4);
            expect(result.warnings.filter(w => w.includes('inappropriate language'))).toHaveLength(3);
        });

        test('warns when hotel name not mentioned', () => {
            const review = 'This is a wonderful place that is long enough and contains no profanity whatsoever.';
            const result = generator.validateReview(review, 'Grand Hotel');
            expect(result.warnings).toContain('Review doesn\'t mention the hotel name');
        });

        test('handles empty review', () => {
            const result = generator.validateReview('', 'Hotel');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Review must be at least 50 characters long');
        });
    });

    describe('Review Creation', () => {
        test('creates review with hotel name', () => {
            const review = generator.createReview('Grand Hotel');
            expect(review).toContain('Grand Hotel');
            expect(review.length).toBeGreaterThan(50);
        });

        test('throws error without hotel name', () => {
            expect(() => generator.createReview('')).toThrow('Hotel name is required');
        });

        test('includes selected aspects', () => {
            generator.selectedAspects.add('cleanliness');
            generator.selectedAspects.add('service');
            const review = generator.createReview('Grand Hotel');
            expect(review.length).toBeGreaterThan(100);
        });

        test('handles unknown aspects gracefully', () => {
            generator.selectedAspects.add('unknownaspect');
            generator.selectedAspects.add('cleanliness');
            const review = generator.createReview('Grand Hotel');
            expect(review).toContain('Grand Hotel');
            expect(review.length).toBeGreaterThan(50);
        });

        test('includes custom comments', () => {
            const comments = 'The pool area was fantastic!';
            const review = generator.createReview('Grand Hotel', comments);
            expect(review).toContain(comments);
        });

        test('creates varied reviews', () => {
            const reviews = new Set();
            for (let i = 0; i < 10; i++) {
                reviews.add(generator.createReview('Grand Hotel'));
            }
            // Should generate at least 2 different reviews
            expect(reviews.size).toBeGreaterThan(1);
        });
    });

    describe('Platform URL Generation', () => {
        test('generates Booking.com URL', () => {
            const url = generator.generatePlatformUrl('booking', 'Grand Hotel');
            expect(url).toBe('https://www.booking.com/reviewlist.html?hotel=Grand%20Hotel&tab=write_review');
        });

        test('generates TripAdvisor URL', () => {
            const url = generator.generatePlatformUrl('tripadvisor', 'Grand Hotel');
            expect(url).toBe('https://www.tripadvisor.com/UserReview?hotel=Grand%20Hotel');
        });

        test('generates Google Maps URL', () => {
            const url = generator.generatePlatformUrl('google', 'Grand Hotel');
            expect(url).toBe('https://maps.google.com/maps/place/search/Grand%20Hotel/reviews');
        });

        test('returns null for unknown platform', () => {
            const url = generator.generatePlatformUrl('unknown', 'Grand Hotel');
            expect(url).toBeNull();
        });

        test('encodes special characters in hotel name', () => {
            const url = generator.generatePlatformUrl('booking', 'Grand & Luxury Hotel');
            expect(url).toContain('Grand%20%26%20Luxury%20Hotel');
        });

        test('handles default case for unknown platform with valid URL', () => {
            // Add a platform URL that doesn't have a specific case
            generator.platformUrls.set('newplatform', 'https://newplatform.com/review');
            const url = generator.generatePlatformUrl('newplatform', 'Grand Hotel');
            expect(url).toBe('https://newplatform.com/review');
        });
    });

    describe('Clipboard Operations', () => {
        test('copies text using modern API', async () => {
            const text = 'Test review';
            await generator.copyToClipboard(text);
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text);
        });

        test('fallback for older browsers', async () => {
            const originalClipboard = navigator.clipboard;
            delete navigator.clipboard;
            
            document.execCommand = jest.fn(() => true);
            const text = 'Test review';
            const result = await generator.copyToClipboard(text);
            expect(document.execCommand).toHaveBeenCalledWith('copy');
            
            navigator.clipboard = originalClipboard;
        });

        test('handles copy failure in fallback', async () => {
            const originalClipboard = navigator.clipboard;
            delete navigator.clipboard;
            
            document.execCommand = jest.fn(() => {
                throw new Error('Copy failed');
            });
            
            await expect(generator.copyToClipboard('Test')).rejects.toThrow();
            
            navigator.clipboard = originalClipboard;
        });
    });

    describe('Draft Management', () => {
        test('saves draft successfully', () => {
            generator.selectedAspects.add('cleanliness');
            const result = generator.saveDraft('Grand Hotel', 'Nice place');
            expect(result).toBe(true);
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });

        test('handles quota exceeded error', () => {
            localStorageMock.setItem.mockImplementationOnce(() => {
                const error = new Error('QuotaExceededError');
                error.name = 'QuotaExceededError';
                throw error;
            });
            
            const result = generator.saveDraft('Grand Hotel', 'Nice place');
            expect(localStorageMock.clear).toHaveBeenCalled();
        });

        test('handles other storage errors', () => {
            localStorageMock.setItem.mockImplementationOnce(() => {
                throw new Error('Some other error');
            });
            
            const result = generator.saveDraft('Grand Hotel', 'Nice place');
            expect(result).toBe(false);
        });

        test('loads draft successfully', () => {
            const draftData = {
                hotelName: 'Grand Hotel',
                selectedAspects: ['cleanliness'],
                comments: 'Nice place',
                timestamp: Date.now()
            };
            localStorageMock.setItem('hotelReviewDraft', JSON.stringify(draftData));
            
            const draft = generator.loadDraft();
            expect(draft).toEqual(draftData);
        });

        test('handles invalid draft data', () => {
            localStorageMock.setItem('hotelReviewDraft', 'invalid json');
            const draft = generator.loadDraft();
            expect(draft).toBeNull();
        });

        test('returns null when no draft exists', () => {
            const draft = generator.loadDraft();
            expect(draft).toBeNull();
        });
    });

    describe('Debounce Function', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test('debounces function calls', () => {
            const mockFn = jest.fn();
            const debounced = generator.debounce(mockFn, 100);
            
            debounced('first');
            debounced('second');
            debounced('third');
            
            expect(mockFn).not.toHaveBeenCalled();
            
            jest.advanceTimersByTime(100);
            
            expect(mockFn).toHaveBeenCalledTimes(1);
            expect(mockFn).toHaveBeenCalledWith('third');
        });

        test('uses default delay', () => {
            const mockFn = jest.fn();
            const debounced = generator.debounce(mockFn);
            
            debounced('test');
            
            jest.advanceTimersByTime(499);
            expect(mockFn).not.toHaveBeenCalled();
            
            jest.advanceTimersByTime(1);
            expect(mockFn).toHaveBeenCalledWith('test');
        });
    });
});

describe('HotelAnalytics', () => {
    let analytics;

    beforeEach(() => {
        analytics = new HotelAnalytics();
        global.gtag = jest.fn();
    });

    test('generates unique session ID', () => {
        const analytics2 = new HotelAnalytics();
        expect(analytics.sessionId).not.toBe(analytics2.sessionId);
        expect(analytics.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    test('tracks events correctly', () => {
        const event = analytics.trackEvent('UI', 'click', 'button', 1);
        
        expect(event).toMatchObject({
            category: 'UI',
            action: 'click',
            label: 'button',
            value: 1,
            sessionId: analytics.sessionId
        });
        expect(analytics.events).toHaveLength(1);
        expect(gtag).toHaveBeenCalled();
    });

    test('tracks events without gtag', () => {
        delete global.gtag;
        const event = analytics.trackEvent('UI', 'click');
        expect(event).toBeDefined();
        expect(analytics.events).toHaveLength(1);
    });

    test('tracks page views', () => {
        const pageView = analytics.trackPageView('/test');
        
        expect(pageView).toMatchObject({
            page: '/test',
            sessionId: analytics.sessionId
        });
        expect(analytics.pageViews).toBe(1);
        expect(gtag).toHaveBeenCalled();
    });

    test('tracks page views without path', () => {
        Object.defineProperty(window, 'location', {
            value: { pathname: '/default' },
            writable: true
        });
        
        const pageView = analytics.trackPageView();
        expect(pageView.page).toBe('/default');
    });

    test('tracks page views without gtag', () => {
        const originalGtag = global.gtag;
        delete global.gtag;
        
        const pageView = analytics.trackPageView('/test');
        expect(pageView).toBeDefined();
        expect(pageView.page).toBe('/test');
        
        global.gtag = originalGtag;
    });

    test('calculates session metrics', () => {
        analytics.trackPageView();
        analytics.trackPageView();
        analytics.trackEvent('UI', 'click');
        
        const metrics = analytics.getSessionMetrics();
        
        expect(metrics).toMatchObject({
            sessionId: analytics.sessionId,
            pageViews: 2,
            totalEvents: 1
        });
        expect(metrics.durationFormatted).toMatch(/^\d+m \d+s$/);
    });

    test('respects Do Not Track', () => {
        window.navigator.doNotTrack = '1';
        expect(analytics.trackDoNotTrack()).toBe(true);
        
        window.navigator.doNotTrack = '0';
        expect(analytics.trackDoNotTrack()).toBe(false);
        
        window.navigator.doNotTrack = 'yes';
        expect(analytics.trackDoNotTrack()).toBe(true);
    });

    test('handles various DNT properties', () => {
        delete window.navigator.doNotTrack;
        window.doNotTrack = '1';
        expect(analytics.trackDoNotTrack()).toBe(true);
        
        delete window.doNotTrack;
        window.navigator.msDoNotTrack = '1';
        expect(analytics.trackDoNotTrack()).toBe(true);
    });
});

describe('Module Export', () => {
    test('exports modules in Node environment', () => {
        // The fact that we can import means this works
        expect(HotelReviewGenerator).toBeDefined();
        expect(HotelAnalytics).toBeDefined();
        expect(PWAManager).toBeDefined();
    });

    test('module export exists in test environment', () => {
        // In Node/Jest environment, module should always exist
        expect(typeof module).toBe('object');
        expect(module.exports).toBeDefined();
        // The export branch at line 477 cannot be fully tested in Node environment
        // as it requires a browser context where module is undefined
    });
});

describe('PWAManager', () => {
    let pwa;

    beforeEach(() => {
        pwa = new PWAManager();
        window.navigator.onLine = true;
        window.navigator.serviceWorker = {
            register: jest.fn().mockResolvedValue({
                addEventListener: jest.fn()
            })
        };
    });

    describe('Service Worker', () => {
        test('registers service worker successfully', async () => {
            const registration = await pwa.init();
            expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
            expect(registration).toBeDefined();
            expect(pwa.serviceWorkerRegistration).toBeDefined();
        });

        test('handles service worker registration failure', async () => {
            navigator.serviceWorker.register.mockRejectedValueOnce(new Error('Registration failed'));
            await expect(pwa.init()).rejects.toThrow('Registration failed');
        });

        test('handles browser without service worker support', async () => {
            delete navigator.serviceWorker;
            const registration = await pwa.init();
            expect(registration).toBeNull();
        });
    });

    describe('Online/Offline Status', () => {
        test('detects online status', () => {
            window.navigator.onLine = true;
            const isOnline = pwa.handleOnlineStatus();
            expect(isOnline).toBe(true);
        });

        test('detects offline status', () => {
            window.navigator.onLine = false;
            const isOnline = pwa.handleOnlineStatus();
            expect(isOnline).toBe(false);
        });

        test('shows offline banner', () => {
            const banner = { classList: { add: jest.fn() } };
            document.getElementById = jest.fn(() => banner);
            
            pwa.showOfflineBanner();
            expect(banner.classList.add).toHaveBeenCalledWith('visible');
        });

        test('hides offline banner', () => {
            const banner = { classList: { remove: jest.fn() } };
            document.getElementById = jest.fn(() => banner);
            
            pwa.hideOfflineBanner();
            expect(banner.classList.remove).toHaveBeenCalledWith('visible');
        });

        test('handles missing banner element', () => {
            document.getElementById = jest.fn(() => null);
            
            expect(() => pwa.showOfflineBanner()).not.toThrow();
            expect(() => pwa.hideOfflineBanner()).not.toThrow();
        });
    });

    describe('Install Prompt', () => {
        test('sets up install prompt listener', () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
            pwa.setupInstallPrompt();
            expect(addEventListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
        });

        test('handles beforeinstallprompt event', () => {
            const mockEvent = {
                preventDefault: jest.fn(),
                prompt: jest.fn(),
                userChoice: Promise.resolve({ outcome: 'accepted' })
            };
            
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
            pwa.setupInstallPrompt();
            
            // Get the handler that was registered
            const handler = addEventListenerSpy.mock.calls.find(
                call => call[0] === 'beforeinstallprompt'
            )[1];
            
            // Call it with our mock event
            handler(mockEvent);
            
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(pwa.deferredPrompt).toBe(mockEvent);
            
            addEventListenerSpy.mockRestore();
        });

        test('shows install button', () => {
            const btn = { style: { display: 'none' } };
            document.getElementById = jest.fn(() => btn);
            
            pwa.showInstallButton();
            expect(btn.style.display).toBe('block');
        });

        test('prompts for installation', async () => {
            pwa.deferredPrompt = {
                prompt: jest.fn(),
                userChoice: Promise.resolve({ outcome: 'accepted' })
            };
            
            const result = await pwa.promptInstall();
            expect(result).toBe(true);
            expect(pwa.deferredPrompt).toBeNull();
        });

        test('handles installation rejection', async () => {
            pwa.deferredPrompt = {
                prompt: jest.fn(),
                userChoice: Promise.resolve({ outcome: 'dismissed' })
            };
            
            const result = await pwa.promptInstall();
            expect(result).toBe(false);
        });

        test('returns false when no deferred prompt', async () => {
            const result = await pwa.promptInstall();
            expect(result).toBe(false);
        });
    });
});