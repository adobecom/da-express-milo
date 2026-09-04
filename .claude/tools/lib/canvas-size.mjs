/**
 * Given two images' {width, height}, compute the shared canvas size used to
 * pad (never stretch) both onto before diffing. Pure math, no image IO —
 * see compare-branches.mjs's diffImages() for why padding beats resizing:
 * stretching a shorter capture to a taller one's height shears every row
 * below the first divergence into a meaningless, huge mismatch %.
 */
export function computeCanvasSize(a, b) {
  return {
    width: Math.max(a.width, b.width),
    height: Math.max(a.height, b.height),
    heightDelta: Math.abs(a.height - b.height),
  };
}
