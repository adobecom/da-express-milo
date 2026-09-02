/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

// Opens the Adobe Express web app (project-x) with a new design that reproduces
// the mini-editor card: a sized canvas, the template background, and the styled
// quote + author. Mirrors the "open Express from color pages" flow in
// ../../color-shared/toolbar/createToolbarComponent.js.
//
// The Express side is the `@hz/x-acom-mini-editor-entry` feature, which reads:
//   referrer=express-mini-editor            (activation allow-list)
//   feature-enable=acom-mini-editor-entry   (enables the hz feature flag)
//   miniEditor=<base64url(JSON)>            (background URN + quote + author + font)
//   width/height/unit                       (blank-canvas size, consumed by /new)

import {
  MINI_EDITOR_EXPORT_WIDTH,
  MINI_EDITOR_EXPORT_HEIGHT,
  QUOTE_MAX_WIDTH,
  QUOTE_FONT_SIZE,
  QUOTE_LINE_HEIGHT,
  AUTHOR_FONT_SIZE,
  AUTHOR_BOTTOM,
  AUTHOR_LINE_HEIGHT,
} from '../../utils/mini-editor-card-renderer.js';
import measureQuoteExportWidth from '../../utils/mini-editor-quote-width.js';

// The card layout in the full-res canvas's coordinates (canvasW x canvasH = the background's native
// size). Express creates a canvas that size and scales the layout to it 1:1. Text scales uniformly
// with canvas height (the renderer constants are the 1084x700 design basis); `quoteWidth` is the
// live card's measured column, already scaled to this canvas. Boxes are top-left based: quote
// column centred vertically, author near the bottom. `height` is nominal (Express auto-heights).
function buildCardLayout(quoteWidth, canvasWidth, canvasHeight) {
  const scale = canvasHeight / MINI_EDITOR_EXPORT_HEIGHT;
  const authorWidth = QUOTE_MAX_WIDTH * scale;
  return {
    width: canvasWidth,
    height: canvasHeight,
    quote: {
      x: (canvasWidth - quoteWidth) / 2,
      y: Math.round(canvasHeight / 2 - QUOTE_LINE_HEIGHT * scale),
      width: quoteWidth,
      height: QUOTE_LINE_HEIGHT * 2 * scale,
      fontSize: QUOTE_FONT_SIZE * scale,
    },
    author: {
      x: (canvasWidth - authorWidth) / 2,
      // hz sets this as the auto-height frame's TOP. That frame is line-height (not font-size) tall
      // and centres the glyph, so anchor by the glyph centre — its visual bottom then sits
      // AUTHOR_BOTTOM from the canvas edge like the download. Using AUTHOR_FONT_SIZE alone left the
      // taller frame (and text) sitting too low on hz.
      y: canvasHeight - (AUTHOR_BOTTOM + (AUTHOR_LINE_HEIGHT + AUTHOR_FONT_SIZE) / 2) * scale,
      width: authorWidth,
      height: (AUTHOR_FONT_SIZE + 8) * scale,
      fontSize: AUTHOR_FONT_SIZE * scale,
    },
  };
}

const LOCAL_BASE_URL = 'https://localhost.adobe.com:8080/new';
const STAGE_BASE_URL = 'https://stage.projectx.corp.adobe.com/new';
const PROD_BASE_URL = 'https://adobesparkpost.app.link/JpBOBeJz35b';
const REFERRER = 'express-mini-editor';
const FEATURE_FLAG = 'acom-mini-editor-entry';
const CANVAS_UNIT = 'px';

// Hosts a ?base= override may point at for non-prod testing: local dev, prenv, and stage.
function isAllowedTestHost(hostname) {
  return hostname === 'localhost.adobe.com'
    || hostname === 'stage.projectx.corp.adobe.com'
    || hostname.endsWith('.prenv.projectx.corp.adobe.com');
}

// Non-prod base selection, mirroring the color flow's ?hzenv / ?base pattern but also covering
// local dev (localhost.adobe.com:8080) and prenv. An explicit ?base= is honoured only when its
// host is allow-listed (so a stray param can't retarget the CTA); otherwise the per-hzenv default
// is used — LOCAL for `?hzenv=local`, STAGE for `?hzenv=stage`.
function getTestBaseUrl(hzenv, base) {
  if (base) {
    try {
      if (isAllowedTestHost(new URL(base).hostname)) return base;
    } catch { /* malformed base — fall through to the hzenv default */ }
  }
  return hzenv === 'local' ? LOCAL_BASE_URL : STAGE_BASE_URL;
}

