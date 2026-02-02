# CC Libraries Drawer - Code Review Findings
**Date:** 2026-02-02  
**Ticket:** MWPW-187085  
**Reviewer:** AI Assistant  
**Files Reviewed:**
- `cc-libraries-drawer.css`
- `createCCLibrariesDrawer.js`
- `spectrum-tags-override.css`

---

## ✅ POSITIVE FINDINGS

### Mobile-First Approach ✅
- CSS properly structured with mobile base styles
- Tablet breakpoint (`@media (min-width: 768px)`) correctly applied
- Desktop breakpoint (`@media (min-width: 1024px)`) correctly applied
- No desktop-first overrides found

### Accessibility (A11y) Features ✅
- ARIA live region implemented for screen reader announcements
- Dialog role with `aria-modal="true"` on drawer
- Labels properly associated with inputs via `aria-label`
- Keyboard handling (ESC key) implemented
- Focus management implemented
- Screen reader announcements for drawer open/close

---

## 🚨 CRITICAL ISSUES

### 1. **Hardcoded Colors - Should Use Tokens**

**File:** `cc-libraries-drawer.css`

**Issues:**
```css
/* Line 242 - Save button background */
background: #3b63fb;  /* ❌ Hardcoded */

/* Line 261 - Hover state */
background: #2f4fd1;  /* ❌ Hardcoded */

/* Line 265 - Active state */
background: #2845b8;  /* ❌ Hardcoded */
```

**Fix:** Use tokens from `/express/code/styles/styles.css`:
```css
/* Use available tokens */
background: var(--color-background-accent-default);  /* #5258E4 */
background: var(--color-background-accent-hover);    /* #4046CA */
background: var(--color-background-accent-down);     /* #3236A8 */
```

**Note:** Figma uses `#3b63fb` but closest token is `--color-background-accent-default`. Consider updating Figma or requesting new token.

---

### 2. **Missing/Non-Existent CSS Tokens**

**File:** `cc-libraries-drawer.css`

**Issues:**
```css
/* Line 198 - Border radius token doesn't exist */
border-radius: var(--corner-radius-75);  /* ❌ Not defined in styles.css */

/* Line 113 - Border radius token doesn't exist */
border-radius: var(--corner-radius-100); /* ❌ Not defined in styles.css */
```

**Available Tokens in styles.css:**
- `--border-radius-10: 10px`
- `--spacing-75: 4px`
- `--spacing-100: 8px`

**Fix:** Use border-radius values directly or create proper tokens:
```css
border-radius: 8px;  /* Instead of var(--corner-radius-100) */
border-radius: 7px;  /* For tags */
```

---

### 3. **Hardcoded RGBA Values**

**File:** `cc-libraries-drawer.css`

**Issues:**
```css
/* Line 13 - Curtain background */
background: rgba(0, 0, 0, 0.3);  /* ❌ Hardcoded */

/* Line 297 - Box shadow */
box-shadow: 0px 0px 12px 0px rgba(0, 0, 0, 0.16);  /* ❌ Hardcoded */
```

**Note:** These values appear in Figma. Consider creating tokens for common shadow/overlay values.

---

### 4. **Duplicate `@media (prefers-reduced-motion)` Query**

**File:** `cc-libraries-drawer.css`

**Lines:** 274-279 and 377-381

