/**
 * Transition Manager for Human-Like NLG Engine
 * Manages natural transitions and flow between sentences and paragraphs
 * @author Hotel Review Generator Team
 * @since 2.0.0
 */

/**
 * Transition Manager class
 * Handles natural transitions and flow between review sections
 */
class TransitionManager {
  /**
   * Creates a new TransitionManager instance
   */
  constructor() {
    this.initializeTransitions();
  }

  /**
   * Natural transitional phrases for coherent flow
   * Initializes transition categories and phrases
   * @returns {void}
   */
  initializeTransitions() {
    this.transitions = {
      additive: [
        'Moreover,',
        'Furthermore,',
        'Additionally,',
        'What\'s more,',
        'Beyond that,',
        'On top of this,',
        'Also worth noting,',
      ],
      contrastive: [
        'However,',
        'On the other hand,',
        'That said,',
        'Conversely,',
        'In contrast,',
        'Despite this,',
        'Nevertheless,',
      ],
      temporal: [
        'Initially,',
        'Subsequently,',
        'Later,',
        'Eventually,',
        'During our stay,',
        'Throughout the visit,',
        'By the end,',
      ],
      causal: [
        'As a result,',
        'Consequently,',
        'Therefore,',
        'This led to,',
        'Hence,',
        'Because of this,',
        'Due to this,',
      ],
      exemplification: [
        'For instance,',
        'For example,',
        'To illustrate,',
        'Case in point,',
        'Specifically,',
        'In particular,',
        'Notably,',
      ],
      emphasis: [
        'Most importantly,',
        'Above all,',
        'Particularly noteworthy,',
        'What really stood out,',
        'The highlight was,',
        'Especially impressive,',
        'Worth emphasizing,',
      ],
    };

    // Track used transitions to avoid repetition
    this.usedTransitions = [];
  }

  /**
   * Select unique transition to avoid repetition
   */
  selectUniqueTransition(index, totalPoints, usedTransitions = []) {
    let availableTransitions;

    if (index === 0) {
      // First point - use temporal or direct
      availableTransitions = [...this.transitions.temporal, 'What immediately struck us was', 'From the start,'];
    } else if (index === totalPoints - 1) {
      // Last point - use emphasis or summary
      availableTransitions = [...this.transitions.emphasis, 'Finally,', 'To cap it off,'];
    } else {
      // Middle points - use additive or exemplification
      availableTransitions = [...this.transitions.additive, ...this.transitions.exemplification];
    }

    // Filter out already used transitions
    const unusedTransitions = availableTransitions.filter(t => !usedTransitions.includes(t));

    if (unusedTransitions.length === 0) {
      // If all used, reset and use any available
      return this.selectRandom(availableTransitions);
    }

    return this.selectRandom(unusedTransitions);
  }

  /**
   * Get transition by type
   */
  getTransition(type, excludeUsed = true) {
    const transitionsOfType = this.transitions[type] || this.transitions.additive;

    if (excludeUsed) {
      const available = transitionsOfType.filter(t => !this.usedTransitions.includes(t));
      if (available.length > 0) {
        const selected = this.selectRandom(available);
        this.usedTransitions.push(selected);
        return selected;
      }
    }

    const selected = this.selectRandom(transitionsOfType);
    this.usedTransitions.push(selected);
    return selected;
  }

  /**
   * Get contrasting transition for negative points
   */
  getContrastTransition() {
    return this.getTransition('contrastive');
  }

  /**
   * Get additive transition for building points
   */
  getAdditiveTransition() {
    return this.getTransition('additive');
  }

  /**
   * Get emphasis transition for important points
   */
  getEmphasisTransition() {
    return this.getTransition('emphasis');
  }

  /**
   * Get temporal transition for time-based flow
   */
  getTemporalTransition() {
    return this.getTransition('temporal');
  }

  /**
   * Get causal transition for cause-effect relationships
   */
  getCausalTransition() {
    return this.getTransition('causal');
  }

