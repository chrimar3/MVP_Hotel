/**
 * Human-Like Natural Language Generation Engine
 * Main orchestrator that combines all NLG components for authentic review generation
 * @author Hotel Review Generator Team
 * @since 2.0.0
 */

// Import NLG modules
const VocabularyManager = typeof require !== 'undefined' ? require('./VocabularyManager') : window.VocabularyManager;
const TransitionManager = typeof require !== 'undefined' ? require('./TransitionManager') : window.TransitionManager;
const NarrativeBuilder = typeof require !== 'undefined' ? require('./NarrativeBuilder') : window.NarrativeBuilder;

/**
 * Human-Like Natural Language Generation Engine
 * Orchestrates all NLG components to generate authentic, human-like hotel reviews
 */
class HumanLikeNLGEngine {
  /**
   * Creates a new HumanLikeNLGEngine instance
   * Initializes all core NLG components and voice profiles
   */
  constructor() {
    // Initialize core components
    this.vocabularyManager = new VocabularyManager();
    this.transitionManager = new TransitionManager();
    this.narrativeBuilder = new NarrativeBuilder(this.vocabularyManager, this.transitionManager);

    // Initialize voice configurations
    this.initializeVoiceProfiles();
  }

  /**
   * Initialize different voice personalities with their characteristics
   * @returns {void}
   */
  initializeVoiceProfiles() {
    this.voiceProfiles = {
      professional: {
        name: 'Professional',
        description: 'Formal, objective, business-appropriate tone',
        characteristics: ['measured', 'precise', 'respectful', 'analytical'],
        intensifierPreference: 'mild',
        hedgeFrequency: 'high',
      },
      friendly: {
        name: 'Friendly',
        description: 'Warm, conversational, approachable tone',
        characteristics: ['warm', 'personal', 'conversational', 'helpful'],
        intensifierPreference: 'medium',
        hedgeFrequency: 'medium',
      },
      enthusiastic: {
        name: 'Enthusiastic',
        description: 'Energetic, expressive, passionate tone',
        characteristics: ['energetic', 'expressive', 'passionate', 'excitable'],
        intensifierPreference: 'strong',
        hedgeFrequency: 'low',
      },
      detailed: {
        name: 'Detailed',
        description: 'Thorough, analytical, comprehensive tone',
        characteristics: ['thorough', 'analytical', 'comprehensive', 'specific'],
        intensifierPreference: 'medium',
        hedgeFrequency: 'medium',
      },
    };
  }

  /**
   * Main generation method - produces human-like review
   * @param {Object} params - Generation parameters
   * @param {string} params.hotelName - Name of the hotel
   * @param {number} params.rating - Review rating (1-5)
   * @param {string} params.tripType - Type of trip (leisure, business, etc.)
   * @param {Array} params.highlights - Key highlights to include
   * @param {number} params.nights - Number of nights stayed
   * @param {string} params.voice - Voice personality to use
   * @param {string} params.language - Language for the review
   * @returns {Promise<Object>} Generated review with metadata
   */
  async generateHumanLikeReview(params) {
    const {
      hotelName = 'this hotel',
      rating = 3,
      tripType = 'leisure',
      highlights = [],
      nights = 3,
      voice = 'friendly',
      // language parameter removed since it's unused
    } = params;

    try {
      // Validate parameters
      this.validateParameters(params);

      // Process highlights into structured format
      const processedHighlights = this.processHighlights(highlights);

      // Build narrative structure
      const narrative = this.narrativeBuilder.buildNarrative({
        rating,
        tripType,
        hotelName,
        highlights: processedHighlights,
        nights,
        voice,
      });

      // Compose final review
      const review = this.narrativeBuilder.composeNaturalNarrative(narrative, voice);

      // Apply final enhancements
      const enhancedReview = this.applyFinalEnhancements(review, voice, rating);

      // Return structured result
      return {
        text: enhancedReview,
        metadata: {
          voice,
          rating,
          tripType,
          wordCount: enhancedReview.split(' ').length,
          sentenceCount: enhancedReview.split(/[.!?]+/).length - 1,
          readabilityScore: this.calculateReadabilityScore(enhancedReview),
          authenticity: this.calculateAuthenticityScore(enhancedReview),
          generationTime: Date.now(),
        },
      };
    } catch (error) {
      return this.handleGenerationError(error, params);
    }
  }

