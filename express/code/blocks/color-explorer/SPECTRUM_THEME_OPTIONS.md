# Spectrum Web Components sp-theme Options

**Component:** `<sp-theme>`  
**Purpose:** Provides design system context for Spectrum Web Components  
**Documentation:** https://opensource.adobe.com/spectrum-web-components/components/theme/

---

## Available Attributes

### 1. `system` - Design System Version
Controls which Spectrum design system to use.

**Available Options:**
```html
<!-- Spectrum 1 (Classic) -->
<sp-theme system="spectrum">

<!-- Spectrum 2 (Modern) -->
<sp-theme system="spectrum-two">

<!-- Adobe Express (Express-specific) -->
<sp-theme system="express">
```

**For Adobe Express:** Should typically use `system="express"` to match the Express design system.

---

### 2. `color` - Color Theme
Controls the light/dark mode.

**Available Options:**
```html
<!-- Light mode (default) -->
<sp-theme color="light">

<!-- Dark mode -->
<sp-theme color="dark">

<!-- Darkest mode -->
<sp-theme color="darkest">
```

**For Adobe Express:** Typically uses `color="light"` for most interfaces.

---

### 3. `scale` - UI Scale/Size
Controls the overall size of components.

**Available Options:**
```html
<!-- Medium scale (default, recommended) -->
<sp-theme scale="medium">

<!-- Large scale (accessibility, touch) -->
<sp-theme scale="large">
```

**Note:** `scale="medium"` is the standard for web applications.

---

## Common Combinations

### For Adobe Express (Recommended)
```html
<sp-theme system="express" color="light" scale="medium">
  <!-- Components here -->
</sp-theme>
```

### For Spectrum 2 (Generic)
```html
<sp-theme system="spectrum-two" color="light" scale="medium">
  <!-- Components here -->
</sp-theme>
```

### For Spectrum 1 (Legacy)
```html
<sp-theme system="spectrum" color="light" scale="medium">
  <!-- Components here -->
</sp-theme>
```

---

## Express-Specific Considerations

Adobe Express has its own design system variant that extends Spectrum 2. When building for Express:

1. **Use `system="express"`** to get Express-specific styling
2. **Color tokens** will use Express brand colors
3. **Component styling** will match Express design guidelines
4. **Typography** will use Express font stack

---

## Current Implementation

### Our Current Code (May Need Update)
```javascript
// File: createFiltersComponent.js
const pickerHTML = `
  <sp-theme system="spectrum-two" color="light" scale="medium">
    <sp-picker>
      ...
    </sp-picker>
  </sp-theme>
`;
```

### Recommended for Express
```javascript
// File: createFiltersComponent.js
const pickerHTML = `
  <sp-theme system="express" color="light" scale="medium">
    <sp-picker>
      ...
    </sp-picker>
  </sp-theme>
`;
```

---

## CSS Overrides

When targeting themed components in CSS:

### Current Selector
```css
sp-theme[system="spectrum-two"][color="light"][scale="medium"] {
  display: block !important;
}
```

### Updated for Express
```css
sp-theme[system="express"][color="light"][scale="medium"] {
  display: block !important;
}

/* Or generic selector */
sp-theme {
  display: block !important;
}
```

---

## Theme Features by System

| Feature | Spectrum 1 | Spectrum 2 | Express |
|---------|------------|------------|---------|
| **Modern Tokens** | ❌ | ✅ | ✅ |
| **Express Branding** | ❌ | ❌ | ✅ |
| **New Components** | ❌ | ✅ | ✅ |
| **Better A11y** | ⚠️ | ✅ | ✅ |
| **Figma Parity** | ⚠️ | ✅ | ✅ |

---

## Testing Recommendations

### Test with Both Systems
```javascript
// Test with Express system
<sp-theme system="express" color="light" scale="medium">

// Compare with Spectrum 2
<sp-theme system="spectrum-two" color="light" scale="medium">
```

### Visual Differences to Check
1. **Colors** - Express uses different brand colors
2. **Typography** - Express may use different font family
3. **Spacing** - Express may have different spacing scales
4. **Component styles** - Express has custom component styling

---

## When to Use Each System

### Use `system="express"`
- ✅ Building for Adobe Express
- ✅ Need Express brand colors
- ✅ Need Express-specific styling
- ✅ Matching Express design guidelines

### Use `system="spectrum-two"`
- ✅ Building generic Adobe product
- ✅ Need standard Spectrum 2 styling
- ✅ Following Spectrum design system
- ✅ Not Express-specific

### Use `system="spectrum"`
- ⚠️ Legacy support only
- ⚠️ Maintaining older codebase
- ❌ Not recommended for new projects

---

## Action Items

### For Our Color Explorer
1. **Decision Needed:** Should we use `system="express"` or `system="spectrum-two"`?
2. **Test Both:** Compare visual appearance with both systems
3. **Update Code:** Change system attribute if needed
4. **Update CSS:** Update CSS selectors to match
5. **Document Choice:** Document why we chose the system we did

---

## Questions to Answer

1. **Which system does Adobe Express officially use?**
   - Need to check Express codebase
   - Check with Express design team
   - Review Express design guidelines

2. **Does `system="express"` exist?**
   - May need to verify in Spectrum Web Components
   - Could be `system="spectrum-two"` with Express CSS
   - May be Express-specific build

3. **What's the visual difference?**
   - Need to test both systems
   - Compare with Figma designs
   - Check color tokens match

---

## References

- **Spectrum Web Components:** https://opensource.adobe.com/spectrum-web-components/
- **Theme Component:** https://opensource.adobe.com/spectrum-web-components/components/theme/
- **Spectrum 2:** https://spectrum.adobe.com/
- **React Spectrum S2:** https://react-spectrum.adobe.com/beta/s2/

---

**Status:** 📋 **Needs Review**  
**Action:** Determine correct system value for Adobe Express  
**Branch:** `picker`
