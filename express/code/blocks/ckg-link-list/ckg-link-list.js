import { getLibs, decorateButtonsDeprecated, getMetadata } from '../../scripts/utils.js';
import getData from '../../scripts/utils/browse-api-controller.js';
import buildCarousel from '../../scripts/widgets/carousel.js';
import { titleCase } from '../../scripts/utils/string.js';

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

let createTag;
let getConfig;
let replaceKey;

function addColorSampler(colorHex, btn) {
  const colorDot = createTag('div', {
    class: 'color-dot',
    style: `background-color: ${colorHex}`,
  });

  const aTag = btn.querySelector('a');
  btn.style.backgroundColor = colorHex;
  aTag.classList.add('colorful');

  aTag.prepend(colorDot);
}

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

async function decorateLegacy(block) {
  await Promise.all([import(`${getLibs()}/utils/utils.js`), decorateButtonsDeprecated(block)]).then(([utils]) => {
    ({ createTag, getConfig } = utils);
  });

  block.style.visibility = 'hidden';

  const pills = await getData();
  if (!pills?.length) return;

  const { prefix } = getConfig().locale;

  pills.forEach(({ canonicalName: colorName, metadata: { link, hexCode: colorHex } }) => {
    if (!colorName || !link || !colorHex) return;

    // Add locale prefix to the link
    const localizedLink = link.startsWith('/') ? `${prefix}${link}` : link;

    const buttonContainer = createTag(
      'p',
      { class: 'button-container' },
      createTag(
        'a',
        {
          class: 'button',
          title: colorName,
          href: localizedLink,
        },
        titleCase(colorName),
      ),
    );
    block.append(buttonContainer);

    colorHex && addColorSampler(colorHex, buttonContainer);
  });

  if (!block.children) return;

  const options = { centerAlign: true };
  await buildCarousel('.button-container', block, options);
  block.style.visibility = 'visible';
}

async function decorateChips(block, heading) {
  if (!heading) return;

  ({ createTag, getConfig } = await import(`${getLibs()}/utils/utils.js`));
  ({ replaceKey } = await import(`${getLibs()}/features/placeholders.js`));

  block.classList.add('ckg-link-list-chips');

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

export default async function decorate(block) {
  const isColorSite = getMetadata('pagetype')?.toLowerCase() === 'color';

  if (isColorSite) {
    const [headingRow] = [...block.querySelectorAll(':scope > div')];
    const heading = headingRow?.querySelector('h1, h2, h3, h4, h5, h6');
    await decorateChips(block, heading);
    return;
  }

  await decorateLegacy(block);
}
