/**
 * Attach Spectrum tooltips to buttons inside color-swatch-rail (shadow DOM).
 * Use explicit content from aria-label so analytics cannot overwrite tooltip text.
 * @param {HTMLElement} container - Root that contains color-swatch-rail(s)
 * @param {Array<() => void>} tooltipDestroys - Push destroy callbacks here
 */

import { createExpressTooltip } from '../spectrum/components/express-tooltip.js';

export async function initTooltipsForColorSwatchRail(container, tooltipDestroys) {
  const rails = container.querySelectorAll?.('color-swatch-rail') || [];
  for (const rail of rails) {
    const root = rail.shadowRoot;
    if (!root) continue;
    const buttons = root.querySelectorAll?.('button[aria-label]') || [];
    for (const btn of buttons) {
      const content = (btn.getAttribute('aria-label') || '').trim();
      if (!content) continue;
      /* Remove existing express tooltip wrappers so we never double-attach. */
      btn.querySelectorAll?.('sp-theme').forEach((el) => el.remove());
      try {
        const tip = await createExpressTooltip({ targetEl: btn, content, placement: 'top' });
        tooltipDestroys.push(() => tip.destroy());
      } catch {
        // ignore per-button failures
      }
    }
  }
}
