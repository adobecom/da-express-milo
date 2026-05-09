/**
 * Font Bento block — asymmetric bento grid with background images and unicode text overlays.
 * Authored structure: row 0 = header (H2 + body + CTA), rows 1-6 = bento cards.
 * Grid layout: row 1 [large, small, small] / row 2 [small, small, large]
 *
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // ── Header row (row 0) ────────────────────────────────────────────────────
  const headerRow = rows[0];
  headerRow.classList.add('fb-header');

  const ctaLink = headerRow.querySelector('a');
  if (ctaLink) {
    ctaLink.classList.add('button', 'accent');
    ctaLink.parentElement?.classList.add('button-container');
  }

  // ── Bento grid ────────────────────────────────────────────────────────────
  const grid = document.createElement('div');
  grid.classList.add('fb-grid');

  // grid-area names map: row/col arrangement per Figma spec
  // Row 1: card-1 (large, 2 cols), card-2 (small), card-3 (small)
  // Row 2: card-4 (small), card-5 (small), card-6 (large, 2 cols)
  const gridAreas = ['card-1', 'card-2', 'card-3', 'card-4', 'card-5', 'card-6'];

  rows.slice(1, 7).forEach((row, index) => {
    const card = document.createElement('div');
    card.classList.add('fb-card');
    card.dataset.area = gridAreas[index];
    card.style.gridArea = gridAreas[index];

    // Background image — authored as first picture element in row
    const picture = row.querySelector('picture');
    if (picture) {
      card.style.backgroundImage = `url(${picture.querySelector('img')?.src || ''})`;
      card.classList.add('fb-card--has-bg');
      picture.remove();
    }

    // Overlay text — remaining content after picture removal
    const overlay = document.createElement('div');
    overlay.classList.add('fb-card-overlay');
    [...row.children].forEach((child) => overlay.append(child));
    card.append(overlay);

    grid.append(card);
  });

  // Replace authored rows with header + grid
  block.innerHTML = '';
  block.append(headerRow, grid);
}
