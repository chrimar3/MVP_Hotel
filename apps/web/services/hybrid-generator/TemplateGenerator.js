/**
 * Template Generator for HybridGenerator
 * Provides fallback review generation using pre-defined templates
 */

class TemplateGenerator {
  /**
   * Generate review from templates
   */
  generate(params) {
    const { hotelName, rating, tripType, highlights = [], nights = 3 } = params;

    const emotionalTones = {
      5: ['euphoric', 'passionate', 'delighted', 'thrilled'],
      4: ['positive', 'satisfied', 'pleased', 'content'],
      3: ['neutral', 'lukewarm', 'indifferent', 'okay'],
      2: ['disappointed', 'frustrated', 'critical', 'underwhelmed'],
      1: ['furious', 'enraged', 'disgusted', 'betrayed']
    };

    const templates = {
      5: [
        `What an incredible ${nights}-night adventure at ${hotelName}! Our ${tripType} trip was nothing short of magical. ${this.createSophisticatedHighlights(highlights, rating)} Every moment felt curated just for us - this isn't just a hotel, it's an experience I'll cherish forever.`,
        `From the moment we stepped into ${hotelName}, I knew this would be extraordinary. Our ${nights}-night stay was a masterclass in hospitality. ${this.createSophisticatedHighlights(highlights, rating)} For ${tripType} travelers seeking perfection, look no further - this place redefines luxury.`,
        `${hotelName} didn't just meet our expectations; they obliterated them. Our ${tripType} journey was transformed by their ${this.getRandomElement(emotionalTones[5])} approach to hospitality. ${this.createSophisticatedHighlights(highlights, rating)} An absolute game-changer.`
      ],
      4: [
        `${hotelName} delivered a solid ${nights}-night experience that genuinely impressed me. While not flawless, it was a step above the ordinary. ${this.createSophisticatedHighlights(highlights, rating)} Perfect for discerning ${tripType} travelers who appreciate nuanced quality.`,
        `Our ${tripType} stay at ${hotelName} was a pleasant surprise. ${this.createSophisticatedHighlights(highlights, rating)} The staff's ${this.getRandomElement(['attentiveness', 'professionalism', 'warmth'])} made all the difference.`,
        `Navigating ${hotelName} felt like a well-choreographed dance during our ${nights}-night stay. ${this.createSophisticatedHighlights(highlights, rating)} A dependable choice for ${tripType} travelers.`
      ],
      3: [
        `${hotelName} provided exactly what we needed - no more, no less. Our ${nights}-night ${tripType} stay was serviceable. ${this.createSophisticatedHighlights(highlights, rating)} It does the job without any unnecessary frills.`,
        `Midway through our ${tripType} trip, ${hotelName} proved to be a functional basecamp. ${this.createSophisticatedHighlights(highlights, rating)} Nothing spectacular, but completely adequate.`,
        `If you're seeking basic comfort for a ${tripType} journey, ${hotelName} checks those boxes. ${this.createSophisticatedHighlights(highlights, rating)} Just don't expect to be wowed.`
      ],
      2: [
        `Our ${nights}-night experience at ${hotelName} felt like a series of missed opportunities. ${this.createSophisticatedHighlights(highlights, rating)} For a ${tripType} trip, it left us more frustrated than rested.`,
        `${hotelName} seemed to be trying, but falling short at every turn. ${this.createSophisticatedHighlights(highlights, rating)} Our ${tripType} stay was more about managing expectations than enjoying them.`,
        `Between unmet promises and minor inconveniences, ${hotelName} tested our patience during our ${nights}-night ${tripType} stay. ${this.createSophisticatedHighlights(highlights, rating)} A stark reminder that not all accommodations are created equal.`
      ],
      1: [
        `${hotelName} represents everything wrong with modern hospitality. Our ${nights}-night ${tripType} nightmare was a masterclass in how NOT to run a hotel. ${this.createSophisticatedHighlights(highlights, rating)} Save yourself the trouble and look elsewhere.`,
        `I've experienced more warmth in a corporate waiting room than during our stay at ${hotelName}. ${this.createSophisticatedHighlights(highlights, rating)} A ${tripType} experience so bad, it almost felt intentional.`,
        `Some hotels restore your faith in travel. ${hotelName} destroys it. Our ${nights}-night ${tripType} stay was a perfect storm of incompetence. ${this.createSophisticatedHighlights(highlights, rating)} An absolute disaster from start to finish.`
      ]
    };

    const ratingTemplates = templates[rating] || templates[3];
    return ratingTemplates[Math.floor(Math.random() * ratingTemplates.length)];
  }

  /**
   * Convert highlights array to natural text
   */
  highlightsToText(highlights, minimal = false) {
    if (highlights.length === 0) return 'The overall experience was as expected.';

    const highlightMap = {
      location: 'the location was perfect',
      cleanliness: 'the room was spotlessly clean',
      comfort: 'the bed was extremely comfortable',
      service: 'the staff provided excellent service',
      breakfast: 'the breakfast was delicious',
      wifi: 'the WiFi was fast and reliable',
      value: 'it offered great value for money',
      amenities: 'the amenities were modern and well-maintained',
    };

    const sentences = highlights.map((h) => highlightMap[h] || h);

    if (minimal) return sentences[0];

    if (sentences.length === 1) {
      return sentences[0].charAt(0).toUpperCase() + sentences[0].slice(1) + '.';
    } else if (sentences.length === 2) {
      return (
        sentences[0].charAt(0).toUpperCase() + sentences[0].slice(1) + ' and ' + sentences[1] + '.'
      );
    } else {
      const last = sentences.pop();
      return (
        sentences.join(', ').charAt(0).toUpperCase() +
        sentences.join(', ').slice(1) +
        ', and ' +
        last +
        '.'
      );
    }
  }

  /**
   * Get available highlight options for UI
   */
  getAvailableHighlights() {
    return [
      { key: 'location', label: 'Location' },
      { key: 'cleanliness', label: 'Cleanliness' },
      { key: 'comfort', label: 'Comfort' },
      { key: 'service', label: 'Service' },
      { key: 'breakfast', label: 'Breakfast' },
      { key: 'wifi', label: 'WiFi' },
      { key: 'value', label: 'Value for Money' },
      { key: 'amenities', label: 'Amenities' },
    ];
  }

  /**
   * Get template variations for testing
   */
  getTemplateVariations(rating) {
    const templates = {
      5: 3,  // More variations for 5-star reviews
      4: 3,  // More variations for 4-star reviews
      3: 3,  // More neutral variations
      2: 3,  // More critical variations
      1: 3,  // More harsh variations
    };
    return templates[rating] || 3;
  }

  /**
   * Generate a random element from an array
   * @param {Array} array - Input array
   * @returns {*} Random element from the array
   */
  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TemplateGenerator;
}

// Export to global window object for browser use
if (typeof window !== 'undefined') {
  window.TemplateGenerator = TemplateGenerator;
}