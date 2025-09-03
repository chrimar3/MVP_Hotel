/**
 * Vocabulary Manager for Human-Like NLG Engine
 * Manages vocabulary, synonyms, emotions, and descriptors
 */

class VocabularyManager {
  constructor() {
    this.initializeVocabulary();
  }

  /**
   * Initialize rich vocabulary with synonyms and variations
   */
  initializeVocabulary() {
    this.vocabulary = {
      // Emotion gradients (not just binary positive/negative)
      emotions: {
        delight: ['delighted', 'thrilled', 'overjoyed', 'elated', 'ecstatic', 'pleased', 'charmed'],
        satisfaction: ['satisfied', 'content', 'happy', 'pleased', 'comfortable', 'gratified'],
        surprise: ['surprised', 'amazed', 'astonished', 'impressed', 'taken aback', 'struck'],
        disappointment: ['disappointed', 'let down', 'underwhelmed', 'dissatisfied', 'frustrated'],
        neutral: ['found', 'experienced', 'noticed', 'observed', 'encountered', 'discovered'],
      },

      // Temporal expressions for natural flow
      temporal: {
        sequence: ['initially', 'at first', 'subsequently', 'later', 'eventually', 'finally'],
        frequency: [
          'always',
          'consistently',
          'usually',
          'often',
          'sometimes',
          'occasionally',
          'rarely',
        ],
        specific: [
          'during breakfast',
          'in the evening',
          'late at night',
          'early morning',
          'around noon',
        ],
        duration: [
          'throughout our stay',
          'the entire time',
          'for the duration',
          'during our visit',
        ],
      },

      // Intensifiers with varying strength
      intensifiers: {
        strong: ['absolutely', 'completely', 'thoroughly', 'utterly', 'genuinely', 'truly'],
        medium: ['quite', 'really', 'very', 'particularly', 'especially', 'notably'],
        mild: ['fairly', 'somewhat', 'rather', 'relatively', 'reasonably', 'pretty'],
      },

      // Hedging language for authenticity
      hedges: {
        opinion: ['in my opinion', 'I feel', 'I believe', 'it seems to me', 'from my perspective'],
        uncertainty: ['perhaps', 'maybe', 'possibly', 'it might be', 'could be'],
        concession: ['although', 'while', 'despite', 'even though', 'granted', 'admittedly'],
      },

      // Specific descriptors by category
      descriptors: {
        room: {
          positive: [
            'spacious',
            'immaculate',
            'cozy',
            'well-appointed',
            'pristine',
            'inviting',
            'comfortable',
            'modern',
            'elegant',
            'spotless',
            'airy',
            'bright',
          ],
          negative: [
            'cramped',
            'dated',
            'worn',
            'musty',
            'noisy',
            'dark',
            'stuffy',
            'tired-looking',
          ],
        },
        staff: {
          positive: [
            'attentive',
            'professional',
            'courteous',
            'knowledgeable',
            'friendly',
            'accommodating',
            'helpful',
            'efficient',
            'warm',
            'responsive',
            'proactive',
          ],
          negative: ['inattentive', 'unprofessional', 'rude', 'unhelpful', 'slow', 'indifferent'],
        },
        food: {
          positive: [
            'delicious',
            'fresh',
            'flavorful',
            'well-prepared',
            'varied',
            'abundant',
            'appetizing',
            'excellent',
            'tasty',
            'memorable',
            'divine',
          ],
          negative: ['bland', 'cold', 'limited', 'disappointing', 'overcooked', 'tasteless'],
        },
        location: {
          positive: [
            'convenient',
            'central',
            'accessible',
            'well-located',
            'prime',
            'strategic',
            'ideal',
            'perfect',
          ],
          negative: ['remote', 'inconvenient', 'isolated', 'noisy', 'busy', 'cramped'],
        },
        amenities: {
          positive: [
            'modern',
            'well-maintained',
            'comprehensive',
            'top-notch',
            'excellent',
            'impressive',
            'extensive',
          ],
          negative: ['limited', 'outdated', 'broken', 'insufficient', 'poor', 'lacking'],
        },
      },
    };
  }

  /**
   * Select emotion based on rating
   */
  selectEmotion(rating) {
    let emotionCategory;

    if (rating >= 5) {
      emotionCategory = 'delight';
    } else if (rating >= 4) {
      emotionCategory = 'satisfaction';
    } else if (rating >= 3) {
      emotionCategory = 'neutral';
    } else {
      emotionCategory = 'disappointment';
    }

    const emotions = this.vocabulary.emotions[emotionCategory];
    return this.selectRandom(emotions);
  }

