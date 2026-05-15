// font-bento — 4-column × 2-row bento grid of Unicode font use-case cards.
//
// Authoring schema:
//   Row 0 (header): two-column [left: H2 + body | right: CTA link]
//   Rows 1-6 (cards): two-column [left: label text | right: picture]
//
// Grid layout (4 columns):
//   Row 1: Social media (span 2) | Games (span 1) | Design (span 1)
//   Row 2: Messaging (span 1)   | Ads (span 1)    | Documents (span 2)
//
// Labels appear ABOVE the image in document flow (Figma deep spec: not overlaid).

import { createTag } from '../../scripts/utils.js';

// Column spans for cards 0-5 (matching Figma bento layout)
const CARD_SPANS = [2, 1, 1, 1, 1, 2];

export default async function init(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  if (rows.length < 2) return;

  // ── Header row ────────────────────────────────────────────────────────────
  const [headingCell, ctaCell] = [...rows[0].children];

  const h2 = headingCell?.querySelector('h2');
  const bodyParagraphs = headingCell ? [...headingCell.querySelectorAll('p')] : [];
  const ctaLink = ctaCell?.querySelector('a');

  const header = createTag('div', { class: 'font-bento-header' });

  const headingGroup = createTag('div', { class: 'font-bento-heading-group' });
  if (h2) headingGroup.appendChild(h2);
  bodyParagraphs.forEach((p) => headingGroup.appendChild(p));
  header.appendChild(headingGroup);

  if (ctaLink) {
    ctaLink.classList.add('font-bento-cta-link');
    const ctaWrapper = ctaLink.closest('p') || ctaLink;
    header.appendChild(ctaWrapper);
  }

  // ── Card grid ─────────────────────────────────────────────────────────────
  const grid = createTag('div', { class: 'font-bento-grid' });

  rows.slice(1).forEach((cardRow, i) => {
    const [labelCell, pictureCell] = [...cardRow.children];
    const label = labelCell?.textContent.trim() ?? '';
    const picture = pictureCell?.querySelector('picture');

    const card = createTag('div', { class: 'font-bento-card' });
    const span = CARD_SPANS[i] ?? 1;
    if (span > 1) card.style.gridColumn = `span ${span}`;

    const labelEl = createTag('p', { class: 'font-bento-card-label' }, label);
    card.appendChild(labelEl);

    const imageWrap = createTag('div', { class: 'font-bento-card-image' });
    if (picture) {
      // Use picture element directly so srcset/responsive loading is preserved.
      imageWrap.appendChild(picture);
    } else {
      // Placeholder shown until AEM asset is uploaded.
      imageWrap.classList.add('font-bento-card-image--placeholder');
    }
    card.appendChild(imageWrap);

    grid.appendChild(card);
  });

  el.replaceChildren(header, grid);
}
