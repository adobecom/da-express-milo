# Spectrum 2 Web Components vs Figma Parity Analysis
## Color Explorer Project

**Date:** February 2, 2026  
**Project:** da-express-milo - Color Explorer  
**Figma File:** Final Color Expansion CCEX-221263

---

## Executive Summary

This analysis compares Spectrum 2 Web Components availability against Figma design requirements for the Color Explorer project. We assess component parity, identify gaps, and estimate implementation effort.

**📊 For detailed component-by-component gap analysis, see:** [`SPECTRUM_2_DETAILED_GAP_ANALYSIS.md`](./SPECTRUM_2_DETAILED_GAP_ANALYSIS.md)  
**Includes:** Exact Figma specs, Spectrum capabilities, specific gaps, CSS override patterns, and workarounds for each component.

---

## 1. COMPONENTS NEEDED (From Figma)

### ✅ Currently Implemented

#### A. Tags (`<sp-tag>`, `<sp-tags>`)
- **Figma Nodes:** 5721-127248, 5721-145824
- **Spectrum Component:** `@spectrum-web-components/tags@1.11.0`
- **Status:** ✅ Implemented with heavy CSS overrides
- **Parity:** 🟡 **~70%** (Requires significant customization)
  - **API Parity:** 71% (Missing Selected/Emphasized states)
  - **Styling Parity:** 30% → 70% with CSS overrides
  - **Behavior Parity:** 60% (Custom states need JS)
  - **A11y Parity:** 90% (Excellent foundation)
- **What Works:**
  - ✅ Basic tag rendering (deletable, disabled, readonly)
  - ✅ Container (`<sp-tags>`) with roving tabindex
  - ✅ Individual tags (`<sp-tag>`) with slots (icon, avatar)
  - ✅ Excellent accessibility (ARIA, keyboard navigation)
- **What Requires Overrides:**
  - ❌ Border radius (8px Figma vs 6px Spectrum)
  - ❌ Exact colors, typography, spacing
  - ❌ Selected/Emphasized states (not in Spectrum API)
  - ❌ Custom icons inside tags (e.g., `+` for CC Libraries)
- **LOE Spent:** 3 days (bundling + Lit integration + nuclear styling + debugging)
- **Detailed Analysis:** See `dev/SPECTRUM_TAGS_PARITY_ANALYSIS.md`
- **📊 Comprehensive Gap Analysis:** See `dev/SPECTRUM_2_DETAILED_GAP_ANALYSIS.md` for component-by-component comparison with exact gaps, workarounds, and CSS override patterns

---

## 2. COMPONENTS NEEDED (Not Yet Implemented)

### Priority 1: Critical Path

#### B. Text Input / TextField
- **Figma Nodes:** CC Libraries drawer input fields
- **Spectrum Component:** `@spectrum-web-components/textfield`
- **Status:** ❌ Not implemented (using native `<input>`)
- **Parity:** Unknown
- **LOE Estimate:** 1-2 days
  - Bundle component
  - Test sizing/styling parity
  - Apply CSS overrides if needed
  - Accessibility testing

#### C. Dropdown / Picker
- **Figma Nodes:** "Save to" library selector
- **Spectrum Component:** `@spectrum-web-components/picker`
- **Status:** ❌ Not implemented (using native `<select>`)
- **Parity:** Unknown
- **LOE Estimate:** 2-3 days
  - Bundle component
  - Handle menu/dropdown positioning
  - Custom styling for Figma match
  - Keyboard navigation testing

#### D. Button (CTA, Action Buttons)
- **Figma Nodes:** Multiple (CTA, action buttons, toolbar buttons)
- **Spectrum Component:** `@spectrum-web-components/button`
- **Status:** ❌ Not implemented (using native `<button>`)
- **Parity:** Unknown
- **LOE Estimate:** 1-2 days
  - Bundle component
  - Test variants (accent, quiet, etc.)
  - Apply Figma styling
  - Test all button states

---

### Priority 2: Nice-to-Have

#### E. Tooltip
- **Figma Nodes:** Toolbar action button tooltips
- **Spectrum Component:** `@spectrum-web-components/tooltip`
- **Status:** ❌ Not implemented
- **Parity:** Unknown
- **LOE Estimate:** 1 day

#### F. Modal/Dialog
- **Figma Nodes:** Gradient/Palette modals
- **Spectrum Component:** `@spectrum-web-components/dialog`
- **Status:** ❌ Not implemented (custom modal)
- **Parity:** N/A (custom implementation works)
- **LOE Estimate:** 3-4 days (if we want to switch)
- **Recommendation:** Keep custom implementation

---

