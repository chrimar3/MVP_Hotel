// Quick test of the review generation logic
const CONFIG = {
    hotelName: "Acme Hotel",
    aspects: {
        'clean-rooms': 'The rooms were spotlessly clean and well-maintained',
        'comfortable-beds': 'The beds were incredibly comfortable',
        'great-location': 'The location was perfect for exploring the area'
    },
    openings: ['Had a wonderful stay at', 'Really enjoyed our time at'],
    closings: ['Highly recommend this hotel!', 'Would definitely stay again!']
};

const ReviewBuilder = {
    formatAspects(aspects) {
        if (aspects.length === 1) return aspects[0] + '.';
        if (aspects.length === 2) return aspects[0] + ' and ' + aspects[1].toLowerCase() + '.';
        const last = aspects.pop();
        return aspects.join(', ') + ', and ' + last.toLowerCase() + '.';
    },
    
    assembleReview(aspects, staffName, comments) {
        const parts = [];
        
        // Random opening (using first for consistency)
        const opening = CONFIG.openings[0];
        parts.push(`${opening} ${CONFIG.hotelName}!`);
        
        // Aspects
        if (aspects.length > 0) {
            parts.push(this.formatAspects(aspects));
        } else {
            parts.push('Everything about our stay was excellent and exceeded our expectations.');
        }
        
        // Staff recognition
        if (staffName) {
            parts.push(`Special thanks to ${staffName} who made our stay extra special.`);
        }
        
        // Additional comments
        if (comments) {
            parts.push(comments);
        }
        
        // Random closing (using first for consistency)
        const closing = CONFIG.closings[0];
        parts.push(closing);
        
        return parts.join('\n\n');
    }
};

// Test cases
console.log('=== Test 1: No aspects selected ===');
console.log(ReviewBuilder.assembleReview([], '', ''));

console.log('\n=== Test 2: Single aspect ===');
console.log(ReviewBuilder.assembleReview([CONFIG.aspects['clean-rooms']], '', ''));

console.log('\n=== Test 3: Multiple aspects + staff + comments ===');
console.log(ReviewBuilder.assembleReview([
    CONFIG.aspects['clean-rooms'], 
    CONFIG.aspects['comfortable-beds'],
    CONFIG.aspects['great-location']
], 'Sarah at reception', 'The breakfast was outstanding and the view from our room was breathtaking.'));

console.log('\n=== Test 4: Aspect formatting ===');
console.log('Single:', ReviewBuilder.formatAspects(['Great service']));
console.log('Two:', ReviewBuilder.formatAspects(['Great service', 'Clean rooms']));
console.log('Three:', ReviewBuilder.formatAspects(['Great service', 'Clean rooms', 'Good food']));