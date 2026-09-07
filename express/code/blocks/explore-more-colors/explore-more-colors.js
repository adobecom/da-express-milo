import { getLibs } from '../../scripts/utils.js';
import buildCarousel from '../../scripts/widgets/carousel.js';
import getData from '../../scripts/utils/browse-api-controller.js';
import { titleCase } from '../../scripts/utils/string.js';

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

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

let createTag;
let getConfig;
let replaceKey;

export default async function decorate(block) {
  ({ createTag, getConfig } = await import(`${getLibs()}/utils/utils.js`));
  ({ replaceKey } = await import(`${getLibs()}/features/placeholders.js`));

  const [headingRow] = [...block.querySelectorAll(':scope > div')];
  const heading = headingRow?.querySelector('h1, h2, h3, h4, h5, h6');
  if (!heading) return;

  const pills = await getData();
  if (!pills?.length) return;

  const { prefix } = getConfig().locale;

  const colors = pills.map(({ canonicalName, metadata: { link, hexCode } = {} }) => {
    if (!canonicalName || !link || !hexCode) return null;
    const href = link.startsWith('/') ? `${prefix}${link}` : link;
    return { name: titleCase(canonicalName), hex: hexCode, href };
  }).filter((color) => color && HEX_PATTERN.test(color.hex));

  if (!colors.length) return;

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

  watchForOverflow(row, async () => {
    await buildCarousel('', row, { centerAlign: true, infinityScrollEnabled: true, deferLeftArrow: true });
    row.querySelector('.carousel-arrow-left')?.setAttribute('aria-label', prevLabel || 'Previous slide');
    row.querySelector('.carousel-arrow-right')?.setAttribute('aria-label', nextLabel || 'Next slide');
  });
}
