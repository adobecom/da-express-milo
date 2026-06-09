# Design Tokens Reference

Express design tokens live in `express/code/styles/styles.css`.
They are defined as CSS custom properties on `:root` and are the
**single source of truth** for the design system.

---

## Token mapping workflow

When building a block from Figma:

1. **Extract the raw value** from the Figma frame (colour, spacing,
   font size, etc.).
2. **Search `express/code/styles/styles.css`** for a CSS variable whose
   value matches (or is very close to) the Figma value.
3. **Use the variable** in your block CSS.  Never hardcode a value when
   a matching token exists.
4. If no matching token exists, hardcode the value **and** leave a
   comment explaining why:
   ```css
   /* No token for this 6px radius — verify with design */
   border-radius: 6px;
   ```

---

## Colour tokens

Colours are prefixed `--color-*` or use descriptive names:

```css
--color-white: #fff;
--color-black: #000;
--color-gray-100 through --color-gray-950   /* neutrals */
--color-info-accent: #5c5ce0;               /* primary accent (indigo) */
--color-info-accent-hover / -down / -reverse
--color-info-primary: #242424;              /* primary button */
--color-info-secondary: #e8e8e8;            /* secondary button */
--color-info-premium: #ebcf2d;              /* premium/gold */
--color-blue-600: #0066CC;
--color-focus-ring-strong: #4B75FF;
--text-color-secondary: #6e6e6e;
--color-brand-title: #000b1d;
--gradient-highlight-vertical / -horizontal / -diagonal
```

Always match Figma hex/rgb values against these tokens before
hardcoding a colour.

---

## Font families

Font families are referenced by these two variables only:

| Variable | Usage |
|----------|-------|
| `--body-font-family` | Body copy, paragraphs, labels, captions — most text. Value: `'adobe-clean', 'Adobe Clean', 'adobe-clean-fallback', sans-serif` |

Headings do not have a separate font-family variable in Express —
they use `--body-font-family` with heavier font weights.  Use
`--heading-font-weight` (800) or `--heading-font-weight-extra` (900)
to style heading elements.

---

## Typography tokens

Font sizes follow a named scale. Do not hardcode `rem` or `px`
values when a token exists.

### Body

```css
--body-font-size-xxl: 1.5rem
--body-font-size-xl:  1.25rem
--body-font-size-l:   1.125rem
--body-font-size-m:   1rem        ← base body
--body-font-size-s:   0.875rem
--body-font-size-xs:  0.75rem
```

### Headings

```css
--heading-font-size-xxxl: 5rem
--heading-font-size-xxl:  3.75rem
--heading-font-size-xl:   2.8125rem
--heading-font-size-l:    2.25rem
--heading-font-size-ml:   2rem
--heading-font-size-m:    1.75rem
--heading-font-size-s:    1.375rem
--heading-font-size-xs:   1.25rem
```

### Font weights

```css
--heading-font-weight:         800   ← standard heading weight
--heading-font-weight-medium:  700
--heading-font-weight-regular: 400
--heading-font-weight-extra:   900
--body-font-weight:            normal
```

---

## Spacing tokens

Spacing follows a numeric scale (the number approximates pixels at 1rem = 16px):

```css
--spacing-0:    0px
--spacing-50:   2px
--spacing-75:   4px
--spacing-80:   6px
--spacing-100:  8px
--spacing-200:  12px
--spacing-250:  14px
--spacing-300:  16px    ← base unit
--spacing-325:  18px
--spacing-350:  20px
--spacing-400:  24px
--spacing-500:  32px
--spacing-600:  40px
--spacing-700:  48px
--spacing-800:  64px
--spacing-900:  80px
--spacing-1000: 96px
```

Map every Figma spacing value to the closest token.  If the value
falls exactly between two tokens, prefer the one that matches the
Figma spec and leave a comment.

---

## Responsive behaviour

Unlike some token systems, Express spacing and font tokens do **not**
change values automatically per breakpoint in the token layer.
When Figma shows different sizes at different viewports, use media
queries in the block CSS to switch token references:

```css
.my-block .heading {
  font-size: var(--heading-font-size-m);
}

@media (width >= 768px) {
  .my-block .heading {
    font-size: var(--heading-font-size-l);
  }
}
```

---

## Checklist before submitting block CSS

- [ ] Every colour value maps to a `--color-*` / `--gradient-*` token or has a comment.
- [ ] Every spacing value maps to a `--spacing-*` token or has a comment.
- [ ] Every font-size maps to a `--body-font-size-*` or `--heading-font-size-*` token.
- [ ] Font families use only `--body-font-family`.
- [ ] Font weights use the `--heading-font-weight-*` or `--body-font-weight` variables.
- [ ] No hardcoded hex/rgb values or pixel measurements without a comment.
