// Hotel Review Generator Module
// Extracted from ultimate-ux-enhanced-v3.html for testing

class HotelReviewGenerator {
    constructor() {
        this.selectedAspects = new Set();
        this.profanityList = ['damn', 'hell', 'crap', 'awful', 'terrible'];
        this.platformUrls = new Map([
            ['booking', 'https://www.booking.com/reviewlist.html'],
            ['tripadvisor', 'https://www.tripadvisor.com/UserReview'],
            ['google', 'https://maps.google.com/maps/place']
        ]);
        this.isGenerating = false;
        this.translations = {
            en: {
                title: 'Hotel Review Generator',
                hotelNameLabel: 'Hotel Name',
                hotelNamePlaceholder: 'Enter hotel name...',
                aspectsTitle: 'Select Aspects to Review',
                cleanlinessLabel: 'Cleanliness',
                serviceLabel: 'Service',
                locationLabel: 'Location',
                valueLabel: 'Value for Money',
                commentsLabel: 'Additional Comments',
                commentsPlaceholder: 'Share more details...',
                generateBtn: 'Generate Review',
                copyBtn: 'Copy to Clipboard',
                regenerateBtn: 'Generate New Review',
                submitBooking: 'Submit to Booking.com',
                submitTripadvisor: 'Submit to TripAdvisor',
                submitGoogle: 'Submit to Google Maps'
            },
            es: {
                title: 'Generador de Reseñas de Hoteles',
                hotelNameLabel: 'Nombre del Hotel',
                hotelNamePlaceholder: 'Ingrese el nombre del hotel...',
                aspectsTitle: 'Seleccione Aspectos a Revisar',
                cleanlinessLabel: 'Limpieza',
                serviceLabel: 'Servicio',
                locationLabel: 'Ubicación',
                valueLabel: 'Relación Calidad-Precio',
                commentsLabel: 'Comentarios Adicionales',
                commentsPlaceholder: 'Comparta más detalles...',
                generateBtn: 'Generar Reseña',
                copyBtn: 'Copiar al Portapapeles',
                regenerateBtn: 'Generar Nueva Reseña',
                submitBooking: 'Enviar a Booking.com',
                submitTripadvisor: 'Enviar a TripAdvisor',
                submitGoogle: 'Enviar a Google Maps'
            },
            ar: {
                title: 'مولد تقييمات الفنادق',
                hotelNameLabel: 'اسم الفندق',
                hotelNamePlaceholder: 'أدخل اسم الفندق...',
                aspectsTitle: 'اختر الجوانب للمراجعة',
                cleanlinessLabel: 'النظافة',
                serviceLabel: 'الخدمة',
                locationLabel: 'الموقع',
                valueLabel: 'القيمة مقابل المال',
                commentsLabel: 'تعليقات إضافية',
                commentsPlaceholder: 'شارك المزيد من التفاصيل...',
                generateBtn: 'إنشاء مراجعة',
                copyBtn: 'نسخ إلى الحافظة',
                regenerateBtn: 'إنشاء مراجعة جديدة',
                submitBooking: 'إرسال إلى Booking.com',
                submitTripadvisor: 'إرسال إلى TripAdvisor',
                submitGoogle: 'إرسال إلى خرائط جوجل'
            },
            fr: {
                title: 'Générateur d\'Avis d\'Hôtel',
                hotelNameLabel: 'Nom de l\'Hôtel',
                hotelNamePlaceholder: 'Entrez le nom de l\'hôtel...',
                aspectsTitle: 'Sélectionner les Aspects à Évaluer',
                cleanlinessLabel: 'Propreté',
                serviceLabel: 'Service',
                locationLabel: 'Emplacement',
                valueLabel: 'Rapport Qualité-Prix',
                commentsLabel: 'Commentaires Supplémentaires',
                commentsPlaceholder: 'Partagez plus de détails...',
                generateBtn: 'Générer l\'Avis',
                copyBtn: 'Copier dans le Presse-papiers',
                regenerateBtn: 'Générer un Nouvel Avis',
                submitBooking: 'Soumettre à Booking.com',
                submitTripadvisor: 'Soumettre à TripAdvisor',
                submitGoogle: 'Soumettre à Google Maps'
            }
        };
        this.currentLanguage = 'en';
    }

