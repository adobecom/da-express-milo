import { getLibs } from '../../scripts/utils.js';
import { debounce, throttle } from '../../scripts/utils/hofs.js';

let createTag;

// Stroke-based chevrons (discover-cards style) scaled to 18×18.
// stroke="currentColor" lets CSS color: control the tint — works for both
// light and dark modes without filter hacks.
const CHEVRON_LEFT = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9L11 14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHEVRON_RIGHT = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7 4L12 9L7 14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function parseSVG(str) {
  return new DOMParser().parseFromString(str, 'image/svg+xml').documentElement;
}

function buildControls(items, gallery) {
  const controls = createTag('div', { class: 'icon-carousel-controls' });
  const prevBtn = createTag('button', { class: 'icon-carousel-btn icon-carousel-prev', 'aria-label': 'Previous' });
  const nextBtn = createTag('button', { class: 'icon-carousel-btn icon-carousel-next', 'aria-label': 'Next' });

  prevBtn.append(parseSVG(CHEVRON_LEFT));
  nextBtn.append(parseSVG(CHEVRON_RIGHT));

  const len = items.length;
  const intersecting = items.map(() => false);

  const pageInc = throttle((inc) => {
    const first = intersecting.indexOf(true);
    if (first === -1) return;
    const next = first + inc;
    if (next < 0 || next >= len) return;
    items[next].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  }, 200);

  prevBtn.addEventListener('click', () => pageInc(-1));
  nextBtn.addEventListener('click', () => pageInc(1));

  const update = debounce((first, last) => {
    prevBtn.disabled = first === 0;
    nextBtn.disabled = last === len - 1;
  }, 300);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      intersecting[items.indexOf(e.target)] = e.isIntersecting;
    });
    const first = intersecting.indexOf(true);
    const last = intersecting.lastIndexOf(true);
    if (first !== -1) update(first, last);
  }, { root: gallery, threshold: 1, rootMargin: '0px 16px 0px 16px' });

  items.forEach((item) => observer.observe(item));

  controls.append(prevBtn, nextBtn);
  return controls;
}

export default async function decorate(block) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));

  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  const [headerRow, ...cardRows] = rows;

  const header = createTag('div', { class: 'icon-carousel-header' });
  const heading = headerRow.querySelector('h1, h2, h3, h4, h5, h6');
  const subtitle = headerRow.querySelector('p');
  if (heading) header.append(heading);
  if (subtitle) header.append(subtitle);

  const gallery = createTag('div', { class: 'icon-carousel-gallery', role: 'region' });
  if (heading) gallery.setAttribute('aria-label', heading.textContent.trim());

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
  const controls = buildControls(cards, gallery);

  block.replaceChildren(header, gallery, controls);
}
