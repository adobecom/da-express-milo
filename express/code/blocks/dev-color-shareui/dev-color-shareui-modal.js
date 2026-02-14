/**
 * Dev-only: stub DOM for testing the modal shell.
 * Card-based launcher with hardcoded palette and gradient; click opens the modal.
 * All non-prod stub content lives here (to be deleted with the block).
 */
import { createTag } from '../../scripts/utils.js';
import { createModalManager } from '../../scripts/color-shared/modal/createModalManager.js';
import { createModalStubContent } from './dev-color-shareui-stub-content.js';

const HARDCODED_PALETTE = {
  name: 'Brand primaries',
  description: 'Use this modal to verify focus trap, Escape, close button, and backdrop click.',
  colors: ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#ca8a04'],
};

const HARDCODED_GRADIENT = {
  name: 'Sunset',
  description: 'Same shell behavior: focus trap, keyboard, accessible title. Vanilla CSS only.',
  type: 'linear',
  angle: 90,
  colorStops: [
    { color: '#ff7e5f', position: 0 },
    { color: '#feb47b', position: 0.5 },
    { color: '#2e3192', position: 1 },
  ],
};

/**
 * Fills the block with banner, copy, and clickable cards (palette, gradient, stub).
 * When options.append is true, appends a new launcher section without clearing (for multiple shareui per block).
 * @param {HTMLElement} block
 * @param {{ append?: boolean }} [options] - append: true to add another launcher without clearing
 */
export async function decorateShareuiModalBlock(block, options = {}) {
  const { append = false } = options;

  block.setAttribute('data-dev', 'true');
  block.setAttribute('data-phase', '1');
  if (!append) {
    block.innerHTML = '';
  }

  const section = document.createElement('div');
  section.className = 'dev-color-shareui-section';

  const banner = document.createElement('div');
  banner.className = 'dev-color-shareui-banner';
  banner.setAttribute('role', 'status');
  banner.innerHTML = '<span>Phase 1 · ShareUI dev</span>';
  section.appendChild(banner);

  const copy = document.createElement('p');
  copy.className = 'dev-color-shareui-modal-copy';
  copy.textContent = 'Click a card to open the modal. Test focus trap, Escape, backdrop, and close. ';
  const criteriaTrigger = document.createElement('button');
  criteriaTrigger.type = 'button';
  criteriaTrigger.className = 'dev-color-shareui-acceptance-trigger';
  criteriaTrigger.textContent = 'Acceptance criteria';
  copy.appendChild(criteriaTrigger);
  section.appendChild(copy);

  const criteriaPanel = document.createElement('div');
  criteriaPanel.className = 'dev-color-shareui-acceptance-panel';
  criteriaPanel.hidden = true;
  criteriaPanel.setAttribute('role', 'region');
  criteriaPanel.setAttribute('aria-label', 'Modal shell acceptance criteria');
  criteriaPanel.innerHTML = `<ul>
    <li><strong>Desktop:</strong> Modal 898×604, 32px padding, 12px gap, 16px radius; content scrolls when overflow.</li>
    <li><strong>Tablet:</strong> Drawer 536px, 24px padding, min(600px, 90vh), radius 20px; centered.</li>
    <li><strong>Mobile:</strong> Drawer max-width 600px, 90vh, radius 20px top; bottom sheet, handle visible.</li>
    <li><strong>Breakpoint:</strong> 1024px modal ↔ drawer; resize switches in place.</li>
    <li><strong>Focus:</strong> Tab trap, Escape closes, focus restored; role=dialog, aria-modal.</li>
    <li><strong>Close:</strong> Close button, backdrop click (drawer 500ms delay), swipe down at scroll top.</li>
    <li><strong>Cleanup:</strong> Listeners and DOM removed on close/destroy.</li>
  </ul>`;
  section.appendChild(criteriaPanel);

  criteriaTrigger.addEventListener('click', () => {
    const isOpen = !criteriaPanel.hidden;
    criteriaPanel.hidden = isOpen;
    criteriaTrigger.setAttribute('aria-expanded', String(!isOpen));
  });
  criteriaTrigger.setAttribute('aria-expanded', 'false');

  const modalManager = createModalManager();
  const cards = document.createElement('div');
  cards.className = 'dev-color-shareui-cards';

  function addCard({ type, title, className, content, onClick }) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `dev-color-shareui-card ${className}`;
    card.setAttribute('aria-label', `Open modal: ${title}`);
    const titleEl = document.createElement('span');
    titleEl.className = 'dev-color-shareui-card-title';
    titleEl.textContent = title;
    card.appendChild(titleEl);
    if (content) card.appendChild(content);
    card.addEventListener('click', onClick);
    cards.appendChild(card);
  }

  const paletteSwatches = document.createElement('div');
  paletteSwatches.className = 'dev-color-shareui-card-swatches';
  HARDCODED_PALETTE.colors.forEach((hex) => {
    const s = document.createElement('span');
    s.className = 'dev-color-shareui-swatch';
    s.style.backgroundColor = hex;
    paletteSwatches.appendChild(s);
  });

  const gradientPreview = document.createElement('div');
  gradientPreview.className = 'dev-color-shareui-card-gradient-preview';
  const gradientCss = `linear-gradient(90deg, ${HARDCODED_GRADIENT.colorStops.map((x) => x.color).join(', ')})`;
  gradientPreview.style.background = gradientCss;

  addCard({
    type: 'palette',
    title: HARDCODED_PALETTE.name,
    className: 'dev-color-shareui-card-palette',
    content: paletteSwatches,
    onClick: () => modalManager.openPaletteModal(HARDCODED_PALETTE),
  });

  addCard({
    type: 'gradient',
    title: HARDCODED_GRADIENT.name,
    className: 'dev-color-shareui-card-gradient',
    content: gradientPreview,
    onClick: () => modalManager.openGradientModal(HARDCODED_GRADIENT),
  });

  addCard({
    type: 'stub',
    title: 'Stub (tall content)',
    className: 'dev-color-shareui-card-stub',
    content: null,
    onClick: () => modalManager.open({
      type: 'drawer',
      title: 'Shell test',
      content: createModalStubContent(),
    }),
  });

  section.appendChild(cards);
  block.appendChild(section);
}
