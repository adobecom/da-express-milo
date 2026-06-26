import { getLibs, decorateButtonsDeprecated } from '../../scripts/utils.js';

let createTag;

export default async function decorate(block) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  await decorateButtonsDeprecated(block);

  const rows = [...block.children];

  // Row 0: background color
  const bgText = rows[0]?.querySelector(':scope > div')?.textContent?.trim();
  if (bgText) block.style.background = bgText;
  rows[0].remove();

  // Row 1: section header (heading + body + CTA)
  const headerCell = block.firstElementChild?.querySelector(':scope > div');
  const header = createTag('div', { class: 'font-bento-header' });
  const textContent = createTag('div', { class: 'font-bento-text' });

  if (headerCell) {
    const ctaArea = [...headerCell.children].find((el) => el.querySelector('a.button'));
    [...headerCell.children].forEach((el) => {
      if (el !== ctaArea) textContent.append(el);
    });
    header.append(textContent);
    if (ctaArea) header.append(ctaArea);
  }
  block.firstElementChild.remove();

  // Remaining rows: bento cards
  const grid = createTag('div', { class: 'font-bento-grid' });
  [...block.children].forEach((row, i) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    const card = createTag('div', { class: `font-bento-card font-bento-card-${i + 1}` });

    const titleP = cells[0]?.querySelector('p');
    if (titleP) {
      titleP.classList.add('font-bento-card-title');
      card.append(titleP);
    }

    const picture = cells[1]?.querySelector('picture');
    if (picture) {
      const mediaWrap = createTag('div', { class: 'font-bento-card-media' });
      mediaWrap.append(picture);
      card.append(mediaWrap);
    }

    row.remove();
    grid.append(card);
  });

  block.append(header, grid);
}