  /**
   * Create smooth narrative bridge between sections
   */
  createNarrativeBridge(fromSection, toSection, sentiment = 'neutral') {
    const bridges = {
      'intro-to-details': {
        positive: [
          'Let me share what made this experience special.',
          'Here\'s what stood out during our stay.',
          'Several aspects particularly impressed us.',
        ],
        negative: [
          'Unfortunately, several issues became apparent.',
          'Here\'s where things didn\'t quite meet expectations.',
          'A few concerns emerged during our visit.',
        ],
        neutral: [
          'Here are the key aspects of our experience.',
          'Let me walk you through our stay.',
          'Several points are worth mentioning.',
        ],
      },
      'details-to-climax': {
        positive: [
          'But what truly made this stay memorable was',
          'The defining moment came when',
          'What elevated the entire experience was',
        ],
        negative: [
          'The situation reached its low point when',
          'Things took a turn for the worse when',
          'The most disappointing aspect was',
        ],
        neutral: [
          'The most significant moment occurred when',
          'What defined our stay was',
          'The turning point came when',
        ],
      },
      'climax-to-conclusion': {
        positive: [
          'Reflecting on the entire experience,',
          'Looking back at our stay,',
          'Taking everything into account,',
        ],
        negative: [
          'Despite these challenges,',
          'In the end,',
          'All things considered,',
        ],
        neutral: [
          'Overall,',
          'In summary,',
          'To conclude,',
        ],
      },
    };

    const bridgeKey = `${fromSection}-to-${toSection}`;
    const bridgeOptions = bridges[bridgeKey]?.[sentiment] || bridges[bridgeKey]?.['neutral'] || ['Moving on,'];

    return this.selectRandom(bridgeOptions);
  }

  /**
   * Create connecting phrases for highlight points
   */
  createHighlightConnector(index, total, sentiment) {
    if (index === 0) {
      return sentiment === 'positive' ? 'What immediately impressed us was' : 'Our first concern was';
    } else if (index === total - 1) {
      return sentiment === 'positive' ? 'The final touch that sealed the deal was' : 'The last straw was';
    } else {
      const connectors = {
        positive: ['Another standout feature was', 'Equally impressive was', 'We also appreciated'],
        negative: ['Another disappointment was', 'We also encountered', 'Additionally problematic was'],
        neutral: ['We also noted', 'Another aspect worth mentioning was', 'It\'s also worth noting'],
      };
      return this.selectRandom(connectors[sentiment] || connectors.neutral);
    }
  }

  /**
   * Reset used transitions (call at start of new review)
   */
  resetUsedTransitions() {
    this.usedTransitions = [];
  }

  /**
   * Get variety in sentence starters
   */
  getVariedStarter(index, context = 'general') {
    const starters = {
      general: [
        'What struck me was',
        'I was particularly impressed by',
        'One thing that stood out was',
        'It\'s worth highlighting',
        'I should mention',
        'Something that caught my attention was',
      ],
      positive: [
        'We were delighted to find',
        'A pleasant surprise was',
        'I was thrilled by',
        'What made us smile was',
        'We absolutely loved',
        'The real gem was',
      ],
      negative: [
        'Unfortunately, we encountered',
        'One disappointment was',
        'I was let down by',
        'A concern arose with',
        'We were troubled by',
        'One issue we faced was',
      ],
    };

    // Use index to ensure variety
    const contextStarters = starters[context] || starters.general;
    return contextStarters[index % contextStarters.length];
  }

  /**
   * Create paragraph transitions
   */
  createParagraphTransition(currentTopic, nextTopic, sentiment = 'neutral') {
    const transitions = {
      'room-staff': {
        positive: 'The excellence extended beyond our accommodations to the service.',
        negative: 'While the room had issues, the service presented different challenges.',
        neutral: 'Moving from accommodations to service,',
      },
      'staff-food': {
        positive: 'The outstanding service was matched by equally impressive dining.',
        negative: 'Service issues were compounded by problems with the food.',
        neutral: 'Regarding the dining experience,',
      },
      'food-location': {
        positive: 'The culinary experience was enhanced by the property\'s prime location.',
        negative: 'Dining disappointments were somewhat offset by the convenient location.',
        neutral: 'As for the location,',
      },
    };

    const key = `${currentTopic}-${nextTopic}`;
    return transitions[key]?.[sentiment] || transitions[key]?.['neutral'] || 'Additionally,';
  }

  /**
   * Utility function to select random item from array
   */
  selectRandom(array) {
    if (!array || array.length === 0) return '';
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Get transition statistics
   */
  getTransitionStats() {
    return {
      totalTypes: Object.keys(this.transitions).length,
      totalTransitions: Object.values(this.transitions).flat().length,
      usedTransitions: this.usedTransitions.length,
      availableTransitions: Object.values(this.transitions).flat().length - this.usedTransitions.length,
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TransitionManager;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
  window.TransitionManager = TransitionManager;
}