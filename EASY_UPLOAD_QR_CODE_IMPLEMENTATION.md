# Easy Upload QR Code Implementation

## Overview

This document describes the implementation of the Easy Upload feature with QR code functionality for the frictionless quick action block. The implementation follows the same patterns used in the Project X EasyUploadImportHub component.

## Features Implemented

### 1. **QR Code Generation**
- Dynamically loads the `qr-code-styling` library (v1.9.2) from CDN
- Generates QR codes with customizable styling (200x200px, rounded dots, transparent background)
- QR code encodes a mobile upload URL with presigned upload parameters

### 2. **Upload Service Integration**
- Integrates with the existing Adobe upload service
- Generates presigned upload URLs for secure file transfers
- Creates placeholder assets to obtain presigned URLs
- Builds mobile-friendly upload URLs based on environment (prod/stage)

### 3. **QR Code Refresh**
- Automatically refreshes QR code every **30 minutes**
- Prevents expired presigned URLs
- Maintains seamless upload experience

### 4. **File Upload and Retrieval**
- "Confirm Import" button to finalize uploads
- Fetches uploaded file from presigned URL
- Processes file through standard quick action workflow
- Refreshes QR code after successful import

### 5. **Resource Cleanup**
- Cleans up intervals on window `beforeunload` event
- Cleans up on popstate (back navigation)
- Properly disposes of QR code instances and references
- Prevents memory leaks

### 6. **Error Handling**
- Graceful error messages for failed operations
- Fallback handling for network issues
- User-friendly toast notifications

## Architecture

### Class Structure

```javascript
class EasyUpload {
  constructor()
  isExperimentEnabled(quickAction)
  loadQRCodeLibrary()
  initializeUploadService()
  generateUploadUrl()
  buildMobileUploadUrl(presignedUrl)
  shortenUrl(longUrl)  // TODO: Implement URL shortener
  displayQRCode(uploadUrl)
  initializeQRCode()
  scheduleQRRefresh()
  refreshQRCode()
  handleConfirmImport()
  retrieveUploadedFile()
  updateConfirmButtonState(disabled)
  createConfirmButton()
  generateQRCode()
  cleanup()
}
```

### Workflow

1. **Initialization**
   - Check if quick action is enabled for Easy Upload
   - Initialize upload service
   - Generate presigned upload URL
   - Create QR code with mobile upload URL
   - Display QR code and "Confirm Import" button
   - Schedule QR code refresh (30 minutes)

2. **User Scans QR Code**
   - User scans QR code on mobile device
   - Mobile browser navigates to upload URL
   - User uploads file from mobile
   - File is stored at presigned URL location

3. **Confirm Import**
   - User clicks "Confirm Import" button
   - Fetch file from presigned URL
   - Process file through quick action workflow
   - Refresh QR code for next upload

4. **Cleanup**
   - On navigation away: cleanup intervals and references
   - On window unload: cleanup intervals and references
   - After successful import: refresh QR code

## Configuration

### Enabled Quick Actions
```javascript
['remove-background', 'resize-image', 'crop-image', 'convert-to-jpg', 'convert-to-png']
```

### Constants
- **QR_REFRESH_INTERVAL**: 30 minutes (1,800,000 ms)
- **QR_CODE_DIMENSIONS**: 200x200 pixels
- **QR_CODE_TYPE**: Canvas
- **DOT_STYLE**: Rounded
- **BACKGROUND**: White (#ffffff)
- **DOT_COLOR**: Black (#000000)

### Mobile Upload URLs
- **Production**: `https://express.adobe.com/uploadFromOtherDevice`
- **Stage**: `https://express-stage.adobe.com/uploadFromOtherDevice`

## URL Shortener Service

### Implementation Status
✅ **IMPLEMENTED AND CONFIGURED** - The URL shortener service is fully integrated and environment-aware!

### Configuration
The URL shortener configuration is automatically determined based on the environment:

```javascript
function getUrlShortenerConfig() {
  const { env } = getConfig();
  const envName = env.name;

  // Production
  if (envName === 'prod') {
    return {
      serviceUrl: 'https://go.adobe.io',
      apiKey: 'quickactions_hz_webapp',
      enabled: true
    };
  }
  
  // Stage/Local (default)
  return {
    serviceUrl: 'https://go-stage.adobe.io',
    apiKey: 'hz-dynamic-url-service',
    enabled: true
  };
}
```

**No manual configuration required!** The service automatically:
- Uses production settings in prod environment
- Uses stage settings in stage/local environments
- Falls back to stage settings if environment is unknown

### How It Works

1. **UrlShortenerService Class**
   - Handles authentication via Adobe IMS
   - Makes POST requests to `/v1/short-links/` endpoint
   - Returns shortened URLs or falls back to original URL on failure

2. **Integration**
   - Service is initialized in EasyUpload constructor if enabled
   - `shortenUrl()` method uses the service automatically
   - Graceful fallback to original URL if service fails
   - Logs all operations for debugging

3. **Request Format**
   ```javascript
   {
     url: "https://express.adobe.com/uploadFromOtherDevice?upload_url=...",
     timeZone: "America/Los_Angeles",
     metaData: "easy-upload-qr-code"
   }
   ```

4. **Response Format**
   ```javascript
   {
     success: true,
     data: "https://short.url/abc123"
   }
   ```

### Benefits of URL Shortening

- **Smaller QR Codes**: Shorter URLs generate simpler, more scannable QR codes
- **Better Reliability**: Less data in QR code means fewer scan errors
- **Faster Loading**: Mobile devices can scan and process QR codes quicker
- **Analytics**: URL shortener can track QR code scans (if configured)

## Future Enhancements

### Additional Features
- Loading states during QR generation
- Progress indicators during file retrieval
- File type validation before processing
- Analytics tracking for QR scans and imports
- Support for multiple file uploads
- QR code customization options

## Testing

### Manual Testing Steps

1. **QR Code Generation**
   - Navigate to a page with remove-background quick action
   - Verify QR code appears next to upload button
   - Scan QR code with mobile device
   - Verify redirect to mobile upload page

2. **File Upload**
   - Upload a file from mobile device
   - Click "Confirm Import" button
   - Verify file is processed correctly
   - Verify QR code refreshes after import

3. **QR Code Refresh**
   - Wait 30 minutes (or modify interval for testing)
   - Verify QR code automatically refreshes
   - Verify new presigned URL is generated

4. **Resource Cleanup**
   - Navigate away from page
   - Verify no console errors
   - Verify intervals are cleared
   - Check for memory leaks in dev tools

5. **Error Handling**
   - Test with network offline
   - Test with invalid file types
   - Test clicking Confirm Import without upload
   - Verify error toasts appear correctly

## Dependencies

- **qr-code-styling**: v1.9.2 (loaded from CDN)
- **Upload Service**: Internal Adobe upload service
- **IMS Service**: Adobe Identity Management Service

## Files Modified

- `/express/code/blocks/frictionless-quick-action/frictionless-quick-action.js`

## Reference Implementation

This implementation is based on:
- `/Users/shiksha/dev/hz-bazel/apps/project-x/web/src/transitional-features/x-import-hub/EasyUploadImportHub.ts`
- `/Users/shiksha/dev/hz-bazel/apps/project-x/web/src/transitional-features/x-import-hub/utils/UrlShortenerService.ts`

## Notes

- QR codes use canvas rendering for better browser compatibility
- Presigned URLs are time-limited by Adobe's upload service
- The implementation handles both authenticated and guest users
- Mobile upload page must be implemented separately on Express side

