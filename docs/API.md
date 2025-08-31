# API Documentation

## Overview

The Hotel Review Generator API provides programmatic access to review generation functionality, analytics, and platform management. This RESTful API is designed for integration with hotel management systems, CRM platforms, and automation tools.

## Base URL

```
Production: https://api.mvphotel.com/v2
Staging: https://staging-api.mvphotel.com/v2
Development: http://localhost:3001/v2
```

## Authentication

Currently, the API is client-side only and doesn't require authentication. Future versions will support:

```http
Authorization: Bearer YOUR_API_KEY
```

## Rate Limiting

- **Default Limit**: 100 requests per hour
- **Burst Limit**: 10 requests per minute
- **Headers Returned**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

## Common Headers

### Request Headers

```http
Content-Type: application/json
Accept: application/json
Accept-Language: en-US
User-Agent: YourApp/1.0
```

### Response Headers

```http
Content-Type: application/json
X-Request-ID: unique-request-id
X-Response-Time: 125ms
Cache-Control: no-cache
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": [
      {
        "field": "rating",
        "issue": "Must be between 1 and 5"
      }
    ],
    "timestamp": "2024-01-01T00:00:00Z",
    "request_id": "req_abc123"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `FORBIDDEN` | 403 | Access denied to resource |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## Endpoints

### 1. Generate Review

Generate a customized hotel review based on specified parameters.

#### Endpoint

```
POST /api/generate-review
```

#### Request Body

```json
{
  "platform": "google",
  "language": "en",
  "rating": 5,
  "guestName": "John Doe",
  "email": "john@example.com",
  "highlights": ["cleanliness", "staff", "location"],
  "staffName": "Maria",
  "roomNumber": "305",
  "stayDuration": 3,
  "checkInDate": "2024-01-15",
  "checkOutDate": "2024-01-18",
  "generationMode": "hybrid",
  "tone": "professional",
  "length": "medium",
  "includePhotos": false,
  "customFields": {
    "specialRequest": "Anniversary celebration"
  }
}
```

#### Parameters

| Parameter | Type | Required | Description | Values |
|-----------|------|----------|-------------|--------|
| `platform` | string | Yes | Target review platform | `google`, `tripadvisor`, `booking`, `expedia`, `hotels` |
| `language` | string | Yes | Language code | `en`, `es`, `fr`, `de`, `it`, `pt`, `ja` |
| `rating` | integer | Yes | Star rating | 1-5 |
| `guestName` | string | Yes | Guest's full name | Max 100 chars |
| `email` | string | No | Guest's email address | Valid email format |
| `highlights` | array | No | Review focus areas | See [Highlights](#highlights) |
| `staffName` | string | No | Staff member to mention | Max 50 chars |
| `roomNumber` | string | No | Room identifier | Max 10 chars |
| `stayDuration` | integer | No | Number of nights | 1-365 |
| `checkInDate` | string | No | Check-in date | ISO 8601 format |
| `checkOutDate` | string | No | Check-out date | ISO 8601 format |
| `generationMode` | string | No | Generation method | `template`, `ai`, `hybrid` |
| `tone` | string | No | Review tone | `casual`, `professional`, `enthusiastic` |
| `length` | string | No | Review length | `short`, `medium`, `long` |
| `includePhotos` | boolean | No | Include photo prompts | `true`, `false` |
| `customFields` | object | No | Additional custom data | Key-value pairs |

#### Highlights

Available highlight options:

- `cleanliness` - Room and facility cleanliness
- `location` - Property location and accessibility
- `staff` - Staff service and friendliness
- `amenities` - Available facilities and services
- `comfort` - Bed and room comfort
- `value` - Value for money
- `food` - Restaurant and dining experience
- `wifi` - Internet connectivity
- `parking` - Parking availability
- `view` - Room view
- `quiet` - Noise levels
- `safety` - Security and safety

#### Response

##### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "review": {
      "text": "I had an absolutely wonderful stay at this hotel! The location was perfect for exploring the city, just a short walk from major attractions. The room was spotlessly clean and very comfortable, with a beautiful view of the city skyline. Maria at the front desk was incredibly helpful and made our anniversary celebration extra special. The amenities were top-notch, especially the rooftop pool. I would definitely recommend this hotel to anyone visiting the area and will certainly be back on my next trip!",
      "platform": "google",
      "language": "en",
      "rating": 5,
      "characterCount": 487,
      "wordCount": 76,
      "readingTime": "23 seconds",
      "sentiment": {
        "score": 0.95,
        "label": "very positive"
      }
    },
    "links": {
      "direct": "https://g.page/r/CRfVCX9DVIVvEAg/review",
      "email": "mailto:?subject=Review%20Your%20Stay&body=Click%20here%20to%20leave%20a%20review:%20https://g.page/...",
      "sms": "sms:?body=Please%20review%20your%20stay:%20https://g.page/...",
      "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS..."
    },
    "metadata": {
      "generatedAt": "2024-01-18T14:30:00Z",
      "generationMode": "hybrid",
      "processingTime": 125,
      "version": "2.0.0",
      "requestId": "req_abc123xyz"
    },
    "suggestions": {
      "photos": [
        "Consider adding a photo of the room",
        "A picture of the view would enhance your review"
      ],
      "improvements": [
        "Mention specific dishes if you dined at the restaurant",
        "Include the dates of your stay for context"
      ]
    }
  }
}
```

