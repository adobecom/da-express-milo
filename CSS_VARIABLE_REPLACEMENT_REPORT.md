# CSS Variable Replacement Report

## Summary
This report documents hardcoded CSS values in block files that have been identified as exact matches for CSS variables defined in `styles.css`.

## Completed Files (9)
1. ✅ `express/code/blocks/cards/cards.css` - 20+ replacements
2. ✅ `express/code/blocks/steps/steps.css` - 8+ replacements  
3. ✅ `express/code/blocks/list/list.css` - 4+ replacements
4. ✅ `express/code/blocks/logo-row/logo-row.css` - 9+ replacements
5. ✅ `express/code/blocks/banner/banner.css` - 11+ replacements
6. ✅ `express/code/blocks/floating-buttons/floating-buttons.css` - 3+ replacements
7. ✅ `express/code/blocks/faq/faq.css` - 8+ replacements
8. ✅ `express/code/blocks/cta-cards/cta-cards.css` - 2+ replacements
9. ✅ `express/code/blocks/app-banner/app-banner.css` - 7+ replacements
10. ✅ `express/code/blocks/collapsible-card/collapsible-card.css` - 1+ replacement

**Total Replacements Made: 70+**

## CSS Variables Mapping (Exact Matches)

### Spacing Variables
| Hardcoded Value | CSS Variable | Occurrences Across All Blocks |
|----------------|--------------|------------------------------|
| ~~`0px`~~ | ~~`var(--spacing-0)`~~ | **CANCELLED - Keep as `0` or `0px`** |
| `2px` | `var(--spacing-50)` | 219 matches in 54 files |
| `4px` | `var(--spacing-75)` | 209 matches in 50 files |
| `6px` | `var(--spacing-80)` | TBD |
| `8px` | `var(--spacing-100)` | 327 matches in 58 files |
| `12px` | `var(--spacing-200)` | 199 matches in 49 files |
| `14px` | `var(--spacing-250)` | 88 matches in 35 files |
| `16px` | `var(--spacing-300)` | 315 matches in 53 files |
| `18px` | `var(--spacing-325)` | 101 matches in 27 files |
| `20px` | `var(--spacing-350)` | 217 matches in 59 files |
| `24px` | `var(--spacing-400)` | 181 matches in 46 files |
| `32px` | `var(--spacing-500)` | 95 matches in 29 files |
| `40px` | `var(--spacing-600)` | 124 matches in 43 files |
| `48px` | `var(--spacing-700)` | 33 matches in 17 files |
| `64px` | `var(--spacing-800)` | 14 matches in 10 files |
| `80px` | `var(--spacing-900)` | 47 matches in 26 files |
| `96px` | `var(--spacing-1000)` | 1 match in 1 file |

### Color Variables
| Hardcoded Value | CSS Variable | Files |
|----------------|--------------|-------|
| `#fff` or `#FFF` | `var(--color-white)` | 13 files |
| `#000` | `var(--color-black)` | 9 files |

### Border Radius Variables
| Hardcoded Value | CSS Variable | Occurrences |
|----------------|--------------|-------------|
| `10px` | `var(--border-radius-10)` | 207 matches in 57 files |

### Typography Variables (Exact Matches)
| Hardcoded Value | CSS Variable | Notes |
|----------------|--------------|-------|
| `22px` | `var(--ax-body-xl-size)` | Exact match for Express body XL |
| `28px` | `var(--ax-body-xxl-size)` or `var(--ax-heading-xl-size)` | Context dependent |
| `36px` | `var(--ax-heading-xxl-size)` | Desktop heading XXL |
| `44px` | `var(--ax-heading-xxxl-size)` | Mobile heading XXXL |
| `80px` | `var(--ax-heading-xxxl-size)` | Desktop heading XXXL (in @media) |

## Files with Most Opportunities (Remaining)

### High Priority (50+ matches)
1. `ax-columns.css` - Very large file (1876 lines)
2. `comparison-table-v2.css` - Multiple spacing values
3. `pricing-table.css` - Multiple spacing values
4. `interactive-marquee.css` - Multiple spacing values
5. `quotes.css` - 850+ lines, many spacing and color values
6. `blog-article-marquee.css` - 210 lines
7. `template-x.css` - Multiple spacing values

### Medium Priority (20-50 matches)
- `wayfinder.css`
- `tutorials.css`
- `toc-seo.css`
- `template-x-carousel.css`
- `template-list.css`
- `submit-email.css`
- `ratings.css`
- `pricing-cards.css`
- `pricing-cards-v2.css`
- `gen-ai-cards.css`
- `fullscreen-marquee.css`
- `discover-cards.css`
- `browse-by-category.css`

### Files with Color Replacements Needed
- `quotes.css` - #fff, #FFF, #000
- `simplified-pricing-cards.css` - #000
- `pricing-cards.css` - #000
- `pricing-cards-v2.css` - #000
- `pricing-cards-credits.css` - #000
- `tabs-ax.css` - #FFF, #000
- `template-x.css` - #FFF
- `template-promo.css` - #FFF
- `template-promo-carousel.css` - #FFF
- `mobile-fork-button-dismissable.css` - #FFF
- `grid-marquee.css` - #FFF
- `templates-as-a-service/library/src/App.css` - #fff, #000
- `templates-as-a-service/library/dist/templates-as-a-service.css` - #fff, #000

## Replacement Guidelines
**CRITICAL:** Only replace values that are EXACT matches:
- ✅ Replace `80px` with `var(--spacing-900)` (exact match)
- ✅ Replace `#fff`, `#FFF`, or `#FFFFFF` with `var(--color-white)` (exact match)
- ✅ Replace `#000`, or `#000000` with `var(--color-black)` (exact match)
- ❌ **DO NOT replace `0` or `0px` with variables** (per project decision - keep as-is)
- ❌ DO NOT replace `20px` with `var(--spacing-400)` (24px - not an exact match)
- ❌ DO NOT replace custom colors like `#00091B` with variables (no exact match)

## Estimated Total Remaining
- **Total exact-match replacements across all blocks: ~2000+**
- **Completed so far: ~70 (3.5%)**
- **Remaining: ~1930 (96.5%)**

## Next Steps
Continue systematic file-by-file replacements focusing on:
1. High-traffic blocks (most commonly used)
2. Large files with many opportunities
3. Files with color replacements (quick wins)
4. Complete remaining spacing value replacements

---
*Last Updated: [Current Session]*
*Report Generated: Automated analysis of all CSS files in express/code/blocks/*

