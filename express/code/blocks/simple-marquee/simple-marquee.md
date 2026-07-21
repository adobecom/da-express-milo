# Simple Marquee

## Overview
- Renders the headline/body-copy/CTA marquee layout of `grid-marquee` **without** the interactive card grid, drawers, ratings, or app-store logic.
- Provides authoring teams a dedicated, clearly-named block for the content-only marquee layout they were previously mis-authoring `grid-marquee` for.
- Centered layout with a branding logo, a heading, body copy, and 1-2 CTA buttons over an optional background/media image.

## Authoring Model
The block is a single-column table named `simple-marquee`.

- **Content row** (required): holds the marquee copy in this order:
  - Heading — `h1`–`h6`.
  - Body copy — one or more paragraphs.
  - CTAs — 1-2 links in a trailing paragraph. The first link becomes the `primaryCTA`; the wrapping paragraph becomes `.ctas`.
- **Media row** (optional): a row whose only content is a `picture`/`img`/`video` (no heading). It becomes the `.background`; its images are lazy-loaded.

### Example

| simple-marquee |
| --- |
| # The quick and easy create-anything app. <br> Make stunning social posts, images, videos, flyers, and more. <br> [Start free trial](#) [Get Adobe Express](#) |
| ![background](media.png) |

## Logo Injection
A branding logo is always injected above the heading, matching the `grid-marquee` contract:
- `inject-branding-logo` metadata — injects the named icon (e.g. `adobe-express-logo`, `cobrand-lockup-acrobat-express`).
- `marquee-inject-acrobat-logo` (`on`/`yes`) — injects `cobrand-lockup-acrobat-express`.
- Otherwise the default `adobe-express-logo` is injected.

## Styling
- All selectors are scoped under `.simple-marquee`.
- Reuses shared design tokens (`--heading-font-size-*`, `--spacing-*`, `--body-font-size-l`, `--color-black`, etc.).
- Responsive at the shared `768px` (tablet) and `1280px` (desktop) breakpoints, matching sibling marquee blocks.

## Non-goals
- Does not render a card grid, drawers, ratings, or app-store links.
- Does not migrate existing `grid-marquee` authored content.