##### Error Response (400 Bad Request)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": [
      {
        "field": "rating",
        "issue": "Rating must be between 1 and 5",
        "provided": 6
      },
      {
        "field": "platform",
        "issue": "Invalid platform specified",
        "provided": "invalid_platform",
        "allowed": ["google", "tripadvisor", "booking", "expedia", "hotels"]
      }
    ]
  }
}
```

#### Example Requests

##### cURL

```bash
curl -X POST https://api.mvphotel.com/v2/api/generate-review \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "google",
    "language": "en",
    "rating": 5,
    "guestName": "John Doe",
    "highlights": ["cleanliness", "staff"]
  }'
```

##### JavaScript (Fetch)

```javascript
const generateReview = async () => {
  const response = await fetch('https://api.mvphotel.com/v2/api/generate-review', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      platform: 'google',
      language: 'en',
      rating: 5,
      guestName: 'John Doe',
      highlights: ['cleanliness', 'staff']
    })
  });
  
  const data = await response.json();
  console.log(data.review.text);
};
```

##### Python

```python
import requests

url = "https://api.mvphotel.com/v2/api/generate-review"
payload = {
    "platform": "google",
    "language": "en",
    "rating": 5,
    "guestName": "John Doe",
    "highlights": ["cleanliness", "staff"]
}

response = requests.post(url, json=payload)
data = response.json()
print(data["review"]["text"])
```

### 2. Get Analytics

Retrieve review generation analytics and metrics.

#### Endpoint

```
GET /api/analytics
```

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `startDate` | string | No | Start date (ISO 8601) | `2024-01-01` |
| `endDate` | string | No | End date (ISO 8601) | `2024-01-31` |
| `platform` | string | No | Filter by platform | `google` |
| `language` | string | No | Filter by language | `en` |
| `groupBy` | string | No | Group results by | `day`, `week`, `month` |
| `metrics` | array | No | Specific metrics to return | `["total", "average"]` |

#### Response

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalReviews": 15234,
      "uniqueUsers": 8921,
      "averageRating": 4.6,
      "conversionRate": 0.35,
      "averageGenerationTime": 145,
      "topPlatform": "google",
      "topLanguage": "en",
      "period": {
        "start": "2024-01-01T00:00:00Z",
        "end": "2024-01-31T23:59:59Z"
      }
    },
    "platforms": {
      "google": {
        "count": 6543,
        "percentage": 42.9,
        "averageRating": 4.7
      },
      "tripadvisor": {
        "count": 4321,
        "percentage": 28.4,
        "averageRating": 4.5
      },
      "booking": {
        "count": 2456,
        "percentage": 16.1,
        "averageRating": 4.6
      },
      "expedia": {
        "count": 1234,
        "percentage": 8.1,
        "averageRating": 4.4
      },
      "hotels": {
        "count": 680,
        "percentage": 4.5,
        "averageRating": 4.5
      }
    },
    "languages": {
      "en": {
        "count": 8765,
        "percentage": 57.5
      },
      "es": {
        "count": 2345,
        "percentage": 15.4
      },
      "fr": {
        "count": 1567,
        "percentage": 10.3
      }
    },
    "ratings": {
      "5": {
        "count": 9140,
        "percentage": 60.0
      },
      "4": {
        "count": 4571,
        "percentage": 30.0
      },
      "3": {
        "count": 1066,
        "percentage": 7.0
      },
      "2": {
        "count": 305,
        "percentage": 2.0
      },
      "1": {
        "count": 152,
        "percentage": 1.0
      }
    },
    "trends": {
      "daily": [
        {
          "date": "2024-01-01",
          "count": 432,
          "averageRating": 4.6
        },
        {
          "date": "2024-01-02",
          "count": 456,
          "averageRating": 4.7
        }
      ]
    },
    "highlights": {
      "cleanliness": 8234,
      "staff": 7890,
      "location": 6543,
      "comfort": 5432,
      "value": 4321
    }
  }
}
```

