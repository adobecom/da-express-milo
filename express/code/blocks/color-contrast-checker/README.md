# contrast-checker

AEM block that renders an interactive WCAG contrast-ratio checker. Accepts two colors (foreground / background), computes contrast ratio and AA/AAA pass-fail results, and exposes a sticky floating toolbar for palette editing.

## Block config (authored rows)

| Key | Type | Default | Description |
|---|---|---|---|
| `variant` | string | `checker` | Renderer variant; currently only `checker` |
| `foreground` | hex string | `#1B1B1B` | Initial foreground color |
| `background` | hex string | `#FFFFFF` | Initial background color |
| `ctaText` | string | — | CTA label on the floating toolbar |
| `mobileCTAText` | string | — | Mobile CTA label |
| `showEdit` | boolean | `true` | Show edit controls in toolbar |
| `showPaletteName` | boolean | — | Show palette name in toolbar |
| `editPaletteName` | boolean | — | Allow editing palette name |
| `editPaletteLink` | string | — | Link for the edit palette action |

## Directory structure

```
contrast-checker/
  contrast-checker.js          block decorator
  contrast-checker.css         block styles
  factory/                     renderer factory / variant registry
  renderers/                   renderer implementations
  services/                    data, history, recommendation services
  utils/                       constants, utilities, placeholders
```

## Events

The renderer emits `contrast-change` with `{ foreground, background, ratio, normalAA, largeAA, normalAAA, largeAAA, uiComponents }` whenever either color changes.
