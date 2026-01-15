# Color Tools Authoring Guide

This document explains how to place the new wheel‑palette marquee experience inside AEM Franklin pages and how we plan to extend it for future layouts.

## 1. Block Invocation

```
| Color Tools (wheel-palette-marquee) |
| Hero Eyebrow: Adobe Express         |
| Hero Title: Create a color palette  |
| Hero Body: Use the color wheel...   |
| Primary CTA Label: Start creating   |
| Primary CTA URL: /create/color-wheel|
| Secondary CTA Label: Watch tutorial |
| Default Tab: image                  |
```

1. Add the **Color Tools** block to a new section.
2. Set the variation to `wheel-palette-marquee` to load the curated hero + workspace layout.
3. Author-facing metadata (shown above) is optional; defaults match the current design.

## 2. Section Metadata & Options

| Metadata key | Description | Default |
| --- | --- | --- |
| `Hero Eyebrow` | Small label above the title | `Adobe Express` |
| `Hero Title` | Main H1/H2 copy | `Create a color palette` |
| `Hero Body` | Supporting paragraph | Predefined marketing copy |
| `Primary CTA Label` / `Primary CTA URL` | Filled button. Omit URL to hide | `Start creating` / `#` |
| `Secondary CTA Label` | Ghost button text; omit to hide | `Watch tutorial` |
| `Default Tab` | Which tab opens first (`wheel`, `image`, `base`) | `wheel` (or driven by ?color-tools-tab=) |

Future metadata fields (planned):

- `Hero Media` – inject custom imagery/video next to the workspace.
- `Quick Actions` – JSON array of CTA chips rendered under the tabs.
- `Analytics Channel` – string appended to tab-change events.

## 3. URL & Analytics Behavior

- **Deep Linking**: The block reads `?color-tools-tab=<id>` on load to activate a specific tab (e.g., `image`, `base`). Tab switching updates this parameter without reloading.
- **Analytics Hooks**:
  - `express:color-tools-action` events fire on key interactions (tab switch, wheel move, rule change).
  - Payload includes `{ action, tab, workflow: 'color-tools', timestamp }`.

## 4. Component Reuse

- **Styling**: Block CSS (`color-tools.css`) handles layout. Web components (`color-wheel`, `color-palette`) are encapsulated.
- **Controller**: `ColorThemeController` manages state (swatches, harmony rules) and syncs across all views (wheel, image, base).
- **Persistance**: Theme state is saved to `localStorage` automatically, preserving the palette across reloads.