### 3. Get Supported Platforms

Retrieve list of supported review platforms with their configurations.

#### Endpoint

```
GET /api/platforms
```

#### Response

```json
{
  "success": true,
  "data": {
    "platforms": [
      {
        "id": "google",
        "name": "Google Reviews",
        "url": "https://www.google.com/travel/hotels",
        "characterLimit": 4096,
        "features": {
          "photos": true,
          "ratings": true,
          "responses": true
        },
        "languages": ["en", "es", "fr", "de", "it", "pt", "ja"],
        "icon": "https://api.mvphotel.com/icons/google.svg"
      },
      {
        "id": "tripadvisor",
        "name": "TripAdvisor",
        "url": "https://www.tripadvisor.com",
        "characterLimit": 20000,
        "features": {
          "photos": true,
          "ratings": true,
          "responses": true,
          "helpful_votes": true
        },
        "languages": ["en", "es", "fr", "de", "it", "pt", "ja"],
        "icon": "https://api.mvphotel.com/icons/tripadvisor.svg"
      }
    ]
  }
}
```

### 4. Get Supported Languages

Retrieve list of supported languages.

#### Endpoint

```
GET /api/languages
```

#### Response

```json
{
  "success": true,
  "data": {
    "languages": [
      {
        "code": "en",
        "name": "English",
        "nativeName": "English",
        "direction": "ltr",
        "available": true
      },
      {
        "code": "es",
        "name": "Spanish",
        "nativeName": "Español",
        "direction": "ltr",
        "available": true
      },
      {
        "code": "fr",
        "name": "French",
        "nativeName": "Français",
        "direction": "ltr",
        "available": true
      },
      {
        "code": "de",
        "name": "German",
        "nativeName": "Deutsch",
        "direction": "ltr",
        "available": true
      },
      {
        "code": "it",
        "name": "Italian",
        "nativeName": "Italiano",
        "direction": "ltr",
        "available": true
      },
      {
        "code": "pt",
        "name": "Portuguese",
        "nativeName": "Português",
        "direction": "ltr",
        "available": true
      },
      {
        "code": "ja",
        "name": "Japanese",
        "nativeName": "日本語",
        "direction": "ltr",
        "available": true
      }
    ]
  }
}
```

### 5. Health Check

Check API health and system status.

#### Endpoint

```
GET /api/health
```

