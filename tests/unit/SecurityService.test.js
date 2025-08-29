/**
 * Unit Tests for SecurityService
 * Tests XSS prevention, input validation, and sanitization
 */

const { SecurityService } = require('../../src/utils/security');

describe('SecurityService', () => {
    let security;

    beforeEach(() => {
        security = new SecurityService();
    });

    describe('sanitizeHTML', () => {
        it('should escape dangerous HTML tags', () => {
            const dirty = '<script>alert("XSS")</script>';
            const clean = security.sanitizeHTML(dirty);
            expect(clean).not.toContain('<script>');
            expect(clean).toContain('&lt;script&gt;');
        });

        it('should allow safe HTML tags', () => {
            const input = '<b>Bold</b> and <i>italic</i>';
            const result = security.sanitizeHTML(input);
            expect(result).toContain('<b>');
            expect(result).toContain('<i>');
        });

        it('should escape quotes and special characters', () => {
            const input = '"Test" & \'quote\' < > /';
            const result = security.sanitizeHTML(input);
            expect(result).toContain('&quot;');
            expect(result).toContain('&#x27;');
            expect(result).toContain('&lt;');
            expect(result).toContain('&gt;');
            expect(result).toContain('&#x2F;');
        });

        it('should handle empty input', () => {
            expect(security.sanitizeHTML('')).toBe('');
            expect(security.sanitizeHTML(null)).toBe('');
            expect(security.sanitizeHTML(undefined)).toBe('');
        });
    });

    describe('sanitizeText', () => {
        it('should remove all HTML tags', () => {
            const input = '<div>Test <script>alert(1)</script></div>';
            const result = security.sanitizeText(input);
            expect(result).toBe('div Test scriptalert(1)/script/div');
        });

        it('should remove javascript: protocol', () => {
            const input = 'javascript:alert(1)';
            const result = security.sanitizeText(input);
            expect(result).toBe('alert(1)');
        });

        it('should remove event handlers', () => {
            const input = 'onclick=alert(1) onmouseover=alert(2)';
            const result = security.sanitizeText(input);
            expect(result).toBe('alert(1) alert(2)');
        });

        it('should limit text length to 10000 characters', () => {
            const longText = 'a'.repeat(15000);
            const result = security.sanitizeText(longText);
            expect(result.length).toBe(10000);
        });

        it('should trim whitespace', () => {
            const input = '  test content  ';
            const result = security.sanitizeText(input);
            expect(result).toBe('test content');
        });
    });

    describe('validateEmail', () => {
        it('should validate correct email formats', () => {
            expect(security.validateEmail('test@example.com')).toBe('test@example.com');
            expect(security.validateEmail('user.name@domain.co.uk')).toBe('user.name@domain.co.uk');
            expect(security.validateEmail('user+tag@example.org')).toBe('user+tag@example.org');
        });

        it('should reject invalid email formats', () => {
            expect(security.validateEmail('invalid')).toBeNull();
            expect(security.validateEmail('@example.com')).toBeNull();
            expect(security.validateEmail('user@')).toBeNull();
            expect(security.validateEmail('user@.com')).toBeNull();
        });

        it('should sanitize and lowercase email', () => {
            expect(security.validateEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
            expect(security.validateEmail(' test@example.com ')).toBe('test@example.com');
        });

        it('should handle XSS attempts in email', () => {
            expect(security.validateEmail('<script>@example.com')).toBeNull();
            expect(security.validateEmail('test@<script>.com')).toBeNull();
        });
    });

    describe('validateHotelName', () => {
        it('should allow valid hotel names', () => {
            expect(security.validateHotelName('Grand Hotel')).toBe('Grand Hotel');
            expect(security.validateHotelName("Marriott's Resort")).toBe("Marriott's Resort");
            expect(security.validateHotelName('Hotel & Spa')).toBe('Hotel & Spa');
        });

        it('should remove invalid characters', () => {
            expect(security.validateHotelName('Hotel<script>')).toBe('Hotelscript');
            expect(security.validateHotelName('Hotel@#$%')).toBe('Hotel');
        });

        it('should limit name length to 100 characters', () => {
            const longName = 'A'.repeat(150);
            const result = security.validateHotelName(longName);
            expect(result.length).toBe(100);
        });

        it('should provide default for empty input', () => {
            expect(security.validateHotelName('')).toBe('Hotel');
            expect(security.validateHotelName(null)).toBe('Hotel');
        });
    });

    describe('validateRating', () => {
        it('should accept valid ratings 1-5', () => {
            expect(security.validateRating(1)).toBe(1);
            expect(security.validateRating(3)).toBe(3);
            expect(security.validateRating(5)).toBe(5);
        });

        it('should reject invalid ratings', () => {
            expect(security.validateRating(0)).toBe(0);
            expect(security.validateRating(6)).toBe(0);
            expect(security.validateRating(-1)).toBe(0);
        });

        it('should handle string input', () => {
            expect(security.validateRating('3')).toBe(3);
            expect(security.validateRating('5.5')).toBe(5);
        });

        it('should handle non-numeric input', () => {
            expect(security.validateRating('abc')).toBe(0);
            expect(security.validateRating(null)).toBe(0);
            expect(security.validateRating(undefined)).toBe(0);
        });
    });

    describe('validateTripType', () => {
        it('should accept valid trip types', () => {
            expect(security.validateTripType('business')).toBe('business');
            expect(security.validateTripType('leisure')).toBe('leisure');
            expect(security.validateTripType('family')).toBe('family');
            expect(security.validateTripType('romance')).toBe('romance');
        });

        it('should default to leisure for invalid types', () => {
            expect(security.validateTripType('invalid')).toBe('leisure');
            expect(security.validateTripType('')).toBe('leisure');
            expect(security.validateTripType(null)).toBe('leisure');
        });

        it('should handle case insensitive input', () => {
            expect(security.validateTripType('BUSINESS')).toBe('business');
            expect(security.validateTripType('Family')).toBe('family');
        });

        it('should sanitize input', () => {
            expect(security.validateTripType('<script>business</script>')).toBe('leisure');
        });
    });

    describe('checkRateLimit', () => {
        beforeEach(() => {
            localStorage.clear();
            jest.spyOn(Date, 'now').mockReturnValue(1000);
        });

        afterEach(() => {
            Date.now.mockRestore();
        });

        it('should allow requests within limit', () => {
            expect(security.checkRateLimit('test', 3, 60000)).toBe(true);
            expect(security.checkRateLimit('test', 3, 60000)).toBe(true);
            expect(security.checkRateLimit('test', 3, 60000)).toBe(true);
        });

        it('should block requests exceeding limit', () => {
            expect(security.checkRateLimit('test', 2, 60000)).toBe(true);
            expect(security.checkRateLimit('test', 2, 60000)).toBe(true);
            expect(security.checkRateLimit('test', 2, 60000)).toBe(false);
        });

        it('should reset after time window', () => {
            expect(security.checkRateLimit('test', 1, 1000)).toBe(true);
            expect(security.checkRateLimit('test', 1, 1000)).toBe(false);
            
            // Move time forward past window
            Date.now.mockReturnValue(3000);
            expect(security.checkRateLimit('test', 1, 1000)).toBe(true);
        });

        it('should track different actions separately', () => {
            expect(security.checkRateLimit('action1', 1, 60000)).toBe(true);
            expect(security.checkRateLimit('action1', 1, 60000)).toBe(false);
            expect(security.checkRateLimit('action2', 1, 60000)).toBe(true);
        });
    });

    describe('generateNonce', () => {
        it('should generate unique nonces', () => {
            const nonce1 = security.generateNonce();
            const nonce2 = security.generateNonce();
            expect(nonce1).not.toBe(nonce2);
        });

        it('should generate base64 encoded strings', () => {
            const nonce = security.generateNonce();
            expect(nonce).toMatch(/^[A-Za-z0-9+/=]+$/);
        });

        it('should generate consistent length nonces', () => {
            const nonce = security.generateNonce();
            // Base64 encoding of 16 bytes should be 24 characters
            expect(nonce.length).toBeGreaterThan(0);
            expect(nonce.length).toBeLessThanOrEqual(24);
        });
    });

    describe('createElement', () => {
        beforeEach(() => {
            document.body.innerHTML = '';
        });

        it('should create safe DOM elements', () => {
            const element = security.createElement('div', 'Test content', {
                class: 'test-class',
                id: 'test-id'
            });
            
            expect(element.tagName).toBe('DIV');
            expect(element.textContent).toBe('Test content');
            expect(element.className).toBe('test-class');
            expect(element.id).toBe('test-id');
        });

        it('should only allow safe attributes', () => {
            const element = security.createElement('button', 'Click', {
                class: 'btn',
                onclick: 'alert(1)',  // Should be ignored
                'data-rating': '5'
            });
            
            expect(element.className).toBe('btn');
            expect(element.onclick).toBeNull();
            expect(element.getAttribute('data-rating')).toBe('5');
        });

        it('should sanitize attribute values', () => {
            const element = security.createElement('a', 'Link', {
                href: 'javascript:alert(1)'
            });
            
            expect(element.href).not.toContain('javascript:');
        });
    });

    describe('validateNumber', () => {
        it('should validate numbers within range', () => {
            expect(security.validateNumber(5, 1, 10, 0)).toBe(5);
            expect(security.validateNumber('7', 1, 10, 0)).toBe(7);
            expect(security.validateNumber(10.5, 1, 20, 0)).toBe(10.5);
        });

        it('should return default for out of range', () => {
            expect(security.validateNumber(15, 1, 10, 5)).toBe(5);
            expect(security.validateNumber(-1, 0, 10, 5)).toBe(5);
        });

        it('should handle invalid input', () => {
            expect(security.validateNumber('abc', 1, 10, 5)).toBe(5);
            expect(security.validateNumber(null, 1, 10, 5)).toBe(5);
            expect(security.validateNumber(undefined, 1, 10, 5)).toBe(5);
        });
    });

    describe('validateURLParams', () => {
        it('should validate and sanitize URL parameters', () => {
            const params = new URLSearchParams('source=booking&tripType=business&nights=5&guests=2&hotel=Grand%20Hotel');
            const result = security.validateURLParams(params);
            
            expect(result.source).toBe('booking');
            expect(result.tripType).toBe('business');
            expect(result.nights).toBe(5);
            expect(result.guests).toBe(2);
            expect(result.hotel).toBe('Grand Hotel');
        });

        it('should provide defaults for missing parameters', () => {
            const params = new URLSearchParams('');
            const result = security.validateURLParams(params);
            
            expect(result.source).toBe('direct');
            expect(result.tripType).toBe('leisure');
            expect(result.nights).toBe(3);
            expect(result.guests).toBe(2);
            expect(result.hotel).toBe('Grand Hotel');
        });

        it('should sanitize malicious input', () => {
            const params = new URLSearchParams('hotel=<script>alert(1)</script>&source=<img src=x onerror=alert(1)>');
            const result = security.validateURLParams(params);
            
            expect(result.hotel).not.toContain('<script>');
            expect(result.source).not.toContain('<img');
        });
    });
});