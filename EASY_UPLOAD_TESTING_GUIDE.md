# Easy Upload Development Mode Testing Guide

## Problem
The Easy Upload QR code feature requires Adobe IMS authentication to generate presigned upload URLs. Feature branch URLs (e.g., `seo-easy-upload-2--da-express-milo--adobecom.aem.page`) are **not allowlisted** in Adobe IMS, causing CORS errors that block the entire feature.

## Solution: Development Mode

Development mode allows you to test the Easy Upload UI and QR code display on feature branches without requiring IMS authentication or ACP Storage access.

## How It Works

### Automatic Detection
Development mode **automatically activates** when:
1. You're on a **feature branch** URL (contains `--` but doesn't start with `main--`)
2. **AND** Adobe IMS is unavailable/blocked

### Manual Override
You can force development mode on any URL by adding a query parameter:
```
?easyupload-dev=true
```

## What Happens in Development Mode

### ✅ What Works
- **QR code displays** with a mock upload URL
- **UI layout and styling** can be tested
- **Confirm Import button** appears and is clickable
- **No CORS errors** - bypasses all IMS/ACP Storage calls

### ⚠️ What Doesn't Work
- **Actual file upload** from mobile device
- **Confirm Import functionality** - shows a toast message instead
- **URL shortening** - uses full mock URLs
- **Real presigned URLs** - uses mock URLs for display only

## Testing Workflow

### On Feature Branches (Recommended)
```bash
# 1. Push your changes to feature branch
git push origin your-feature-branch

# 2. Test on AEM preview
https://your-branch--da-express-milo--adobecom.aem.page/your-page/?martech=off

# 3. Development mode activates automatically
# You'll see console message: "Easy Upload: Development mode auto-enabled (feature branch + IMS unavailable)"

# 4. QR code displays with mock URL for visual/UI testing
```

### Force Development Mode Anywhere
```
# Add query parameter to any URL:
?easyupload-dev=true

# Example:
https://main--da-express-milo--adobecom.aem.page/express/?easyupload-dev=true
```

### Full Functionality Testing
For testing **actual upload functionality**, you must use an IMS-allowlisted domain:

```bash
# Option 1: Test on main branch
https://main--da-express-milo--adobecom.aem.page/your-page/?martech=off

# Option 2: Test on prod/stage with authoring
https://www.adobe.com/express/your-page/
```

## Console Messages

Watch for these in your browser console:

### Development Mode Active
```
Easy Upload: Development mode auto-enabled (feature branch + IMS unavailable)
Easy Upload: Using mock URL for development/testing
Easy Upload: Mock QR URL: https://express-stage.adobe.com/uploadFromOtherDevice?...
```

### Production Mode
```
Generating upload URL for mobile client
Upload URL generated successfully
```

## What to Test in Dev Mode

### UI/UX Testing
- ✅ QR code displays correctly
- ✅ QR code is properly sized and positioned
- ✅ Confirm Import button appears
- ✅ Loading states during QR generation
- ✅ Mobile responsive layout
- ✅ Error toasts display correctly

### Authoring Testing
- ✅ Block renders with `remove-background-easy-upload-variant`
- ✅ Block renders with other Easy Upload variant IDs
- ✅ Layout doesn't break with QR code present
- ✅ Free plan tags display correctly

### What NOT to Test in Dev Mode
- ❌ Actual mobile file uploads
- ❌ Confirm Import functionality
- ❌ File retrieval from ACP Storage
- ❌ URL shortening service
- ❌ Analytics tracking

## Troubleshooting

### QR Code Still Fails to Generate
Check browser console for specific error. If you see:
```
Failed to load QR code library
```
**Solution**: Check network access to CDN: `https://cdn.jsdelivr.net/npm/qr-code-styling@1.9.2/lib/qr-code-styling.js`

### Development Mode Not Activating
Manually force it:
```
?easyupload-dev=true
```

### Want to Test Real Functionality
Push to main or test on prod/stage URLs that are IMS-allowlisted.

## Code Changes Made

The following functions now support development mode:
- `generateUploadUrl()` - Returns mock URL in dev mode
- `handleConfirmImport()` - Shows informational toast in dev mode
- Auto-detection via `isDevelopmentMode()` helper

## Summary

**Use development mode for:**
- ✅ UI/UX testing on feature branches
- ✅ Authoring testing
- ✅ Visual regression testing
- ✅ Layout/styling verification

**Use production mode (main/prod URLs) for:**
- ✅ End-to-end functionality testing
- ✅ Mobile upload testing
- ✅ Integration testing with ACP Storage
- ✅ Analytics verification

This approach matches your existing testing workflow - no need for local SSL certificates or complex setup!

