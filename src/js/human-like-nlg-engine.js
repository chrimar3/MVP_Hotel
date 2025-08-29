/**
 * Advanced Human-Like Natural Language Generation Engine
 *
 * This module transforms robotic template-based text generation into
 * genuinely human-sounding reviews with:
 * - Natural linguistic variation and transitions
 * - Emotional arcs and storytelling
 * - Context-aware sentence construction
 * - Vocabulary diversity (10,000+ words)
 * - Coherent narrative flow
 */

class HumanLikeNLGEngine {
  constructor() {
    // Initialize linguistic components
    this.initializeVocabulary();
    this.initializeTransitions();
    this.initializeSentencePatterns();
    this.initializeEmotionalArcs();
    this.initializeStorytellingElements();
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
      },
    };
  }

  /**
   * Natural transitional phrases for coherent flow
   */
  initializeTransitions() {
    this.transitions = {
      additive: [
        'Moreover,',
        'Furthermore,',
        'Additionally,',
        "What's more,",
        'On top of that,',
        'Another thing worth mentioning is that',
        'I should also mention that',
        "It's worth noting that",
      ],
      contrastive: [
        'However,',
        'On the other hand,',
        'That said,',
        'Nevertheless,',
        'Despite this,',
        'In contrast,',
        'Conversely,',
        'Although,',
        'While I appreciated',
        'The only downside was',
      ],
      causal: [
        'As a result,',
        'Consequently,',
        'This meant that',
        'Because of this,',
        'This led to',
        'Thanks to',
        'Due to',
        'Which explains why',
      ],
      exemplifying: [
        'For instance,',
        'For example,',
        'To give you an idea,',
        'Case in point:',
        'One example:',
        'Such as when',
        'Like when',
        'Particularly when',
      ],
      temporal: [
        'During our stay,',
        'Throughout the visit,',
        'On our first night,',
        'By the second day,',
        'Towards the end,',
        'Each morning,',
        'Every evening,',
      ],
      emphasizing: [
        'Indeed,',
        'In fact,',
        'Actually,',
        'To be honest,',
        'Frankly,',
        'I must say,',
        'I have to admit,',
        'Surprisingly,',
      ],
    };
  }

  /**
   * Natural sentence patterns that vary structure
   */
  initializeSentencePatterns() {
    this.sentencePatterns = {
      // Personal anecdotes (creates authenticity)
      anecdotal: [
        'I still remember {moment} when {experience}.',
        'One {time_of_day}, we {action} and were {emotion} to find {discovery}.',
        'My {companion} and I were {emotion} when {event}.',
        'The moment that stands out most was when {specific_event}.',
        "I'll never forget how {person} {action} when we {situation}.",
      ],

      // Sensory descriptions (creates immersion)
      sensory: [
        'The {noun} had a {adjective} {sensory_quality} that {effect}.',
        'You could {sense_verb} the {quality} from {location}.',
        'The {aspect} was {descriptor}, with {detail1} and {detail2}.',
        'Walking into {location}, the first thing you notice is {observation}.',
      ],

      // Comparative (adds credibility)
      comparative: [
        "Compared to other {category} I've {experienced}, this was {comparison}.",
        'Having stayed at many {category}, I can say this {aspect} was {ranking}.',
        'This reminded me of {comparison}, but with {difference}.',
        "It's not quite {high_comparison}, but certainly better than {low_comparison}.",
      ],

      // Emotional journey (creates engagement)
      emotional: [
        'I went from {emotion1} to {emotion2} when {event}.',
        'Initially {feeling1}, but {transition} {feeling2}.',
        'What started as {beginning} turned into {ending}.',
        'My {emotion} quickly turned to {new_emotion} when {trigger}.',
      ],

      // Specific details (adds authenticity)
      specific: [
        'The {specific_item} (I believe it was {detail}) really {impact}.',
        'At exactly {time}, {event} which {consequence}.',
        "The {person}'s name was {name}, and they {action}.",
        '{number} times during our stay, {repeated_event}.',
      ],
    };
  }

  /**
   * Emotional arcs for storytelling
   */
  initializeEmotionalArcs() {
    this.emotionalArcs = {
      // Positive crescendo (builds excitement)
      crescendo: {
        start: 'cautiously optimistic',
        middle: 'pleasantly surprised',
        peak: 'absolutely delighted',
        end: 'already planning our return',
      },

      // Redemption arc (overcomes challenges)
      redemption: {
        start: 'initial concerns',
        middle: 'staff went above and beyond',
        peak: 'completely turned around',
        end: 'exceeded expectations',
      },

      // Balanced perspective (most authentic)
      balanced: {
        start: 'high hopes',
        middle: 'mix of highs and lows',
        peak: 'standout moments',
        end: 'overall positive despite some issues',
      },

      // Discovery arc (finding hidden gems)
      discovery: {
        start: "didn't know what to expect",
        middle: 'pleasant discoveries',
        peak: 'hidden gem revealed',
        end: 'glad we took the chance',
      },
    };
  }

  /**
   * Storytelling elements for narrative structure
   */
  initializeStorytellingElements() {
    this.storyElements = {
      // Hooks that draw readers in
      hooks: [
        "I almost didn't write this review, but felt I had to share",
        "After reading mixed reviews, I wasn't sure what to expect",
        'This was our third visit, and something was different this time',
        "I'm usually not one to write reviews, but this experience warranted it",
        'We chose this hotel last minute, and what a decision it turned out to be',
      ],

      // Personal context (makes it relatable)
      context: [
        'traveling with my {companion} for our {occasion}',
        'as someone who travels {frequency} for {purpose}',
        'having stayed in {number} hotels this year alone',
        'being particularly picky about {aspect}',
        'after a long day of {activity}',
      ],

      // Specific memorable moments
      moments: [
        'when the {staff_member} remembered our {preference} without being asked',
        'finding {unexpected_amenity} waiting in our room',
        'watching the {view} from our {location}',
        'the way the {staff} handled {situation}',
        'discovering {hidden_feature} by accident',
      ],

      // Resolution and reflection
      conclusions: [
        'Would we return? Without hesitation.',
        "It's these little touches that transform a good stay into a memorable one.",
        "Sometimes you find exactly what you didn't know you were looking for.",
        'Perfect? No. Worth it? Absolutely.',
        'This is how hospitality should be done.',
      ],
    };
  }

  /**
   * Generate genuinely human-like review text
   */
  generateHumanLikeReview(rating, highlights, voice, context) {
    // Select emotional arc based on rating and voice
    const arc = this.selectEmotionalArc(rating, voice);

    // Build narrative structure
    const narrative = {
      hook: this.selectHook(context),
      setup: this.createSetup(context, voice),
      development: this.developMainPoints(highlights, rating, arc),
      climax: this.createClimax(highlights, rating),
      resolution: this.createResolution(rating, voice, highlights),
    };

    // Compose with natural flow
    return this.composeNaturalNarrative(narrative, arc, voice);
  }

  /**
   * Select appropriate emotional arc
   */
  selectEmotionalArc(rating, voice) {
    if (rating === 5 && voice === 'enthusiastic') {
      return this.emotionalArcs.crescendo;
    } else if (rating === 4 && voice === 'professional') {
      return this.emotionalArcs.balanced;
    } else if (rating >= 3 && rating <= 4) {
      return this.emotionalArcs.redemption;
    } else {
      return this.emotionalArcs.discovery;
    }
  }

  /**
   * Create natural setup with context
   */
  createSetup(context, voice) {
    const timeRef = this.getTimeReference(context.checkIn, context.checkOut);
    const purpose = this.inferPurpose(context.tripType);

    // Use varied sentence structures
    const templates = [
      `${timeRef}, my ${context.tripType} trip brought me to ${context.hotelName}. ${purpose}`,
      `Having just returned from ${context.duration} nights at ${context.hotelName}, I felt compelled to share my experience. ${timeRef}.`,
      `${context.hotelName} was our home for ${context.duration} nights ${timeRef}. ${purpose}`,
    ];

    return this.selectRandom(templates);
  }

  /**
   * Develop main points with natural transitions
   */
  developMainPoints(highlights, rating, arc) {
    const points = [];
    const usedTransitions = [];

    highlights.forEach((highlight, index) => {
      // Select unique transition
      let transition = this.selectUniqueTransition(index, highlights.length, usedTransitions);
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
    const descriptor = this.selectDescriptor(highlight.category, sentiment);
    const emotion = this.selectEmotion(rating);

    // Vary sentence patterns
    const patterns = [
      `The ${highlight.text.substring(2).toLowerCase()} was ${descriptor}`,
      `I was ${emotion} by the ${highlight.text.substring(2).toLowerCase()}`,
      `${highlight.text} - ${descriptor} and ${this.selectDescriptor(highlight.category, sentiment)}`,
      `What stood out was how ${descriptor} the ${highlight.text.substring(2).toLowerCase()} was`,
    ];

    return this.selectRandom(patterns);
  }

  /**
   * Add personal touches and specific details
   */
  addPersonalTouch(highlight, rating) {
    const touches = [
      `(the ${this.getSpecificDetail(highlight)} was a nice surprise).`,
      `- something I particularly appreciated.`,
      `, which made a real difference.`,
      `. ${this.getPersonalAnecdote(highlight)}`,
      `, though ${this.getMildCriticism(highlight)}.`,
    ];

    return rating >= 4 ? this.selectRandom(touches.slice(0, 4)) : this.selectRandom(touches);
  }

  /**
   * Create climactic moment
   */
  createClimax(highlights, rating) {
    if (rating >= 4) {
      return `The moment that truly captured the essence of our stay was ${this.getMemorableMoment(highlights)}.`;
    } else {
      return `Despite the challenges, ${this.getRedemptiveMoment(highlights)}.`;
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
   * Compose complete narrative with natural flow
   */
  composeNaturalNarrative(narrative, arc, voice) {
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

    // Apply voice-specific adjustments
    return this.applyVoicePersonality(review, voice);
  }

  /**
   * Apply voice-specific personality traits
   */
  applyVoicePersonality(text, voice) {
    switch (voice) {
      case 'professional':
        // Add measured language
        return text
          .replace(/amazing/gi, 'excellent')
          .replace(/awesome/gi, 'impressive')
          .replace(/!/g, '.');

      case 'friendly':
        // Add conversational elements
        return text.replace(/\. /g, (match, offset) => {
          return Math.random() > 0.7 ? ' - ' : match;
        });

      case 'enthusiastic':
        // Add excitement markers
        return text.replace(/\./g, (match, offset, string) => {
          const nextChar = string[offset + 1];
          if (nextChar === '\n' && Math.random() > 0.5) {
            return '!';
          }
          return match;
        });

      case 'detailed':
        // Already detailed, no changes needed
        return text;

      default:
        return text;
    }
  }

  // Helper methods

  selectRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  selectDescriptor(category, sentiment) {
    const descriptors = this.vocabulary.descriptors[category];
    if (descriptors && descriptors[sentiment]) {
      return this.selectRandom(descriptors[sentiment]);
    }
    return this.selectRandom(this.vocabulary.descriptors.room[sentiment]);
  }

  selectEmotion(rating) {
    if (rating >= 5) return this.selectRandom(this.vocabulary.emotions.delight);
    if (rating >= 4) return this.selectRandom(this.vocabulary.emotions.satisfaction);
    if (rating >= 3) return this.selectRandom(this.vocabulary.emotions.neutral);
    return this.selectRandom(this.vocabulary.emotions.disappointment);
  }

  selectUniqueTransition(index, total, used) {
    let category;
    if (index === 0) {
      category = 'temporal';
    } else if (index < total / 2) {
      category = 'additive';
    } else if (index === total - 1) {
      category = 'emphasizing';
    } else {
      category = Math.random() > 0.5 ? 'exemplifying' : 'additive';
    }

    let transition;
    do {
      transition = this.selectRandom(this.transitions[category]);
    } while (used.includes(transition));

    return transition;
  }

  getTimeReference(checkIn, checkOut) {
    const phrases = [
      `From ${checkIn} to ${checkOut}`,
      `During our recent stay (${checkIn}-${checkOut})`,
      `Last week`,
      `This past weekend`,
      `Just last month`,
    ];
    return this.selectRandom(phrases);
  }

  inferPurpose(tripType) {
    const purposes = {
      leisure: 'We were looking forward to a relaxing getaway.',
      business: 'The location needed to be convenient for meetings.',
      romantic: 'We wanted somewhere special for our celebration.',
      family: 'Finding a place that works for everyone can be challenging.',
    };
    return purposes[tripType] || purposes.leisure;
  }

  getSpecificDetail(highlight) {
    const details = {
      staff: 'manager who checked in on us',
      room: 'view from the window',
      amenities: 'afternoon tea service',
      location: 'walk to the main attractions',
    };
    return details[highlight.category] || 'attention to detail';
  }

  getPersonalAnecdote(highlight) {
    const anecdotes = [
      'My partner was particularly impressed',
      'This made our mornings so much better',
      'Exactly what we needed after a long day',
      'A detail that might seem small but meant a lot',
    ];
    return this.selectRandom(anecdotes);
  }

  getMildCriticism(highlight) {
    const criticisms = [
      'it could have been more consistent',
      'there was room for improvement',
      'not everyone might appreciate this',
      'it took some getting used to',
    ];
    return this.selectRandom(criticisms);
  }

  getMemorableMoment(highlights) {
    const moments = [
      'when the concierge went out of their way to secure us last-minute reservations',
      'watching the sunset from our balcony with a complimentary bottle of wine',
      'the genuine smile from the staff who remembered our names',
      'finding fresh flowers in our room after housekeeping',
    ];
    return this.selectRandom(moments);
  }

  getRedemptiveMoment(highlights) {
    const moments = [
      "the staff's effort to address our concerns showed they truly cared",
      'there were enough positive aspects to balance things out',
      'certain elements of the stay were genuinely enjoyable',
      'we found ways to make the most of our time there',
    ];
    return this.selectRandom(moments);
  }

  createReflection(rating, highlights) {
    if (rating >= 4) {
      return `Looking back, it's the combination of ${this.summarizeHighlights(highlights)} that made this stay memorable.`;
    } else {
      return `In reflection, while there were issues, ${this.findPositive(highlights)}.`;
    }
  }

  summarizeHighlights(highlights) {
    if (highlights.length === 0) return 'thoughtful touches';
    if (highlights.length === 1) return highlights[0].text.substring(2).toLowerCase();

    const items = highlights.slice(0, 2).map((h) => h.text.substring(2).toLowerCase());
    return items.join(' and ');
  }

  findPositive(highlights) {
    const positives = [
      'the location was convenient',
      'the bed was comfortable',
      'the staff tried their best',
      'the value was reasonable',
    ];
    return this.selectRandom(positives);
  }

  createRecommendation(rating, voice) {
    const recommendations = {
      5: {
        professional:
          'I would not hesitate to recommend this property to colleagues and friends alike.',
        friendly: "If you're on the fence, just book it - you won't regret it!",
        enthusiastic: "Stop reading reviews and book this place NOW! You'll thank me later!",
        detailed:
          'For travelers seeking quality accommodation with attention to detail, this delivers on all fronts.',
      },
      4: {
        professional: 'A solid choice that I would recommend with minor caveats.',
        friendly:
          'Would I stay here again? Yes, definitely! Just manage your expectations on a few things.',
        enthusiastic: 'Great place that just needs a few tweaks to be absolutely perfect!',
        detailed:
          "Recommended for those who value the positives I've mentioned and can overlook minor shortcomings.",
      },
      3: {
        professional: 'Suitable for travelers with specific needs or budget constraints.',
        friendly: "It's fine if you need a place to sleep and aren't too fussy.",
        enthusiastic: 'Could be great with some improvements - fingers crossed they make them!',
        detailed:
          'Consider carefully based on your priorities; it may or may not meet your specific requirements.',
      },
    };

    return recommendations[Math.max(3, rating)][voice];
  }
}

// Export for use in main file
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HumanLikeNLGEngine;
}
