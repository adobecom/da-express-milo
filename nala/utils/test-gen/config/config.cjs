// utils/test-gen/config/config.cjs
// Nala Test Generator Configuration
// Defines project paths, defaults, selectors, and tag conventions

const path = require('path');

module.exports = {
  // Project metadata and directory paths
  project: {
    name: 'express',
    rootDir: process.cwd(),
    blocksDir: path.join(process.cwd(), 'nala', 'blocks'),
    libsDir: path.join(process.cwd(), 'nala', 'libs'),
  },
  // Default settings for test generation
  defaults: {
    testExt: 'cjs',
    isESM: false,
    accessibilityLib: 'accessibility.cjs',
    seoLib: 'seo-check.cjs',
    enableAccessibilityTests: true,
    enableSeoTests: true,
  },

  // DOM selectors for block parsing and element detection
  selectors: {
    blockLocator: 'main div.section div[data-block-status="loaded"], div[data-block-status="loaded"]',
    parentContext: '.text, .content-wrapper, .container, .foreground, .body',

    textElements: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'li', 'span', 'strong', 'em',
      'div[class*="faq-answer"]', 'div[class*="accordion-answer"]',
      'label.cta-card-text', 'label.subtext', '.head-cnt',
      'div[class*="card-explain"]',
    ],

    mediaElements: ['img', 'video', 'svg', 'picture'],

    interactiveElements: [
      'a[href]', 'button', 'input', 'select', 'textarea',
      '[role="button"]', '[role="tab"]', '[role="switch"]', '[tabindex]', 'video[controls]',
      '.carousel-arrow', '.carousel-left-trigger', '.carousel-right-trigger',
      '.video-play-button', '.video-overlay-play-button', '.reduce-motion-wrapper',
    ],

    hiddenOrIgnoredElements: [
      '.hide', '.isHidden', '.hidden', '.inactive', '.offscreen', '.visually-hidden',
      '.aem-hide', '.cmp-hidden', '.suppressed-billing-toggle',
      '[aria-hidden="true"]', '[data-hidden="true"]',
      '[aria-checked="false"]', '[style*="display:none"]', '[style*="visibility:hidden"]',
    ],
  },

  // Tagging convention for test and block metadata
  tags: {
    projectTag: '@express',
  },
};
