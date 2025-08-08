# 🚀 Deployment Guide

## Quick Deployment (30 seconds)

### Option 1: Simple Upload
1. Upload `src/hotel-review-generator.html` to your web server
2. Update the CONFIG object (line 382) with your hotel details
3. Share the URL with guests

### Option 2: CDN Deployment
1. Upload to your CDN (Cloudflare, AWS CloudFront, etc.)
2. Configure HTTPS for clipboard functionality
3. Set up custom domain

### Option 3: GitHub Pages (Free)
1. Enable GitHub Pages in repository settings
2. Choose `main` branch as source
3. Access via: `https://chrimar3.github.io/MVP_Hotel/src/hotel-review-generator.html`

## Configuration

### Essential Settings
```javascript
const CONFIG = {
    hotelName: "Your Hotel Name Here",
    hotelLogo: "https://yourhotel.com/logo.png", // Optional
    
    // Update platform URLs to your specific property pages
    platforms: {
        booking: {
            name: 'Booking.com',
            url: 'https://www.booking.com/hotel/xx/your-property.html#review',
            emoji: '🏨'
        },
        // ... update other platforms
    }
}
```

## Email Campaign Integration

### Guest Email Templates

**Direct Booking Guests:**
```html
<p>Thank you for staying with us!</p>
<p><a href="https://yourhotel.com/review-generator.html">
   Share your experience - it only takes 30 seconds!
</a></p>
```

**Booking.com Guests:**
```html
<p>Thank you for choosing us through Booking.com!</p>
<p><a href="https://yourhotel.com/review-generator.html?source=booking">
   Share your experience on Booking.com
</a></p>
```

**Expedia Guests:**
```html
<p>Thank you for booking through Expedia!</p>
<p><a href="https://yourhotel.com/review-generator.html?source=expedia">
   Share your experience on Expedia
</a></p>
```

## Production Checklist

### Pre-Launch
- [ ] Update hotel name and logo
- [ ] Verify platform URLs point to your property
- [ ] Test on mobile devices
- [ ] Verify HTTPS is enabled
- [ ] Test clipboard functionality
- [ ] Verify all platform links work

### Post-Launch Monitoring
- [ ] Monitor review volume increase
- [ ] Track platform distribution
- [ ] Check for any error reports
- [ ] Monitor mobile usage rates

## Advanced Features

### Custom Branding
1. Replace logo URL in CONFIG
2. Update color scheme in CSS variables (lines 9-21)
3. Modify aspects to match your property features

### Analytics Integration
Add tracking code before closing `</body>` tag:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

## Performance Optimization

### CDN Setup
- Enable gzip compression
- Set cache headers for static content
- Use HTTP/2 for faster loading

### Mobile Optimization
- Already optimized for 3G connections
- 44px touch targets implemented
- Responsive design for all screen sizes

## Security Considerations

### HTTPS Required
- Clipboard API requires HTTPS in production
- Fallback method works on HTTP but less user-friendly

### Content Security Policy (Optional)
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline';">
```

## Troubleshooting

### Common Issues
1. **Clipboard not working**: Ensure HTTPS is enabled
2. **Platform links broken**: Update URLs in CONFIG object
3. **Logo not showing**: Check URL accessibility and CORS
4. **Mobile layout issues**: Test viewport meta tag

### Debug Mode
Add `?debug=true` to URL for additional console logging (if implemented).

## Support

For technical issues:
1. Check browser console for errors
2. Verify all file paths are correct
3. Test on multiple devices and browsers
4. Review this documentation for configuration issues

---

**Deployment Time**: ~5 minutes  
**Technical Skill Required**: Basic web hosting knowledge  
**Maintenance**: Monthly content updates recommended