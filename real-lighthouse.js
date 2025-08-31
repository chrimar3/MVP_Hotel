/**
 * Real Lighthouse Measurements via PageSpeed Insights API
 * This uses Google's actual Lighthouse engine
 */

const https = require('https');
const fs = require('fs');

// First, we need to deploy the site to test it
// Let's check if GitHub Pages is accessible
const testUrl = 'https://chrimar3.github.io/MVP_Hotel/';

function runRealLighthouse(url) {
  return new Promise((resolve, reject) => {
    // PageSpeed Insights API (free, no key required for basic usage)
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&category=accessibility&category=best-practices&category=seo&category=pwa`;
    
    console.log('🚀 Running REAL Lighthouse test on:', url);
    console.log('⏳ This may take 15-30 seconds...\n');
    
    https.get(apiUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (result.error) {
            console.error('❌ Error:', result.error.message);
            reject(result.error);
            return;
          }
          
          const lighthouse = result.lighthouseResult;
          const categories = lighthouse.categories;
          
          console.log('🎯 REAL LIGHTHOUSE RESULTS');
          console.log('=' .repeat(50));
          console.log(`🌐 URL: ${lighthouse.finalUrl}`);
          console.log(`📅 Test Date: ${new Date(lighthouse.fetchTime).toLocaleString()}`);
          console.log('\n📊 SCORES (0-100):');
          console.log(`  ⚡ Performance: ${Math.round(categories.performance.score * 100)}/100`);
          console.log(`  ♿ Accessibility: ${Math.round(categories.accessibility.score * 100)}/100`);
          console.log(`  ✅ Best Practices: ${Math.round(categories['best-practices'].score * 100)}/100`);
          console.log(`  🔍 SEO: ${Math.round(categories.seo.score * 100)}/100`);
          console.log(`  📱 PWA: ${Math.round(categories.pwa.score * 100)}/100`);
          
          // Core Web Vitals
          const metrics = lighthouse.audits;
          console.log('\n📈 CORE WEB VITALS:');
          console.log(`  FCP: ${metrics['first-contentful-paint'].displayValue} ${metrics['first-contentful-paint'].score >= 0.9 ? '✅' : metrics['first-contentful-paint'].score >= 0.5 ? '⚠️' : '❌'}`);
          console.log(`  LCP: ${metrics['largest-contentful-paint'].displayValue} ${metrics['largest-contentful-paint'].score >= 0.9 ? '✅' : metrics['largest-contentful-paint'].score >= 0.5 ? '⚠️' : '❌'}`);
          console.log(`  TBT: ${metrics['total-blocking-time'].displayValue} ${metrics['total-blocking-time'].score >= 0.9 ? '✅' : metrics['total-blocking-time'].score >= 0.5 ? '⚠️' : '❌'}`);
          console.log(`  CLS: ${metrics['cumulative-layout-shift'].displayValue} ${metrics['cumulative-layout-shift'].score >= 0.9 ? '✅' : metrics['cumulative-layout-shift'].score >= 0.5 ? '⚠️' : '❌'}`);
          console.log(`  TTI: ${metrics['interactive'].displayValue} ${metrics['interactive'].score >= 0.9 ? '✅' : metrics['interactive'].score >= 0.5 ? '⚠️' : '❌'}`);
          
          // Key Issues
          console.log('\n⚠️ TOP ISSUES TO FIX:');
          let issueCount = 0;
          Object.values(lighthouse.audits).forEach(audit => {
            if (audit.score !== null && audit.score < 0.9 && audit.details && audit.details.type === 'opportunity') {
              issueCount++;
              if (issueCount <= 5) {
                console.log(`  ${issueCount}. ${audit.title}: ${audit.displayValue || 'Fix needed'}`);
              }
            }
          });
          
          // Save full report
          fs.writeFileSync('lighthouse-real-report.json', JSON.stringify(result, null, 2));
          console.log('\n✅ Full report saved to lighthouse-real-report.json');
          
          // Overall score
          const avgScore = Math.round(
            (categories.performance.score + 
             categories.accessibility.score + 
             categories['best-practices'].score + 
             categories.seo.score) * 100 / 4
          );
          
          console.log('\n🏆 OVERALL SCORE:', avgScore + '/100');
          
          resolve(result);
        } catch (error) {
          console.error('❌ Failed to parse results:', error);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('❌ Request failed:', error);
      reject(error);
    });
  });
}

// Try GitHub Pages first
runRealLighthouse(testUrl).catch(() => {
  console.log('\n⚠️ GitHub Pages not accessible. Trying alternative...');
  
  // Try netlify deployment
  const netlifyUrl = 'https://mvp-hotel.netlify.app/';
  return runRealLighthouse(netlifyUrl).catch(() => {
    console.log('\n❌ No public deployment found.');
    console.log('📝 To get real Lighthouse scores, you need to:');
    console.log('   1. Deploy your site (GitHub Pages, Netlify, Vercel, etc.)');
    console.log('   2. Run: node real-lighthouse.js');
    console.log('\n🔄 Alternative: Use Chrome DevTools:');
    console.log('   1. Open Chrome');
    console.log('   2. Open DevTools (F12)');
    console.log('   3. Go to Lighthouse tab');
    console.log('   4. Click "Generate report"');
  });
});