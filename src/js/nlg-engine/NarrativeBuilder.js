/**
 * Narrative Builder for Human-Like NLG Engine
 * Handles story arcs, emotional flow, and narrative structure
 * @author Hotel Review Generator Team
 * @since 2.0.0
 */

/**
 * Narrative Builder class
 * Creates natural flow and structure for hotel reviews with emotional arcs
 */
class NarrativeBuilder {
  /**
   * Creates a new NarrativeBuilder instance
   * @param {Object} vocabularyManager - The vocabulary manager instance
   * @param {Object} transitionManager - The transition manager instance
   */
  constructor(vocabularyManager, transitionManager) {
    this.vocabularyManager = vocabularyManager;
    this.transitionManager = transitionManager;
    this.initializeNarrativeElements();
  }

  /**
   * Initialize storytelling and emotional arc components
   * Sets up narrative arcs, hooks, and story templates
   * @returns {void}
   */
  initializeNarrativeElements() {
    // Narrative arc templates based on rating
    this.narrativeArcs = {
      5: 'heroic', // Expectation exceeded
      4: 'satisfying', // Expectation met with pleasant surprises
      3: 'balanced', // Mixed experience
      2: 'disappointing', // Expectation not met
      1: 'tragic', // Significantly below expectation
    };

    // Hook templates for engaging openings
    this.hooks = {
      heroic: [
        'From the moment we arrived, we knew this would be something special.',
        'Sometimes a place exceeds your wildest expectations - this was one of those times.',
        'After countless hotel stays, it\'s rare to find one that truly stands out.',
      ],
      satisfying: [
        'Our stay here was exactly what we hoped for and then some.',
        'Walking into the lobby, we felt immediately welcomed.',
        'It\'s refreshing to find a hotel that delivers on its promises.',
      ],
      balanced: [
        'Our experience here was a real mix of highs and lows.',
        'Like many hotels, this one had its strengths and weaknesses.',
        'Our stay was decent overall, with some notable points worth sharing.',
      ],
      disappointing: [
        'Unfortunately, our stay didn\'t quite live up to expectations.',
        'We had hoped for better based on the reviews and photos.',
        'While the location drew us in, the experience left us wanting.',
      ],
      tragic: [
        'I wish I had better things to say about our stay.',
        'It pains me to write this review, but future guests deserve to know.',
        'Despite our best efforts to enjoy our visit, we encountered numerous issues.',
      ],
    };

    // Context setup phrases
    this.contextSetups = {
      business: 'As business travelers,',
      leisure: 'On our vacation,',
      family: 'Traveling with the family,',
      solo: 'As a solo traveler,',
      couple: 'My partner and I',
    };
  }

  /**
   * Create engaging hook based on rating and context
   */
  createHook(rating, tripType, voice) {
    const arcType = this.narrativeArcs[rating] || 'balanced';
    const hooks = this.hooks[arcType];
    let selectedHook = this.vocabularyManager.selectRandom(hooks);

    // Add trip context if appropriate
    if (tripType && this.contextSetups[tripType]) {
      const context = this.contextSetups[tripType];
      selectedHook = `${context} ${selectedHook.toLowerCase()}`;
    }

    // Adjust for voice
    return this.adjustForVoice(selectedHook, voice);
  }

  /**
   * Create compelling setup with context
   */
  createSetup(hotelName, rating, tripType, nights) {
    const setups = {
      5: [
        `booked ${nights} nights at ${hotelName} based on the excellent reviews, but nothing prepared us for how exceptional it would be.`,
        `chose ${hotelName} for our ${nights}-night stay, and it turned out to be the perfect decision.`,
        `decided on ${hotelName} after careful research, and it exceeded every expectation.`,
      ],
      4: [
        `spent ${nights} nights at ${hotelName} and found it to be a solid choice with several standout features.`,
        `stayed at ${hotelName} for ${nights} nights and were generally impressed with the experience.`,
        `chose ${hotelName} for our ${nights}-night trip and were pleased with most aspects of our stay.`,
      ],
      3: [
        `stayed ${nights} nights at ${hotelName} and had a mixed but acceptable experience.`,
        `spent ${nights} nights at ${hotelName} - some things were great, others less so.`,
        `booked ${nights} nights at ${hotelName} and found it to be adequate for our needs.`,
      ],
      2: [
        `unfortunately booked ${nights} nights at ${hotelName} and encountered several issues.`,
        `stayed at ${hotelName} for ${nights} nights but found the experience disappointing.`,
        `spent ${nights} nights at ${hotelName} hoping for better based on the marketing.`,
      ],
      1: [
        `regrettably spent ${nights} nights at ${hotelName} and had a thoroughly disappointing experience.`,
        `booked ${nights} nights at ${hotelName} that turned out to be a mistake.`,
        `unfortunately chose ${hotelName} for our ${nights}-night stay and faced numerous problems.`,
      ],
    };

    const ratingSetups = setups[rating] || setups[3];
    return 'We ' + this.vocabularyManager.selectRandom(ratingSetups);
  }

