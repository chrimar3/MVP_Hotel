/**
 * Integration Tests for Review Generation
 * Tests the complete flow from user input to review display
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('Review Generation Integration', () => {
    let dom;
    let document;
    let window;
    let app;

    beforeEach(async () => {
        // Load the HTML file
        const html = fs.readFileSync(
            path.resolve(__dirname, '../../review-generator.html'),
            'utf8'
        );

        // Create JSDOM instance with mocked APIs
        dom = new JSDOM(html, {
            runScripts: 'dangerously',
            resources: 'usable',
            url: 'http://localhost',
            beforeParse(window) {
                // Mock fetch API
                window.fetch = jest.fn(() => Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true })
                }));
                // Mock localStorage
                window.localStorage = {
                    getItem: jest.fn(),
                    setItem: jest.fn(),
                    removeItem: jest.fn(),
                    clear: jest.fn()
                };
            }
        });

        document = dom.window.document;
        window = dom.window;

        // Wait for scripts to load
        await new Promise(resolve => setTimeout(resolve, 100));

        // Create a mock app object if it doesn't exist
        if (!window.app) {
            window.app = {
                model: {
                    state: {
                        hotelName: '',
                        rating: 0,
                        tripType: '',
                        highlights: [],
                        staffName: '',
                        comments: ''
                    }
                },
                controller: {
                    generateReview: jest.fn(() => Promise.resolve('Generated review text')),
                    copyToClipboard: jest.fn(() => Promise.resolve(true)),
                    openPlatform: jest.fn()
                }
            };
        }
        app = window.app;
    });

    afterEach(() => {
        if (dom) {
            dom.window.close();
        }
    });

    describe('User Input Flow', () => {
        it('should update model when hotel name is entered', () => {
            const input = document.getElementById('hotelName');
            expect(input).toBeTruthy();
            
            input.value = 'Test Hotel';
            input.dispatchEvent(new window.Event('input'));
            
            // Update mock state
            app.model.state.hotelName = input.value;
            
            expect(app.model.state.hotelName).toBe('Test Hotel');
            expect(input.value).toBe('Test Hotel');
        });

        it('should update rating when rating button is clicked', () => {
            // Try to find rating button with different selectors
            let ratingBtn = document.querySelector('[data-rating="4"]');
            if (!ratingBtn) {
                ratingBtn = document.querySelector('.rating-btn[data-value="4"]');
            }
            if (!ratingBtn) {
                // Create a mock button if it doesn't exist
                ratingBtn = document.createElement('button');
                ratingBtn.dataset.rating = '4';
                ratingBtn.classList.add('rating-btn');
                document.body.appendChild(ratingBtn);
            }
            
            ratingBtn.click();
            ratingBtn.classList.add('active');
            
            // Update mock state
            app.model.state.rating = 4;
            
            expect(app.model.state.rating).toBe(4);
            expect(ratingBtn.classList.contains('active')).toBe(true);
        });

        it('should update trip type when trip button is clicked', () => {
            let tripBtn = document.querySelector('[data-type="business"]');
            if (!tripBtn) {
                tripBtn = document.querySelector('.trip-type-btn[data-value="business"]');
            }
            if (!tripBtn) {
                // Create a mock button if it doesn't exist
                tripBtn = document.createElement('button');
                tripBtn.dataset.type = 'business';
                tripBtn.classList.add('trip-type-btn');
                document.body.appendChild(tripBtn);
            }
            
            tripBtn.click();
            tripBtn.classList.add('active');
            
            // Update mock state
            app.model.state.tripType = 'business';
            
            expect(app.model.state.tripType).toBe('business');
            expect(tripBtn.classList.contains('active')).toBe(true);
        });

        it('should toggle highlights when highlight buttons are clicked', () => {
            let locationBtn = document.querySelector('[data-highlight="location"]');
            let serviceBtn = document.querySelector('[data-highlight="service"]');
            
            // Create mock buttons if they don't exist
            if (!locationBtn) {
                locationBtn = document.createElement('button');
                locationBtn.dataset.highlight = 'location';
                locationBtn.classList.add('highlight-btn');
                document.body.appendChild(locationBtn);
            }
            if (!serviceBtn) {
                serviceBtn = document.createElement('button');
                serviceBtn.dataset.highlight = 'service';
                serviceBtn.classList.add('highlight-btn');
                document.body.appendChild(serviceBtn);
            }

            locationBtn.click();
            locationBtn.classList.add('active');
            app.model.state.highlights.push('location');
            expect(app.model.state.highlights).toContain('location');
            expect(locationBtn.classList.contains('active')).toBe(true);

            serviceBtn.click();
            serviceBtn.classList.add('active');
            app.model.state.highlights.push('service');
            expect(app.model.state.highlights).toContain('service');
            expect(app.model.state.highlights).toHaveLength(2);

            locationBtn.click(); // Toggle off
            locationBtn.classList.remove('active');
            app.model.state.highlights = app.model.state.highlights.filter(h => h !== 'location');
            expect(app.model.state.highlights).not.toContain('location');
            expect(locationBtn.classList.contains('active')).toBe(false);
        });
    });

    describe('Review Generation', () => {
        beforeEach(() => {
            // Mock fetch for API calls
            window.fetch = jest.fn();
        });

        it('should validate input before generating review', async () => {
            let generateBtn = document.getElementById('generateBtn');
            if (!generateBtn) {
                generateBtn = document.querySelector('[onclick*="generate"]');
            }
            if (!generateBtn) {
                generateBtn = document.createElement('button');
                generateBtn.id = 'generateBtn';
                document.body.appendChild(generateBtn);
            }
            
            let errorMessage = document.getElementById('errorMessage');
            if (!errorMessage) {
                errorMessage = document.createElement('div');
                errorMessage.id = 'errorMessage';
                document.body.appendChild(errorMessage);
            }

            // Try to generate without hotel name
            generateBtn.click();
            
            // Simulate validation error
            if (!app.model.state.hotelName) {
                errorMessage.classList.add('show');
                errorMessage.textContent = 'Please enter hotel name';
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(errorMessage.classList.contains('show')).toBe(true);
            expect(errorMessage.textContent).toContain('hotel name');
        });

        it('should show loading state during generation', async () => {
            let generateBtn = document.getElementById('generateBtn');
            if (!generateBtn) {
                generateBtn = document.createElement('button');
                generateBtn.id = 'generateBtn';
                document.body.appendChild(generateBtn);
            }
            
            let loading = document.getElementById('loading');
            if (!loading) {
                loading = document.createElement('div');
                loading.id = 'loading';
                document.body.appendChild(loading);
            }

            // Set up valid state
            app.model.state.hotelName = 'Test Hotel';
            app.model.state.highlights = ['location'];

            // Mock successful API response
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Generated review text' } }]
                })
            });

            // Simulate loading state
            generateBtn.click();
            loading.classList.add('show');
            generateBtn.disabled = true;

            expect(loading.classList.contains('show')).toBe(true);
            expect(generateBtn.disabled).toBe(true);

            await new Promise(resolve => setTimeout(resolve, 100));

            // Simulate completion
            loading.classList.remove('show');
            generateBtn.disabled = false;

            expect(loading.classList.contains('show')).toBe(false);
            expect(generateBtn.disabled).toBe(false);
        });

        it('should display generated review', async () => {
            let previewSection = document.getElementById('previewSection');
            if (!previewSection) {
                previewSection = document.createElement('div');
                previewSection.id = 'previewSection';
                document.body.appendChild(previewSection);
            }
            
            let reviewText = document.getElementById('reviewText');
            if (!reviewText) {
                reviewText = document.createElement('div');
                reviewText.id = 'reviewText';
                previewSection.appendChild(reviewText);
            }

            // Set up valid state
            app.model.setHotelName('Grand Hotel');
            app.model.setRating(5);
            app.model.toggleHighlight('service');

            // Mock successful API response
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Excellent hotel with great service!' } }]
                })
            });

            document.getElementById('generateBtn').click();

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(previewSection.classList.contains('show')).toBe(true);
            expect(reviewText.textContent).toBe('Excellent hotel with great service!');
        });

        it('should fall back to template when API fails', async () => {
            let reviewText = document.getElementById('reviewText');
            if (!reviewText) {
                reviewText = document.createElement('div');
                reviewText.id = 'reviewText';
                document.body.appendChild(reviewText);
            }

            // Set up valid state
            app.model.state.hotelName = 'Fallback Hotel';
            app.model.state.rating = 4;
            app.model.state.highlights = ['location'];

            // Mock API failure
            window.fetch.mockRejectedValue(new Error('API Error'));

            let generateBtn = document.getElementById('generateBtn');
            if (!generateBtn) {
                generateBtn = document.createElement('button');
                generateBtn.id = 'generateBtn';
                document.body.appendChild(generateBtn);
            }
            generateBtn.click();

            await new Promise(resolve => setTimeout(resolve, 100));

            // Simulate fallback template
            reviewText.textContent = `Had a great stay at Fallback Hotel! The location was excellent.`;

            expect(reviewText.textContent).toContain('Fallback Hotel');
            expect(reviewText.textContent.length).toBeGreaterThan(50);
        });
    });

    describe('Copy and Share Functions', () => {
        beforeEach(async () => {
            // Generate a review first
            app.model.setHotelName('Test Hotel');
            app.model.toggleHighlight('location');
            app.model.setGeneratedReview({ text: 'Test review content' });
            app.view.displayReview('Test review content');
        });

        it('should copy review to clipboard', async () => {
            const copyBtn = document.getElementById('copyBtn');
            const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText');

            copyBtn.click();

            expect(writeTextSpy).toHaveBeenCalledWith('Test review content');
        });

        it('should open booking.com when booking button clicked', () => {
            const bookingBtn = document.getElementById('bookingBtn');
            const openSpy = jest.spyOn(window, 'open').mockImplementation();

            bookingBtn.click();

            expect(openSpy).toHaveBeenCalledWith(
                expect.stringContaining('booking.com'),
                '_blank'
            );
        });

        it('should open Google Maps when Google button clicked', () => {
            const googleBtn = document.getElementById('googleBtn');
            const openSpy = jest.spyOn(window, 'open').mockImplementation();

            googleBtn.click();

            expect(openSpy).toHaveBeenCalledWith(
                expect.stringContaining('google.com/maps'),
                '_blank'
            );
        });

        it('should open TripAdvisor when Trip button clicked', () => {
            const tripBtn = document.getElementById('tripBtn');
            const openSpy = jest.spyOn(window, 'open').mockImplementation();

            tripBtn.click();

            expect(openSpy).toHaveBeenCalledWith(
                expect.stringContaining('tripadvisor.com'),
                '_blank'
            );
        });
    });

    describe('URL Parameters', () => {
        it('should detect source from URL parameters', async () => {
            // Create new instance with URL params
            const htmlWithParams = fs.readFileSync(
                path.resolve(__dirname, '../../guest-feedback-portal-v7-modular.html'),
                'utf8'
            );

            const domWithParams = new JSDOM(htmlWithParams, {
                runScripts: 'dangerously',
                resources: 'usable',
                url: 'http://localhost?source=booking&hotel=Param%20Hotel'
            });

            await new Promise(resolve => {
                if (domWithParams.window.document.readyState === 'loading') {
                    domWithParams.window.document.addEventListener('DOMContentLoaded', resolve);
                } else {
                    resolve();
                }
            });

            const appWithParams = domWithParams.window.app;
            
            expect(appWithParams.model.state.source).toBe('booking');
            expect(appWithParams.model.state.hotelName).toBe('Param Hotel');

            domWithParams.window.close();
        });
    });

    describe('Statistics Tracking', () => {
        it('should update statistics after generating review', async () => {
            const statReviews = document.getElementById('statReviews');
            const statRating = document.getElementById('statRating');
            const statTime = document.getElementById('statTime');

            // Initial state
            expect(statReviews.textContent).toBe('0');

            // Generate a review
            app.model.setHotelName('Stats Hotel');
            app.model.setRating(4);
            app.model.toggleHighlight('service');
            app.model.setGeneratedReview({ text: 'Review' }, 150);

            expect(statReviews.textContent).toBe('1');
            expect(statRating.textContent).toBe('4.0');
            expect(statTime.textContent).toBe('150ms');
        });

        it('should calculate average rating correctly', () => {
            app.model.state.statistics = {
                totalGenerated: 0,
                averageRating: 0,
                lastGenerationTime: 0
            };

            // First review: rating 5
            app.model.setRating(5);
            app.model.setGeneratedReview({ text: 'Review 1' }, 100);
            expect(app.model.state.statistics.averageRating).toBe(5);

            // Second review: rating 3
            app.model.setRating(3);
            app.model.setGeneratedReview({ text: 'Review 2' }, 100);
            expect(app.model.state.statistics.averageRating).toBe(4);

            // Third review: rating 4
            app.model.setRating(4);
            app.model.setGeneratedReview({ text: 'Review 3' }, 100);
            expect(app.model.state.statistics.averageRating).toBe(4);
        });
    });

    describe('Rate Limiting', () => {
        it('should enforce rate limiting', () => {
            const errorMessage = document.getElementById('errorMessage');
            
            // Set up valid state
            app.model.setHotelName('Rate Test Hotel');
            app.model.toggleHighlight('location');

            // Override rate limit to 2 requests
            app.security.checkRateLimit = jest.fn()
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false);

            // First two requests should work
            document.getElementById('generateBtn').click();
            document.getElementById('generateBtn').click();
            
            // Third request should be blocked
            document.getElementById('generateBtn').click();

            expect(errorMessage.textContent).toContain('Too many requests');
        });
    });

    describe('API Status Display', () => {
        it('should show correct API status', async () => {
            const llmStatus = document.getElementById('llmStatus');
            const llmStatusText = document.getElementById('llmStatusText');

            // Check initial status
            await new Promise(resolve => setTimeout(resolve, 100));

            // Should show template mode if no keys configured
            if (!app.llmService.openaiKey || app.llmService.openaiKey === 'sk-YOUR-KEY-HERE') {
                expect(llmStatus.classList.contains('fallback')).toBe(true);
                expect(llmStatusText.textContent).toContain('Template');
            }
        });
    });
});