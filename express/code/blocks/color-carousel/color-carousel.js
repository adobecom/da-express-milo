import { getLibs } from '../../scripts/utils.js';
import getData from '../../scripts/utils/browse-api-controller.js';
import buildCarousel from '../../scripts/widgets/carousel.js';
import { titleCase } from '../../scripts/utils/string.js';

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

let createTag;
let getConfig;
let replaceKey;

function watchForOverflow(row, onOverflow) {
  const observer = new ResizeObserver(() => {
    if (row.clientWidth === 0) return;
    if (row.scrollWidth > row.clientWidth) {
      observer.disconnect();
      onOverflow();
    }
  });
  observer.observe(row);
}

function buildChip({ name, hex, href }) {
  const chip = createTag(href ? 'a' : 'div', {
    class: 'color-carousel-chip',
    ...(href ? { href } : {}),
  });
  const swatch = createTag('div', { class: 'color-carousel-chip-swatch' });
  swatch.style.setProperty('background-color', hex);
  const info = createTag('div', { class: 'color-carousel-chip-info' });
  info.append(
    createTag('p', { class: 'color-carousel-chip-name' }, name),
    createTag('p', { class: 'color-carousel-chip-hex' }, hex.toUpperCase()),
  );
  chip.append(swatch, info);
  return chip;
}

async function renderCarousel(block, heading, colors) {
  if (!colors.length) {
    block.closest('.section')?.remove();
    return;
  }

  const section = createTag('section');
  const row = createTag('div', { class: 'color-carousel-row' });

  if (heading) {
    const headingText = heading.textContent.trim();
    if (headingText) section.setAttribute('aria-label', headingText);
    const header = createTag('div', { class: 'color-carousel-header' });
    header.append(heading);
    section.append(header);
  }

  colors.forEach((color) => row.append(buildChip(color)));

  const [prevLabel, nextLabel] = await Promise.all([
    replaceKey('explore-more-colors-previous', getConfig()),
    replaceKey('explore-more-colors-next', getConfig()),
  ]);

  section.append(row);
  block.replaceChildren(section);

  watchForOverflow(row, async () => {
    await buildCarousel('', row, { centerAlign: true, infinityScrollEnabled: true, deferLeftArrow: true });
    row.querySelector('.carousel-arrow-left')?.setAttribute('aria-label', prevLabel || 'Previous slide');
    row.querySelector('.carousel-arrow-right')?.setAttribute('aria-label', nextLabel || 'Next slide');
  });
}

async function getCkgColors() {
  const pills = await getData();
  if (!pills?.length) return [];

  const { prefix } = getConfig().locale;

  return pills.map(({ canonicalName, metadata: { link, hexCode } = {} }) => {
    if (!canonicalName || !link || !hexCode) return null;
    const href = link.startsWith('/') ? `${prefix}${link}` : link;
    return { name: titleCase(canonicalName), hex: hexCode, href };
  }).filter((color) => color && HEX_PATTERN.test(color.hex));
}

function extractHeading(rows) {
  const firstRow = rows[0];
  const cell = firstRow?.querySelector(':scope > div');
  if (!cell) return null;
  const hasLink = !!cell.querySelector('a');
  const hasHex = HEX_PATTERN.test(cell.textContent.trim());
  if (hasLink || hasHex) return null;
  const headingEl = cell.querySelector('h1, h2, h3, h4, h5, h6') || cell;
  if (!headingEl.textContent.trim()) return null;
  rows.shift();
  return headingEl;
}

function getAuthoredColors(rows) {
  return rows.map((row) => {
    const cell = row.querySelector(':scope > div') || row;
    const [nameEl, hexEl, linkEl] = cell.children;
    const name = nameEl?.textContent.trim();
    const hex = hexEl?.textContent.trim();
    const anchor = linkEl?.matches('a') ? linkEl : linkEl?.querySelector('a');
    const href = anchor?.getAttribute('href');
    if (!name || !hex || !href) return null;
    return { name, hex, href };
  }).filter((color) => color && HEX_PATTERN.test(color.hex));
}

export default async function decorate(block) {
  const [utils, placeholders] = await Promise.all([
    import(`${getLibs()}/utils/utils.js`),
    import(`${getLibs()}/features/placeholders.js`),
  ]);
  ({ createTag, getConfig } = utils);
  ({ replaceKey } = placeholders);

  const rows = [...block.querySelectorAll(':scope > div')];
  const heading = extractHeading(rows);
  const authoredColors = getAuthoredColors(rows);

  // Failsafe: with no authored chip content, fall back to the dynamic CKG variant.
  if (!authoredColors.length) block.classList.add('ckg');

  const isCkg = block.classList.contains('ckg');
  const colors = isCkg ? await getCkgColors() : authoredColors;

  await renderCarousel(block, heading, colors);
}
