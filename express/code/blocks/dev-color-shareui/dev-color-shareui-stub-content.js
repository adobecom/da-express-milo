/**
 * Dev-only: tall stub content for modal shell testing (test entry point).
 * Same classes as shell contract (ax-color-modal-stub-*). Not for prod — lives with dev block.
 */
import { createTag } from '../../scripts/utils.js';

/**
 * Creates tall placeholder content so the modal content slot scrolls.
 * @param {Object} [opts] Optional.
 * @param {number} [opts.listItems=12] Number of list items.
 * @param {number} [opts.strips=0] Number of extra strip divs.
 * @returns {HTMLElement}
 */
export function createModalStubContent(opts = {}) {
  const { listItems = 12, strips = 0 } = opts;
  const wrap = createTag('div', { class: 'ax-color-modal-stub-content' });
  const title = createTag('h3', { class: 'ax-color-modal-stub-title' });
  title.textContent = 'Content stub (shell adjusts)';
  wrap.appendChild(title);

  const intro = createTag('p', { class: 'ax-color-modal-stub-intro' });
  intro.textContent = 'This stub is taller than the slot so the shell shows a scrollable area. Per Figma: desktop 898×604; content slot fills remaining height and scrolls when content overflows.';
  wrap.appendChild(intro);

  const list = createTag('ol', { class: 'ax-color-modal-stub-list' });
  for (let i = 1; i <= listItems; i += 1) {
    const li = createTag('li');
    li.textContent = `Stub item ${i}: placeholder to force vertical scroll in the modal content slot.`;
    list.appendChild(li);
  }
  wrap.appendChild(list);

  for (let s = 0; s < strips; s += 1) {
    const strip = createTag('div', { class: 'ax-color-modal-stub-strip' });
    strip.textContent = `Strip ${s + 1}`;
    strip.style.minHeight = '80px';
    wrap.appendChild(strip);
  }

  return wrap;
}
