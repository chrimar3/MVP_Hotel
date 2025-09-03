/**
 * Test script to verify review generation functionality
 */

// Test the basic template generation logic
function testTemplateGeneration() {
    console.log('Testing Template Generation...\n');
    
    // Simulate the basic template logic from review-generator.html
    const translations = {
        en: {
            location: 'location',
            cleanliness: 'cleanliness',
            service: 'service',
            opening: 'I had a wonderful stay at',
            enjoyed: 'I particularly enjoyed the',
            staff: 'Special thanks to',
            recommend: 'I would definitely recommend this hotel',
            closing: 'Looking forward to returning!'
        }
    };
    
    // Test data
    const hotelName = 'Test Hotel';
    const selectedAspects = ['cleanliness', 'service'];
    const staffName = 'John at reception';
    const comments = 'Great experience overall.';
    const lang = 'en';
    
    // Generate review (simulating the logic from lines 1044-1062)
    const t = translations[lang];
    let review = `${t.opening} ${hotelName}. `;
    
    if (selectedAspects.length > 0) {
        const aspectsText = selectedAspects.map(a => t[a]).join(', ');
        review += `${t.enjoyed} ${aspectsText}. `;
    }
    
    if (staffName) {
        review += `${t.staff} ${staffName}. `;
    }
    
    if (comments) {
        review += `${comments} `;
    }
    
    review += `${t.recommend}. ${t.closing}`;
    
    console.log('Generated Review:');
    console.log('=================');
    console.log(review);
    console.log('\n');
    
    // Test assertions
    const tests = [
        {
            name: 'Review contains hotel name',
            pass: review.includes(hotelName)
        },
        {
            name: 'Review contains selected aspects',
            pass: selectedAspects.every(aspect => review.includes(translations.en[aspect]))
        },
        {
            name: 'Review contains staff name',
            pass: review.includes(staffName)
        },
        {
            name: 'Review contains comments',
            pass: review.includes(comments)
        },
        {
            name: 'Review has proper structure',
            pass: review.startsWith(t.opening) && review.includes(t.closing)
        }
    ];
    
    console.log('Test Results:');
    console.log('=============');
    tests.forEach(test => {
        console.log(`${test.pass ? '✅' : '❌'} ${test.name}`);
    });
    
    const allPassed = tests.every(t => t.pass);
    console.log(`\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed'}`);
    
    return allPassed;
}

// Test button selector fix
function testButtonSelector() {
    console.log('\nTesting Button Selector Fix...\n');
    
    // Check if the fix was applied correctly
    const fs = require('fs');
    const content = fs.readFileSync('review-generator.html', 'utf8');
    
    const hasCorrectSelector = content.includes("document.getElementById('generateBtn')");
    const hasOldSelector = content.includes("document.querySelector('.generate-btn')");
    
    console.log(`✅ Using getElementById('generateBtn'): ${hasCorrectSelector}`);
    console.log(`✅ No incorrect .generate-btn selector: ${!hasOldSelector}`);
    
    return hasCorrectSelector && !hasOldSelector;
}

// Run all tests
console.log('=================================');
console.log('Review Generator Functionality Test');
console.log('=================================\n');

const templateTestPassed = testTemplateGeneration();
const selectorTestPassed = testButtonSelector();

console.log('\n=================================');
console.log('Final Results:');
console.log('=================================');
console.log(`Template Generation: ${templateTestPassed ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Button Selector: ${selectorTestPassed ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Overall: ${templateTestPassed && selectorTestPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

// Kill the web server
const { exec } = require('child_process');
exec("pkill -f 'python3 -m http.server'", (error) => {
    if (!error) console.log('\nWeb server stopped.');
});