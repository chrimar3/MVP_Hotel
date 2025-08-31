/**
 * Review View
 * Handles UI rendering and DOM manipulation
 */

class ReviewView {
    constructor(security) {
        this.security = security;
        this.elements = {};
        this.templates = this.loadTemplates();
        this.eventHandlers = {};
    }

    /**
     * Initialize view elements
     */
    init() {
        this.cacheElements();
        this.setupAnimations();
        return this;
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            // Forms
            hotelNameInput: document.getElementById('hotelName'),
            ratingButtons: document.querySelectorAll('.rating-btn'),
            tripTypeButtons: document.querySelectorAll('.trip-type-btn'),
            highlightButtons: document.querySelectorAll('.highlight-btn'),
            languageSelect: document.getElementById('language'),
            voiceButtons: document.querySelectorAll('.voice-btn'),

            // Display areas
            previewSection: document.getElementById('preview-section'),
            reviewDisplay: document.getElementById('review-display'),
            reviewText: document.getElementById('review-text'),

            // Action buttons
            generateBtn: document.getElementById('generate-btn'),
            copyBtn: document.getElementById('copy-btn'),
            shareBtn: document.getElementById('share-btn'),
            resetBtn: document.getElementById('reset-btn'),

            // Feedback elements
            loadingSpinner: document.getElementById('loading-spinner'),
            errorMessage: document.getElementById('error-message'),
            successMessage: document.getElementById('success-message'),

            // Stats
            statsContainer: document.getElementById('stats-container'),
            progressBar: document.getElementById('progress-bar'),

            // Modal
            modal: document.getElementById('review-modal'),
            modalContent: document.getElementById('modal-review-content'),
            modalClose: document.querySelector('.modal-close')
        };
    }

    /**
     * Bind event handler
     */
    on(eventName, handler) {
        this.eventHandlers[eventName] = handler;
    }

    /**
     * Setup UI animations
     */
    setupAnimations() {
        // Add smooth transitions
        const style = document.createElement('style');
        style.textContent = `
            .fade-in {
                animation: fadeIn 0.3s ease-in;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .pulse {
                animation: pulse 1s infinite;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            .shake {
                animation: shake 0.5s;
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Update rating display
     */
    updateRating(rating) {
        this.elements.ratingButtons.forEach(btn => {
            const btnRating = parseInt(btn.dataset.rating);
            btn.classList.toggle('active', btnRating <= rating);

            // Update stars
            const stars = btn.querySelector('.stars');
            if (stars) {
                stars.textContent = '★'.repeat(btnRating) + '☆'.repeat(5 - btnRating);
            }
        });
    }

    /**
     * Update trip type display
     */
    updateTripType(tripType) {
        this.elements.tripTypeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === tripType);
        });
    }

    /**
     * Update highlights display
     */
    updateHighlights(highlights) {
        this.elements.highlightButtons.forEach(btn => {
            const highlight = btn.dataset.highlight;
            btn.classList.toggle('active', highlights.includes(highlight));
        });
    }

    /**
     * Show loading state
     */
    showLoading(message = 'Generating review...') {
        if (this.elements.loadingSpinner) {
            this.elements.loadingSpinner.style.display = 'block';
            this.elements.loadingSpinner.textContent = message;
        }

        if (this.elements.generateBtn) {
            this.elements.generateBtn.disabled = true;
            this.elements.generateBtn.classList.add('pulse');
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        if (this.elements.loadingSpinner) {
            this.elements.loadingSpinner.style.display = 'none';
        }

        if (this.elements.generateBtn) {
            this.elements.generateBtn.disabled = false;
            this.elements.generateBtn.classList.remove('pulse');
        }
    }

    /**
     * Display review
     */
    displayReview(review) {
        if (!review) return;

        // Show preview section
        if (this.elements.previewSection) {
            this.elements.previewSection.style.display = 'block';
            this.elements.previewSection.classList.add('fade-in');
        }

        // Display review text
        if (this.elements.reviewText) {
            this.elements.reviewText.textContent = this.security.sanitizeText(review.text);
        }

        // Show metadata
        if (review.source) {
            this.addMetadata(review);
        }

        // Enable action buttons
        if (this.elements.copyBtn) {
            this.elements.copyBtn.disabled = false;
        }
        if (this.elements.shareBtn) {
            this.elements.shareBtn.disabled = false;
        }
    }

    /**
     * Add review metadata
     */
    addMetadata(review) {
        const metaDiv = document.createElement('div');
        metaDiv.className = 'review-metadata';
        metaDiv.innerHTML = `
            <span class="meta-source">Source: ${review.source}</span>
            ${review.model ? `<span class="meta-model">Model: ${review.model}</span>` : ''}
            ${review.latency ? `<span class="meta-latency">Generated in: ${review.latency}ms</span>` : ''}
            ${review.cost ? `<span class="meta-cost">Cost: $${review.cost.toFixed(6)}</span>` : ''}
        `;

        if (this.elements.reviewDisplay) {
            const existing = this.elements.reviewDisplay.querySelector('.review-metadata');
            if (existing) existing.remove();
            this.elements.reviewDisplay.appendChild(metaDiv);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
            this.elements.errorMessage.style.display = 'block';
            this.elements.errorMessage.classList.add('shake');

            setTimeout(() => {
                this.elements.errorMessage.style.display = 'none';
                this.elements.errorMessage.classList.remove('shake');
            }, 5000);
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        if (this.elements.successMessage) {
            this.elements.successMessage.textContent = message;
            this.elements.successMessage.style.display = 'block';
            this.elements.successMessage.classList.add('fade-in');

            setTimeout(() => {
                this.elements.successMessage.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * Update progress bar
     */
    updateProgress(step, total) {
        if (this.elements.progressBar) {
            const percentage = (step / total) * 100;
            this.elements.progressBar.style.width = `${percentage}%`;
            this.elements.progressBar.setAttribute('aria-valuenow', percentage);
        }
    }

    /**
     * Update statistics display
     */
    updateStats(stats) {
        if (!this.elements.statsContainer) return;

        this.elements.statsContainer.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Total Reviews:</span>
                <span class="stat-value">${stats.totalGenerated || 0}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Avg Rating:</span>
                <span class="stat-value">${(stats.averageRating || 0).toFixed(1)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Top Highlights:</span>
                <span class="stat-value">
                    ${(stats.popularHighlights || []).slice(0, 3).map(h => h.name).join(', ')}
                </span>
            </div>
        `;
    }

    /**
     * Show modal
     */
    showModal(content) {
        if (this.elements.modal) {
            this.elements.modalContent.innerHTML = this.security.sanitizeHTML(content);
            this.elements.modal.style.display = 'block';
            this.elements.modal.classList.add('fade-in');
        }
    }

    /**
     * Hide modal
     */
    hideModal() {
        if (this.elements.modal) {
            this.elements.modal.style.display = 'none';
        }
    }

    /**
     * Reset form
     */
    resetForm() {
        if (this.elements.hotelNameInput) {
            this.elements.hotelNameInput.value = '';
        }

        this.updateRating(5);
        this.updateTripType('leisure');
        this.updateHighlights([]);

        if (this.elements.previewSection) {
            this.elements.previewSection.style.display = 'none';
        }
    }

    /**
     * Load UI templates
     */
    loadTemplates() {
        return {
            reviewCard: (review) => `
                <div class="review-card">
                    <h3>${review.hotelName}</h3>
                    <div class="rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                    <p>${review.text}</p>
                    <div class="review-footer">
                        <span>${review.tripType}</span>
                        <span>${new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            `,

            errorAlert: (message) => `
                <div class="alert alert-error">
                    <strong>Error:</strong> ${message}
                </div>
            `,

            successAlert: (message) => `
                <div class="alert alert-success">
                    <strong>Success:</strong> ${message}
                </div>
            `
        };
    }

    /**
     * Destroy view
     */
    destroy() {
        // Remove event listeners
        Object.keys(this.eventHandlers).forEach(key => {
            delete this.eventHandlers[key];
        });

        // Clear cached elements
        this.elements = {};
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReviewView;
}