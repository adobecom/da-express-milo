import { getLibs } from '../../scripts/utils.js';
import buildGallery from '../../scripts/widgets/gallery/gallery.js';

let createTag;
let getConfig;
let replaceKey;

export default async function decorate(block) {
  ({ createTag, getConfig } = await import(`${getLibs()}/utils/utils.js`));
  ({ replaceKey } = await import(`${getLibs()}/features/placeholders.js`));

  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  const [prevLabel, nextLabel, regionLabel] = await Promise.all([
    replaceKey('icon-carousel-previous', getConfig()),
    replaceKey('icon-carousel-next', getConfig()),
    replaceKey('icon-carousel-label', getConfig()),
  ]);

  const [headerRow, ...cardRows] = rows;

  const header = createTag('div', { class: 'icon-carousel-header' });
  const heading = headerRow.querySelector('h1, h2, h3, h4, h5, h6');
  const subtitle = headerRow.querySelector('p');
  if (heading) header.append(heading);
  if (subtitle) header.append(subtitle);

  const gallery = createTag('div', { class: 'icon-carousel-gallery' });
  // buildGallery marks this container role="group" aria-roledescription="carousel";
  // give that grouping an accessible name from the heading, or a localized fallback.
  gallery.setAttribute('aria-label', heading ? heading.textContent.trim() : (regionLabel || 'Feature highlights'));

  cardRows.forEach((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    const card = createTag('div', { class: 'icon-carousel-card' });

    const iconSource = cells.length > 1 ? cells[0] : null;
    const textSource = cells.length > 1 ? cells[1] : cells[0];

    if (iconSource) {
      const iconWrap = createTag('div', { class: 'icon-carousel-card-icon', 'aria-hidden': 'true' });
      const picture = iconSource.querySelector('picture');
      const img = iconSource.querySelector('img');
      if (picture) {
        iconWrap.append(picture);
      } else if (img) {
        iconWrap.append(img);
      }
      card.append(iconWrap);
    }

    const textWrap = createTag('div', { class: 'icon-carousel-card-body' });
    [...textSource.children].forEach((child) => textWrap.append(child));
    card.append(textWrap);

    gallery.append(card);
  });

  const cards = [...gallery.querySelectorAll('.icon-carousel-card')];
  // Reuse the shared gallery widget for prev/next + IntersectionObserver +
  // hide-when-all-visible; the control is re-skinned in CSS.
  const { control } = await buildGallery(cards, gallery);
  // The widget hardcodes English aria-labels; swap in the localized placeholders.
  control.querySelector('.prev')?.setAttribute('aria-label', prevLabel || 'Previous');
  control.querySelector('.next')?.setAttribute('aria-label', nextLabel || 'Next');

  block.replaceChildren(header, gallery, control);
}
