# Spectrum Web Components Tags - Prototype Documentation

**Branch:** `MWPW-187074-spectrum-tags-prototype`  
**Created:** February 2, 2026  
**Status:** Prototype/Testing Phase

---

## 📋 Overview

This prototype integrates [Spectrum Web Components Tags](https://opensource.adobe.com/spectrum-web-components/components/tags/) into the Color Explorer to evaluate:

1. **Standards compliance**: Using Adobe's official design system components
2. **Accessibility**: Built-in ARIA support and keyboard navigation
3. **Maintainability**: Reduced custom CSS and JS maintenance
4. **Visual consistency**: Matching Figma design specs
5. **Bundle size impact**: Understanding the performance implications

---

## 🎯 What's Changed

### Package Installation
```bash
npm install @spectrum-web-components/tags
```

**Added Dependencies:**
- `@spectrum-web-components/tags` (+ 13 packages)

---

### Files Modified

#### 1. **CC Libraries Drawer** (`createCCLibrariesDrawer.js`)
- **Before**: Custom `<div>` tags with manual ARIA attributes
- **After**: `<sp-tags>` container with `<sp-tag>` elements
- **Hybrid Approach**: Kept custom "+" button (Spectrum tags don't support custom actions)

```javascript
// Before
const tag = document.createElement('div');
tag.className = 'cc-libraries-tag';

// After
const tag = document.createElement('sp-tag');
// Built-in role="listitem", semantic HTML
```

#### 2. **Palette Modal** (`createPaletteModalContent.js`)
- **Before**: `<ul>` with `<li class="modal-tag">` elements
- **After**: `<sp-tags>` with `<sp-tag>` elements
- **Benefit**: Read-only display matches Spectrum semantics perfectly

#### 3. **Gradient Modal** (`createGradientModalContent.js`)
- **Before**: `<ul>` with `<li class="modal-tag">` elements  
- **After**: `<sp-tags>` with `<sp-tag>` elements
- **Benefit**: Consistent with palette modal approach

#### 4. **New CSS Override File** (`spectrum-tags-override.css`)
- Custom styles to match our Figma design
- CSS variables integration for consistent theming
- Responsive breakpoints maintained

---

## ✅ What Works Well

1. **Semantic HTML**: `<sp-tag>` provides better semantics than `<div>` or `<li>`
2. **Built-in Accessibility**: Role attributes, keyboard nav, and focus management
3. **Reduced Code**: Less custom ARIA management needed
4. **Future-proof**: Updates from Adobe automatically
5. **Design System Alignment**: Official Adobe component

---

## ⚠️ Considerations & Trade-offs

### 1. **Custom Actions Not Supported**
- Spectrum tags are designed for **display only** (no remove/add actions)
- **Workaround**: Hybrid approach with custom "+" button
- **Impact**: Requires wrapper `<div class="cc-libraries-tag-wrapper">`

### 2. **Styling Override Required**
- Spectrum default styles don't match Figma exactly
- **Solution**: `spectrum-tags-override.css` with CSS variables
- **Impact**: Still maintaining custom styles (but less than before)

### 3. **Bundle Size**
- **Added**: ~13 new packages from Spectrum ecosystem
- **Concern**: Potential impact on page load performance
- **Need to measure**: Actual bundle size increase

### 4. **Web Components Compatibility**
- Spectrum uses Web Components (Custom Elements)
- **Concern**: Older browser support? (should be fine for modern browsers)
- **Benefit**: Encapsulated styles (Shadow DOM)

---

## 🧪 Testing Checklist

- [ ] **Visual QA**: Compare with Figma designs across all breakpoints
  - [ ] Mobile (< 768px)
  - [ ] Tablet (768px - 1023px)
  - [ ] Desktop (1024px+)
  
- [ ] **Functional Testing**:
  - [ ] CC Libraries drawer tags render correctly
  - [ ] Modal palette tags render correctly
  - [ ] Modal gradient tags render correctly
  - [ ] "+" button in CC Libraries drawer works
  
- [ ] **Accessibility Audit**:
  - [ ] Screen reader announcements (VoiceOver, NVDA)
  - [ ] Keyboard navigation (Tab, Shift+Tab, Enter)
  - [ ] Focus indicators visible
  - [ ] ARIA attributes correct
  
- [ ] **Performance Testing**:
  - [ ] Bundle size comparison (before/after)
  - [ ] Page load time impact
  - [ ] Runtime performance (no jank)
  
- [ ] **Cross-browser Testing**:
  - [ ] Chrome/Edge (Chromium)
  - [ ] Firefox
  - [ ] Safari (Desktop & iOS)

---

## 📊 Comparison: Custom vs. Spectrum

| Feature | Custom Tags | Spectrum Tags | Winner |
|---------|-------------|---------------|--------|
| **Semantic HTML** | ❌ `<div>` or `<li>` | ✅ `<sp-tag>` | Spectrum |
| **Built-in ARIA** | ❌ Manual | ✅ Automatic | Spectrum |
| **Styling** | ✅ Full control | ⚠️ Needs override | Custom |
| **Custom Actions** | ✅ Supported | ❌ Not supported | Custom |
| **Maintenance** | ❌ More work | ✅ Less work | Spectrum |
| **Bundle Size** | ✅ Smaller | ❌ Larger | Custom |
| **Standards Compliance** | ❌ Custom | ✅ Official | Spectrum |

---

## 🔍 Decision Matrix

### Use Spectrum Tags If:
- ✅ Tags are **read-only** (modal display)
- ✅ Standards compliance is priority
- ✅ Long-term maintenance reduction is important
- ✅ Bundle size increase is acceptable

### Use Custom Tags If:
- ✅ Need **custom actions** (add, remove, edit)
- ✅ Bundle size is critical concern
- ✅ Need 100% custom styling control
- ✅ Don't want external dependencies

---

## 🚀 Next Steps

### Option 1: Merge Prototype
If testing is successful:
1. Merge `MWPW-187074-spectrum-tags-prototype` → `MWPW-187074`
2. Update main CSS to load `spectrum-tags-override.css`
3. Document in code review for team awareness

### Option 2: Keep Custom Implementation
If Spectrum doesn't meet needs:
1. Keep current custom tags implementation
2. Delete prototype branch
3. Document decision rationale
4. Consider revisiting for future Spectrum 2.0 updates

### Option 3: Hybrid Approach
Mix both approaches based on use case:
- **Spectrum tags**: Read-only display (modals)
- **Custom tags**: Interactive tags (CC Libraries drawer with "+" button)

---

## 📝 Notes

- Spectrum tags documentation: https://opensource.adobe.com/spectrum-web-components/components/tags/
- Figma tags component: https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=5721-145824
- Original implementation: MWPW-187085 (CC Libraries drawer tags)

---

## 🤔 Questions for Discussion

1. Is the bundle size increase acceptable for our performance budget?
2. Should we use Spectrum for **all** tags or just read-only ones?
3. Do we need to coordinate with other teams using Spectrum?
4. What's the plan for Spectrum 2.0 migration (if/when it happens)?

---

**Created by:** Cursor AI Assistant  
**For:** MWPW-187074 Floating Toolbar Implementation  
**Related:** MWPW-187085 CC Libraries Drawer
