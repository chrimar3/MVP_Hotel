/**
 * Free Analytics Integration
 * Uses Google Analytics 4 (free tier) for comprehensive analytics
 */

class FreeAnalytics {
  constructor() {
    this.GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Replace with your GA4 ID
    this.isInitialized = false;
    this.eventQueue = [];
    
    // Initialize GA4
    this.initializeGA4();
    
    // Initialize custom metrics collection
    this.initializeCustomMetrics();
  }
  
  initializeGA4() {
    // Only initialize in production
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('Analytics disabled in development');
      return;
    }
    
    // Add GA4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.GA_MEASUREMENT_ID}`;
    script.onload = () => {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() { dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', this.GA_MEASUREMENT_ID, {
        send_page_view: true,
        anonymize_ip: true, // GDPR compliance
        cookie_flags: 'SameSite=None;Secure'
      });
      
      this.isInitialized = true;
      this.flushEventQueue();
    };
    document.head.appendChild(script);
  }
  
  initializeCustomMetrics() {
    // Track Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.trackEvent('Core Web Vitals', 'LCP', Math.round(lastEntry.startTime));
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {}
      
      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.trackEvent('Core Web Vitals', 'FID', Math.round(entry.processingStart - entry.startTime));
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {}
      
      // Cumulative Layout Shift
      try {
        let cls = 0;
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          });
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        
        // Report CLS when page is hidden
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
            this.trackEvent('Core Web Vitals', 'CLS', Math.round(cls * 1000));
          }
        });
      } catch (e) {}
    }
    
    // Track page performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = performance.timing;
        const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
        const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
        const timeToFirstByte = timing.responseStart - timing.navigationStart;
        
        this.trackEvent('Performance', 'Page Load Time', pageLoadTime);
        this.trackEvent('Performance', 'DOM Ready Time', domReadyTime);
        this.trackEvent('Performance', 'Time to First Byte', timeToFirstByte);
        
        // Track memory usage if available
        if (performance.memory) {
          const memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576);
          this.trackEvent('Performance', 'Memory Usage MB', memoryUsage);
        }
      }, 0);
    });
    
    // Track errors
    window.addEventListener('error', (event) => {
      this.trackEvent('JavaScript Error', event.message, {
        source: event.filename,
        line: event.lineno,
        column: event.colno
      });
    });
    
    // Track user engagement
    this.trackEngagement();
  }
  
  trackEngagement() {
    let startTime = Date.now();
    let timeOnPage = 0;
    let isActive = true;
    
    // Track time on page
    setInterval(() => {
      if (isActive) {
        timeOnPage = Math.round((Date.now() - startTime) / 1000);
      }
    }, 30000); // Every 30 seconds
    
    // Track when user leaves
    window.addEventListener('beforeunload', () => {
      this.trackEvent('Engagement', 'Time on Page', timeOnPage);
    });
    
    // Track if user is active
    let inactivityTimer;
    const resetTimer = () => {
      isActive = true;
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        isActive = false;
      }, 30000); // 30 seconds of inactivity
    };
    
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });
    
    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
      const scrollPercentage = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
      if (scrollPercentage > maxScroll) {
        maxScroll = scrollPercentage;
        if (maxScroll === 25 || maxScroll === 50 || maxScroll === 75 || maxScroll === 100) {
          this.trackEvent('Engagement', 'Scroll Depth', maxScroll);
        }
      }
    });
  }
  
  trackEvent(category, action, label = null, value = null) {
    const event = {
      event: 'custom_event',
      category,
      action,
      label,
      value,
      timestamp: new Date().toISOString()
    };
    
    if (this.isInitialized && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value
      });
    } else {
      // Queue events until GA4 is ready
      this.eventQueue.push(event);
    }
    
    // Also save to localStorage for custom dashboard
    this.saveToLocalStorage(event);
  }
  
  flushEventQueue() {
    if (this.isInitialized && window.gtag) {
      this.eventQueue.forEach(event => {
        window.gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value
        });
      });
      this.eventQueue = [];
    }
  }
  
  saveToLocalStorage(event) {
    try {
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      events.push(event);
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.shift();
      }
      
      localStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (e) {
      // Silently fail if localStorage is full
    }
  }
  
  // Track specific hotel review actions
  trackReviewAction(action, details = {}) {
    this.trackEvent('Review Actions', action, JSON.stringify(details));
    
    // Track conversion funnel
    switch (action) {
      case 'form_started':
        this.trackEvent('Conversion Funnel', 'Step 1 - Started');
        break;
      case 'rating_selected':
        this.trackEvent('Conversion Funnel', 'Step 2 - Rating Selected');
        break;
      case 'review_generated':
        this.trackEvent('Conversion Funnel', 'Step 3 - Review Generated');
        break;
      case 'review_copied':
        this.trackEvent('Conversion Funnel', 'Step 4 - Review Copied');
        break;
      case 'platform_redirected':
        this.trackEvent('Conversion Funnel', 'Step 5 - Platform Redirect');
        break;
    }
  }
  
  // Get analytics summary for dashboard
  getAnalyticsSummary() {
    try {
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      
      const summary = {
        totalEvents: events.length,
        eventsByCategory: {},
        recentEvents: events.slice(-10).reverse(),
        conversionFunnel: {
          started: 0,
          ratingSelected: 0,
          reviewGenerated: 0,
          reviewCopied: 0,
          platformRedirected: 0
        }
      };
      
      events.forEach(event => {
        // Count by category
        if (!summary.eventsByCategory[event.category]) {
          summary.eventsByCategory[event.category] = 0;
        }
        summary.eventsByCategory[event.category]++;
        
        // Track funnel
        if (event.category === 'Conversion Funnel') {
          if (event.action.includes('Step 1')) summary.conversionFunnel.started++;
          if (event.action.includes('Step 2')) summary.conversionFunnel.ratingSelected++;
          if (event.action.includes('Step 3')) summary.conversionFunnel.reviewGenerated++;
          if (event.action.includes('Step 4')) summary.conversionFunnel.reviewCopied++;
          if (event.action.includes('Step 5')) summary.conversionFunnel.platformRedirected++;
        }
      });
      
      return summary;
    } catch (e) {
      return null;
    }
  }
  
  // GDPR compliant consent check
  checkConsent() {
    const consent = localStorage.getItem('analytics_consent');
    if (!consent) {
      // Show consent banner
      this.showConsentBanner();
      return false;
    }
    return consent === 'granted';
  }
  
  showConsentBanner() {
    const banner = document.createElement('div');
    banner.id = 'consent-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #333;
      color: white;
      padding: 20px;
      text-align: center;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    
    banner.innerHTML = `
      <p style="margin: 0 0 15px 0;">
        We use cookies and analytics to improve your experience. 
        <a href="/privacy" style="color: #4CAF50;">Learn more</a>
      </p>
      <button id="accept-analytics" style="
        background: #4CAF50;
        color: white;
        border: none;
        padding: 10px 30px;
        margin: 0 10px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
      ">Accept</button>
      <button id="reject-analytics" style="
        background: #666;
        color: white;
        border: none;
        padding: 10px 30px;
        margin: 0 10px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
      ">Reject</button>
    `;
    
    document.body.appendChild(banner);
    
    document.getElementById('accept-analytics').addEventListener('click', () => {
      localStorage.setItem('analytics_consent', 'granted');
      banner.remove();
      this.initializeGA4();
    });
    
    document.getElementById('reject-analytics').addEventListener('click', () => {
      localStorage.setItem('analytics_consent', 'denied');
      banner.remove();
    });
  }
}

// Initialize analytics
const analytics = new FreeAnalytics();

// Export for use
if (typeof window !== 'undefined') {
  window.FreeAnalytics = analytics;
}