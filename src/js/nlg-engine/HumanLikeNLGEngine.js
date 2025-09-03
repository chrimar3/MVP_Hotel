/**
 * Human-Like Natural Language Generation Engine
 * Main orchestrator that combines all NLG components for authentic review generation
 */

// Import NLG modules
const VocabularyManager = typeof require !== 'undefined' ? require('./VocabularyManager') : window.VocabularyManager;
const TransitionManager = typeof require !== 'undefined' ? require('./TransitionManager') : window.TransitionManager;
const NarrativeBuilder = typeof require !== 'undefined' ? require('./NarrativeBuilder') : window.NarrativeBuilder;

class HumanLikeNLGEngine {
  constructor() {
    // Initialize core components
    this.vocabularyManager = new VocabularyManager();
    this.transitionManager = new TransitionManager();
    this.narrativeBuilder = new NarrativeBuilder(this.vocabularyManager, this.transitionManager);

    // Initialize voice configurations
    this.initializeVoiceProfiles();
  }

  /**
   * Initialize different voice personalities
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
   */
  async generateHumanLikeReview(params) {
    const {
      hotelName = 'this hotel',
      rating = 3,
      tripType = 'leisure',
      highlights = [],
      nights = 3,
      voice = 'friendly',
      language = 'en',
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
  optimizeParagraphBreaks(text) {
    // Ensure proper spacing around paragraph breaks
    return text.replace(/\n\n+/g, '\n\n')
               .replace(/^\n+|\n+$/g, '')
               .trim();
  }

  /**
   * Final polish for natural flow
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
  addDetailedDescriptions(text) {
    // This is a simplified implementation
    return text.replace(/\broom\b/g, 'accommodation')
               .replace(/\bnice\b/g, 'well-appointed')
               .replace(/\bgood\b/g, 'satisfactory');
  }

  /**
   * Calculate readability score (simplified Flesch Reading Ease)
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
  getVoiceProfiles() {
    return this.voiceProfiles;
  }

  /**
   * Add custom voice profile
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