    detectLanguage() {
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        
        if (langParam && this.translations[langParam]) {
            return langParam;
        }
        
        const browserLang = navigator.language.split('-')[0];
        const supportedLangs = Object.keys(this.translations);
        
        if (supportedLangs.includes(browserLang)) {
            return browserLang;
        }
        
        const savedLang = localStorage.getItem('preferred_language');
        if (savedLang && this.translations[savedLang]) {
            return savedLang;
        }
        
        return 'en';
    }

    setLanguage(lang) {
        if (!this.translations[lang]) {
            return false;
        }
        
        this.currentLanguage = lang;
        localStorage.setItem('preferred_language', lang);
        
        // Set RTL for Arabic
        if (lang === 'ar' || lang === 'he') {
            document.dir = 'rtl';
        } else {
            document.dir = 'ltr';
        }
        
        return true;
    }

    translate(key) {
        return this.translations[this.currentLanguage][key] || this.translations.en[key] || key;
    }

    toggleAspect(aspect) {
        if (this.selectedAspects.has(aspect)) {
            this.selectedAspects.delete(aspect);
            return false;
        } else {
            this.selectedAspects.add(aspect);
            return true;
        }
    }

    validateReview(review, hotelName) {
        const errors = [];
        const warnings = [];
        
        if (!review || review.length < 50) {
            errors.push('Review must be at least 50 characters long');
        }
        
        if (review.length > 5000) {
            errors.push('Review must be less than 5000 characters');
        }
        
        const lowerReview = review.toLowerCase();
        for (const word of this.profanityList) {
            if (lowerReview.includes(word)) {
                warnings.push(`Contains potentially inappropriate language: "${word}"`);
            }
        }
        
        if (!review.includes(hotelName)) {
            warnings.push('Review doesn\'t mention the hotel name');
        }
        
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    createReview(hotelName, comments = '') {
        if (!hotelName) {
            throw new Error('Hotel name is required');
        }
        
        const aspects = Array.from(this.selectedAspects);
        
        const aspectSentences = {
            cleanliness: [
                'The room was spotlessly clean and well-maintained.',
                'Cleanliness standards were exceptional throughout the property.',
                'The housekeeping team did an outstanding job keeping everything pristine.'
            ],
            service: [
                'The staff went above and beyond to ensure our comfort.',
                'Service was prompt, professional, and always delivered with a smile.',
                'Every team member we encountered was helpful and accommodating.'
            ],
            location: [
                'The location was perfect for exploring the area.',
                'Conveniently situated with easy access to major attractions.',
                'The hotel\'s location made our stay incredibly convenient.'
            ],
            value: [
                'Excellent value for the price paid.',
                'The quality exceeded our expectations for the price point.',
                'Worth every penny and would definitely book again.'
            ]
        };
        
        const templates = [
            `My recent stay at ${hotelName} was truly exceptional. `,
            `I had a wonderful experience at ${hotelName}. `,
            `${hotelName} exceeded all my expectations. `,
            `I thoroughly enjoyed my time at ${hotelName}. `
        ];
        
        let review = templates[Math.floor(Math.random() * templates.length)];
        
        aspects.forEach((aspect, index) => {
            if (aspectSentences[aspect]) {
                const sentences = aspectSentences[aspect];
                review += sentences[Math.floor(Math.random() * sentences.length)] + ' ';
            }
        });
        
        if (comments) {
            review += comments + ' ';
        }
        
        review += `I highly recommend ${hotelName} to anyone visiting the area.`;
        
        return review;
    }

    generatePlatformUrl(platform, hotelName) {
        const baseUrl = this.platformUrls.get(platform);
        if (!baseUrl) {
            return null;
        }
        
        const encodedHotel = encodeURIComponent(hotelName);
        
        switch(platform) {
            case 'booking':
                return `${baseUrl}?hotel=${encodedHotel}&tab=write_review`;
            case 'tripadvisor':
                return `${baseUrl}?hotel=${encodedHotel}`;
            case 'google':
                return `${baseUrl}/search/${encodedHotel}/reviews`;
            default:
                return baseUrl;
        }
    }

    copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return Promise.resolve(success);
        } catch (err) {
            document.body.removeChild(textarea);
            return Promise.reject(err);
        }
    }

    saveDraft(hotelName, comments) {
        const draft = {
            hotelName,
            selectedAspects: Array.from(this.selectedAspects),
            comments,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('hotelReviewDraft', JSON.stringify(draft));
            return true;
        } catch (e) {
            // Handle quota exceeded
            if (e.name === 'QuotaExceededError') {
                localStorage.clear();
                localStorage.setItem('hotelReviewDraft', JSON.stringify(draft));
            }
            return false;
        }
    }

    loadDraft() {
        try {
            const saved = localStorage.getItem('hotelReviewDraft');
            if (saved) {
                const draft = JSON.parse(saved);
                return draft;
            }
        } catch (e) {
            console.error('Failed to load draft:', e);
        }
        return null;
    }

    debounce(func, wait = 500) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Analytics Module
class HotelAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.events = [];
        this.pageViews = 0;
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    trackEvent(category, action, label = null, value = null) {
        const event = {
            category,
            action,
            label,
            value,
            timestamp: Date.now(),
            sessionId: this.sessionId
        };
        
        this.events.push(event);
        
        // Send to analytics service
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: category,
                event_label: label,
                value: value
            });
        }
        
        return event;
    }

    trackPageView(page = window.location.pathname) {
        this.pageViews++;
        
        const pageView = {
            page,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            referrer: document.referrer,
            userAgent: navigator.userAgent
        };
        
        if (typeof gtag !== 'undefined') {
            gtag('config', 'GA_MEASUREMENT_ID', {
                page_path: page
            });
        }
        
        return pageView;
    }

    getSessionMetrics() {
        const duration = Date.now() - this.startTime;
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        
        return {
            sessionId: this.sessionId,
            duration,
            durationFormatted: `${minutes}m ${seconds}s`,
            pageViews: this.pageViews,
            totalEvents: this.events.length,
            events: this.events
        };
    }

    trackDoNotTrack() {
        const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
        return dnt === '1' || dnt === 'yes';
    }
}

// PWA Manager
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isOnline = navigator.onLine;
        this.serviceWorkerRegistration = null;
    }

    async init() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                this.serviceWorkerRegistration = registration;
                console.log('ServiceWorker registered:', registration);
                return registration;
            } catch (error) {
                console.error('ServiceWorker registration failed:', error);
                throw error;
            }
        }
        return null;
    }

    handleOnlineStatus() {
        this.isOnline = navigator.onLine;
        
        if (!this.isOnline) {
            this.showOfflineBanner();
        } else {
            this.hideOfflineBanner();
        }
        
        return this.isOnline;
    }

    showOfflineBanner() {
        const banner = document.getElementById('offline-banner');
        if (banner) {
            banner.classList.add('visible');
        }
    }

    hideOfflineBanner() {
        const banner = document.getElementById('offline-banner');
        if (banner) {
            banner.classList.remove('visible');
        }
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });
    }

    showInstallButton() {
        const btn = document.getElementById('install-btn');
        if (btn) {
            btn.style.display = 'block';
        }
    }

    async promptInstall() {
        if (!this.deferredPrompt) {
            return false;
        }
        
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        this.deferredPrompt = null;
        
        return outcome === 'accepted';
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        HotelReviewGenerator,
        HotelAnalytics,
        PWAManager
    };
}