  /**
   * Select descriptor based on category and sentiment
   */
  selectDescriptor(category, sentiment) {
    const categoryDescriptors = this.vocabulary.descriptors[category];
    if (!categoryDescriptors) {
      return sentiment === 'positive' ? 'good' : sentiment === 'negative' ? 'disappointing' : 'okay';
    }

    const descriptors = categoryDescriptors[sentiment] || categoryDescriptors['positive'];
    return this.selectRandom(descriptors);
  }

  /**
   * Get intensifier based on strength
   */
  getIntensifier(strength = 'medium') {
    const intensifiers = this.vocabulary.intensifiers[strength] || this.vocabulary.intensifiers['medium'];
    return this.selectRandom(intensifiers);
  }

  /**
   * Get hedge phrase
   */
  getHedge(type = 'opinion') {
    const hedges = this.vocabulary.hedges[type] || this.vocabulary.hedges['opinion'];
    return this.selectRandom(hedges);
  }

  /**
   * Get temporal expression
   */
  getTemporal(type = 'sequence') {
    const temporals = this.vocabulary.temporal[type] || this.vocabulary.temporal['sequence'];
    return this.selectRandom(temporals);
  }

  /**
   * Get specific detail based on highlight category
   */
  getSpecificDetail(highlight) {
    const details = {
      cleanliness: 'housekeeping attention',
      comfort: 'bedding quality',
      service: 'staff responsiveness',
      breakfast: 'variety offered',
      location: 'proximity to attractions',
      amenities: 'facility quality',
      wifi: 'connection speed',
      value: 'pricing fairness',
    };

    return details[highlight.category] || 'attention to detail';
  }

  /**
   * Get personal anecdotes
   */
  getPersonalAnecdote() {
    const anecdotes = [
      'My partner was particularly impressed',
      'This made our mornings so much better',
      'Exactly what we needed after a long day',
      'A detail that might seem small but meant a lot',
    ];
    return this.selectRandom(anecdotes);
  }

  /**
   * Get mild criticism
   */
  getMildCriticism() {
    const criticisms = [
      'it could have been more consistent',
      'there was room for improvement',
      'not everyone might appreciate this',
      'it took some getting used to',
    ];
    return this.selectRandom(criticisms);
  }

  /**
   * Get memorable moments
   */
  getMemorableMoment() {
    const moments = [
      'when the concierge went out of their way to secure us last-minute reservations',
      'watching the sunset from our balcony with a complimentary bottle of wine',
      'the genuine smile from the staff who remembered our names',
      'finding fresh flowers in our room after housekeeping',
    ];
    return this.selectRandom(moments);
  }

  /**
   * Get redemptive moments
   */
  getRedemptiveMoment() {
    const moments = [
      "the staff's effort to address our concerns showed they truly cared",
      'there were enough positive aspects to balance things out',
      'certain elements of the stay were genuinely enjoyable',
      'we found ways to make the most of our time there',
    ];
    return this.selectRandom(moments);
  }

  /**
   * Find positive aspects
   */
  findPositive() {
    const positives = [
      'the location was convenient',
      'the bed was comfortable',
      'the staff tried their best',
      'the value was reasonable',
    ];
    return this.selectRandom(positives);
  }

  /**
   * Create summary of highlights
   */
  summarizeHighlights(highlights) {
    if (highlights.length === 0) return 'thoughtful touches';
    if (highlights.length === 1) return highlights[0].text.substring(2).toLowerCase();

    const items = highlights.slice(0, 2).map((h) => h.text.substring(2).toLowerCase());
    return items.join(' and ');
  }

  /**
   * Utility function to select random item from array
   */
  selectRandom(array) {
    if (!array || array.length === 0) return '';
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Get vocabulary statistics
   */
  getVocabularyStats() {
    const stats = {
      totalCategories: Object.keys(this.vocabulary).length,
      emotions: Object.keys(this.vocabulary.emotions).length,
      descriptors: Object.keys(this.vocabulary.descriptors).length,
      temporal: Object.keys(this.vocabulary.temporal).length,
    };

    // Count total words
    let totalWords = 0;
    const countWords = (obj) => {
      for (const key in obj) {
        if (Array.isArray(obj[key])) {
          totalWords += obj[key].length;
        } else if (typeof obj[key] === 'object') {
          countWords(obj[key]);
        }
      }
    };

    countWords(this.vocabulary);
    stats.totalWords = totalWords;

    return stats;
  }

  /**
   * Add custom vocabulary
   */
  addCustomVocabulary(category, subcategory, words) {
    if (!this.vocabulary[category]) {
      this.vocabulary[category] = {};
    }
    if (!this.vocabulary[category][subcategory]) {
      this.vocabulary[category][subcategory] = [];
    }
    this.vocabulary[category][subcategory].push(...words);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VocabularyManager;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
  window.VocabularyManager = VocabularyManager;
}