import { getLibs } from '../../utils.js';
import { debounce } from '../../utils/hofs.js';

// JS-transform infinite carousel with a center-pinned ("spotlight") item.
// Unlike gallery.js (native scroll-snap), position is a JS-owned integer index
// and the track is moved with translate3d, which makes looping + centering
// deterministic. Assumes uniform item width (enforced by the consuming block).

const nextSVGHTML = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g>
    <circle cx="16" cy="16" r="16" fill="#FFFFFF"/>
    <path d="M14.6016 21.1996L19.4016 16.3996L14.6016 11.5996" stroke="#292929" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
const prevSVGHTML = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g>
    <circle cx="16" cy="16" r="16" transform="matrix(-1 0 0 1 32 0)" fill="#FFFFFF"/>
    <path d="M17.3984 21.1996L12.5984 16.3996L17.3984 11.5996" stroke="#292929" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

const DRAG_THRESHOLD = 0.18; // fraction of a step that counts as a swipe

let createTag; let loadStyle;

function createControl(labels) {
  const control = createTag('div', { class: 'gallery-control' });
  const prevButton = createTag('button', { class: 'prev', 'aria-label': labels.prev }, prevSVGHTML);
  const nextButton = createTag('button', { class: 'next', 'aria-label': labels.next }, nextSVGHTML);
  control.append(prevButton, nextButton);
  return { control, prevButton, nextButton };
}

export default async function buildLoopGallery(items, container, options = {}) {
  ({ createTag, loadStyle } = await import(`${getLibs()}/utils/utils.js`));
  await new Promise((res) => {
    loadStyle('/express/code/scripts/widgets/gallery/gallery-loop.css', res);
  });

  const labels = { prev: 'Previous', next: 'Next', ...options.labels };
  const realItems = [...items];
  const n = realItems.length;

  const viewport = createTag('div', {
    class: 'gallery-loop-viewport',
    role: 'group',
    'aria-roledescription': 'carousel',
  });
  const track = createTag('div', { class: 'gallery-loop-track' });
  realItems.forEach((item) => item.classList.add('gallery-loop-item'));
  track.append(...realItems);
  viewport.append(track);
  container.classList.add('gallery-loop');
  container.append(viewport);

  const { control, prevButton, nextButton } = createControl(labels);

  // n <= 1: nothing to loop. Center the single item, no controls.
  if (n <= 1) {
    track.classList.add('gallery-loop-track--static');
    control.classList.add('hide');
    if (n === 1) realItems[0].classList.add('active');
    return { control, destroy: () => {} };
  }

  // Measured layout state, refreshed on resize.
  let step = 0; // item width + gap
  let itemWidth = 0;
  let viewportWidth = 0;
  let bufferCount = 0;
  let vpos = 0; // index of the centered child within track.children

  const realIndex = () => ((vpos - bufferCount) % n + n) % n;
  const centerOffset = (childIndex) => viewportWidth / 2 - (childIndex * step + itemWidth / 2);

  function setActive() {
    [...track.children].forEach((child) => child.classList.remove('active'));
    track.children[vpos]?.classList.add('active');
  }

  function position(animate) {
    track.style.transition = animate ? '' : 'none';
    track.style.transform = `translate3d(${centerOffset(vpos)}px, 0, 0)`;
    if (!animate) {
      track.getBoundingClientRect(); // force reflow so the next transition starts clean
      track.style.transition = '';
    }
    setActive();
  }

  function buildClones() {
    // Clone a buffer of items onto each end so the seam is never visible.
    const lead = [];
    const tail = [];
    for (let j = 0; j < bufferCount; j += 1) {
      const tailClone = realItems[j % n].cloneNode(true);
      const leadClone = realItems[(n - 1 - (j % n) + n) % n].cloneNode(true);
      [tailClone, leadClone].forEach((clone) => {
        clone.classList.add('gallery-loop-clone');
        clone.setAttribute('inert', ''); // keep clones out of tab order + AT
        clone.setAttribute('aria-hidden', 'true');
      });
      tail.push(tailClone);
      lead.unshift(leadClone);
    }
    track.replaceChildren(...lead, ...realItems, ...tail);
  }

  function measure() {
    itemWidth = realItems[0].offsetWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    step = itemWidth + gap;
    viewportWidth = viewport.offsetWidth;
    if (!step || !viewportWidth) return false;
    const need = Math.ceil(viewportWidth / 2 / step) + 2;
    return Math.min(need, n);
  }

  function layout() {
    const currentReal = realIndex();
    const nextBuffer = measure();
    if (!nextBuffer) return;
    if (nextBuffer !== bufferCount) {
      bufferCount = nextBuffer;
      buildClones();
    }
    vpos = bufferCount + currentReal; // keep the same real item centered
    position(false);
  }

  function normalizeSeam() {
    if (vpos < bufferCount) vpos += n;
    else if (vpos > bufferCount + n - 1) vpos -= n;
    else return;
    position(false);
  }

  function step1(dir) {
    vpos += dir;
    position(true);
  }

  track.addEventListener('transitionend', (e) => {
    if (e.propertyName === 'transform') normalizeSeam();
  });

  prevButton.addEventListener('click', () => step1(-1));
  nextButton.addEventListener('click', () => step1(1));

  // Keyboard support on the carousel region.
  viewport.setAttribute('tabindex', '0');
  viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step1(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); step1(1); }
  });

  // Pointer drag / swipe — one step per gesture.
  let dragging = false;
  let startX = 0;
  let baseOffset = 0;
  viewport.addEventListener('pointerdown', (e) => {
    dragging = true;
    startX = e.clientX;
    baseOffset = centerOffset(vpos);
    track.style.transition = 'none';
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    track.style.transform = `translate3d(${baseOffset + (e.clientX - startX)}px, 0, 0)`;
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    viewport.releasePointerCapture?.(e.pointerId);
    track.style.transition = '';
    const delta = e.clientX - startX;
    if (Math.abs(delta) > step * DRAG_THRESHOLD) step1(delta < 0 ? 1 : -1);
    else position(true); // settle back to center
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  const onResize = debounce(layout, 100);
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(viewport);
  layout();

  return {
    control,
    destroy: () => resizeObserver.disconnect(),
  };
}
