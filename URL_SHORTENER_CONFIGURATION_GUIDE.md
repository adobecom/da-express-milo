# URL Shortener Configuration Guide

## Overview

The URL Shortener Service for the Easy Upload QR code feature is now **automatically configured** based on your environment. No manual configuration is required!

## Automatic Configuration

The system automatically selects the correct configuration based on your environment:

### Environment Settings

| Environment | Service URL | API Key |
|------------|-------------|---------|
| **Production** | `https://go.adobe.io` | `quickactions_hz_webapp` |
| **Stage** | `https://go-stage.adobe.io` | `hz-dynamic-url-service` |
| **Local** | `https://go-stage.adobe.io` | `hz-dynamic-url-service` |

### How It Works

The configuration is generated automatically by the `getUrlShortenerConfig()` function:

```javascript
function getUrlShortenerConfig() {
  const { env } = getConfig();
  const envName = env.name;

  const serviceUrlMap = {
    prod: 'https://go.adobe.io',
    stage: 'https://go-stage.adobe.io',
    local: 'https://go-stage.adobe.io',
  };

  const apiKeyMap = {
    prod: 'quickactions_hz_webapp',
    stage: 'hz-dynamic-url-service',
    local: 'hz-dynamic-url-service',
  };

  return {
    serviceUrl: serviceUrlMap[envName] || serviceUrlMap.stage,
    apiKey: apiKeyMap[envName] || apiKeyMap.stage,
    enabled: true,
  };
}
```

### Benefits

✅ **No manual configuration needed**
✅ **Environment-aware** - automatically switches between prod/stage
✅ **Fail-safe** - defaults to stage settings if environment is unknown
✅ **Always enabled** - URL shortening works out of the box

## Testing the Configuration

1. Open a page with the remove-background quick action
2. Open browser console
3. Look for these log messages:
   ```
   UrlShortenerService initialized
   Attempting to shorten URL
   URL shortened successfully
   ```

4. If URL shortening fails, you'll see:
   ```
   Failed to shorten URL, using original
   ```

## Customizing Configuration (Advanced)

If you need to modify the configuration (e.g., add new environments or change endpoints):

1. **Locate the configuration function** in `frictionless-quick-action.js` (around line 689):
   ```javascript
   function getUrlShortenerConfig() {
     // Configuration logic here
   }
   ```

2. **Add new environment mappings:**
   ```javascript
   const serviceUrlMap = {
     prod: 'https://go.adobe.io',
     stage: 'https://go-stage.adobe.io',
     local: 'https://go-stage.adobe.io',
     dev: 'https://go-dev.adobe.io', // Add new environment
   };
   ```

3. **Update API keys if needed:**
   ```javascript
   const apiKeyMap = {
     prod: 'quickactions_hz_webapp',
     stage: 'hz-dynamic-url-service',
     local: 'hz-dynamic-url-service',
     dev: 'hz-dynamic-url-service-dev', // Add new environment
   };
   ```

## Authentication Requirements

The URL Shortener Service requires:

1. **Adobe IMS Authentication**
   - User must be signed in via `window.adobeIMS`
   - Service will use the user's access token

2. **API Key**
   - Provided in the `x-api-key` header
   - Required for all requests

3. **Authorization Token**
   - Provided in the `Authorization: Bearer <token>` header
   - Obtained from Adobe IMS

## API Endpoint Details

### Request

**Endpoint:** `POST /v1/short-links/`

**Headers:**
```
Authorization: Bearer <IMS_ACCESS_TOKEN>
Content-Type: application/json
x-api-key: <YOUR_API_KEY>
```

**Body:**
```json
{
  "url": "https://express.adobe.com/uploadFromOtherDevice?upload_url=...",
  "timeZone": "America/Los_Angeles",
  "metaData": "easy-upload-qr-code"
}
```

### Response

**Success:**
```json
{
  "status": "success",
  "data": "https://short.url/abc123"
}
```

**Error:**
```json
{
  "status": "error",
  "error": "Error message"
}
```

## Troubleshooting

### Issue: "User not signed in" Error

**Solution:** Ensure the user is logged in with Adobe IMS before using the QR code feature.

### Issue: "Request failed: 401 Unauthorized"

**Possible causes:**
- Invalid or expired API key
- Invalid IMS access token
- Incorrect service URL

**Solution:** Verify your API key and ensure the user is properly authenticated.

### Issue: "Request failed: 404 Not Found"

**Possible causes:**
- Incorrect service URL
- Incorrect endpoint path

**Solution:** Verify the `serviceUrl` is correct and the endpoint `/v1/short-links/` exists.

### Issue: URL Not Being Shortened

**Check:**
1. Is `enabled` set to `true`?
2. Are there any console errors?
3. Is the user signed in?
4. Are the service URL and API key correct?

## Testing Checklist

- [ ] Configuration values are set correctly
- [ ] `enabled` is set to `true`
- [ ] User is logged in with Adobe IMS
- [ ] Console shows "UrlShortenerService initialized"
- [ ] Console shows "Attempting to shorten URL"
- [ ] Console shows "URL shortened successfully" (or fallback message)
- [ ] QR code generates successfully
- [ ] QR code can be scanned
- [ ] Shortened URL redirects correctly

## Support

If you need help configuring the URL Shortener Service:

1. Check Project X's implementation for reference values
2. Contact the URL shortener service team
3. Check with your team lead
4. Review Adobe API Console documentation

## Security Notes

✅ **Built-in Security:**
- API keys are environment-specific and managed in code
- Production uses different API key than stage/local
- No sensitive configuration in environment variables needed
- Automatic environment detection prevents misconfigurations

⚠️ **Best Practices:**
- Monitor API usage through Adobe's monitoring tools
- Report any unauthorized access immediately
- Keep the environment detection logic secure
- Review API key access regularly