  /**
   * Build development section with natural highlight flow
   */
  buildDevelopment(highlights, rating) {
    if (!highlights || highlights.length === 0) {
      return this.createGenericDevelopment(rating);
    }

    const points = [];
    const usedTransitions = [];

    highlights.forEach((highlight, index) => {
      // Select unique transition
      const transition = this.transitionManager.selectUniqueTransition(index, highlights.length, usedTransitions);
      usedTransitions.push(transition);

      // Create point with varying sentence structure
      const point = this.createNaturalPoint(highlight, rating, index);

      // Add personal touch
      const personalTouch = this.addPersonalTouch(highlight, rating);

      points.push(`${transition} ${point} ${personalTouch}`);
    });

    return points.join(' ');
  }

  /**
   * Create natural point with variety
   */
  createNaturalPoint(highlight, rating, index) {
    const sentiment = rating >= 4 ? 'positive' : rating >= 3 ? 'neutral' : 'negative';
    const descriptor = this.vocabularyManager.selectDescriptor(highlight.category, sentiment);
    const emotion = this.vocabularyManager.selectEmotion(rating);

    // Vary sentence patterns
    const patterns = [
      `The ${highlight.text.substring(2).toLowerCase()} was ${descriptor}`,
      `I was ${emotion} by the ${highlight.text.substring(2).toLowerCase()}`,
      `${highlight.text} - ${descriptor} and ${this.vocabularyManager.selectDescriptor(highlight.category, sentiment)}`,
      `What stood out was how ${descriptor} the ${highlight.text.substring(2).toLowerCase()} was`,
    ];

    return this.vocabularyManager.selectRandom(patterns);
  }

  /**
   * Add personal touches and specific details
   */
  addPersonalTouch(highlight, rating) {
    const touches = [
      `(the ${this.vocabularyManager.getSpecificDetail(highlight)} was a nice surprise).`,
      `- something I particularly appreciated.`,
      `, which made a real difference.`,
      `. ${this.vocabularyManager.getPersonalAnecdote()}`,
      `, though ${this.vocabularyManager.getMildCriticism()}.`,
    ];

    return rating >= 4 ?
      this.vocabularyManager.selectRandom(touches.slice(0, 4)) :
      this.vocabularyManager.selectRandom(touches);
  }

  /**
   * Create climactic moment
   */
  createClimax(highlights, rating) {
    if (rating >= 4) {
      return `The moment that truly captured the essence of our stay was ${this.vocabularyManager.getMemorableMoment()}.`;
    } else {
      return `Despite the challenges, ${this.vocabularyManager.getRedemptiveMoment()}.`;
    }
  }

  /**
   * Create natural resolution
   */
  createResolution(rating, voice, highlights) {
    const reflection = this.createReflection(rating, highlights);
    const recommendation = this.createRecommendation(rating, voice);

    return `${reflection} ${recommendation}`;
  }

  /**
   * Create reflection based on experience
   */
  createReflection(rating, highlights) {
    if (rating >= 4) {
      return `Looking back, it's the combination of ${this.vocabularyManager.summarizeHighlights(highlights)} that made this stay memorable.`;
    } else {
      return `In reflection, while there were issues, ${this.vocabularyManager.findPositive()}.`;
    }
  }