#### Response

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-18T14:30:00Z",
    "version": "2.0.0",
    "uptime": 864000,
    "services": {
      "api": {
        "status": "operational",
        "responseTime": 12
      },
      "database": {
        "status": "operational",
        "responseTime": 8,
        "connections": 45
      },
      "cache": {
        "status": "operational",
        "hitRate": 0.92,
        "memory": "124MB/512MB"
      },
      "nlg": {
        "status": "operational",
        "queueSize": 3,
        "averageProcessingTime": 145
      },
      "ai": {
        "status": "operational",
        "model": "gpt-3.5-turbo",
        "tokensRemaining": 985432
      }
    },
    "metrics": {
      "requestsPerMinute": 234,
      "averageResponseTime": 125,
      "errorRate": 0.002,
      "successRate": 0.998
    }
  }
}
```

### 6. Batch Generate Reviews

Generate multiple reviews in a single request.

#### Endpoint

```
POST /api/batch-generate
```

#### Request Body

```json
{
  "reviews": [
    {
      "platform": "google",
      "language": "en",
      "rating": 5,
      "guestName": "John Doe",
      "highlights": ["cleanliness", "staff"]
    },
    {
      "platform": "tripadvisor",
      "language": "es",
      "rating": 4,
      "guestName": "Maria Garcia",
      "highlights": ["location", "value"]
    }
  ],
  "options": {
    "parallel": true,
    "returnFormat": "array"
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "index": 0,
        "success": true,
        "review": {
          "text": "...",
          "platform": "google",
          "language": "en"
        }
      },
      {
        "index": 1,
        "success": true,
        "review": {
          "text": "...",
          "platform": "tripadvisor",
          "language": "es"
        }
      }
    ],
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0,
      "processingTime": 234
    }
  }
}
```

## Webhooks

Configure webhooks to receive real-time notifications about review generation events.

### Webhook Events

| Event | Description | Payload |
|-------|-------------|---------|
| `review.generated` | Review successfully generated | Review data |
| `review.failed` | Review generation failed | Error details |
| `review.shared` | Review shared via email/SMS | Share details |
| `analytics.threshold` | Analytics threshold reached | Metric data |

### Webhook Payload

```json
{
  "event": "review.generated",
  "timestamp": "2024-01-18T14:30:00Z",
  "data": {
    "review": {
      "id": "rev_abc123",
      "platform": "google",
      "rating": 5,
      "language": "en"
    }
  },
  "metadata": {
    "webhookId": "wh_xyz789",
    "attempt": 1
  }
}
```

### Webhook Security

Webhooks are secured using HMAC-SHA256 signatures:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return hash === signature;
}
```

## SDKs and Libraries

### JavaScript/TypeScript SDK

```bash
npm install @mvphotel/review-generator
```

```javascript
import { ReviewGenerator } from '@mvphotel/review-generator';

const generator = new ReviewGenerator({
  apiKey: 'YOUR_API_KEY'
});

const review = await generator.generate({
  platform: 'google',
  language: 'en',
  rating: 5,
  guestName: 'John Doe'
});
```

### Python SDK

```bash
pip install mvphotel-review-generator
```

```python
from mvphotel import ReviewGenerator

generator = ReviewGenerator(api_key='YOUR_API_KEY')

review = generator.generate(
    platform='google',
    language='en',
    rating=5,
    guest_name='John Doe'
)
```

## Best Practices

### 1. Error Handling

Always implement proper error handling:

```javascript
try {
  const review = await generateReview(params);
  // Handle success
} catch (error) {
  if (error.code === 'RATE_LIMITED') {
    // Wait and retry
    await sleep(60000);
    return retry();
  } else if (error.code === 'VALIDATION_ERROR') {
    // Fix validation issues
    console.error('Validation failed:', error.details);
  } else {
    // Log unexpected errors
    console.error('Unexpected error:', error);
  }
}
```

### 2. Caching

Implement caching for frequently used data:

```javascript
const cache = new Map();

async function getCachedPlatforms() {
  const cacheKey = 'platforms';
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const platforms = await api.getPlatforms();
  cache.set(cacheKey, platforms);
  
  // Clear cache after 1 hour
  setTimeout(() => cache.delete(cacheKey), 3600000);
  
  return platforms;
}
```

### 3. Rate Limiting

Respect rate limits:

```javascript
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 3600000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }
  
  async throttle() {
    const now = Date.now();
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    );
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await sleep(waitTime);
    }
    
    this.requests.push(now);
  }
}
```

### 4. Batch Processing

Use batch endpoints for multiple reviews:

```javascript
// Instead of:
for (const guest of guests) {
  await generateReview(guest); // Multiple API calls
}

// Use:
const reviews = await batchGenerate(guests); // Single API call
```

## Changelog

### Version 2.0.0 (2024-01-18)
- Added batch generation endpoint
- Improved NLG engine with AI integration
- Added webhook support
- Enhanced analytics with detailed metrics
- Added support for Japanese language

### Version 1.5.0 (2023-12-01)
- Added custom fields support
- Improved error messages
- Added QR code generation
- Performance improvements

### Version 1.0.0 (2023-10-01)
- Initial release
- Basic review generation
- Support for 5 platforms
- 6 languages supported

## Support

- **Documentation**: [https://docs.mvphotel.com](https://docs.mvphotel.com)
- **Status Page**: [https://status.mvphotel.com](https://status.mvphotel.com)
- **Support Email**: api-support@mvphotel.com
- **GitHub Issues**: [Report Issues](https://github.com/chrimar3/MVP_Hotel/issues)

---

*API Documentation v2.0.0 - Last Updated: 2024*