const GENERIC_FONT_FAMILIES = new Set([
  'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy',
  'system-ui', 'ui-sans-serif', 'ui-serif',
]);

// The widget stores font.family as a CSS font stack (e.g. `"lobster", var(--body-font-family,
// sans-serif)`) because it needs that to render the DOM. Express only wants the concrete family
// name, so send just that — not the quotes, the `var(...)` fallback, or generic keywords.
function primaryFontFamily(cssFamily) {
  return (cssFamily || '')
    .split(',')
    .map((segment) => segment.trim().replace(/^['"]+|['"]+$/g, '').trim())
    .find((name) => name
      && !name.includes('(')
      && !name.includes(')')
      && !GENERIC_FONT_FAMILIES.has(name.toLowerCase())) || '';
}

// Unicode- and URL-safe base64 (base64url). encodeURIComponent+unescape makes the
// JSON UTF-8-clean (quotes carry curly quotes / accents); the +/=/ replacements
// stop the payload from colliding with query-string '+'→space decoding on the
// Express side. Decoder (hz) reverses these exact steps.
function encodePayload(payload) {
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function buildExpressUrl(model, prodBaseUrl = PROD_BASE_URL) {
  const { getTrackingAppendedURL } = await import('../../branchlinks.js');

  const params = new URLSearchParams(window.location.search);
  const hzenv = params.get('hzenv');
  const baseUrl = hzenv === 'local' || hzenv === 'stage'
    ? getTestBaseUrl(hzenv, params.get('base'))
    : prodBaseUrl;

  // Attribution params only (placement) — not isSearchOverride, which would
  // inject category=templates and its own width/height. Our params are set
  // afterwards so they win over anything getTrackingAppendedURL appended.
  const url = new URL(await getTrackingAppendedURL(baseUrl, { placement: 'mini-editor' }));

  // Reproduce the card's text contrast: a dark background (or unknown) gets light text,
  // a light background gets dark text — matching the widget's light-mode/dark-mode CSS.
  const isLight = model.mode === 'light';
  const quoteColor = isLight ? '#131313' : '#FFFFFF';
  const authorColor = isLight ? '#505050' : '#E6E6E6';

  // Express creates the canvas at the background's native full-res size; the layout scales to it.
  // The measured quote column is in the design (40px-font) basis, so scale it by the height factor.
  const canvasWidth = model.backgroundWidth || MINI_EDITOR_EXPORT_WIDTH;
  const canvasHeight = model.backgroundHeight || MINI_EDITOR_EXPORT_HEIGHT;
  const scale = canvasHeight / MINI_EDITOR_EXPORT_HEIGHT;
  const quoteWidth = Math.round(measureQuoteExportWidth() * scale);

  const payload = {
    // URN is carried for provenance/analytics; backgroundUrl is what Express fetches — the full-res
    // rendition (a bare public template URN isn't dereferenceable on the hz side).
    backgroundUrn: model.backgroundUrn || '',
    backgroundUrl: model.backgroundFullUrl || model.backgroundUrl || '',
    quote: model.quote || '',
    author: model.author || '',
    quoteColor,
    authorColor,
    font: {
      family: primaryFontFamily(model.font?.family) || 'sans-serif',
      style: model.font?.style || 'normal',
      weight: model.font?.weight || 'normal',
      stretch: model.font?.stretch || 'normal',
    },
    // Full-res-canvas layout; Express scales it to the canvas it creates (1:1). The quote column is
    // measured from the live card so the reproduction matches this quote's actual box.
    layout: buildCardLayout(quoteWidth, canvasWidth, canvasHeight),
  };

  url.searchParams.set('referrer', REFERRER);
  url.searchParams.set('feature-enable', FEATURE_FLAG);
  url.searchParams.set('miniEditor', encodePayload(payload));
  url.searchParams.set('width', String(canvasWidth));
  url.searchParams.set('height', String(canvasHeight));
  url.searchParams.set('unit', CANVAS_UNIT);

  return url.toString();
}

export async function openInExpress(model, prodBaseUrl) {
  window.open(await buildExpressUrl(model, prodBaseUrl), '_blank', 'noopener,noreferrer');
}
