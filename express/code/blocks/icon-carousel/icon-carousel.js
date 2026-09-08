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
  // Keyboard users must be able to reach and scroll this region directly
  // (axe scrollable-region-focusable / WCAG 2.1.1); a focused, overflowing
  // element scrolls natively via arrow keys. Cards themselves carry no
  // tabindex, so they stay out of the tab order.
  gallery.setAttribute('tabindex', '0');

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

  // Gallery's own box is static; a plain outline on it can't hug just the
  // first card at rest and then track the flush-left edge once scrolled.
  // This sibling is a decorative overlay whose position CSS recomputes from
  // the --scrolled class below, independent of the gallery's own box.
  const galleryWrap = createTag('div', { class: 'icon-carousel-gallery-wrap' });
  const galleryRing = createTag('div', { class: 'icon-carousel-gallery-ring', 'aria-hidden': 'true' });
  const updateScrolledState = () => {
    galleryWrap.classList.toggle('icon-carousel-gallery-wrap--scrolled', gallery.scrollLeft > 0);
  };
  updateScrolledState();
  gallery.addEventListener('scroll', updateScrolledState, { passive: true });
  galleryWrap.append(gallery, galleryRing);

  section.append(header, galleryWrap, control);
  block.replaceChildren(section);
}
