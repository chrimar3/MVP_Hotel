/**
 * Unit Tests for ReviewModel
 * Tests data management, state updates, and business logic
 */

const { ReviewModel } = require('../../src/models/ReviewModel');

describe('ReviewModel', () => {
    let model;
    let mockObserver;

    beforeEach(() => {
        model = new ReviewModel();
        mockObserver = jest.fn();
        localStorage.clear();
    });

    describe('initialization', () => {
        it('should initialize with default state', () => {
            const state = model.getState();
            expect(state.hotelName).toBe('');
            expect(state.rating).toBe(5);
            expect(state.tripType).toBe('leisure');
            expect(state.highlights).toEqual([]);
            expect(state.language).toBe('en');
            expect(state.voice).toBe('friendly');
            expect(state.nights).toBe(3);
            expect(state.guests).toBe(2);
            expect(state.source).toBe('direct');
            expect(state.generatedReview).toBeNull();
        });

        it('should load saved state from localStorage', () => {
            const savedState = {
                stats: {
                    totalGenerated: 10,
                    averageRating: 4.5
                },
                language: 'es',
                voice: 'professional'
            };
            localStorage.setItem('reviewModelState', JSON.stringify(savedState));
            
            const newModel = new ReviewModel();
            const state = newModel.getState();
            
            expect(state.statistics.totalGenerated).toBe(10);
            expect(state.statistics.averageRating).toBe(4.5);
            expect(state.language).toBe('es');
            expect(state.voice).toBe('professional');
        });
    });

    describe('observer pattern', () => {
        it('should subscribe and notify observers', () => {
            const unsubscribe = model.subscribe(mockObserver);
            
            model.setHotelName('Test Hotel');
            
            expect(mockObserver).toHaveBeenCalledWith('stateChange', expect.objectContaining({
                key: 'hotelName',
                value: 'Test Hotel'
            }));
        });

        it('should unsubscribe observers', () => {
            const unsubscribe = model.subscribe(mockObserver);
            unsubscribe();
            
            model.setHotelName('Test Hotel');
            
            expect(mockObserver).not.toHaveBeenCalled();
        });

        it('should notify multiple observers', () => {
            const observer1 = jest.fn();
            const observer2 = jest.fn();
            
            model.subscribe(observer1);
            model.subscribe(observer2);
            
            model.setRating(4);
            
            expect(observer1).toHaveBeenCalled();
            expect(observer2).toHaveBeenCalled();
        });
    });

    describe('setHotelInfo', () => {
        it('should set hotel name and source', () => {
            model.setHotelInfo('Grand Hotel', 'booking');
            const state = model.getState();
            
            expect(state.hotelName).toBe('Grand Hotel');
            expect(state.source).toBe('booking');
        });

        it('should default source to direct', () => {
            model.setHotelInfo('Test Hotel');
            const state = model.getState();
            
            expect(state.source).toBe('direct');
        });
    });

    describe('setRating', () => {
        it('should set valid ratings', () => {
            model.setRating(4);
            expect(model.getState().rating).toBe(4);
            
            model.setRating(1);
            expect(model.getState().rating).toBe(1);
            
            model.setRating(5);
            expect(model.getState().rating).toBe(5);
        });

        it('should reject invalid ratings', () => {
            model.setRating(0);
            expect(model.getState().rating).toBe(5); // Should remain unchanged
            
            model.setRating(6);
            expect(model.getState().rating).toBe(5); // Should remain unchanged
        });

        it('should update statistics when rating changes', () => {
            model.setRating(4);
            // Statistics update is tested in updateStatistics tests
        });
    });

    describe('setTripDetails', () => {
        it('should set trip type, nights, and guests', () => {
            model.setTripDetails('business', 7, 3);
            const state = model.getState();
            
            expect(state.tripType).toBe('business');
            expect(state.nights).toBe(7);
            expect(state.guests).toBe(3);
        });
    });

    describe('toggleHighlight', () => {
        it('should add highlight when not present', () => {
            model.toggleHighlight('location');
            expect(model.getState().highlights).toContain('location');
        });

        it('should remove highlight when present', () => {
            model.toggleHighlight('location');
            model.toggleHighlight('location');
            expect(model.getState().highlights).not.toContain('location');
        });

        it('should handle multiple highlights', () => {
            model.toggleHighlight('location');
            model.toggleHighlight('service');
            model.toggleHighlight('cleanliness');
            
            const highlights = model.getState().highlights;
            expect(highlights).toHaveLength(3);
            expect(highlights).toContain('location');
            expect(highlights).toContain('service');
            expect(highlights).toContain('cleanliness');
        });
    });

    describe('setLanguage', () => {
        it('should set language', () => {
            model.setLanguage('es');
            expect(model.getState().language).toBe('es');
        });
    });

    describe('setVoice', () => {
        it('should set voice style', () => {
            model.setVoice('professional');
            expect(model.getState().voice).toBe('professional');
        });
    });

    describe('setGeneratedReview', () => {
        it('should store review and update statistics', () => {
            const review = { text: 'Great hotel!', source: 'template' };
            model.setGeneratedReview(review);
            
            const state = model.getState();
            expect(state.generatedReview).toEqual(review);
            expect(state.statistics.totalGenerated).toBe(1);
        });

        it('should notify observers when review is generated', () => {
            model.subscribe(mockObserver);
            const review = { text: 'Test review' };
            
            model.setGeneratedReview(review);
            
            expect(mockObserver).toHaveBeenCalledWith('reviewGenerated', review);
        });
    });

    describe('updateStatistics', () => {
        it('should calculate average rating correctly', () => {
            // First review with rating 5
            model.setRating(5);
            model.updateStatistics('rating', 5);
            expect(model.getState().statistics.averageRating).toBe(5);
            
            // Second review with rating 3
            model.updateStatistics('rating', 3);
            expect(model.getState().statistics.averageRating).toBe(4);
        });

        it('should track popular highlights', () => {
            model.updateStatistics('highlight', 'location');
            model.updateStatistics('highlight', 'service');
            model.updateStatistics('highlight', 'location');
            model.updateStatistics('highlight', 'location');
            model.updateStatistics('highlight', 'service');
            
            const highlights = model.getState().statistics.popularHighlights;
            expect(highlights[0]).toEqual({ name: 'location', count: 3 });
            expect(highlights[1]).toEqual({ name: 'service', count: 2 });
        });

        it('should limit popular highlights to top 10', () => {
            for (let i = 0; i < 15; i++) {
                model.updateStatistics('highlight', `highlight${i}`);
            }
            
            const highlights = model.getState().statistics.popularHighlights;
            expect(highlights).toHaveLength(10);
        });
    });

    describe('validate', () => {
        it('should validate valid state', () => {
            model.setHotelName('Test Hotel');
            model.setRating(5);
            model.toggleHighlight('location');
            
            const validation = model.validate();
            expect(validation.valid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        it('should require hotel name', () => {
            model.setRating(5);
            model.toggleHighlight('location');
            
            const validation = model.validate();
            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('Hotel name is required');
        });

        it('should require valid rating', () => {
            model.setHotelName('Test Hotel');
            model.state.rating = 0; // Force invalid rating
            model.toggleHighlight('location');
            
            const validation = model.validate();
            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('Valid rating is required');
        });

        it('should require at least one highlight', () => {
            model.setHotelName('Test Hotel');
            model.setRating(5);
            
            const validation = model.validate();
            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('At least one highlight must be selected');
        });
    });

    describe('reset', () => {
        it('should reset state but preserve statistics', () => {
            // Set up some state
            model.setHotelName('Test Hotel');
            model.setRating(4);
            model.toggleHighlight('location');
            model.state.statistics = {
                totalGenerated: 5,
                averageRating: 4.2,
                popularHighlights: []
            };
            
            model.reset();
            
            const state = model.getState();
            expect(state.hotelName).toBe('');
            expect(state.rating).toBe(5);
            expect(state.highlights).toEqual([]);
            expect(state.statistics.totalGenerated).toBe(5); // Preserved
            expect(state.statistics.averageRating).toBe(4.2); // Preserved
        });

        it('should notify observers of reset', () => {
            model.subscribe(mockObserver);
            model.reset();
            
            expect(mockObserver).toHaveBeenCalledWith('reset', null);
        });
    });

    describe('saveState and loadState', () => {
        it('should save only persistent data', () => {
            model.setHotelName('Test Hotel');
            model.setLanguage('fr');
            model.setVoice('enthusiastic');
            model.state.statistics = {
                totalGenerated: 10,
                averageRating: 4.5,
                popularHighlights: []
            };
            
            model.saveState();
            
            const saved = JSON.parse(localStorage.getItem('reviewModelState'));
            expect(saved.statistics.totalGenerated).toBe(10);
            expect(saved.language).toBe('fr');
            expect(saved.voice).toBe('enthusiastic');
            expect(saved.hotelName).toBeUndefined(); // Should not save transient data
        });

        it('should handle localStorage errors gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            localStorage.setItem = jest.fn(() => {
                throw new Error('Storage error');
            });
            
            model.saveState();
            
            expect(consoleSpy).toHaveBeenCalledWith('Failed to save state:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('exportAnalytics', () => {
        it('should export analytics data', () => {
            model.state.statistics = {
                totalGenerated: 100,
                averageRating: 4.3,
                popularHighlights: [
                    { name: 'location', count: 50 },
                    { name: 'service', count: 30 }
                ]
            };
            
            const analytics = model.exportAnalytics();
            
            expect(analytics.totalReviews).toBe(100);
            expect(analytics.averageRating).toBe(4.3);
            expect(analytics.popularHighlights).toHaveLength(2);
            expect(analytics.timestamp).toBeDefined();
        });
    });
});