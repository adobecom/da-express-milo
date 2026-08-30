import { getLibs } from '../../scripts/utils.js';
import buildCarousel from '../../scripts/widgets/carousel.js';

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

function getText(cell) {
  return cell?.textContent.trim() || '';
}

let createTag;
let getConfig;
let replaceKey;

export default async function decorate(block) {
  ({ createTag, getConfig } = await import(`${getLibs()}/utils/utils.js`));
  ({ replaceKey } = await import(`${getLibs()}/features/placeholders.js`));

  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  const [headingRow, ...colorRows] = rows;
  const heading = headingRow?.querySelector('h1, h2, h3, h4, h5, h6');

  const colors = colorRows.map((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    const nameLink = cells[0]?.querySelector('a');
    return {
      name: getText(nameLink || cells[0]),
      hex: getText(cells[1]),
      href: nameLink?.getAttribute('href') || '',
    };
  }).filter((color) => color.name && HEX_PATTERN.test(color.hex));

  if (!heading || !colors.length) return;

  const headingText = heading.textContent.trim();

  const header = createTag('div', { class: 'explore-more-colors-header' });
  header.append(heading);

  const section = createTag('section', { 'aria-label': headingText });

  const row = createTag('div', { class: 'explore-more-colors-row' });

  colors.forEach(({ name, hex, href }) => {
    const chip = createTag(href ? 'a' : 'div', {
      class: 'explore-more-colors-chip',
      ...(href ? { href } : {}),
    });
    const swatch = createTag('div', { class: 'explore-more-colors-chip-swatch' });
    swatch.style.setProperty('background-color', hex);
    const info = createTag('div', { class: 'explore-more-colors-chip-info' });
    info.append(
      createTag('p', { class: 'explore-more-colors-chip-name' }, name),
      createTag('p', { class: 'explore-more-colors-chip-hex' }, hex.toUpperCase()),
    );
    chip.append(swatch, info);
    row.append(chip);
  });

  const [prevLabel, nextLabel] = await Promise.all([
    replaceKey('explore-more-colors-previous', getConfig()),
    replaceKey('explore-more-colors-next', getConfig()),
  ]);

  section.append(header, row);
  block.replaceChildren(section);

  await buildCarousel('', row, { centerAlign: true });

  row.querySelector('.carousel-arrow-left')?.setAttribute('aria-label', prevLabel || 'Previous slide');
  row.querySelector('.carousel-arrow-right')?.setAttribute('aria-label', nextLabel || 'Next slide');
}
