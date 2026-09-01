/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

// Shared quote-column measurement for both mini-editor export paths (Express hand-off and the
// download/copy image). Lives outside mini-editor-card-renderer.js so that file stays DOM-free and
// worker-safe (the export worker imports the renderer).

import { QUOTE_FONT_SIZE, QUOTE_MAX_WIDTH } from './mini-editor-card-renderer.js';

// The quote box (`.me-quote-wrap`) hugs its text up to a fixed max-width, and the card renders at
// different sizes per breakpoint (~20px font/~322px box on desktop, ~18px/narrower on the arc
// carousel). Read the visible quote's box and rendered font size (desktop `.me-quote`; mobile the
// arc `.me-arc-quote`) and scale the box to keep the same chars per line at the export font size:
// box * (QUOTE_FONT_SIZE / displayFontSize). A fixed design-width factor only held on desktop.
// Falls back to QUOTE_MAX_WIDTH when nothing is measurable (before render or in tests).
export default function measureQuoteExportWidth() {
  const arcQuote = document
    .getElementsByClassName('me-arc-card--center')[0]
    ?.getElementsByClassName('me-arc-quote')[0];
  const quoteEl = arcQuote?.clientWidth > 0
    ? arcQuote
    : document.getElementsByClassName('me-quote')[0];
  const box = quoteEl?.closest('.me-quote-wrap');
  if (!box) {
    return QUOTE_MAX_WIDTH;
  }
  const fontSize = parseFloat(getComputedStyle(quoteEl).fontSize);
  const boxWidth = box.offsetWidth;
  if (boxWidth > 0 && fontSize > 0) {
    return Math.round((boxWidth * QUOTE_FONT_SIZE) / fontSize);
  }
  return QUOTE_MAX_WIDTH;
}
