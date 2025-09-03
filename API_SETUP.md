# API Configuration Guide for Hotel Review Generator

## Overview
The Hotel Review Generator supports three generation modes:
1. **OpenAI GPT-4** - Premium AI generation (requires API key)
2. **Groq Llama-3** - Fast alternative AI (requires API key)
3. **Template Engine** - Always available fallback

## Getting API Keys

### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy and save your key securely (starts with `sk-`)
6. **Pricing**: ~$0.03 per review with GPT-4

### Groq API Key
1. Visit [Groq Console](https://console.groq.com/)
2. Create a free account
3. Go to [API Keys](https://console.groq.com/keys)
4. Click "Create API Key"
5. Copy your key (starts with `gsk_`)
6. **Pricing**: Free tier includes 30 requests/minute

## Configuration Methods

### Method 1: Environment Variables (Recommended for Production)

#### For Local Development
Create a `.env` file in the project root:
```bash
# .env
OPENAI_API_KEY=sk-your-openai-key-here
GROQ_API_KEY=gsk_your-groq-key-here
```

#### For Production Deployment

**Netlify:**
```bash
# In Netlify Dashboard > Site Settings > Environment Variables
OPENAI_API_KEY="sk-your-openai-key-here"
GROQ_API_KEY="gsk_your-groq-key-here"
```

**Vercel:**
```bash
# In Vercel Dashboard > Settings > Environment Variables
OPENAI_API_KEY="sk-your-openai-key-here"
GROQ_API_KEY="gsk_your-groq-key-here"
```

**Docker:**
```dockerfile
ENV OPENAI_API_KEY="sk-your-openai-key-here"
ENV GROQ_API_KEY="gsk_your-groq-key-here"
```

### Method 2: Browser Configuration (For Testing)

Open browser console (F12) and run:
```javascript
// Set OpenAI Key
localStorage.setItem('openai_api_key', 'sk-your-openai-key-here');

// Set Groq Key
localStorage.setItem('groq_api_key', 'gsk_your-groq-key-here');

// Verify keys are set
console.log('OpenAI:', localStorage.getItem('openai_api_key') ? 'Configured' : 'Not set');
console.log('Groq:', localStorage.getItem('groq_api_key') ? 'Configured' : 'Not set');

// Optional: Set default model preference
localStorage.setItem('llm_preference', 'openai'); // or 'groq' or 'template'
```

### Method 3: Configuration UI (Coming Soon)
A settings panel is planned for v2.1 that will allow API key configuration through the UI.

## Verifying Configuration

### Check Current Configuration
Open browser console and run:
```javascript
// Check which generators are available
const config = {
  openai: !!localStorage.getItem('openai_api_key'),
  groq: !!localStorage.getItem('groq_api_key'),
  template: true // Always available
};
console.table(config);
```

### Test API Connection
```javascript
// Test OpenAI connection
fetch('https://api.openai.com/v1/models', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('openai_api_key')}`
  }
}).then(r => console.log('OpenAI:', r.ok ? 'Connected' : 'Failed'));

// Test Groq connection
fetch('https://api.groq.com/openai/v1/models', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('groq_api_key')}`
  }
}).then(r => console.log('Groq:', r.ok ? 'Connected' : 'Failed'));
```

## Security Best Practices

### DO:
- ✅ Store keys in environment variables for production
- ✅ Use server-side proxy for API calls in production
- ✅ Rotate keys regularly
- ✅ Set usage limits in API dashboards
- ✅ Monitor API usage and costs

### DON'T:
- ❌ Commit API keys to Git
- ❌ Share keys publicly
- ❌ Use production keys in development
- ❌ Store keys in client-side code for production

## Troubleshooting

### API Key Not Working
1. **Check format**: OpenAI keys start with `sk-`, Groq keys with `gsk_`
2. **Verify in console**: `localStorage.getItem('openai_api_key')`
3. **Check network tab**: Look for 401/403 errors
4. **Clear and reset**: 
   ```javascript
   localStorage.removeItem('openai_api_key');
   localStorage.removeItem('groq_api_key');
   // Then set again
   ```

### Fallback to Templates
The app automatically falls back to templates when:
- No API keys are configured
- API rate limits exceeded
- Network errors occur
- API services are down

### Cost Management
- **OpenAI**: ~$0.03 per review (GPT-4)
- **Groq**: Free tier: 30 requests/minute
- **Templates**: Always free

## API Response Examples

### Successful API Generation
```json
{
  "source": "openai",
  "model": "gpt-4",
  "content": "During my recent stay at the Grand Hotel...",
  "tokens": 150,
  "cost": 0.03
}
```

### Template Fallback
```json
{
  "source": "template",
  "model": "template-engine-v2",
  "content": "I recently stayed at the Grand Hotel...",
  "tokens": 0,
  "cost": 0
}
```

## Support

For issues or questions:
- Check browser console for errors
- Review network tab for API calls
- Ensure keys are properly formatted
- Verify API service status

## Future Enhancements

**v2.1 (Planned):**
- In-app API configuration UI
- Support for Claude API (Anthropic)
- Support for local LLMs (Ollama)
- API proxy server for production
- Usage analytics dashboard

---

*Last updated: September 2025*