  /**
   * Validate input parameters
   */
  /**
   * Validates the input parameters for review generation
   * @param {Object} params - Parameters to validate
   * @throws {Error} If parameters are invalid
   * @returns {void}
   */
  validateParameters(params) {
    const { rating, voice } = params;

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    if (voice && !this.voiceProfiles[voice]) {
      throw new Error(`Unknown voice profile: ${voice}`);
    }
  }

  /**
   * Process highlights into structured format
   */
  /**
   * Processes highlight inputs into structured format
   * @param {Array} highlights - Array of highlight strings or objects
   * @returns {Array} Processed highlights with categories
   */
  processHighlights(highlights) {
    if (!Array.isArray(highlights)) {
      return [];
    }

    return highlights.map((highlight, index) => {
      if (typeof highlight === 'string') {
        return {
          text: highlight,
          category: this.inferCategory(highlight),
          index,
        };
      }

      return {
        text: highlight.text || highlight.name || `Highlight ${index + 1}`,
        category: highlight.category || this.inferCategory(highlight.text || highlight.name),
        index,
      };
    });
  }

  /**
   * Infer category from highlight text
   */
  /**
   * Infers the category of a highlight from its text content
   * @param {string} text - The highlight text
   * @returns {string} The inferred category
   */
  inferCategory(text) {
    const categoryKeywords = {
      cleanliness: ['clean', 'spotless', 'tidy', 'hygienic', 'pristine'],
      comfort: ['comfort', 'bed', 'pillow', 'mattress', 'cozy'],
      service: ['service', 'staff', 'helpful', 'friendly', 'professional'],
      food: ['food', 'breakfast', 'restaurant', 'dining', 'meal'],
      location: ['location', 'convenient', 'central', 'nearby', 'walking'],
      amenities: ['pool', 'gym', 'spa', 'fitness', 'facilities'],
      wifi: ['wifi', 'internet', 'connection', 'online'],
      value: ['value', 'price', 'cost', 'worth', 'money'],
    };

    const lowerText = text.toLowerCase();

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  /**
   * Apply final enhancements to the review
   */
  /**
   * Applies final enhancements to the generated review
   * @param {string} review - The base review text
   * @param {string} voice - The voice personality
   * @param {number} rating - The review rating
   * @returns {string} The enhanced review
   */
  applyFinalEnhancements(review, voice, rating) {
    let enhanced = review;

    // Apply voice-specific enhancements
    enhanced = this.applyVoiceEnhancements(enhanced, voice);

    // Add rating-appropriate emotional touches
    enhanced = this.addEmotionalNuances(enhanced, rating);

    // Ensure natural paragraph breaks
    enhanced = this.optimizeParagraphBreaks(enhanced);

    // Final polish
    enhanced = this.finalPolish(enhanced);

    return enhanced;
  }

  /**
   * Apply voice-specific enhancements
   */
  /**
   * Applies voice-specific enhancements to the text
   * @param {string} text - The text to enhance
   * @param {string} voice - The voice personality
   * @returns {string} The voice-enhanced text
   */
  applyVoiceEnhancements(text, voice) {
    const profile = this.voiceProfiles[voice];
    if (!profile) return text;

    let enhanced = text;

    // Adjust based on voice characteristics
    switch (voice) {
      case 'professional':
        enhanced = enhanced.replace(/!+/g, '.');
        enhanced = enhanced.replace(/\b(amazing|awesome|incredible)\b/gi, 'excellent');
        enhanced = enhanced.replace(/\b(bad|terrible|awful)\b/gi, 'unsatisfactory');
        break;

      case 'enthusiastic':
        enhanced = enhanced.replace(/\. /g, '! ');
        enhanced = enhanced.replace(/\bgood\b/gi, 'fantastic');
        enhanced = enhanced.replace(/\bokay\b/gi, 'pretty great');
        break;

      case 'detailed':
        // Add more specific details and measurements where appropriate
        enhanced = this.addDetailedDescriptions(enhanced);
        break;

      case 'friendly':
      default:
        // Friendly is the baseline, no major changes needed
        break;
    }

    return enhanced;
  }

  /**
   * Add emotional nuances based on rating
   */
  /**
   * Adds emotional nuances based on the rating
   * @param {string} text - The text to enhance
   * @param {number} rating - The review rating
   * @returns {string} Text with emotional nuances
   */
  addEmotionalNuances(text, rating) {
    // Add subtle emotional indicators based on rating
    if (rating >= 4) {
      // Add positive emotional markers
      return text.replace(/\bwas\b/g, 'was genuinely')
                .replace(/\bfound\b/g, 'discovered')
                .replace(/\bstay\b/g, 'experience');
    } else if (rating <= 2) {
      // Add disappointment markers
      return text.replace(/\bunfortunately\b/gi, 'regrettably')
                .replace(/\bissue\b/g, 'significant concern');
    }

    return text;
  }

  /**
   * Optimize paragraph breaks for readability
   */
  /**
   * Optimizes paragraph breaks for better readability
   * @param {string} text - The text to optimize
   * @returns {string} Text with optimized paragraph breaks
   */
  optimizeParagraphBreaks(text) {
    // Ensure proper spacing around paragraph breaks
    return text.replace(/\n\n+/g, '\n\n')
               .replace(/^\n+|\n+$/g, '')
               .trim();
  }

  /**
   * Final polish for natural flow
   */
  /**
   * Applies final polish and cleanup to the text
   * @param {string} text - The text to polish
   * @returns {string} The polished text
   */
  finalPolish(text) {
    return text
      // Fix any double spaces
      .replace(/\s+/g, ' ')
      // Ensure proper punctuation spacing
      .replace(/\s+([.!?])/g, '$1')
      // Capitalize after periods
      .replace(/\.\s+([a-z])/g, (match, letter) => `. ${letter.toUpperCase()}`)
      // Fix common grammar issues
      .replace(/\ba\s+([aeiou])/gi, 'an $1')
      .trim();
  }

  /**
   * Add detailed descriptions for detailed voice
   */
  /**
   * Adds more detailed descriptions to enhance the text
   * @param {string} text - The text to enhance
   * @returns {string} Text with added descriptions
   */
  addDetailedDescriptions(text) {
    // This is a simplified implementation
    return text.replace(/\broom\b/g, 'accommodation')
               .replace(/\bnice\b/g, 'well-appointed')
               .replace(/\bgood\b/g, 'satisfactory');
  }

  /**
   * Calculate readability score (simplified Flesch Reading Ease)
   */
  /**
   * Calculates a readability score using Flesch Reading Ease formula
   * @param {string} text - The text to analyze
   * @returns {number} Readability score (0-100, higher is more readable)
   */
  calculateReadabilityScore(text) {
    const sentences = text.split(/[.!?]+/).length - 1;
    const words = text.split(/\s+/).length;
    const syllables = this.countSyllables(text);

    if (sentences === 0 || words === 0) return 0;

    const avgWordsPerSentence = words / sentences;
    const avgSyllablesPerWord = syllables / words;

    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Count syllables in text (approximation)
   */
  /**
   * Counts syllables in a text (approximation)
   * @param {string} text - The text to analyze
   * @returns {number} Approximate syllable count
   */
  countSyllables(text) {
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    return words.reduce((count, word) => {
      const syllableCount = word.match(/[aeiouy]+/g)?.length || 1;
      return count + syllableCount;
    }, 0);
  }

  /**
   * Calculate authenticity score based on human-like features
   */
  /**
   * Calculates an authenticity score based on various linguistic features
   * @param {string} text - The text to analyze
   * @returns {Object} Authenticity score and breakdown
   */
  calculateAuthenticityScore(text) {
    let score = 0;
    const maxScore = 100;

    // Check for varied sentence lengths
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    const variance = sentences.reduce((sum, s) => {
      const len = s.split(' ').length;
      return sum + Math.pow(len - avgLength, 2);
    }, 0) / sentences.length;

    if (variance > 10) score += 20; // Good sentence variety

    // Check for personal touches
    const personalMarkers = ['we', 'our', 'us', 'my', 'I'];
    const personalCount = personalMarkers.reduce((count, marker) => {
      return count + (text.toLowerCase().match(new RegExp(`\\b${marker}\\b`, 'g')) || []).length;
    }, 0);
    if (personalCount >= 3) score += 20;

    // Check for emotional language
    const emotions = ['delighted', 'impressed', 'disappointed', 'surprised', 'pleased'];
    const emotionCount = emotions.reduce((count, emotion) => {
      return count + (text.toLowerCase().includes(emotion) ? 1 : 0);
    }, 0);
    if (emotionCount >= 1) score += 20;

    // Check for specific details
    const detailMarkers = ['particularly', 'especially', 'specifically', 'notably'];
    const detailCount = detailMarkers.reduce((count, marker) => {
      return count + (text.toLowerCase().includes(marker) ? 1 : 0);
    }, 0);
    if (detailCount >= 1) score += 20;

    // Check for hedging language (authenticity marker)
    const hedges = ['perhaps', 'maybe', 'somewhat', 'fairly'];
    const hedgeCount = hedges.reduce((count, hedge) => {
      return count + (text.toLowerCase().includes(hedge) ? 1 : 0);
    }, 0);
    if (hedgeCount >= 1) score += 20;

    return Math.min(maxScore, score);
  }

  /**
   * Handle generation errors gracefully
   */
  /**
   * Handles errors during review generation
   * @param {Error} error - The error that occurred
   * @param {Object} params - The original generation parameters
   * @returns {Object} Fallback review or error response
   */
  handleGenerationError(error, params) {
    console.error('NLG Engine Error:', error);

    // Return fallback review
    return {
      text: this.createFallbackReview(params),
      metadata: {
        error: error.message,
        fallback: true,
        generationTime: Date.now(),
      },
    };
  }

  /**
   * Create fallback review when main generation fails
   */
  /**
   * Creates a simple fallback review when generation fails
   * @param {Object} params - Generation parameters
   * @returns {Object} Simple fallback review
   */
  createFallbackReview(params) {
    const { hotelName = 'this hotel', rating = 3, tripType = 'leisure' } = params;

    const fallbacks = {
      5: `Our stay at ${hotelName} was excellent. Everything exceeded our expectations for this ${tripType} trip. Would definitely recommend!`,
      4: `We had a great time at ${hotelName}. Most aspects of our ${tripType} stay were very good. Would stay again.`,
      3: `${hotelName} provided a decent experience for our ${tripType} trip. Some things were good, others could be improved.`,
      2: `Our stay at ${hotelName} was disappointing. Several issues affected our ${tripType} experience. Would look elsewhere next time.`,
      1: `Unfortunately, our ${tripType} stay at ${hotelName} was very poor. Multiple problems made this an unpleasant experience.`,
    };

    return fallbacks[rating] || fallbacks[3];
  }

  /**
   * Get engine statistics and capabilities
   */
  /**
   * Gets statistics about the NLG engine
   * @returns {Object} Engine statistics
   */
  getEngineStats() {
    return {
      vocabulary: this.vocabularyManager.getVocabularyStats(),
      transitions: this.transitionManager.getTransitionStats(),
      narrative: this.narrativeBuilder.getNarrativeStats(),
      voices: Object.keys(this.voiceProfiles).length,
      version: '1.0.0',
    };
  }

  /**
   * Get available voice profiles
   */
  /**
   * Gets all available voice profiles
   * @returns {Object} Dictionary of voice profiles
   */
  getVoiceProfiles() {
    return this.voiceProfiles;
  }

  /**
   * Add custom voice profile
   */
  /**
   * Adds a new voice profile to the engine
   * @param {string} name - The name of the voice profile
   * @param {Object} profile - The voice profile configuration
   * @returns {void}
   */
  addVoiceProfile(name, profile) {
    this.voiceProfiles[name] = profile;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HumanLikeNLGEngine;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
  window.HumanLikeNLGEngineCore = HumanLikeNLGEngine;
}