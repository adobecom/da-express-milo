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

  const headingText = heading ? heading.textContent.trim() : '';

  const section = createTag('section', { 'aria-label': headingText || regionLabel || 'Feature highlights' });

  const gallery = createTag('div', { class: 'icon-carousel-gallery' });
  // buildGallery marks this container role="group" aria-roledescription="carousel".
  gallery.setAttribute('aria-label', headingText || regionLabel || 'Feature highlights');
  // Chromium auto-focuses scrollable overflow containers even with no tabindex
  // set; opt out explicitly since the prev/next buttons already provide full
  // keyboard control over scrolling.
  gallery.setAttribute('tabindex', '-1');

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
  // At the >=1440px breakpoint the 160px left inset (--icon-carousel-inset)
  // keeps the previously-first card ~37% visible after paging forward, which
  // at the widget's default 10% threshold pins its "first visible card" index
  // on the stale card and stalls the next button after one click. A higher
  // threshold (as template-x-carousel-toolbar also uses) clears that margin.
  const { control } = await buildGallery(cards, gallery, { intersectionThreshold: 0.5 });
  // The widget hardcodes English aria-labels; swap in the localized placeholders.
  control.querySelector('.prev')?.setAttribute('aria-label', prevLabel || 'Previous slide');
  control.querySelector('.next')?.setAttribute('aria-label', nextLabel || 'Next slide');
  // Chevron SVGs are decorative; the buttons already carry accessible labels.
  control.querySelectorAll('svg').forEach((svg) => svg.setAttribute('aria-hidden', 'true'));

  section.append(header, gallery, control);
  block.replaceChildren(section);
}