**Fix:** Remove duplicate at lines 377-381 (it's redundant inside desktop media query).

---

### 5. **Hardcoded Line Heights**

**File:** `cc-libraries-drawer.css`

**Issues:**
```css
/* Line 73 */
line-height: 22px;  /* ❌ Hardcoded */

/* Line 248 */
line-height: 22px;  /* ❌ Hardcoded */
```

**Available Tokens:**
- `--body-line-height: 1.5`
- `--heading-line-height: 130%`

**Fix:** Use token or relative value:
```css
line-height: var(--body-line-height);
/* OR calculate: 22px / 14px = 1.571 */
line-height: 1.571;
```

---

### 6. **Missing `color` Property with `-variant` Suffix**

**File:** `cc-libraries-drawer.css`

**Line 29:**
```css
color: var(--color-dark-gray);  /* ❌ Token doesn't exist */
```

**Available Token:**
```css
--text-color-secondary: #6e6e6e;
```

**Fix:**
```css
color: var(--text-color-secondary);
/* OR */
color: var(--color-gray-600);  /* #686868 */
```

---

## ⚠️ ACCESSIBILITY (A11y) IMPROVEMENTS NEEDED

### 1. **Missing Form Landmark**

**File:** `createCCLibrariesDrawer.js`

**Issue:** Input fields container should be wrapped in `<form>` or have `role="form"`

**Current:**
```javascript
const inputs = document.createElement('div');
inputs.className = 'cc-libraries-inputs';
```

**Fix:**
```javascript
const inputs = document.createElement('div');
inputs.className = 'cc-libraries-inputs';
inputs.setAttribute('role', 'form');
inputs.setAttribute('aria-label', 'Save palette to library');
```

---

### 2. **Missing Descriptive Labels for Tags**

**File:** `createCCLibrariesDrawer.js` (Custom Tags)

**Issue:** Tag buttons should announce the color name they represent

**Current:**
```javascript
tag.setAttribute('aria-label', `Add tag ${text}`);
```

**Improvement:** If associated with palette colors:
```javascript
// If tag represents a palette color
tag.setAttribute('aria-label', `Add ${text} tag for ${colorName} color`);
```

---

### 3. **Focus Trap Missing**

**File:** `createCCLibrariesDrawer.js`

**Issue:** When drawer opens, focus should be trapped inside until closed

**Recommendation:** Implement focus trap:
```javascript
// Trap focus within drawer
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  });
}
```

---

### 4. **Keyboard Navigation for Custom Tags**

**File:** `createCCLibrariesDrawer.js` - Custom tags implementation

**Current:** Arrow key navigation not implemented

**Recommendation:**
```javascript
// Add arrow key navigation between tags
tagsList.addEventListener('keydown', (e) => {
  const currentTag = document.activeElement;
  if (!currentTag.classList.contains('cc-libraries-tag-custom')) return;
  
  const allTags = Array.from(tagsList.querySelectorAll('.cc-libraries-tag-custom'));
  const currentIndex = allTags.indexOf(currentTag);
  
  let nextTag = null;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    nextTag = allTags[currentIndex + 1] || allTags[0];
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    nextTag = allTags[currentIndex - 1] || allTags[allTags.length - 1];
  }
  
  if (nextTag) nextTag.focus();
});
```

---

## 📋 MINOR ISSUES

### 1. **Inconsistent Spacing Token Usage**

Some places use `var(--spacing-100)` while others use hardcoded `8px`. Prefer tokens for consistency.

---

### 2. **Missing `box-sizing: border-box` on Some Elements**

Most elements have it, but verify all interactive elements (inputs, buttons) have explicit `box-sizing`.

---

### 3. **Z-Index Documentation**

Good: Z-index values are documented with comments. Consider creating a z-index scale constant.

**Recommendation:**
```javascript
// z-index.js
export const Z_INDEX = {
  MODAL_CURTAIN: 9998,
  MODAL_CONTAINER: 9999,
  LIBRARY_CURTAIN: 10000,
  LIBRARY_DRAWER: 10001,
  MODAL_CLOSE_BUTTON: 10002,
};
```

---

## 🔍 FIGMA PARITY CHECK

### Checked Against Figma Node: `5708:250660`

✅ **Correct:**
- Mobile: Height matches content (no fixed height)
- Padding: `8px 16px 16px 16px` (mobile)
- Gap between inputs: `16px` mobile, `8px` tablet/desktop
- Border radius: `20px 20px 0 0` (mobile top corners)
- Drawer handle: `80px × 4px`
- Tags: `24px` height, `7px` border-radius, `#E9E9E9` background

✅ **Typography:**
- Title: `14px / 20px` line-height, bold
- Labels: `16px` mobile, `14px` tablet/desktop
- Tags: `12px / 16px`

✅ **Interactive States:**
- Hover states defined
- Focus states with outline
- Active states defined

---

## 📊 SUMMARY

### Critical: 6 issues
1. Hardcoded button colors (need tokens)
2. Non-existent corner-radius tokens
3. Hardcoded RGBA values
4. Duplicate media query
5. Hardcoded line heights
6. Missing color-dark-gray token

### A11y: 4 improvements needed
1. Missing form role
2. Enhanced tag labels
3. Focus trap implementation
4. Arrow key navigation

### Minor: 3 issues
1. Inconsistent spacing token usage
2. Box-sizing verification needed
3. Z-index scale recommendation

---

## 🎯 RECOMMENDED ACTION PLAN

1. **Immediate:** Fix hardcoded colors to use tokens ✅
2. **Immediate:** Replace non-existent corner-radius tokens ✅
3. **Immediate:** Remove duplicate media query ✅
4. **High Priority:** Add form role for a11y ✅
5. **Medium Priority:** Implement focus trap ⏳
6. **Low Priority:** Add arrow key navigation for tags ⏳
7. **Low Priority:** Create z-index scale constant ⏳

---

## 📝 NOTES

- **No Figma Accessibility Annotations Found:** Figma file does not contain explicit accessibility annotations. Implementation follows WCAG 2.1 AA guidelines.
- **Mobile-First CSS:** ✅ Properly implemented
- **Token Usage:** Good start, but needs completion for all values
- **Code Quality:** Clean, well-commented, maintainable

---

**Status:** Ready for fixes  
**Next Steps:** Apply fixes from this review
