/**
 * Review Display Component
 * Shows generated review with copy and share functionality
 */

class ReviewDisplay {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            onCopy: options.onCopy || (() => {}),
            onShare: options.onShare || (() => {}),
            platforms: options.platforms || ['booking', 'google', 'tripadvisor'],
            animateIn: options.animateIn !== false
        };
        
        this.review = null;
        this.render();
    }

    render() {
        const html = `
            <div class="review-display" style="display: none;">
                <div class="review-header">
                    <h2 class="review-title">Your Generated Review</h2>
                    <div class="review-metadata" role="status" aria-live="polite"></div>
                </div>
                
                <div class="review-content-wrapper">
                    <div class="review-text" id="review-text" tabindex="0" role="article"></div>
                    
                    <div class="review-stats">
                        <span class="stat-item" id="word-count">0 words</span>
                        <span class="stat-item" id="char-count">0 characters</span>
                        <span class="stat-item" id="read-time">0 min read</span>
                    </div>
                </div>
                
                <div class="review-actions">
                    <button 
                        class="btn btn-primary copy-btn"
                        id="copy-btn"
                        aria-label="Copy review to clipboard"
                        disabled
                    >
                        <span class="btn-icon">📋</span>
                        <span class="btn-text">Copy Review</span>
                    </button>
                    
                    <div class="platform-buttons">
                        ${this.options.platforms.map(platform => `
                            <button 
                                class="btn platform-btn"
                                data-platform="${platform}"
                                aria-label="Post to ${this.getPlatformName(platform)} (opens in new tab)"
                            >
                                <span class="btn-icon">${this.getPlatformIcon(platform)}</span>
                                <span class="btn-text">${this.getPlatformName(platform)}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="review-feedback" style="display: none;">
                    <p>Was this review helpful?</p>
                    <div class="feedback-buttons">
                        <button class="feedback-btn" data-feedback="yes" aria-label="Yes, helpful">
                            👍 Yes
                        </button>
                        <button class="feedback-btn" data-feedback="no" aria-label="No, not helpful">
                            👎 No
                        </button>
                    </div>
                </div>
                
                <div class="copy-success" role="status" aria-live="polite" style="display: none;">
                    ✓ Review copied to clipboard!
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        this.displayEl = this.container.querySelector('.review-display');
        this.textEl = this.container.querySelector('#review-text');
        this.metadataEl = this.container.querySelector('.review-metadata');
        this.copyBtn = this.container.querySelector('#copy-btn');
        this.wordCountEl = this.container.querySelector('#word-count');
        this.charCountEl = this.container.querySelector('#char-count');
        this.readTimeEl = this.container.querySelector('#read-time');
        this.copySuccessEl = this.container.querySelector('.copy-success');
        
        this.attachEvents();
    }

    attachEvents() {
        // Copy button
        this.copyBtn?.addEventListener('click', () => this.copyReview());
        
        // Platform buttons
        this.container.querySelectorAll('.platform-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const platform = btn.dataset.platform;
                this.shareOnPlatform(platform);
            });
        });
        
        // Feedback buttons
        this.container.querySelectorAll('.feedback-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.submitFeedback(btn.dataset.feedback);
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
                if (this.review) {
                    e.preventDefault();
                    this.copyReview();
                }
            }
        });
    }

    displayReview(reviewData) {
        this.review = reviewData;
        
        // Show container
        this.displayEl.style.display = 'block';
        
        // Set review text
        this.textEl.textContent = reviewData.text;
        
        // Update metadata
        this.updateMetadata(reviewData);
        
        // Update statistics
        this.updateStats(reviewData.text);
        
        // Enable copy button
        this.copyBtn.disabled = false;
        
        // Animate in
        if (this.options.animateIn) {
            this.animateIn();
        }
        
        // Focus on review for screen readers
        this.textEl.focus();
        
        // Show feedback after delay
        setTimeout(() => {
            this.container.querySelector('.review-feedback').style.display = 'block';
        }, 3000);
    }

    updateMetadata(reviewData) {
        const metadata = [];
        
        if (reviewData.source) {
            metadata.push(`<span class="meta-source">Source: ${this.formatSource(reviewData.source)}</span>`);
        }
        
        if (reviewData.latency) {
            metadata.push(`<span class="meta-latency">Generated in ${reviewData.latency}ms</span>`);
        }
        
        if (reviewData.cost && reviewData.cost > 0) {
            metadata.push(`<span class="meta-cost">Cost: $${reviewData.cost.toFixed(6)}</span>`);
        }
        
        if (reviewData.cached) {
            metadata.push(`<span class="meta-cached">📦 Cached</span>`);
        }
        
        this.metadataEl.innerHTML = metadata.join(' • ');
    }

    updateStats(text) {
        const words = text.trim().split(/\s+/).length;
        const chars = text.length;
        const readTime = Math.ceil(words / 200); // Average reading speed
        
        this.wordCountEl.textContent = `${words} words`;
        this.charCountEl.textContent = `${chars} characters`;
        this.readTimeEl.textContent = `${readTime} min read`;
    }

    async copyReview() {
        if (!this.review) return;
        
        try {
            await navigator.clipboard.writeText(this.review.text);
            this.showCopySuccess();
            this.options.onCopy(this.review);
            
            // Track analytics
            this.trackEvent('copy_review', {
                source: this.review.source,
                length: this.review.text.length
            });
        } catch (error) {
            console.error('Failed to copy:', error);
            this.showCopyError();
        }
    }

    showCopySuccess() {
        this.copySuccessEl.style.display = 'block';
        this.copyBtn.innerHTML = '<span class="btn-icon">✓</span><span class="btn-text">Copied!</span>';
        
        setTimeout(() => {
            this.copySuccessEl.style.display = 'none';
            this.copyBtn.innerHTML = '<span class="btn-icon">📋</span><span class="btn-text">Copy Review</span>';
        }, 2000);
    }

    showCopyError() {
        this.copyBtn.innerHTML = '<span class="btn-icon">❌</span><span class="btn-text">Copy Failed</span>';
        
        setTimeout(() => {
            this.copyBtn.innerHTML = '<span class="btn-icon">📋</span><span class="btn-text">Copy Review</span>';
        }, 2000);
    }

    shareOnPlatform(platform) {
        if (!this.review) return;
        
        const urls = this.getPlatformUrls();
        const url = urls[platform];
        
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
            this.options.onShare(platform, this.review);
            
            // Track analytics
            this.trackEvent('share_review', {
                platform: platform,
                source: this.review.source
            });
        }
    }

    getPlatformUrls() {
        const hotelName = encodeURIComponent(this.review?.hotelName || 'Hotel');
        
        return {
            booking: `https://www.booking.com/hotel/${hotelName}`,
            google: `https://www.google.com/maps/search/${hotelName}`,
            tripadvisor: `https://www.tripadvisor.com/Search?q=${hotelName}`,
            expedia: `https://www.expedia.com/Hotel-Search?destination=${hotelName}`,
            hotels: `https://www.hotels.com/search.do?q=${hotelName}`
        };
    }

    getPlatformName(platform) {
        const names = {
            booking: 'Booking.com',
            google: 'Google',
            tripadvisor: 'TripAdvisor',
            expedia: 'Expedia',
            hotels: 'Hotels.com'
        };
        return names[platform] || platform;
    }

    getPlatformIcon(platform) {
        const icons = {
            booking: '📘',
            google: '🗺️',
            tripadvisor: '✈️',
            expedia: '🏨',
            hotels: '🛏️'
        };
        return icons[platform] || '🌐';
    }

    formatSource(source) {
        const sourceNames = {
            openai: 'OpenAI GPT-4',
            groq: 'Groq Mixtral',
            template: 'Template System',
            cache: 'Cache',
            emergency: 'Fallback'
        };
        return sourceNames[source] || source;
    }

    submitFeedback(feedback) {
        // Hide feedback section
        this.container.querySelector('.review-feedback').style.display = 'none';
        
        // Track feedback
        this.trackEvent('review_feedback', {
            feedback: feedback,
            source: this.review?.source,
            requestId: this.review?.requestId
        });
        
        // Show thank you message
        const thankYou = document.createElement('div');
        thankYou.className = 'feedback-thanks';
        thankYou.textContent = 'Thank you for your feedback!';
        this.container.querySelector('.review-feedback').replaceWith(thankYou);
    }

    animateIn() {
        this.displayEl.style.opacity = '0';
        this.displayEl.style.transform = 'translateY(20px)';
        
        requestAnimationFrame(() => {
            this.displayEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            this.displayEl.style.opacity = '1';
            this.displayEl.style.transform = 'translateY(0)';
        });
    }

    trackEvent(eventName, data) {
        // Send to analytics service
        if (typeof window !== 'undefined' && window.analytics) {
            window.analytics.track(eventName, data);
        }
    }

    hide() {
        this.displayEl.style.display = 'none';
        this.review = null;
    }

    reset() {
        this.hide();
        this.textEl.textContent = '';
        this.metadataEl.innerHTML = '';
        this.copyBtn.disabled = true;
    }

    destroy() {
        this.container.innerHTML = '';
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReviewDisplay;
}