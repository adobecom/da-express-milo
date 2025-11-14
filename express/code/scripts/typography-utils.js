/**
 * Express Typography Utilities
 *
 * Utility functions for working with the Express typography system (ax- namespace)
 * and migrating from the Milo typography system.
 */

/**
 * Check if a class is an Express typography class
 * @param {string} className - The class name to check
 * @returns {boolean} - True if it's an Express typography class
 */
export function isExpressTypographyClass(className) {
  return /^ax-(heading|body|detail)-(xxxl|xxl|xl|l|m|s|xs|xxs)(-bold)?$/.test(className);
}

/**
 * Check if a class is a Milo typography class
 * @param {string} className - The class name to check
 * @returns {boolean} - True if it's a Milo typography class
 */
export function isMiloTypographyClass(className) {
  return /^(heading|body|detail)-(xxxl|xxl|xl|l|m|s|xs|xxs)$/.test(className);
}

// Note: List functions removed - they were confusing and not needed for the core authoring workflow

/**
 * Process typography options for blocks - handles both Milo and Express typography
 * This function should be called after splitAndAddVariantsWithDash() in block initialization
 * @param {HTMLElement} block - The block element to process
 * @param {string} selector - CSS selector for elements to apply typography to
 * (default: 'h1, h2, h3, h4, h5, h6')
 */
export function processBlockTypography(
  block,
  selector = 'h1, h2, h3, h4, h5, h6',
) {
  const elements = block.querySelectorAll(selector);

  // Check for typography options in block classes
  const typographyOptions = Array.from(block.classList).filter(
    (cls) => isMiloTypographyClass(cls) || isExpressTypographyClass(cls),
  );

  if (typographyOptions.length === 0) return;

  // Process each typography option
  typographyOptions.forEach((option) => {
    if (isExpressTypographyClass(option)) {
      // Express typography - apply directly
      elements.forEach((el) => {
        el.classList.add(option);
      });
    } else if (isMiloTypographyClass(option)) {
      // Milo typography - apply directly (maintains existing behavior)
      elements.forEach((el) => {
        el.classList.add(option);
      });
    }
  });
}

/**
 * Enhanced version of splitAndAddVariantsWithDash that handles typography options
 * This should be used instead of the original function for blocks that support typography
 * @param {HTMLElement} block - The block element to process
 * @param {string} selector - CSS selector for elements to apply typography to
 * (default: 'h1, h2, h3, h4, h5, h6')
 */
export function splitAndAddVariantsWithTypography(
  block,
  selector = 'h1, h2, h3, h4, h5, h6',
) {
  // First, do the standard variant splitting
  const extra = [];
  block.classList.forEach((className, index) => {
    if (index === 0) return; // block name, no split
    const split = className.split('-');
    if (split.length > 1) {
      split.forEach((part) => {
        extra.push(part);
      });
    }
  });
  block.classList.add(...extra);

  // Then process typography options
  processBlockTypography(block, selector);
}

/**
 * Check if a class is a typography option (either Milo or Express)
 * @param {string} className - The class name to check
 * @returns {boolean} - True if it's a typography class
 */
export function isTypographyClass(className) {
  return isMiloTypographyClass(className) || isExpressTypographyClass(className);
}

/**
 * Get the typography system from a class name
 * @param {string} className - The typography class name
 * @returns {string|null} - 'milo', 'express', or null if not a typography class
 */
export function getTypographySystem(className) {
  if (isMiloTypographyClass(className)) return 'milo';
  if (isExpressTypographyClass(className)) return 'express';
  return null;
}

// Note: Conversion functions removed - they were confusing and not needed
// for the core authoring workflow
