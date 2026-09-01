/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

// Shared quote-column measurement for both mini-editor export paths (Express hand-off and the
// download/copy image). Lives outside mini-editor-card-renderer.js so that file stays DOM-free and
// worker-safe (the export worker imports the renderer).

import { MINI_EDITOR_EXPORT_WIDTH, QUOTE_MAX_WIDTH } from './mini-editor-card-renderer.js';

// The card is designed at CARD_DESIGN_WIDTH (`.mini-editor-widget` max-width in
// mini-editor-widget.css); the export canvas is 2x that (MINI_EDITOR_EXPORT_WIDTH).
const CARD_DESIGN_WIDTH = 542;

// The quote box hugs its text up to a fixed max-width with a fixed-px font (`.me-quote-wrap` in
// mini-editor-widget.css), so its width is in the card's design px and varies per quote. Locate the
// visible quote text (desktop `.me-quote`; mobile/tablet the arc-carousel centre's `.me-arc-quote`)
// and measure its wrapping BOX (`.me-quote-wrap`) — not the tight text — so the box's padding gives
// the render slack; otherwise a line that just fits on the card overflows when it's re-wrapped with
// slightly different font metrics. Scale by the fixed export/design factor. Falls back to
// QUOTE_MAX_WIDTH when nothing is measurable (e.g. before render, or in tests without a DOM card).
export default function measureQuoteExportWidth() {
  const arcQuote = document
    .getElementsByClassName('me-arc-card--center')[0]
    ?.getElementsByClassName('me-arc-quote')[0];
  const quoteEl = arcQuote?.clientWidth > 0
    ? arcQuote
    : document.getElementsByClassName('me-quote')[0];
  const box = quoteEl?.closest('.me-quote-wrap');
  const boxWidth = box ? box.getBoundingClientRect().width : 0;
  if (boxWidth > 0) {
    return Math.round((boxWidth * MINI_EDITOR_EXPORT_WIDTH) / CARD_DESIGN_WIDTH);
  }
  return QUOTE_MAX_WIDTH;
}
