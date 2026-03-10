# Blog Feature Marquee

## Overview
- Renders a hero-style block showing curated blog content with a content column on the left and an autoplaying carousel on the right.
- Pulls featured articles from `/express/learn/blog/query-index.json`, trims titles via `cleanTitle`, and formats dates based on the site locale.
- Each card promotes a post with an `h2` title, teaser, author/avatar row, and a “Featured” badge over the hero image.

## Authoring Model
- Row 1: Eyebrow/headline/subcopy content. Optional logo injection is controlled by the `marquee-inject-logo` metadata flag.
- Row 2: Either a featured article link (static mode) or tag text used to derive the fallback filter list.
- Row 3: Optional “View all” link.
- Remaining rows: two-column config table where the first column becomes the key (lower-cased, hyphen-separated) and the second column provides values or URLs.

## Configuration Keys
- `max`: caps the number of articles (defaults to 6).
- `featured`: overrides filtering to force a specific set of article URLs.
- `category` / `tag`: filters the query-index results.
- `auto-play-duration`: seconds before advancing the carousel; falls back to the `blog-feature-marquee-autoplay-duration` metadata value.
- `blog-feature-marquee-slider` metadata toggles slider behavior, while `marquee-inject-logo` decides whether to prepend the Express logo.

## Slider Behavior
- Cards are rendered once, layered in a dissolve carousel controlled by `blog-feature-carousel.js`.
- The controller ensures only the active card is tabbable, pauses autoplay on hover/focus, and exposes prev/next/pause controls plus dot indicators.
- View-all link receives an inline caret icon via `buildViewAllNode`.

## Accessibility & Styling
- `createTag` helper guarantees semantic elements; titles use `h2` for a consistent heading hierarchy.
- Focus states live on both the link wrapper and inner button role, with autoplay pausing on user interaction.
- Visual tokens (colors, spacing, radii) are defined in `express/code/styles/styles.css` under the `--blog-feature-marquee-*` namespace for easier theming.
