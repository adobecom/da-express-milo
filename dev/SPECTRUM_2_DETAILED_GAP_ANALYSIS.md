# Spectrum 2 Web Components - Detailed Gap Analysis
## Component-by-Component Comparison: Spectrum vs Figma Requirements

**Date:** February 2, 2026  
**Project:** da-express-milo - Color Explorer  
**Figma File:** Final Color Expansion CCEX-221263  
**Purpose:** Identify exact gaps between Spectrum capabilities and Figma requirements

---

## TABLE OF CONTENTS

1. [Tags Component](#1-tags-component)
2. [Text Field Component](#2-text-field-component)
3. [Picker/Dropdown Component](#3-pickerdropdown-component)
4. [Button Component](#4-button-component)
5. [Action Button Component](#5-action-button-component)
6. [Tooltip Component](#6-tooltip-component)
7. [Dialog/Modal Component](#7-dialogmodal-component)
8. [Color Components](#8-color-components)
9. [Search/Marquee Component](#9-searchmarquee-component)
10. [Summary Matrix](#10-summary-matrix)

---

## 1. TAGS COMPONENT

**Figma Node:** `5721-145824`, `5708-250660` (CC Libraries tags)  
**Spectrum Component:** `@spectrum-web-components/tags`  
**Implementation Status:** ✅ Completed (with workarounds)

### What Figma Asks For

#### Size Variants (Mobile, Tablet, Desktop)

| Property | Mobile (L) | Tablet/Desktop (M) | Spectrum Default |
|----------|------------|-------------------|------------------|
| **Height** | 32px | 24px | 32px (M), 24px (S) |
| **Padding** | 12px horiz | 12px horiz | 9px horiz |
| **Font Size** | 14px | 12px | 14px (M), 12px (S) |
| **Line Height** | 18px | 16px | 18px (M), 16px (S) |
| **Border Radius** | 8px | 7px | **6px** ⚠️ |
| **Gap (text to icon)** | N/A | 6px (for + icon) | No custom icon support |

**❌ GAP:** Border radius doesn't match (6px vs 7-8px)

#### Colors & States

| State | Figma BG Color | Figma Text Color | Spectrum Default |
|-------|----------------|------------------|------------------|
| **Default** | `#E9E9E9` (gray-100) | `#292929` | `#E6E6E6` ⚠️ |
| **Hover** | `#D9D9D9` | `#292929` | No hover state ❌ |
| **Selected** | N/A in current design | N/A | Not supported ❌ |
| **Disabled** | Lighter gray | Gray text | Supported ✅ |

**❌ GAPS:**
- Exact color mismatch (`#E9E9E9` vs `#E6E6E6`)
- No hover state in Spectrum
- No "Selected" or "Emphasized" states in Spectrum API

#### Custom Content Requirements

**Figma Requirement:** Tags with custom `+` icon on the RIGHT side (CC Libraries)

```html
<!-- What Figma Shows -->
<tag>
  <span>Orange</span>
  <svg class="plus-icon">+</svg>  <!-- RIGHT side -->
</tag>
```

**Spectrum Provides:**
- ✅ `slot="icon"` - But renders on LEFT side only
- ✅ `slot="avatar"` - But renders on LEFT side only
- ❌ No right-side slot for custom content
- ❌ Default slot only accepts TEXT nodes, not custom elements

**❌ GAP:** Cannot place custom icons/content on right side of tag text

**Workaround Used:**
- Replaced `<sp-tag>` with custom `<button>` element
- Full control over content and positioning
- Lost Spectrum's built-in accessibility features (had to re-implement)

#### Typography

| Property | Figma (M size) | Spectrum (M size) | Match? |
|----------|---------------|-------------------|--------|
| **Font Family** | Adobe Clean Spectrum VF (Medium) | --spectrum-font-family | ⚠️ Similar |
| **Font Weight** | 500 (Medium) | 500 | ✅ Match |
| **Font Size** | 14px | 14px | ✅ Match |
| **Line Height** | 18px | 18px | ✅ Match |
| **Letter Spacing** | 0 | 0 | ✅ Match |

**✅ GAP:** Typography mostly matches

#### Accessibility Features

| Feature | Figma Annotation | Spectrum Provides | Gap? |
|---------|------------------|-------------------|-------|
| **Role** | `listitem` | `listitem` ✅ | None |
| **ARIA labels** | Custom per tag | Supported ✅ | None |
| **Keyboard nav** | Tab, Arrow keys | Roving tabindex ✅ | None |
| **Screen reader** | Announce tag actions | ARIA support ✅ | None |
| **Focus visible** | 2px blue outline | Native focus ✅ | None |

**✅ GAP:** Accessibility features are excellent in Spectrum

---

### Spectrum Tags API Limitations

**What Spectrum Provides:**
```html
<sp-tags>
  <sp-tag 
    size="s|m|l"           <!-- ✅ Size variants -->
    disabled               <!-- ✅ Disabled state -->
    readonly               <!-- ✅ Readonly state -->
    deletable              <!-- ✅ Removable (X icon) -->
    invalid                <!-- ✅ Error state -->
    >
    <sp-icon slot="icon">  <!-- ✅ Left icon slot -->
    <sp-avatar slot="avatar"> <!-- ✅ Left avatar slot -->
    Text content           <!-- ✅ Default slot (text only) -->
  </sp-tag>
</sp-tags>
```

**What Spectrum Does NOT Provide:**
```html
<!-- ❌ MISSING: Right-side content slot -->
<sp-tag>
  Text
  <svg slot="trailing-icon">X</svg>  <!-- NOT SUPPORTED -->
</sp-tag>

<!-- ❌ MISSING: Selected/Emphasized states -->
<sp-tag selected emphasized>  <!-- NOT SUPPORTED -->

<!-- ❌ MISSING: Hover state -->
<sp-tag :hover>  <!-- NOT SUPPORTED (CSS only) -->

<!-- ❌ MISSING: Custom content in default slot -->
<sp-tag>
  <span>Text</span>
  <svg>Icon</svg>  <!-- FILTERED OUT BY SHADOW DOM -->
</sp-tag>
```

---

### CSS Override Complexity

**Effort Required:** 🔴 HIGH (3/5 difficulty)

**Lines of CSS Override:** ~120 lines for full Figma parity

**Key Overrides Needed:**
```css
/* 1. Border radius (most common) */
sp-tag {
  --spectrum-tag-border-radius: 7px !important;
  border-radius: 7px !important;  /* Fallback */
}

/* 2. Exact colors */
sp-tag {
  --spectrum-tag-background-color: #E9E9E9 !important;
  background: #E9E9E9 !important;
}

/* 3. Hover states (not in Spectrum) */
sp-tag:hover {
  --spectrum-tag-background-color: #D9D9D9 !important;
  background: #D9D9D9 !important;
}

/* 4. Height/padding adjustments */
sp-tag {
  height: 24px !important;
  padding: 4px 12px !important;
}

/* 5. Typography fine-tuning */
sp-tag {
  font-size: 12px !important;
  line-height: 16px !important;
  font-weight: 500 !important;
}
```

**Why !important is Required:**
- Shadow DOM styles have higher specificity
- CSS custom properties need forcing
- No other way to override without modifying source

---

### Final Decision: Custom Button for CC Libraries Tags

**Why We Abandoned Spectrum Tags for This Use Case:**

1. **Cannot place + icon on right side** (slot limitations)
2. **Default slot filters out custom elements** (text-only)
3. **Too much CSS override effort** (easier to build custom)
4. **Better performance** (no Shadow DOM overhead)
5. **Full control** (exact Figma match possible)

**Custom Implementation:**
```javascript
// Create native button element
const tag = document.createElement('button');
tag.className = 'cc-libraries-tag-custom';
tag.setAttribute('role', 'listitem');

// Add text
const text = document.createElement('span');
text.textContent = 'Orange';
tag.appendChild(text);

// Add + icon on right
const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
// ... SVG paths ...
tag.appendChild(icon);  // Direct append works!
```

**Result:** 100% Figma parity, cleaner CSS, full control

---

## 2. TEXT FIELD COMPONENT

**Figma Nodes:** `5708-243441` (Palette name input), `5708-243443` (Tags input)  
**Spectrum Component:** `@spectrum-web-components/textfield`  
**Implementation Status:** ❌ Not implemented (using native `<input>`)

### What Figma Asks For

#### Size Variants

| Property | Mobile (L) | Tablet/Desktop (M) | Spectrum L | Spectrum M |
|----------|------------|-------------------|------------|------------|
| **Height** | 40px | 32px | **48px** ❌ | **32px** ✅ |
| **Padding** | 10px vert, 15px horiz | 7px vert, 12px horiz | 13px vert ❌ | 7px vert ✅ |
| **Border Width** | 2px | 2px | 1px ❌ | 1px ❌ |
| **Border Radius** | 9px | 8px | **8px** ⚠️ | **8px** ✅ |
| **Font Size** | 16px | 14px | 16px ✅ | 14px ✅ |
| **Line Height** | 20px | 18px | 24px ❌ | 18px ✅ |

**❌ GAPS:**
- Mobile height: 48px (Spectrum L) vs 40px (Figma)
- Border width: 1px (Spectrum) vs 2px (Figma)
- Mobile padding doesn't match
- Mobile line-height: 24px vs 20px

#### States & Colors

| State | Figma Border | Figma Background | Spectrum Default |
|-------|--------------|------------------|------------------|
| **Default** | `#DADADA` (gray-300) | `#FFFFFF` (white) | Similar ✅ |
| **Hover** | Darker border | White | Supported ✅ |
| **Focus** | Blue (`#3B63FB`) | White | Blue (different shade) ⚠️ |
| **Disabled** | Light gray | Light gray bg | Supported ✅ |
| **Invalid** | Red border | White | Supported ✅ |

**⚠️ GAP:** Focus color doesn't match exact Figma blue

#### Label Positioning & Typography

**Figma Requirement:**
```
Label (above input)
├─ Font: Adobe Clean, Regular, 16px (mobile) / 14px (desktop)
├─ Color: #505050 (neutral-subdued)
├─ Padding: 10px vertical
└─ Position: Above input (not floating)
```

**Spectrum Provides:**
```html
<sp-field-label for="input">Label</sp-field-label>
<sp-textfield id="input"></sp-textfield>
```

**✅ GAP:** Label structure matches, but typography needs override

#### Placeholder Text

| Property | Figma | Spectrum Default |
|----------|-------|------------------|
| **Text** | "Value" | Configurable ✅ |
| **Color** | `#292929` (darker) | `#6e6e6e` (lighter) ❌ |
| **Font** | Same as input | Same as input ✅ |

**❌ GAP:** Placeholder color too light in Spectrum

#### Caret (Text Cursor)

**Figma Specification:**
- Color: Black (`#000000`)
- Width: 1px
- Height: 20px (mobile), 18px (desktop)

**Spectrum:**
- Uses browser default caret
- Cannot customize easily

**⚠️ GAP:** Minor, browser default is acceptable

---

### Spectrum TextField API

**What Spectrum Provides:**
```html
<sp-textfield
  size="s|m|l|xl"          <!-- ✅ Size variants -->
  placeholder="Text"       <!-- ✅ Placeholder -->
  value="Initial"          <!-- ✅ Value binding -->
  disabled                 <!-- ✅ Disabled state -->
  readonly                 <!-- ✅ Readonly state -->
  invalid                  <!-- ✅ Error state -->
  quiet                    <!-- ⚠️ Borderless variant (not needed) -->
  multiline                <!-- ⚠️ Textarea mode (not needed) -->
  pattern="regex"          <!-- ✅ Validation -->
  >
  <label slot="label">     <!-- ✅ Label slot -->
  <sp-help-text slot="help-text">  <!-- ⚠️ Not in Figma -->
</sp-textfield>
```

**What Spectrum Does NOT Provide:**
- ❌ Exact border width control (2px Figma vs 1px Spectrum)
- ❌ Exact mobile height (40px Figma vs 48px Spectrum L)
- ❌ Custom caret styling
- ❌ Exact placeholder color control

---

### CSS Override Complexity

**Effort Required:** 🟡 MEDIUM (2/5 difficulty)

**Estimated Lines of CSS:** ~60 lines

**Key Overrides Needed:**
```css
/* 1. Height adjustment (mobile) */
sp-textfield[size="l"] {
  --spectrum-textfield-height: 40px !important;
  height: 40px !important;
}

/* 2. Border width */
sp-textfield {
  --spectrum-textfield-border-width: 2px !important;
  border-width: 2px !important;
}

/* 3. Padding adjustment */
sp-textfield[size="l"] {
  --spectrum-textfield-padding-y: 10px !important;
  --spectrum-textfield-padding-x: 15px !important;
}

/* 4. Border radius (minor) */
sp-textfield {
  --spectrum-textfield-border-radius: 9px !important;  /* Mobile */
  border-radius: 9px !important;
}

/* 5. Placeholder color */
sp-textfield::part(input)::placeholder {
  color: #292929 !important;
  opacity: 0.6 !important;
}

/* 6. Focus color */
sp-textfield:focus-within {
  --spectrum-textfield-border-color-focus: #3B63FB !important;
}
```

---

### Recommendation

**✅ ADOPT SPECTRUM TEXTFIELD**

**Reasons:**
1. ✅ Accessibility features (ARIA, labels, validation)
2. ✅ Desktop size (M) matches Figma perfectly
3. ✅ API supports all needed states
4. ⚠️ Mobile requires moderate CSS overrides (~60 lines)
5. ✅ Better than custom input (form validation, built-in states)

**Workarounds Needed:**
- Override mobile height (40px)
- Override border width (2px)
- Override placeholder color
- Minor padding adjustments

**LOE:** 1-2 days (bundling + CSS overrides + testing)

---

## 3. PICKER/DROPDOWN COMPONENT

**Figma Nodes:** `5708-243439` ("Save to" library picker)  
**Spectrum Component:** `@spectrum-web-components/picker`  
**Implementation Status:** ❌ Not implemented (using custom div with chevron)

### What Figma Asks For

#### Size Variants

| Property | Mobile (L) | Tablet/Desktop (M) | Spectrum L | Spectrum M |
|----------|------------|-------------------|------------|------------|
| **Height** | 40px | 32px | **48px** ❌ | **32px** ✅ |
| **Padding** | 10px vert, 15px horiz | 7px vert, 12px horiz | 13px vert ❌ | 7px vert ✅ |
| **Border Radius** | 9px | 8px | **8px** ⚠️ | **8px** ✅ |
| **Background** | `#E9E9E9` (gray-100) | `#E9E9E9` | White ❌ | White ❌ |
| **Border** | None | None | 1px border ❌ | 1px border ❌ |
| **Font Size** | 16px | 14px | 16px ✅ | 14px ✅ |

**❌ GAPS:**
- Mobile height: 48px vs 40px
- Background color: Gray vs White
- Has border (Figma has none)

#### Chevron Icon

**Figma Requirement:**
- Icon: `S2_Chevron` (Spectrum icon)
- Size: 12px (mobile), 10px (desktop)
- Position: Right side, 14px from edge (mobile)
- Color: `#292929` (dark gray)
- Direction: Down

**Spectrum Provides:**
- ✅ Chevron icon included
- ⚠️ Size may not match exactly
- ✅ Position correct (right side)
- ⚠️ Color customizable via CSS

**⚠️ GAP:** Minor size/color adjustments needed

#### Dropdown Menu Positioning

**Figma Specification:**
- Opens below picker
- Aligned to left edge
- Max height: 300px with scroll
- Border radius: 8px
- Box shadow: Elevation-2

**Spectrum Provides:**
- ✅ Popover positioning logic
- ✅ Scroll behavior
- ⚠️ Exact shadow may differ
- ✅ Keyboard navigation

**⚠️ GAP:** Shadow and radius need tweaking

#### States

| State | Figma BG | Figma Border | Spectrum Default |
|-------|----------|--------------|------------------|
| **Default** | `#E9E9E9` | None | White + 1px border ❌ |
| **Hover** | Slightly darker | None | Darker ✅ |
| **Focus** | Same | Blue outline | Blue outline ✅ |
| **Open** | Same | None | Highlight ✅ |
| **Disabled** | Light gray | None | Light gray ✅ |

**❌ GAP:** Background color and border

---

### Spectrum Picker API

**What Spectrum Provides:**
```html
<sp-picker
  size="s|m|l|xl"          <!-- ✅ Size variants -->
  label="Save to"          <!-- ✅ Label -->
  value="selected-id"      <!-- ✅ Value binding -->
  disabled                 <!-- ✅ Disabled -->
  invalid                  <!-- ✅ Error state -->
  quiet                    <!-- ⚠️ Borderless (not needed) -->
  pending                  <!-- ⚠️ Loading state (not needed) -->
  >
  <sp-menu-item value="lib1">My Library</sp-menu-item>
  <sp-menu-item value="lib2">Team Library</sp-menu-item>
</sp-picker>
```

**Menu Items:**
```html
<sp-menu slot="options">
  <sp-menu-item value="1">Option 1</sp-menu-item>
  <sp-menu-item value="2" disabled>Option 2</sp-menu-item>
  <sp-menu-item value="3">
    <sp-icon slot="icon">  <!-- ✅ Icons supported -->
    Option 3
  </sp-menu-item>
</sp-menu>
```

**What Spectrum Does NOT Provide:**
- ❌ Gray background by default (white only)
- ❌ Borderless variant (has `quiet` but not the same)
- ❌ Exact mobile height (40px vs 48px)
- ❌ Custom popover styles (shadow, radius)

---

### CSS Override Complexity

**Effort Required:** 🟡 MEDIUM-HIGH (3/5 difficulty)

**Estimated Lines of CSS:** ~80 lines

**Key Overrides Needed:**
```css
/* 1. Background color (critical) */
sp-picker {
  --spectrum-picker-background-color: #E9E9E9 !important;
  background: #E9E9E9 !important;
}

/* 2. Remove border */
sp-picker {
  --spectrum-picker-border-width: 0 !important;
  border: none !important;
}

/* 3. Height adjustment (mobile) */
sp-picker[size="l"] {
  --spectrum-picker-height: 40px !important;
  height: 40px !important;
}

/* 4. Border radius */
sp-picker {
  --spectrum-picker-border-radius: 9px !important;  /* Mobile */
}

/* 5. Chevron customization */
sp-picker::part(chevron) {
  width: 12px !important;
  height: 12px !important;
  color: #292929 !important;
}

/* 6. Popover/menu overrides */
sp-popover {
  --spectrum-popover-border-radius: 8px !important;
  box-shadow: 0px 0px 12px 0px rgba(0, 0, 0, 0.16) !important;
}
```

---

### Recommendation

**✅ ADOPT SPECTRUM PICKER**

**Reasons:**
1. ✅ Complex dropdown logic (positioning, scroll, keyboard)
2. ✅ Accessibility features (ARIA, keyboard nav)
3. ✅ Desktop size matches well
4. ⚠️ Mobile requires moderate overrides (~80 lines)
5. ✅ Much better than custom implementation

**Workarounds Needed:**
- Override background to gray
- Remove border entirely
- Adjust mobile height
- Customize popover styles

**LOE:** 2-3 days (bundling + CSS overrides + menu setup + testing)

---

## 4. BUTTON COMPONENT

**Figma Nodes:** Multiple CTA buttons, Save buttons  
**Spectrum Component:** `@spectrum-web-components/button`  
**Implementation Status:** ❌ Not implemented (using native `<button>`)

### What Figma Asks For

#### CTA Button (Accent/Primary)

| Property | Mobile | Tablet/Desktop | Spectrum Accent |
|----------|--------|----------------|-----------------|
| **Height** | 48px | 40px | **48px** ✅ | **32px** ❌ |
| **Padding** | 13px vert, 24px horiz | 13px vert, 24px horiz | 11px vert ⚠️ |
| **Border Radius** | 24px (full round) | 24px | **8px** ❌ |
| **Background** | `#3B63FB` | `#3B63FB` | `#5258E4` ⚠️ |
| **Font Size** | 18px | 16px | 18px ✅ / 16px ✅ |
| **Font Weight** | 700 (Bold) | 700 | 700 ✅ |
| **Text Color** | White | White | White ✅ |

**❌ GAPS:**
- Border radius: 24px (pill shape) vs 8px (rounded)
- Desktop height: 40px vs 32px
- Background color: Different blue shade
- Padding doesn't match exactly

#### States

| State | Figma BG | Spectrum Default |
|-------|----------|------------------|
| **Default** | `#3B63FB` | `#5258E4` ⚠️ |
| **Hover** | `#2F4FD1` | Darker blue ✅ |
| **Active** | `#2845B8` | Darker still ✅ |
| **Focus** | Blue + outline | Blue + outline ✅ |
| **Disabled** | Gray `#E9E9E9` | Gray ✅ |

**⚠️ GAP:** Default blue shade different

---

### Spectrum Button API

**What Spectrum Provides:**
```html
<sp-button
  size="s|m|l|xl"          <!-- ✅ Size variants -->
  variant="accent|primary|secondary|negative"  <!-- ✅ Variants -->
  treatment="fill|outline" <!-- ✅ Fill/outline -->
  static="white|black"     <!-- ⚠️ On dark/light bg -->
  disabled                 <!-- ✅ Disabled -->
  pending                  <!-- ✅ Loading state -->
  href="url"               <!-- ⚠️ Link button -->
  >
  Button Text
  <sp-icon slot="icon">    <!-- ✅ Icon support -->
</sp-button>
```

**What Spectrum Does NOT Provide:**
- ❌ Pill-shaped variant (24px border-radius)
- ❌ Exact Figma color (`#3B63FB` vs `#5258E4`)
- ❌ Custom height (40px desktop, 48px mobile)
- ❌ Exact padding control

---

### CSS Override Complexity

**Effort Required:** 🟡 MEDIUM (2/5 difficulty)

**Estimated Lines of CSS:** ~50 lines

**Key Overrides Needed:**
```css
/* 1. Border radius (critical for CTA) */
sp-button[variant="accent"] {
  --spectrum-button-border-radius: 24px !important;
  border-radius: 24px !important;
}

/* 2. Background color */
sp-button[variant="accent"] {
  --spectrum-button-accent-background-color: #3B63FB !important;
  background: #3B63FB !important;
}

/* 3. Height adjustments */
sp-button[size="l"] {
  --spectrum-button-height: 48px !important;  /* Mobile */
}

sp-button[size="m"] {
  --spectrum-button-height: 40px !important;  /* Desktop */
}

/* 4. Padding */
sp-button {
  --spectrum-button-padding-y: 13px !important;
  --spectrum-button-padding-x: 24px !important;
}

/* 5. Hover/active states */
sp-button[variant="accent"]:hover {
  background: #2F4FD1 !important;
}

sp-button[variant="accent"]:active {
  background: #2845B8 !important;
}
```

---

### Recommendation

**⚠️ CONSIDER SPECTRUM BUTTON**

**Reasons:**
1. ✅ Good accessibility (ARIA, keyboard, focus)
2. ✅ Handles all button states well
3. ⚠️ Moderate CSS overrides needed (~50 lines)
4. ✅ Icon support built-in
5. ⚠️ Current native buttons work fine

**Decision Factors:**
- If using Spectrum for forms already → adopt buttons too (consistency)
- If staying custom → keep native buttons (they work)

**LOE:** 1-2 days (bundling + CSS overrides + testing)

---

## 5. ACTION BUTTON COMPONENT

**Figma Nodes:** `5654-74818` (Edit), `5654-74967` (Share), `5654-75125` (Download), `5703-182002` (Save to CC)  
**Spectrum Component:** `@spectrum-web-components/action-button`  
**Implementation Status:** ❌ Not implemented (using native `<button>` with SVG)

### What Figma Asks For

#### Size & Layout

| Property | Mobile/Tablet/Desktop | Spectrum M | Match? |
|----------|----------------------|------------|--------|
| **Height** | 32px | **32px** ✅ | YES |
| **Width** | 32px (square) | Auto width ⚠️ | PARTIAL |
| **Border Radius** | 8px | **8px** ✅ | YES |
| **Padding** | 6px (for 20px icon) | 6px ✅ | YES |
| **Icon Size** | 20px × 20px | 20px ✅ | YES |

**✅ GAP:** Size matches well!

#### States

| State | Figma BG | Figma Border | Spectrum Default |
|-------|----------|--------------|------------------|
| **Default** | Transparent | None | Transparent ✅ |
| **Hover** | `#F3F3F3` (gray-150) | None | Gray ✅ |
| **Active** | `#E9E9E9` (gray-100) | None | Darker gray ✅ |
| **Focus** | Transparent | Blue outline | Blue outline ✅ |
| **Selected** | `#E9E9E9` | None | Supported ✅ |

**✅ GAP:** States match very well!

#### Icon Requirements

**Figma Icons:**
- Edit: `S2_Icon_Edit_20_N`
- Share: `S2_Icon_ShareAndroid_20_N`
- Download: `S2_Icon_Download_20_N`
- Save: `S2_Icon_CCLibrary_20_N`

**Spectrum Workflow Icons:**
- ✅ `Edit` - Available as `WorkflowEdit`
- ✅ `Share` - Available as `WorkflowShare`
- ✅ `Download` - Available as `WorkflowDownload`
- ✅ `CCLibraries` - Available as `WorkflowAsset`

**✅ GAP:** Icons available via `@spectrum-web-components/icons-workflow`

---

### Spectrum Action Button API

**What Spectrum Provides:**
```html
<sp-action-button
  size="s|m|l|xl"          <!-- ✅ Size variants -->
  quiet                    <!-- ✅ No background (default for icons) -->
  selected                 <!-- ✅ Selected state -->
  emphasized               <!-- ⚠️ Higher contrast -->
  hold-affordance          <!-- ⚠️ Long-press indicator -->
  disabled                 <!-- ✅ Disabled -->
  >
  <sp-icon-edit slot="icon"></sp-icon-edit>
  Label (optional)
</sp-action-button>
```

**What Spectrum Does NOT Provide:**
- ❌ Forced square aspect ratio (auto-width by default)
- ⚠️ Exact hover color (`#F3F3F3` vs Spectrum's gray)

---

### CSS Override Complexity

**Effort Required:** 🟢 LOW (1/5 difficulty)

**Estimated Lines of CSS:** ~30 lines

**Key Overrides Needed:**
```css
/* 1. Force square shape */
sp-action-button {
  --spectrum-actionbutton-min-width: 32px !important;
  width: 32px !important;
  aspect-ratio: 1 / 1 !important;
}

/* 2. Exact hover color */
sp-action-button:hover {
  --spectrum-actionbutton-background-color-hover: #F3F3F3 !important;
  background: #F3F3F3 !important;
}

/* 3. Active state */
sp-action-button:active {
  background: #E9E9E9 !important;
}
```

---

### Recommendation

**✅ STRONGLY RECOMMEND SPECTRUM ACTION-BUTTON**

**Reasons:**
1. ✅ Size matches Figma perfectly (32px)
2. ✅ States match very well
3. ✅ Workflow icons available
4. ✅ Minimal CSS overrides (~30 lines)
5. ✅ Excellent accessibility
6. ✅ Much better than custom implementation

**Workarounds Needed:**
- Force square aspect ratio
- Minor hover color adjustment

**LOE:** 1 day (bundling + icons + minimal CSS + testing)

---

## 6. TOOLTIP COMPONENT

**Figma Nodes:** `5703-182002` (Action button tooltips)  
**Spectrum Component:** `@spectrum-web-components/tooltip`  
**Implementation Status:** ❌ Not implemented (custom tooltip divs)

### What Figma Asks For

#### Size & Layout

| Property | Figma (M size) | Spectrum M |
|----------|---------------|------------|
| **Max Width** | 160px | 200px ⚠️ |
| **Padding** | 4px vert, 9px horiz | 4px vert, 8px horiz ⚠️ |
| **Border Radius** | 7px | **8px** ⚠️ |
| **Background** | `#292929` (dark gray) | Black ⚠️ |
| **Font Size** | 12px | 12px ✅ |
| **Line Height** | 16px | 16px ✅ |
| **Text Color** | White | White ✅ |

**⚠️ GAPS:**
- Max width: 160px vs 200px
- Border radius: 7px vs 8px
- Background: Dark gray vs black
- Padding: 9px vs 8px horizontal

#### Positioning

**Figma Requirement:**
- Position: Bottom center (below button)
- Offset: 9px from button (includes tip)
- Tip: 10px wide, 5px tall triangle
- Alignment: Center-aligned to button

**Spectrum Provides:**
- ✅ Multiple placements (top, bottom, left, right)
- ✅ Auto-positioning (flip if no space)
- ✅ Tip/arrow included
- ⚠️ Exact offset may differ

**⚠️ GAP:** Offset distance may need adjustment

#### Behavior

| Behavior | Figma | Spectrum |
|----------|-------|----------|
| **Trigger** | Hover | Hover ✅ |
| **Delay** | ~500ms | Configurable ✅ |
| **Focus** | Show on keyboard focus | Supported ✅ |
| **Touch** | Show on tap/hold | Supported ✅ |
| **Dismiss** | Mouse leave | Auto ✅ |

**✅ GAP:** Behavior matches well

---

### Spectrum Tooltip API

**What Spectrum Provides:**
```html
<sp-action-button id="btn">Edit</sp-action-button>
<sp-tooltip 
  for="btn"                    <!-- ✅ Associates with button -->
  placement="bottom"           <!-- ✅ Positioning -->
  open                         <!-- ⚠️ Manual control -->
  self-managed                 <!-- ✅ Auto show/hide -->
  >
  Edit this palette
</sp-tooltip>
```

**Overlay Trigger (Recommended):**
```html
<overlay-trigger placement="bottom">
  <sp-action-button slot="trigger">Edit</sp-action-button>
  <sp-tooltip slot="hover-content">Edit this palette</sp-tooltip>
</overlay-trigger>
```

**What Spectrum Does NOT Provide:**
- ❌ Exact 160px max-width
- ❌ 7px border-radius
- ❌ Dark gray background (only black)
- ❌ 9px horizontal padding

---

### CSS Override Complexity

**Effort Required:** 🟢 LOW (1/5 difficulty)

**Estimated Lines of CSS:** ~40 lines

**Key Overrides Needed:**
```css
/* 1. Max width */
sp-tooltip {
  --spectrum-tooltip-max-width: 160px !important;
  max-width: 160px !important;
}

/* 2. Border radius */
sp-tooltip {
  --spectrum-tooltip-border-radius: 7px !important;
  border-radius: 7px !important;
}

/* 3. Background color */
sp-tooltip {
  --spectrum-tooltip-background-color: #292929 !important;
  background: #292929 !important;
}

/* 4. Padding */
sp-tooltip {
  --spectrum-tooltip-padding-y: 4px !important;
  --spectrum-tooltip-padding-x: 9px !important;
}

/* 5. Offset adjustment */
sp-tooltip[placement="bottom"] {
  --spectrum-tooltip-offset: 9px !important;
}
```

---

### Recommendation

**✅ ADOPT SPECTRUM TOOLTIP**

**Reasons:**
1. ✅ Complex positioning logic built-in
2. ✅ Accessibility features (ARIA)
3. ✅ Auto flip when no space
4. ✅ Minimal CSS overrides (~40 lines)
5. ✅ Much better than custom tooltip

**Workarounds Needed:**
- Adjust max-width to 160px
- Change background to dark gray
- Minor padding/radius adjustments

**LOE:** 1 day (bundling + CSS overrides + testing)

---

## 7. DIALOG/MODAL COMPONENT

**Figma Nodes:** Multiple modal containers  
**Spectrum Component:** `@spectrum-web-components/dialog`  
**Implementation Status:** ❌ Not using Spectrum (custom modals work perfectly)

### What Figma Asks For

#### Modal Container Dimensions

| Breakpoint | Width | Height | Spectrum Default |
|------------|-------|--------|------------------|
| **Mobile** | 100vw | Auto (fit content) | 100vw ✅ / Auto ✅ |
| **Tablet** | 536px | 540px max | Configurable ✅ |
| **Desktop** | 898px | 604px max | Configurable ✅ |

**✅ GAP:** Dimensions fully customizable

#### Drawer Behavior (Mobile)

**Figma Requirement:**
- Slides up from bottom
- Has handle (80px × 4px gray bar)
- Rounded top corners (20px radius)
- Swipe down to dismiss
- Height matches content

**Spectrum Dialog:**
- ❌ Does NOT support drawer/bottom-sheet mode
- ✅ Standard centered modal only
- ❌ No swipe gesture support
- ❌ No drawer handle

**❌ CRITICAL GAP:** Spectrum Dialog does NOT support mobile drawer/bottom-sheet pattern

#### Curtain/Backdrop

| Property | Figma | Spectrum |
|----------|-------|----------|
| **Background** | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.5)` ✅ |
| **Blur** | 10px backdrop blur | Not supported ❌ |
| **Click to close** | Yes | Configurable ✅ |
| **Z-index** | 9998 | Managed ✅ |

**⚠️ GAP:** No backdrop-filter blur support

---

### Spectrum Dialog API

**What Spectrum Provides:**
```html
<sp-dialog
  size="s|m|l"                 <!-- ✅ Size variants -->
  dismissable                  <!-- ✅ X button -->
  no-divider                   <!-- ⚠️ Header divider control -->
  error                        <!-- ⚠️ Error variant -->
  >
  <h2 slot="heading">Title</h2>
  Content goes here
  <sp-button-group slot="button-group">
    <sp-button>Cancel</sp-button>
    <sp-button variant="accent">Save</sp-button>
  </sp-button-group>
</sp-dialog>

<!-- Wrap in overlay -->
<sp-overlay open>
  <sp-dialog>...</sp-dialog>
</sp-overlay>
```

**What Spectrum Does NOT Provide:**
- ❌ Mobile drawer/bottom-sheet mode
- ❌ Swipe gestures
- ❌ Drawer handle component
- ❌ Slide-up animation (mobile)
- ❌ Rounded top corners only (mobile)
- ❌ Custom modal sizes (Figma's 898px × 604px)
- ❌ Backdrop blur effect

---

### Recommendation

**❌ DO NOT ADOPT SPECTRUM DIALOG**

**Reasons:**
1. ❌ Cannot do mobile drawer/bottom-sheet pattern
2. ❌ No swipe gesture support
3. ❌ Custom modals work perfectly
4. ❌ Too much effort to replicate current functionality
5. ❌ Would lose mobile drawer behavior

**Decision:**
- **Keep custom modal/drawer implementation**
- Custom modals support all Figma requirements
- Already have full accessibility
- Spectrum Dialog adds no value here

**LOE to Switch:** 3-4 days (NOT RECOMMENDED)

---

## 8. COLOR COMPONENTS

**Figma Nodes:** Color handles in gradients, palette swatches  
**Spectrum Components:** Multiple color components available  
**Implementation Status:** ❌ Not using Spectrum (custom color rendering)

### Available Spectrum Color Components

| Component | Purpose | Figma Need? |
|-----------|---------|-------------|
| **`<sp-color-area>`** | 2D color picker (hue/saturation) | ❌ No |
| **`<sp-color-field>`** | Hex color input field | ⚠️ Maybe (future) |
| **`<sp-color-handle>`** | Draggable color picker handle | ⚠️ Similar to gradient handles |
| **`<sp-color-loupe>`** | Magnifying glass for color picking | ❌ No |
| **`<sp-color-slider>`** | 1D color slider (hue, alpha) | ❌ No |
| **`<sp-color-wheel>`** | Circular hue picker | ❌ No |
| **`<sp-swatch>`** | Color preview swatch | ⚠️ Similar to palette swatches |

### Color Handle Comparison

**Figma Gradient Handle:**
- Size: 22px × 22px (circular)
- Ring: White outer ring
- Fill: Color preview inside
- Border: Inner white border
- Shadow: 0px 0px 12px rgba(0,0,0,0.16)
- Draggable: Yes
- Position: On gradient bar

**Spectrum `<sp-color-handle>`:**
- ✅ Circular shape
- ✅ Color preview
- ✅ Draggable
- ⚠️ Different styling (flat design)
- ❌ No ring/border structure
- ❌ Different shadow

**❌ GAP:** Styling completely different, would need full CSS override

### Color Swatch Comparison

**Figma Palette Swatch:**
- Size: 36px × 36px (mobile/tablet/desktop)
- Border: 1px `rgba(31,31,31,0.2)`
- Border radius: 8px
- Background: Solid color
- Hover: Subtle highlight
- Click: Expand/copy

**Spectrum `<sp-swatch>`:**
- ✅ Shows color preview
- ⚠️ Square/rounded shape (configurable)
- ⚠️ Different size/border
- ❌ No built-in interactions

**⚠️ GAP:** Moderate styling differences

---

### Recommendation

**❌ DO NOT ADOPT SPECTRUM COLOR COMPONENTS (for now)**

**Reasons:**
1. ❌ Custom color rendering works well
2. ❌ Significant styling differences
3. ❌ No real benefit (no complex color picker needed)
4. ✅ Current implementation matches Figma perfectly
5. ⚠️ Maybe revisit if building color editing features

**Decision:**
- **Keep custom color rendering**
- Only consider if building advanced color picker
- Current swatches/handles are sufficient

**LOE to Switch:** 2-3 days (NOT RECOMMENDED currently)

---

## 9. SEARCH/MARQUEE COMPONENT

**Figma Nodes:** TBD (search/filter interface if designed)  
**Spectrum Component:** ❌ **DOES NOT EXIST**  
**Implementation Status:** ❌ Not designed yet

### What a Search Marquee Would Require

**Typical Marquee Features:**
- Horizontal scrolling text/content
- Auto-scrolling animation
- Pause on hover
- Keyboard controls (arrow keys)
- Loop behavior
- Variable speed
- Responsive (mobile/desktop)

### Available Spectrum Components

| Component | Can It Help? | Notes |
|-----------|--------------|-------|
| **`<sp-search>`** | ⚠️ Partial | Basic search input, no marquee |
| **`<sp-combobox>`** | ⚠️ Partial | Autocomplete, no marquee |
| **`<sp-textfield>`** | ❌ No | Just an input |

**❌ CRITICAL GAP:** Spectrum does NOT provide marquee/scrolling component

### What Would Need to Be Built Custom

```javascript
// Full custom implementation required
class SearchMarquee extends HTMLElement {
  constructor() {
    super();
    // 1. Create scrolling container
    // 2. Duplicate content for seamless loop
    // 3. Calculate scroll distance
    // 4. Implement CSS animation or RAF
    // 5. Add pause on hover
    // 6. Keyboard controls (arrow keys, spacebar)
    // 7. Accessibility (ARIA live region)
    // 8. Respect prefers-reduced-motion
  }
}
```

**Implementation Approaches:**

#### Option A: CSS Animation (Simplest)
```css
@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.marquee-content {
  animation: marquee 20s linear infinite;
}

.marquee-content:hover {
  animation-play-state: paused;
}
```

**Pros:**
- ✅ Simple implementation
- ✅ Good performance (GPU accelerated)
- ✅ Easy pause on hover

**Cons:**
- ⚠️ Less control over speed/behavior
- ⚠️ Hard to sync with user interaction

#### Option B: JavaScript RAF (Smoothest)
```javascript
function animate() {
  position -= speed;
  if (position <= -contentWidth) {
    position = 0;
  }
  element.style.transform = `translateX(${position}px)`;
  requestAnimationFrame(animate);
}
```

**Pros:**
- ✅ Full control over animation
- ✅ Can adjust speed dynamically
- ✅ Easy to add interactions

**Cons:**
- ⚠️ More complex code
- ⚠️ Need to handle performance

---

### Accessibility Requirements for Custom Marquee

**WCAG 2.1 Guidelines:**
1. **Pause Control** - Users must be able to pause scrolling content
2. **Keyboard Nav** - Arrow keys or spacebar to control
3. **Screen Readers** - ARIA live region for updates
4. **Reduced Motion** - Respect `prefers-reduced-motion: reduce`

**Implementation:**
```html
<div 
  class="search-marquee"
  role="marquee"
  aria-live="off"
  aria-label="Scrolling search results"
  >
  <div class="marquee-content">
    <!-- Scrolling items here -->
  </div>
  <button 
    class="marquee-pause" 
    aria-label="Pause scrolling"
    aria-pressed="false"
    >
    Pause
  </button>
</div>
```

```css
@media (prefers-reduced-motion: reduce) {
  .marquee-content {
    animation: none !important;
  }
}
```

---

### Recommendation

**🔨 BUILD CUSTOM SEARCH MARQUEE**

**Reasons:**
1. ❌ Does NOT exist in Spectrum
2. ✅ CSS animation approach is straightforward
3. ✅ Can build with good accessibility
4. ⚠️ Ensure performance optimization
5. ⚠️ Test across all breakpoints

**Implementation Plan:**
1. Use CSS `@keyframes` for animation (simplest)
2. Add pause on hover/focus
3. Implement ARIA live region
4. Add keyboard controls (spacebar to pause)
5. Respect `prefers-reduced-motion`
6. Test performance with many items

**LOE:** 3-5 days (design + implement + a11y + testing)

---

## 10. SUMMARY MATRIX

### Component Parity Overview

| Component | Spectrum Available? | Size Match | Color Match | Behavior Match | CSS Override Effort | Recommendation |
|-----------|---------------------|------------|-------------|----------------|---------------------|----------------|
| **Tags** | ✅ Yes | 🟡 Partial | ❌ No | 🟡 Partial | 🔴 HIGH (120 lines) | ⚠️ Custom for CC Libraries |
| **TextField** | ✅ Yes | 🟡 Partial | ✅ Yes | ✅ Yes | 🟡 MEDIUM (60 lines) | ✅ Adopt |
| **Picker** | ✅ Yes | 🟡 Partial | ❌ No | ✅ Yes | 🟡 MEDIUM (80 lines) | ✅ Adopt |
| **Button** | ✅ Yes | 🟡 Partial | ❌ No | ✅ Yes | 🟡 MEDIUM (50 lines) | ⚠️ Consider |
| **Action Button** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 🟢 LOW (30 lines) | ✅ Strong recommend |
| **Tooltip** | ✅ Yes | 🟡 Partial | 🟡 Partial | ✅ Yes | 🟢 LOW (40 lines) | ✅ Adopt |
| **Dialog** | ✅ Yes | ❌ No | ✅ Yes | ❌ No | 🔴 HIGH | ❌ Don't adopt |
| **Color Components** | ✅ Yes | ❌ No | ❌ No | 🟡 Partial | 🔴 HIGH | ❌ Don't adopt (for now) |
| **Search Marquee** | ❌ No | N/A | N/A | N/A | N/A | 🔨 Build custom |

---

### Gap Categories

#### 🟢 EXCELLENT MATCH (>80% parity)
- **Action Button** - Minimal overrides needed

#### 🟡 GOOD MATCH (60-80% parity)
- **TextField** - Moderate CSS overrides
- **Picker** - Moderate CSS overrides
- **Tooltip** - Minor adjustments
- **Button** - Moderate overrides

#### 🟠 PARTIAL MATCH (40-60% parity)
- **Tags** - Significant CSS + API limitations (custom solution better)

#### 🔴 POOR MATCH (<40% parity)
- **Dialog** - Missing mobile drawer pattern
- **Color Components** - Styling completely different

#### ❌ NOT AVAILABLE
- **Search Marquee** - Must build custom

---

### Common Gaps Across All Components

#### Styling Differences

| Property | Figma Uses | Spectrum Default | Workaround |
|----------|------------|------------------|------------|
| **Border Radius** | 7-9px | 6-8px | CSS override ✅ |
| **Border Width** | 0-2px | 1px | CSS override ✅ |
| **Colors** | Specific hex values | Spectrum tokens | CSS override ✅ |
| **Padding** | Figma-specific | Spectrum scale | CSS override ✅ |
| **Font Weights** | 500, 700 | Similar | Usually matches ✅ |

#### Size Variants

| Breakpoint | Figma Size | Spectrum Size | Match? |
|------------|------------|---------------|--------|
| **Mobile** | L (40-48px height) | L (48px) | ⚠️ Close |
| **Tablet** | M (32px height) | M (32px) | ✅ Match |
| **Desktop** | M (32-40px) | M (32px) | ⚠️ Close |

**Pattern:** Spectrum's "M" size matches Tablet/Desktop well, but mobile requires overrides

#### Shadow DOM Limitations

**Challenge:** Cannot easily override styles without `!important` and CSS custom properties

**Solution Pattern:**
```css
sp-component {
  /* Set both custom property AND direct style */
  --spectrum-component-property: value !important;
  property: value !important;  /* Fallback */
}
```

---

## FINAL RECOMMENDATIONS BY PRIORITY

### ✅ High Priority - Adopt These

1. **Action Button** (1 day) - Best parity, minimal overrides
2. **TextField** (1-2 days) - Good accessibility, moderate overrides
3. **Picker** (2-3 days) - Complex logic, worth the overrides
4. **Tooltip** (1 day) - Positioning logic valuable

**Total:** 5-8 days

### ⚠️ Medium Priority - Consider These

5. **Button** (1-2 days) - Only if already using other Spectrum components
6. **Tags** (Done, but don't expand) - Keep custom for CC Libraries

### ❌ Low Priority - Don't Adopt

7. **Dialog** - Custom modals work better
8. **Color Components** - Custom rendering sufficient

### 🔨 Must Build Custom

9. **Search Marquee** (3-5 days) - Not available in Spectrum

---

## TOTAL LEVEL OF EFFORT

### If Adopting Recommended Components

| Phase | Components | LOE | Status |
|-------|------------|-----|--------|
| **Phase 1** | Action Button, TextField | 2-3 days | Not started |
| **Phase 2** | Picker, Tooltip | 3-4 days | Not started |
| **Phase 3** | Button (optional) | 1-2 days | Optional |
| **Custom** | Search Marquee | 3-5 days | Future (if needed) |

**Total Recommended:** 5-8 days (10-14 days with optional components)

---

## LESSONS LEARNED FROM TAGS IMPLEMENTATION

### What Worked

1. ✅ **Self-contained bundles** - Lit included, works everywhere
2. ✅ **CSS custom properties** - Can override shadow DOM
3. ✅ **!important flag** - Required for shadow DOM overrides
4. ✅ **Accessibility** - Spectrum provides excellent a11y foundation

### What Didn't Work

1. ❌ **Custom content in slots** - Shadow DOM filtered it out
2. ❌ **Right-side icons** - No slot available, only left
3. ❌ **Perfect Figma match** - Required abandoning component
4. ❌ **State API** - Missing Selected/Emphasized states

### Key Takeaway

> **Spectrum components work well when you can accept their design system. For pixel-perfect Figma matching with custom behaviors, custom components are often easier than forcing Spectrum to comply.**

---

## APPENDIX: CSS OVERRIDE PATTERNS

### Pattern 1: Size Overrides

```css
/* Override size via custom properties + direct styles */
sp-component {
  --spectrum-component-height: 40px !important;
  --spectrum-component-width: auto !important;
  height: 40px !important;
  width: auto !important;
}
```

### Pattern 2: Color Overrides

```css
/* Override colors (background, text, border) */
sp-component {
  --spectrum-component-background-color: #E9E9E9 !important;
  --spectrum-component-text-color: #292929 !important;
  --spectrum-component-border-color: #DADADA !important;
  background: #E9E9E9 !important;
  color: #292929 !important;
  border-color: #DADADA !important;
}
```

### Pattern 3: State Overrides

```css
/* Override hover, focus, active states */
sp-component:hover {
  --spectrum-component-background-color-hover: #D9D9D9 !important;
  background: #D9D9D9 !important;
}

sp-component:focus-within {
  --spectrum-component-border-color-focus: #3B63FB !important;
  border-color: #3B63FB !important;
}
```

### Pattern 4: Typography Overrides

```css
/* Override font properties */
sp-component {
  --spectrum-component-font-size: 14px !important;
  --spectrum-component-font-weight: 500 !important;
  --spectrum-component-line-height: 18px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  line-height: 18px !important;
}
```

---

**Document Version:** 1.0  
**Last Updated:** February 2, 2026  
**Next Review:** After TextField/Picker implementation  
**Prepared by:** AI Assistant
