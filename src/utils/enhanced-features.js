/**
 * Enhanced Review Generator - Deferred Features Module
 * Loads after core functionality to optimize initial page load
 */

window.EnhancedReviewGenerator = {
    hotelName: '',
    selectedAspects: [],
    reviewText: '',
    platform: 'booking',
    language: 'en',
    staffName: '',

    // Translations loaded on demand
    translations: null,

    init(hotelName) {
        this.hotelName = hotelName;
        this.renderFullForm();
        this.loadTranslations();
        this.initializeAnalytics();
        this.startSocialProof();
    },

    renderFullForm() {
        const deferredContent = document.getElementById('deferredContent');
        if (!deferredContent) return;

        deferredContent.innerHTML = `
            <div class="form-group aspect-selection"><label>What did you enjoy? (Select multiple)</label><div class="aspect-grid" id="aspectGrid">${this.getAspectButtons()}</div></div>
            <div class="form-group"><label for="staffName"><span>👏 Staff member to recognize (optional)</span><span class="bonus-points">+20 points!</span></label><input type="text" id="staffName" placeholder="e.g., Maria at reception" class="staff-input"></div>

            <!-- Platform Selection -->
            <div class="form-group">
                <label>Where will you post?</label>
                <div class="platform-selector" id="platformSelector">
                    ${this.getPlatformButtons()}
                </div>
            </div>

            <!-- Generated Review -->
            <div class="review-output" id="reviewOutput" style="display:none;">
                <h3>Your Perfect Review is Ready!</h3>
                <div class="review-text" id="reviewText"></div>
                <div class="action-buttons">
                    <button class="btn-copy" onclick="EnhancedReviewGenerator.copyReview()">
                        📋 Copy Review
                    </button>
                    <button class="btn-share" onclick="EnhancedReviewGenerator.shareReview()">
                        🔗 Share Link
                    </button>
                </div>
            </div>

            <!-- Social Proof Ticker -->
            <div class="social-proof-ticker" id="socialProof"></div>
        `;

        // Apply enhanced styles
        this.injectEnhancedStyles();

        // Attach event listeners
        this.attachEventListeners();

        // Show content
        deferredContent.style.display = 'block';

        // Animate entrance
        deferredContent.style.opacity = '0';
        setTimeout(() => {
            deferredContent.style.transition = 'opacity 0.5s';
            deferredContent.style.opacity = '1';
        }, 100);
    },

    getAspectButtons() {
        const aspects = [
            { id: 'location', label: '📍 Location', points: 5 },
            { id: 'cleanliness', label: '✨ Cleanliness', points: 5 },
            { id: 'service', label: '🌟 Service', points: 5 },
            { id: 'comfort', label: '🛏️ Comfort', points: 5 },
            { id: 'facilities', label: '🏊 Facilities', points: 5 },
            { id: 'value', label: '💰 Value', points: 5 },
            { id: 'breakfast', label: '🍳 Breakfast', points: 5 },
            { id: 'wifi', label: '📶 WiFi', points: 5 }
        ];

        return aspects.map(aspect => `
            <button 
                type="button" 
                class="aspect-btn" 
                data-aspect="${aspect.id}"
                data-points="${aspect.points}"
                onclick="EnhancedReviewGenerator.selectAspect('${aspect.id}', ${aspect.points})"
            >
                ${aspect.label}
            </button>
        `).join('');
    },

    getPlatformButtons() {
        const platforms = [
            { id: 'booking', name: 'Booking.com', icon: '🏨' },
            { id: 'tripadvisor', name: 'TripAdvisor', icon: '🦉' },
            { id: 'google', name: 'Google', icon: '🔍' },
            { id: 'expedia', name: 'Expedia', icon: '✈️' }
        ];

        return platforms.map(platform => `
            <button 
                type="button" 
                class="platform-btn ${platform.id === 'booking' ? 'selected' : ''}" 
                data-platform="${platform.id}"
                onclick="EnhancedReviewGenerator.selectPlatform('${platform.id}')"
            >
                ${platform.icon} ${platform.name}
            </button>
        `).join('');
    },

    selectAspect(aspect, points) {
        const btn = document.querySelector(`[data-aspect="${aspect}"]`);
        if (!btn) return;

        if (this.selectedAspects.includes(aspect)) {
            this.selectedAspects = this.selectedAspects.filter(a => a !== aspect);
            btn.classList.remove('selected');
        } else {
            this.selectedAspects.push(aspect);
            btn.classList.add('selected');

            // Award points
            window.GameSystem.addPoints(points, `selecting ${aspect}`);

            // Celebrate with confetti for milestones
            if (this.selectedAspects.length === 3) {
                this.triggerConfetti();
                window.GameSystem.addPoints(10, 'great selections!');
            }
        }

        // Auto-generate if enough aspects selected
        if (this.selectedAspects.length >= 2) {
            this.generateReview();
        }
    },

    selectPlatform(platform) {
        this.platform = platform;

        // Update UI
        document.querySelectorAll('.platform-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-platform="${platform}"]`)?.classList.add('selected');
    },

    generateReview() {
        const staffName = document.getElementById('staffName')?.value.trim();

        // Build review based on selections
        const templates = this.getReviewTemplates();
        const template = templates[Math.floor(Math.random() * templates.length)];

        let review = template
            .replace('{hotel}', this.hotelName)
            .replace('{aspects}', this.formatAspects());

        if (staffName) {
            review += ` Special thanks to ${staffName} for making our stay memorable!`;
            window.GameSystem.addPoints(20, 'recognizing staff');
        }

        this.reviewText = review;
        this.displayReview(review);

        // Big celebration
        window.GameSystem.addPoints(25, 'completing your review!');
        this.triggerBigCelebration();
    },

    getReviewTemplates() {
        return [
            "Had an amazing stay at {hotel}! {aspects}. Would definitely recommend and will be back!",
            "Exceptional experience at {hotel}. {aspects}. Exceeded all expectations!",
            "{hotel} provided everything we needed for a perfect stay. {aspects}. 5 stars!",
            "Wonderful time at {hotel}! {aspects}. Can't wait to return!"
        ];
    },

    formatAspects() {
        const aspectPhrases = {
            location: "Perfect location",
            cleanliness: "Spotlessly clean",
            service: "Outstanding service",
            comfort: "Extremely comfortable",
            facilities: "Excellent facilities",
            value: "Great value for money",
            breakfast: "Delicious breakfast",
            wifi: "Fast and reliable WiFi"
        };

        return this.selectedAspects
            .map(a => aspectPhrases[a])
            .join(', ');
    },

    displayReview(review) {
        const output = document.getElementById('reviewOutput');
        const textElement = document.getElementById('reviewText');

        if (output && textElement) {
            textElement.textContent = review;
            output.style.display = 'block';
            output.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },

    copyReview() {
        navigator.clipboard.writeText(this.reviewText).then(() => {
            this.showNotification('Review copied! 📋');
            window.GameSystem.addPoints(5, 'sharing');
        });
    },

    shareReview() {
        // Load QR code library on demand
        if (!window.QRCode) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
            script.onload = () => this.showShareModal();
            document.head.appendChild(script);
        } else {
            this.showShareModal();
        }
    },

    showShareModal() {
        // Implementation for share modal with QR code
        // Development placeholder for share modal
        if (window.location.hostname === 'localhost') {
            console.info('Share modal would appear here');
        }
    },

    triggerConfetti() {
        // Simple confetti effect
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.innerHTML = '🎉🎊✨';
        confetti.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 50px;
            z-index: 9999;
            animation: confettiBurst 1s ease-out forwards;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 1000);
    },

    triggerBigCelebration() {
        // Multiple confetti
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.triggerConfetti(), i * 200);
        }
    },

    showNotification(message) {
        const notif = document.createElement('div');
        notif.className = 'notification';
        notif.textContent = message;
        notif.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #4CAF50;
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 9999;
            animation: slideUp 0.5s ease;
        `;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    },

    startSocialProof() {
        const messages = [
            "Sarah just generated a review for Hilton London",
            "Mike shared 5 stars for Marriott Paris",
            "Emma recognized staff at Four Seasons Dubai",
            "125 reviews generated in the last hour",
            "David just earned 50 points!"
        ];

        let index = 0;
        setInterval(() => {
            const ticker = document.getElementById('socialProof');
            if (ticker) {
                ticker.textContent = `🔥 ${messages[index % messages.length]}`;
                ticker.style.animation = 'slideIn 0.5s ease';
                index++;
            }
        }, 5000);
    },

    loadTranslations() {
        // Detect user language
        const userLang = navigator.language.substring(0, 2);

        if (userLang !== 'en') {
            // Dynamically load translation module
            import(`./translations/${userLang}.js`).then(module => {
                this.translations = module.default;
                this.applyTranslations();
            }).catch(() => {
                // Development logging for translation fallback
                if (window.location.hostname === 'localhost') {
                    console.info('Translation not available, using English');
                }
            });
        }
    },

    initializeAnalytics() {
        // Track user engagement
        if (window.gtag) {
            window.gtag('event', 'enhanced_features_loaded', {
                'event_category': 'engagement',
                'load_time': performance.now()
            });
        }
    },

    attachEventListeners() {
        // Track all interactions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('aspect-btn')) {
                this.trackEvent('aspect_selected', e.target.dataset.aspect);
            }
        });
    },

    trackEvent(action, label) {
        // Development logging for analytics tracking
        if (window.location.hostname === 'localhost') {
            console.info('Analytics Track:', action, label);
        }
    },

    injectEnhancedStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Enhanced Styles - Deferred */
            .aspect-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 10px;
                margin-top: 15px;
            }

            .aspect-btn {
                padding: 12px;
                background: #f8f9fa;
                border: 2px solid #e1e8ed;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 14px;
            }

            .aspect-btn:hover {
                background: #667eea;
                color: white;
                border-color: #667eea;
                transform: translateY(-2px);
            }

            .aspect-btn.selected {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border-color: transparent;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            }

            .platform-selector {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                gap: 10px;
                margin-top: 15px;
            }

            .platform-btn {
                padding: 12px;
                background: white;
                border: 2px solid #e1e8ed;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .platform-btn.selected {
                background: #667eea;
                color: white;
                border-color: #667eea;
            }

            .review-output {
                margin-top: 30px;
                padding: 20px;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                border-radius: 15px;
                animation: slideIn 0.5s ease;
            }

            .review-text {
                background: white;
                padding: 20px;
                border-radius: 10px;
                margin: 15px 0;
                font-size: 16px;
                line-height: 1.8;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }

            .action-buttons {
                display: flex;
                gap: 10px;
            }

            .action-buttons button {
                flex: 1;
                padding: 12px;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .btn-copy {
                background: #4CAF50;
                color: white;
            }

            .btn-share {
                background: #2196F3;
                color: white;
            }

            .social-proof-ticker {
                margin-top: 20px;
                padding: 10px;
                background: #fff3cd;
                border-radius: 10px;
                text-align: center;
                font-size: 14px;
                color: #856404;
            }

            .bonus-points {
                color: #4CAF50;
                font-size: 12px;
                font-weight: bold;
                margin-left: 5px;
            }

            .notification {
                animation: slideUp 0.5s ease;
            }

            @keyframes slideIn {
                from { opacity: 0; transform: translateX(-20px); }
                to { opacity: 1; transform: translateX(0); }
            }

            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            @keyframes confettiBurst {
                0% { opacity: 1; transform: translate(-50%, -50%) scale(0) rotate(0deg); }
                50% { opacity: 1; transform: translate(-50%, -50%) scale(1.5) rotate(180deg); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(2) rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
};

// Auto-init if hotel name was provided
if (window.pendingHotelName) {
    window.EnhancedReviewGenerator.init(window.pendingHotelName);
}