// Apply a per-character transform function to an entire string.
// Uses spread to correctly handle multi-codepoint characters (emoji, supplementary planes).
export function applyTransform(text, transform) {
  return [...text].map(transform).join('');
}