  /**
   * Create recommendation based on rating and voice
   */
  createRecommendation(rating, voice) {
    const recommendations = {
      5: {
        professional: 'I would not hesitate to recommend this property to colleagues and friends alike.',
        friendly: "If you're on the fence, just book it - you won't regret it!",
        enthusiastic: "Stop reading reviews and book this place NOW! You'll thank me later!",
        detailed: 'For travelers seeking quality accommodation with attention to detail, this delivers on all fronts.',
      },
      4: {
        professional: 'A solid choice that I would recommend with minor caveats.',
        friendly: 'Would I stay here again? Yes, definitely! Just manage your expectations on a few things.',
        enthusiastic: 'Great place that just needs a few tweaks to be absolutely perfect!',
        detailed: "Recommended for those who value the positives I've mentioned and can overlook minor shortcomings.",
      },
      3: {
        professional: 'Suitable for travelers with specific needs or budget constraints.',
        friendly: "It's fine if you need a place to sleep and aren't too fussy.",
        enthusiastic: 'Could be great with some improvements - fingers crossed they make them!',
        detailed: 'Consider carefully based on your priorities; it may or may not meet your specific requirements.',
      },
      2: {
        professional: 'I would recommend looking elsewhere unless this meets very specific needs.',
        friendly: 'Honestly, there are better options out there for similar money.',
        enthusiastic: 'Skip this one - your vacation time is too precious!',
        detailed: 'Only consider if the location is absolutely critical and you can overlook significant shortcomings.',
      },
      1: {
        professional: 'I cannot recommend this property based on our experience.',
        friendly: 'Save your money and book somewhere else.',
        enthusiastic: 'Please, for your own sake, look elsewhere!',
        detailed: 'Would not recommend unless major improvements are made to address the issues mentioned.',
      },
    };

    const ratingRecommendations = recommendations[rating] || recommendations[3];
    return ratingRecommendations[voice] || ratingRecommendations['friendly'];
  }

  /**
   * Create generic development for when no highlights provided
   */
  createGenericDevelopment(rating) {
    const developments = {
      5: 'Every aspect of our stay exceeded expectations, from the moment we walked through the door.',
      4: 'Most aspects of the hotel met or exceeded our expectations, with a few minor areas for improvement.',
      3: 'The hotel provided a decent experience with both positive and negative aspects worth mentioning.',
      2: 'While the hotel had some redeeming qualities, several issues detracted from the overall experience.',
      1: 'Unfortunately, multiple problems made this a disappointing stay that fell well short of expectations.',
    };

    return developments[rating] || developments[3];
  }

  /**
   * Adjust text for voice personality
   */
  adjustForVoice(text, voice) {
    switch (voice) {
      case 'professional':
        return text.replace(/!+/g, '.').replace(/\b(amazing|awesome|incredible)\b/gi, 'excellent');
      case 'friendly':
        return text;
      case 'enthusiastic':
        return text.replace(/\./g, '!').replace(/\bgood\b/gi, 'amazing');
      case 'detailed':
        return text;
      default:
        return text;
    }
  }

  /**
   * Build complete narrative structure
   */
  buildNarrative(params) {
    const { rating, tripType, hotelName, highlights, nights, voice } = params;

    // Reset transitions for new narrative
    this.transitionManager.resetUsedTransitions();

    const narrative = {
      hook: this.createHook(rating, tripType, voice),
      setup: this.createSetup(hotelName, rating, tripType, nights || 3),
      development: this.buildDevelopment(highlights, rating),
      climax: rating !== 3 ? this.createClimax(highlights, rating) : null,
      resolution: this.createResolution(rating, voice, highlights),
    };

    return narrative;
  }

  /**
   * Compose complete narrative with natural flow
   */
  composeNaturalNarrative(narrative, voice) {
    // Build with paragraph breaks for readability
    let review = narrative.hook + ' ' + narrative.setup + '\n\n';

    // Add development with natural flow
    review += narrative.development;

    // Add climax if substantial
    if (narrative.climax) {
      review += ' ' + narrative.climax;
    }

    // Add resolution
    review += '\n\n' + narrative.resolution;

    // Apply final voice adjustments
    return this.adjustForVoice(review, voice);
  }

  /**
   * Get narrative statistics
   */
  getNarrativeStats() {
    return {
      arcTypes: Object.keys(this.narrativeArcs).length,
      hookVariations: Object.values(this.hooks).flat().length,
      contextSetups: Object.keys(this.contextSetups).length,
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NarrativeBuilder;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
  window.NarrativeBuilder = NarrativeBuilder;
}