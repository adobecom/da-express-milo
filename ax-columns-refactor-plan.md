# ax-columns CSS Refactoring Plan

## Issues Found

### 1. Three nth-child(2) Selectors
**Lines 1058, 1063, 1117** - Targeting second column for padding

### 2. Multiple :first-child/:last-child Selectors
**31 instances** - Detecting section position for spacing adjustments

### 3. Complex :not() Selectors  
**Lines 9-10, 18-19, 119-120, 124-125, 138-142, 159-166** - Long lists of spacing classes

---

## Refactoring Strategy

### Fix 1: Replace nth-child(2) with Classes

**Problem:**
```css
.ax-columns .column:nth-child(2):not(.column-picture):not(.hero-animation-overlay):not(.text) {
  padding-left: var(--spacing-300);
}
```

**Solution:**
Add a class to the second column in JavaScript and use it in CSS:

```css
.ax-columns .column.column--second:not(.column-picture):not(.hero-animation-overlay):not(.text) {
  padding-left: var(--spacing-300);
}
```

**JavaScript Change Needed:**
```javascript
// In ax-columns.js, add after columns are created:
columns.forEach((column, index) => {
  if (index === 1) { // Second column (0-indexed)
    column.classList.add('column--second');
  }
});
```

---

### Fix 2: Replace Complex :not() with Data Attribute

**Problem:**
```css
.section:not(.xxxl-spacing-static, .xxl-spacing-static, .xl-spacing-static, 
  .xxxl-spacing, .xxl-spacing, .xl-spacing, .l-spacing, .m-spacing, 
  .s-spacing, .xs-spacing, .xxs-spacing):first-child .ax-columns:first-child {
  padding-top: 0;
}
```

**Solution:**
Sections WITH custom spacing get `data-spacing="custom"`, default sections don't get it:

```css
.section:not([data-spacing]):first-child .ax-columns:first-child {
  padding-top: 0;
}

/* OR mark sections without custom spacing: */
.section[data-spacing="default"]:first-child .ax-columns:first-child {
  padding-top: 0;
}
```

**JavaScript Change Needed:**
```javascript
// In section decoration code (utils.js or similar):
function decorateSection(section) {
  const hasCustomSpacing = section.classList.contains('xxxl-spacing-static') ||
    section.classList.contains('xxl-spacing-static') ||
    // ... check all spacing classes
    section.classList.contains('xxs-spacing');
  
  if (hasCustomSpacing) {
    section.dataset.spacing = 'custom';
  } else {
    section.dataset.spacing = 'default';
  }
}
```

---

### Fix 3: Replace :first-child/:last-child with Data Attributes

**Problem:**
```css
.section:first-child .ax-columns:first-child {
  min-height: unset;
}
```

**Solution:**
Add position data attributes to sections:

```css
.section[data-position="first"] .ax-columns:first-child {
  min-height: unset;
}

.section[data-position="last"] .ax-columns:last-child {
  padding-bottom: var(--spacing-600);
}
```

**JavaScript Change Needed:**
```javascript
// In page initialization:
const sections = document.querySelectorAll('main > .section');
sections.forEach((section, index) => {
  if (index === 0) {
    section.dataset.position = 'first';
  }
  if (index === sections.length - 1) {
    section.dataset.position = 'last';
  }
});
```

---

## Alternative: Minimal Changes (Keep :has())

Since :has() is modern and supported, we could:
1. ONLY fix the 3 nth-child(2) selectors
2. Simplify the complex :not() selectors
3. Keep :first-child/:last-child as they're less fragile

This reduces the refactor to ~10 changes instead of 85.

---

## Recommended Approach

**Phase 1 (Quick Win - 1 hour):**
1. Fix 3 nth-child(2) selectors → Add `.column--second` class
2. Simplify 2 complex :not() selectors → Use `[data-spacing]`

**Phase 2 (Optional - 2-3 hours):**
3. Replace critical :first-child/:last-child with data attributes

---

## Files to Modify

1. **ax-columns.css** - The CSS selectors
2. **ax-columns.js** - Add `.column--second` class
3. **scripts/scripts.js** or **utils.js** - Add section data attributes


