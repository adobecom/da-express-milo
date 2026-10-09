# Simple Marquee

## Overview

`simple-marquee` provides the headline, body-copy, branding-logo, and CTA layout of `grid-marquee` without its card grid, drawers, ratings, or app-store logic.

## Authoring

The required first row contains a heading, optional body copy, and up to two CTA links. An optional media-only row becomes the block background.

| simple-marquee |
| --- |
| # The quick and easy create-anything app. <br> Make stunning social posts, images, videos, flyers, and more. <br> [Start free trial](#) [Get Adobe Express](#) |
| ![background](media.png) |

The first link is the primary CTA. The second link is the outlined secondary CTA. CTAs remain visible on mobile. Add the `keep-cta-mobile` variant when the CTA must also remain visible if its URL matches the page's floating CTA.

## Variants

Variants may be combined:

- `left-aligned` / `start-aligned` — logically start-aligns the logo, content, and CTAs.
- `right-aligned` / `end-aligned` — logically end-aligns the logo, content, and CTAs for localized layouts.
- `dark` — uses light text, the white Adobe Express logo, and the white outlined secondary CTA.
- `secondary-cta-link` — renders the secondary CTA as an underlined text link.
- `premium-cta` — applies the shared premium gradient and interaction states to the primary CTA.
- `keep-cta-mobile` — keeps a CTA visible on mobile when the shared floating-CTA behavior would otherwise hide a duplicate link.

A single authored link naturally renders the single-CTA variant.

## Branding logo

A branding logo is always injected above the heading:

- `inject-branding-logo` injects the named icon.
- `marquee-inject-acrobat-logo` set to `on` or `yes` injects `cobrand-lockup-acrobat-express` at the 214px design width.
- Otherwise the block injects `adobe-express-logo`, or `adobe-express-logo-white` for the `dark` variant.