### Priority 3: Custom Components (Not Available in Spectrum)

#### G. Search Marquee
- **Figma Nodes:** TBD (search/filter interface)
- **Spectrum Component:** ❌ **NOT AVAILABLE** - Does not exist in Spectrum Web Components
- **Status:** ❌ Not implemented
- **Parity:** 0% (must build custom)
- **LOE Estimate:** 3-5 days
  - Design and implement marquee/scrolling animation
  - Integrate with search functionality
  - Ensure accessibility (keyboard nav, screen readers)
  - Responsive behavior across breakpoints
  - Performance optimization (RAF, will-change)
- **Available Alternatives:**
  - `<sp-search>` - Basic search field (no marquee)
  - `<sp-combobox>` - Autocomplete dropdown
  - Custom implementation required for marquee behavior
- **Recommendation:** Build custom component
  - Use `<sp-search>` as base input
  - Add custom marquee/scroll wrapper
  - Use CSS animations or requestAnimationFrame
  - Consider performance impact on long lists

---

## 3. SPECTRUM WEB COMPONENTS ASSESSMENT

### Available Components (from opensource.adobe.com)

According to [Spectrum Web Components documentation](https://opensource.adobe.com/spectrum-web-components/index.html):

**Form Components:**
- ✅ `<sp-textfield>` - Text input
- ✅ `<sp-textarea>` - Multi-line input
- ✅ `<sp-picker>` - Dropdown selector
- ✅ `<sp-combobox>` - Autocomplete dropdown
- ✅ `<sp-search>` - Search field
- ✅ `<sp-number-field>` - Number input
- ✅ `<sp-checkbox>` - Checkbox
- ✅ `<sp-radio>`, `<sp-radio-group>` - Radio buttons
- ✅ `<sp-switch>` - Toggle switch

**Action Components:**
- ✅ `<sp-button>` - Primary button
- ✅ `<sp-action-button>` - Icon/action button
- ✅ `<sp-action-group>` - Button group
- ✅ `<sp-action-menu>` - Action menu
- ✅ `<sp-link>` - Hyperlink

**Display Components:**
- ✅ `<sp-badge>` - Badge/tag
- ✅ `<sp-tags>`, `<sp-tag>` - Tag system
- ✅ `<sp-card>` - Card container
- ✅ `<sp-divider>` - Divider line
- ✅ `<sp-icon>` - Icon system
- ✅ `<sp-tooltip>` - Tooltip
- ✅ `<sp-progress-bar>` - Progress indicator
- ✅ `<sp-meter>` - Meter display

**Dialog Components:**
- ✅ `<sp-dialog>` - Modal dialog
- ✅ `<sp-popover>` - Popover overlay
- ✅ `<sp-overlay>` - Overlay system

**Navigation Components:**
- ✅ `<sp-tabs>`, `<sp-tab>` - Tabs
- ✅ `<sp-sidenav>` - Side navigation
- ✅ `<sp-breadcrumbs>` - Breadcrumbs
- ✅ `<sp-top-nav>` - Top navigation

**Color Components (Relevant!):**
- ✅ `<sp-color-area>` - 2D color picker
- ✅ `<sp-color-field>` - Color input field
- ✅ `<sp-color-handle>` - Color picker handle
- ✅ `<sp-color-loupe>` - Color magnifier
- ✅ `<sp-color-slider>` - Color slider
- ✅ `<sp-color-wheel>` - Color wheel picker
- ✅ `<sp-swatch>` - Color swatch

---

## 4. PARITY ANALYSIS

### Overall Spectrum 2 Parity

| Category | Parity | Notes |
|----------|--------|-------|
| **Component Availability** | 90% | Almost all needed components exist |
| **Styling Parity** | 40-60% | Spectrum's design ≠ Figma's design |
| **API Parity** | 80% | Most APIs support needed functionality |
| **Customization** | 60% | Shadow DOM requires CSS custom properties |

---

### Key Findings

#### ✅ Strengths

1. **Comprehensive Component Library**
   - All form inputs available
   - Action buttons well-supported
   - Color components could be useful

2. **Accessibility Built-In**
   - ARIA support
   - Keyboard navigation
   - Screen reader support

3. **LitElement Base**
   - Lightweight
   - Standards-based
   - Framework agnostic

#### ❌ Challenges

1. **Styling Mismatch**
   - Spectrum's design tokens ≠ Figma specs
   - Requires aggressive CSS overrides
   - Shadow DOM penetration needed

2. **Fixed Sizing**
   - `size="s|m|l"` doesn't match Figma exact pixels
   - Height, padding, border-radius all differ
   - Font sizes/weights don't align

3. **Custom Behaviors**
   - Need custom implementations (like + button in tags)
   - Some Figma interactions not supported natively
   - Some components don't exist at all (search marquee)

4. **Bundle Size**
   - Each component adds to bundle
   - Lit must be included (35 KB gzipped)
   - Full bundle approach not recommended

5. **No Build Process Constraint**
   - Can't use Spectrum's theming system
   - Must use runtime CSS overrides
   - Self-contained bundles required

---

## 5. LEVEL OF EFFORT (LOE) ESTIMATES

### Already Completed

| Component | Status | LOE Spent | Outcome |
|-----------|--------|-----------|---------|
| **Tags** | ✅ Done | 3 days | Self-contained bundle, CSS overrides work |

### Remaining Components

| Component | Priority | LOE Estimate | Risk Level |
|-----------|----------|--------------|------------|
| **TextField** | P1 | 1-2 days | Low |
| **Picker** | P1 | 2-3 days | Medium (positioning) |
| **Button** | P1 | 1-2 days | Low |
| **Tooltip** | P2 | 1 day | Low |
| **Dialog** | P2 | 3-4 days | High (switch cost) |
| **Search Marquee** | P3 | 3-5 days | High (custom build) |

**Total Remaining LOE:** 
- P1 components: 5-8 days
- P2 components: 4-5 days (if needed)
- P3 components (custom): 3-5 days

---

## 6. APPROACH RECOMMENDATION

### Option A: Gradual Spectrum Adoption ⭐ RECOMMENDED

**Approach:**
1. Keep custom implementations where they work well (modals, drawers)
2. Adopt Spectrum for form components (textfield, picker)
3. Use CSS overrides for Figma parity
4. Bundle components individually (not full bundle)

**Pros:**
- ✅ Incremental adoption (lower risk)
- ✅ Keep what works (custom modals)
- ✅ Better form accessibility
- ✅ Smaller bundle sizes

**Cons:**
- ⚠️ Mixed approach (some Spectrum, some custom)
- ⚠️ CSS override maintenance
- ⚠️ Multiple bundling scripts needed

**LOE:** 5-8 days

---

### Option B: Full Spectrum Adoption

**Approach:**
1. Replace ALL components with Spectrum equivalents
2. Rebuild modals using `<sp-dialog>`
3. Use Spectrum theming system (if possible without build)

**Pros:**
- ✅ Consistent component library
- ✅ Full Adobe design system
- ✅ Less custom code

**Cons:**
- ❌ High migration cost
- ❌ Modals work well now (why change?)
- ❌ Still need CSS overrides for Figma
- ❌ Larger bundle sizes

**LOE:** 15-20 days

---

### Option C: Custom Everything (Current)

**Approach:**
1. Keep all custom implementations
2. No Spectrum adoption (remove tags)
3. Pure CSS/HTML

**Pros:**
- ✅ Full control
- ✅ Exact Figma match
- ✅ Smaller bundle (no Lit)

**Cons:**
- ❌ More accessibility work
- ❌ More maintenance
- ❌ No design system benefits

**LOE:** 0 days (current state, but remove tags)

---

## 7. SPECIFIC COMPONENT RECOMMENDATIONS

### TextField (`<sp-textfield>`)
- **Recommendation:** ✅ Adopt
- **Reason:** Better accessibility, form validation
- **LOE:** 1-2 days
- **Bundle:** ~15 KB with Lit (already loaded)

### Picker (`<sp-picker>`)
- **Recommendation:** ✅ Adopt
- **Reason:** Complex dropdown logic, keyboard nav
- **LOE:** 2-3 days
- **Bundle:** ~20 KB

### Button (`<sp-button>`)
- **Recommendation:** ⚠️ Consider
- **Reason:** Current `<button>` works, but Spectrum has better states
- **LOE:** 1-2 days
- **Bundle:** ~10 KB

### Dialog (`<sp-dialog>`)
- **Recommendation:** ❌ Don't adopt
- **Reason:** Custom modal/drawer works perfectly
- **LOE:** 3-4 days (not worth it)

### Tooltip (`<sp-tooltip>`)
- **Recommendation:** ✅ Adopt (later)
- **Reason:** Tooltips need proper positioning logic
- **LOE:** 1 day
- **Bundle:** ~8 KB

### Search Marquee
- **Recommendation:** 🔨 Build Custom (not available in Spectrum)
- **Reason:** Spectrum does not provide marquee/scrolling component
- **LOE:** 3-5 days
- **Approach:**
  1. Use `<sp-search>` as base input (if needed)
  2. Build custom marquee wrapper with CSS animations
  3. Consider performance (use `requestAnimationFrame`)
  4. Ensure accessibility (ARIA live regions, keyboard control)
  5. Add pause on hover, keyboard controls
- **Bundle:** ~5-10 KB (custom code only)
- **Alternatives:**
  - CSS `animation` with `@keyframes` (simplest)
  - JavaScript `requestAnimationFrame` (smoothest)
  - Intersection Observer for performance
- **Accessibility Considerations:**
  - Add `aria-live="polite"` for screen readers
  - Provide pause/play controls
  - Respect `prefers-reduced-motion`
  - Keyboard navigation (arrow keys)

---

## 8. BUNDLING STRATEGY

### Current Approach (Works!)
```javascript
// build-bundle.mjs - Create self-contained bundles
await esbuild.build({
  stdin: {
    contents: `
      export * from '@spectrum-web-components/tags/sp-tags.js';
      export * from '@spectrum-web-components/tags/sp-tag.js';
    `,
  },
  bundle: true,
  external: [], // Include Lit (self-contained)
  minify: true,
  outfile: 'spectrum-tags.bundle.js', // 98 KB / 35 KB gzipped
});
```

### Proposed: Multi-Component Bundle
```javascript
// Bundles per feature area
1. spectrum-forms.bundle.js  
   - textfield, picker, checkbox
   - ~60 KB / 20 KB gzipped

2. spectrum-actions.bundle.js
   - button, action-button, tooltip
   - ~40 KB / 15 KB gzipped

3. spectrum-tags.bundle.js (existing)
   - tags, tag
   - 98 KB / 35 KB gzipped (includes Lit)
```

**Note:** Only the first bundle needs Lit included. Subsequent bundles can mark Lit as external.

---

## 9. CSS OVERRIDE STRATEGY

### Current Pattern (Works!)

```css
/* Override Spectrum shadow DOM */
sp-tag {
  /* CSS custom properties for shadow DOM */
  --spectrum-tag-background-color: #E9E9E9 !important;
  --spectrum-tag-border-radius: 7px !important;
  
  /* Direct styles as backup */
  background: #E9E9E9 !important;
  border-radius: 7px !important;
  height: 24px !important;
}
```

### Lessons Learned

1. **Always use `!important`** - Required to override shadow DOM
2. **Set both custom properties AND direct styles** - Belt + suspenders
3. **Use exact Figma values** - Not CSS tokens (they resolve differently)
4. **Test in all breakpoints** - Mobile/tablet/desktop

---

## 10. RISK ASSESSMENT

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Styling mismatches** | High | Medium | CSS overrides (proven to work) |
| **Bundle size growth** | Medium | Low | Self-contained bundles, gzip helps |
| **Shadow DOM complexity** | Medium | Medium | CSS custom properties documented |
| **Figma changes** | Low | High | Modular CSS, easy to update |
| **Spectrum updates** | Low | Medium | Lock versions, test before upgrading |

---

## 11. FINAL RECOMMENDATION

### 🎯 Adopt Spectrum for Forms Only

**Timeline:** 1-2 weeks (+ 3-5 days for custom components)  
**Components:** TextField, Picker, (maybe) Button  
**Keep Custom:** Modals, Drawers, Cards, Layout  
**Build Custom:** Search Marquee (not available in Spectrum)

**Rationale:**
1. ✅ Tags implementation proves the approach works
2. ✅ Forms benefit most from Spectrum (accessibility, validation)
3. ✅ Custom modals/drawers work perfectly (don't fix what isn't broken)
4. ✅ Incremental adoption reduces risk
5. ✅ Can evaluate before committing to more
6. ⚠️ Some components don't exist in Spectrum (search marquee)

### Next Steps

1. **Week 1:** Bundle and implement TextField
2. **Week 2:** Bundle and implement Picker
3. **Week 3:** Build custom Search Marquee (if needed)
4. **Evaluate:** Assess if Button adoption makes sense
5. **Document:** Update patterns for future components

---

## 12. CONCLUSION

**Spectrum 2 Web Components Parity: 60-70%**

- ✅ Component availability is excellent (90% - most components exist)
- ⚠️ Styling parity requires significant CSS overrides (40-60%)
- ✅ APIs support most needed functionality (80%)
- ❌ Some components don't exist (search marquee, custom interactions)
- ⚠️ No-build-process constraint adds complexity

**Bottom Line:** Spectrum components are viable for the Color Explorer, but expect to spend 40-50% of implementation time on CSS overrides to match Figma exactly. Some components (like search marquee) will require full custom implementation. The tags implementation serves as a proven template for future components.

---

**Prepared by:** AI Assistant  
**Reviewed:** TBD  
**Next Update:** After TextField/Picker implementation

