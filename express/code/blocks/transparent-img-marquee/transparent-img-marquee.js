// transparent-img-marquee — Phase E hero block.
// Two-column layout: left (logo + H1 + body) on black bg, right (image column).
// Black background always applied — no dark/light swap needed (bg is always #000).
// Logo is always adobe-express-logo-white — no metadata gate, no media-query swap.
//
// Authoring schema (one row):
//   Row 0: two-column [left cell: logo-placeholder + H1 + body | right cell: picture]
//
// Reference: ax-marquee.js:339-369 for logo injection pattern.

import { getIconElementDeprecated, createTag } from '../../scripts/utils.js';

export default async function init(el) {
  const row = el.querySelector(':scope > div');
  if (!row) return;

  const cells = [...row.children];
  const leftCell = cells[0];
  const rightCell = cells[1];
  if (!leftCell) return;

  leftCell.classList.add('marquee-left');
  if (rightCell) rightCell.classList.add('marquee-right');

  // Remove the authored logo placeholder — either a paragraph with only a link,
  // or a paragraph whose text includes 'PLACEHOLDER'.
  // The real logo is always injected programmatically below.
  const firstP = leftCell.querySelector('p:first-of-type');
  if (firstP) {
    const hasOnlyLink = firstP.children.length === 1 && firstP.querySelector('a');
    const hasPlaceholder = firstP.textContent.includes('PLACEHOLDER');
    if (hasOnlyLink || hasPlaceholder) firstP.remove();
  }

  // Inject Adobe Express white logo + wordmark.
  // getIconElementDeprecated returns an <img> pointing to the SVG asset.
  const logo = getIconElementDeprecated('adobe-express-logo-white');
  logo.classList.add('express-logo');
  leftCell.prepend(logo);

  // Wrap logo in a link to express.adobe.com for accessibility.
  const logoLink = createTag('a', {
    href: 'https://express.adobe.com/',
    'aria-label': 'Adobe Express',
    class: 'express-logo-link',
  });
  logoLink.appendChild(logo);
  leftCell.prepend(logoLink);
}
