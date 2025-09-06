# 🎨 CSS Variable Linter

## Overview
Automatically enforces the use of CSS variables from `:root` instead of hardcoded values in CSS files. This ensures consistency across our design system and makes theme changes easier to manage.

## ✨ Features

### Pre-commit Enforcement
- **Blocks commits** until violations are fixed
- **Staged files only** - only checks files being committed, not the entire codebase
- **Clear feedback** - shows exact file, line, and suggested fixes

### Auto-fix Capability
- **Automatic replacement** of violations with CSS variables
- **Batch processing** - fixes multiple issues in a single command
- **Safe operation** - preserves file structure and formatting

### Smart Detection
- **Color values**: Hex (`#fff`, `#ffffff`), RGB, RGBA, HSL, named colors
- **Spacing values**: Pixels, rem, em, percentages, viewport units
- **Shorthand properties**: `background:`, `margin:`, `padding:`, etc.
- **Multiple values**: Handles `padding: 8px 16px;` with multiple replacements

## 🔍 What It Catches

### Colors
```css
/* ❌ Before */
color: #ffffff;
background: #000;
border-color: #E9E9E9;

/* ✅ After */
color: var(--color-white);
background: var(--color-black);
border-color: var(--color-light-gray);
```

### Spacing
```css
/* ❌ Before */
margin-top: 16px;
padding: 8px 16px;
gap: 24px;

/* ✅ After */
margin-top: var(--spacing-300);
padding: var(--spacing-100) var(--spacing-300);
gap: var(--spacing-400);
```

## 🚀 Usage

### Check for Violations
```bash
npm run lint:css-vars
```

### Auto-fix Violations
```bash
npm run lint:css-vars:fix
```

### Manual Workflow
```bash
# 1. Make changes to CSS files
git add express/code/features/table-of-contents-seo/table-of-contents-seo.css

# 2. Try to commit (pre-commit hook runs)
git commit -m "Update TOC styles"

# 3. If violations found, auto-fix
npm run lint:css-vars:fix

# 4. Re-stage and commit
git add express/code/features/table-of-contents-seo/table-of-contents-seo.css
git commit -m "Update TOC styles"
```

## 📋 Example Output

```
❌ CSS Variable Linting Issues Found in Staged Files:

📁 express/code/features/table-of-contents-seo/table-of-contents-seo.css:110
   Found: main .toc-content a { padding: 8px 16px; }
   Replace:
     8px → var(--spacing-100)
     16px → var(--spacing-300)

📁 express/code/features/table-of-contents-seo/table-of-contents-seo.css:144
   Found: .toc-container { background: #ffffff; }
   Use: var(--color-white)

Total issues: 2

💡 Update these hardcoded colors and spacing to use CSS variables from :root

🔄 Applying fixes...
✅ Fixes applied. Please re-stage your files.
```

## 📁 Files Added/Modified

### New Files
- `scripts/lint-css-vars.js` - Main linting script with auto-fix capability
- `.husky/pre-commit` - Pre-commit hook configuration

### Modified Files
- `package.json` - Added lint scripts:
  - `lint:css-vars` - Check for violations
  - `lint:css-vars:fix` - Auto-fix violations

## 🎯 Benefits

### Consistency
- Ensures all colors and spacing use design system variables
- Prevents inconsistent hardcoded values across the codebase
- Maintains visual consistency across components

### Maintainability
- Makes theme changes easier by centralizing values in `:root`
- Reduces manual search-and-replace when updating design tokens
- Provides clear audit trail of design system usage

### Quality Gate
- Prevents hardcoded values from reaching production
- Catches violations early in the development process
- Ensures design system compliance

### Developer Experience
- Clear, actionable feedback with exact file locations
- Auto-fix capability reduces manual work
- Pre-commit enforcement prevents forgotten fixes

## 🔧 Technical Details

### Supported CSS Variables
- **Colors**: All `--color-*` variables from `express/code/styles/styles.css`
- **Spacing**: All `--spacing-*` variables from `express/code/styles/styles.css`

### Supported Properties
- **Colors**: `color`, `background-color`, `border-color`, `fill`, `stroke`, `background`, `border`
- **Spacing**: `margin`, `padding`, `gap`, `top`, `right`, `bottom`, `left`, `width`, `height`, `min-width`, `max-width`, `min-height`, `max-height`

### Smart Matching
- **Hex normalization**: `#fff` ↔ `#ffffff` ↔ `#FFF`
- **Case insensitive**: Handles mixed case variations
- **Whitespace handling**: Trims and normalizes spacing
- **Complex values**: Extracts colors from `background: #fff url(image.png) no-repeat;`

## 🚨 Breaking Changes
None - this is an additive feature that only affects the development workflow.

## 🧪 Testing
The linter has been tested with:
- Various color formats (hex, rgb, rgba, hsl, named colors)
- Shorthand and longhand CSS properties
- Multiple values in single properties
- Edge cases like whitespace and case variations

## 📝 Migration Notes
- Existing code will continue to work normally
- The linter only affects new commits
- Use `npm run lint:css-vars:fix` to automatically fix existing violations
- No manual migration required

---

This linter ensures our CSS follows the design system consistently and makes theme changes easier to manage across the entire codebase. 
