import { getLibs } from '../../utils.js';
import { throttle, debounce } from '../../utils/hofs.js';

const nextSVGHTML = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g id="Slider Button - Arrow - Right">
    <circle id="Ellipse 24477" cx="16" cy="16" r="16" fill="#FFFFFF"/>
    <path id="chevron-right" d="M14.6016 21.1996L19.4016 16.3996L14.6016 11.5996" stroke="#292929" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
`;
const prevSVGHTML = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g id="Slider Button - Arrow - Left">
    <circle id="Ellipse 24477" cx="16" cy="16" r="16" transform="matrix(-1 0 0 1 32 0)" fill="#FFFFFF"/>
    <path id="chevron-right" d="M17.3984 21.1996L12.5984 16.3996L17.3984 11.5996" stroke="#292929" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

let createTag; let loadStyle;

function createControl(items, container) {
  const control = createTag('div', { class: 'gallery-control loading' });
  const prevButton = createTag('button', {
    class: 'prev',
    'aria-label': 'Prev', // TODO: localize
  }, prevSVGHTML);
  const nextButton = createTag('button', {
    class: 'next',
    'aria-label': 'Next',
  }, nextSVGHTML);

  const intersecting = Array.from(items).fill(false);

  const len = items.length;
  const pageInc = throttle((inc) => {
    const first = intersecting.indexOf(true);
    if (first === -1) return; // middle of swapping only page
    if (first + inc < 0 || first + inc >= len) return; // no looping
    const target = items[(first + inc + len) % len];
    target.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  }, 30);
  prevButton.addEventListener('click', () => pageInc(-1));
  nextButton.addEventListener('click', () => pageInc(1));

  const updateDOM = debounce((first, last) => {
    prevButton.disabled = first === 0;
    nextButton.disabled = last === items.length - 1;
    if (items.length === last - first + 1) {
      control.classList.add('hide');
      container.classList.add('gallery--all-displayed');
    } else {
      control.classList.remove('hide');
      container.classList.remove('gallery--all-displayed');
    }
    control.classList.remove('loading');
  }, 30);

  const reactToChange = (entries) => {
    entries.forEach((entry) => {
      intersecting[items.indexOf(entry.target)] = entry.isIntersecting;
    });
    const [first, last] = [intersecting.indexOf(true), intersecting.lastIndexOf(true)];
    if (first === -1) {
      // middle of swapping only page or shrinking when centered
      container.classList.remove('gallery--all-displayed');
      return;
    }
    updateDOM(first, last);
  };

  const scrollObserver = new IntersectionObserver((entries) => {
    reactToChange(entries);
  }, { root: container, threshold: 0.99 });

  items.forEach((item) => scrollObserver.observe(item));

  control.append(prevButton, nextButton);
  return control;
}

export default async function buildGallery(
  items,
  container = items?.[0]?.parentNode,
) {
  ({ createTag, loadStyle } = await import(`${getLibs()}/utils/utils.js`));
  const control = createControl([...items], container);
  await new Promise((res) => {
    loadStyle('/express/code/scripts/widgets/gallery/gallery.css', res);
  });
  container.classList.add('gallery');
  container.setAttribute('aria-roledescription', 'carousel');
  container.setAttribute('role', 'group');
  [...items].forEach((item) => {
    item.classList.add('gallery--item');
  });
  return { control };
}
