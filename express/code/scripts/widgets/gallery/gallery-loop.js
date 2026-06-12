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

  const labels = {
    prev: 'Previous template',
    next: 'Next template',
    // Accessible name for the carousel group (first focus level).
    group: 'Template carousel',
    // {{current}}/{{total}} are interpolated per navigation for the live region.
    position: '{{current}} of {{total}}',
    ...options.labels,
  };
  const realItems = [...items];
  const n = realItems.length;

  // The card's CTA anchor is the roving focus target (second focus level).
  const cardLink = (card) => card.querySelector('.button-container a.button')
    || card.querySelector('a[href]');

  // The carousel itself is a focusable, named group — the first focus level.
  // Tabbing into it announces the group name; Tab again enters the cards.
  const viewport = createTag('div', {
    class: 'gallery-loop-viewport',
    role: 'group',
    'aria-roledescription': 'carousel',
    'aria-label': labels.group,
    tabindex: '0',
  });
  const track = createTag('div', { class: 'gallery-loop-track' });
  realItems.forEach((item) => item.classList.add('gallery-loop-item'));
  track.append(...realItems);
  viewport.append(track);
  container.classList.add('gallery-loop');
  container.append(viewport);

  // Polite live region: announces "X of N" so screen-reader users navigating an
  // endless loop always know where they are and how many items there are.
  const statusId = `gallery-loop-status-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const status = createTag('div', {
    id: statusId,
    class: 'gallery-loop-status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  });
  container.append(status);

  const { control, prevButton, nextButton } = createControl(labels);
  prevButton.setAttribute('aria-describedby', statusId);
  nextButton.setAttribute('aria-describedby', statusId);

  // n <= 1: nothing to loop. Center the single item, no controls.
  if (n <= 1) {
    track.classList.add('gallery-loop-track--static');
    control.classList.add('hide');
    if (n === 1) {
      realItems[0].classList.add('active');
      cardLink(realItems[0])?.setAttribute('tabindex', '0');
    }
    return { control, destroy: () => {} };
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ANIM_MS = reduceMotion ? 0 : 380;
  let locked = false;

  // Baseline roving tabindex: only the first (initial centre) card is tabbable;
  // every other card's focusables are pulled out of the tab order.
  realItems.forEach((card, i) => {
    card.querySelectorAll('a[href], button, input, select, textarea')
      .forEach((node) => node.setAttribute('tabindex', '-1'));
    if (i === 0) cardLink(card)?.setAttribute('tabindex', '0');
  });

  // Measured layout state, refreshed on resize.
  let step = 0; // item width + gap
  let itemWidth = 0;
  let viewportWidth = 0;
  let bufferCount = 0;
  let vpos = 0; // index of the centered child within track.children

  const realIndex = () => ((vpos - bufferCount) % n + n) % n;
  const centerOffset = (childIndex) => viewportWidth / 2 - (childIndex * step + itemWidth / 2);

  function update() {
    // Visual spotlight follows the centred child (may be a clone mid-transition).
    [...track.children].forEach((child) => child.classList.remove('active'));
    track.children[vpos]?.classList.add('active');
    // Roving tabindex + live region track the logical (real) index.
    const ri = realIndex();
    realItems.forEach((card, i) => {
      cardLink(card)?.setAttribute('tabindex', i === ri ? '0' : '-1');
    });
    status.textContent = labels.position
      .replace('{{current}}', String(ri + 1))
      .replace('{{total}}', String(n));
  }

  function position(animate) {
    track.style.transition = animate ? '' : 'none';
    track.style.transform = `translate3d(${centerOffset(vpos)}px, 0, 0)`;
    if (!animate) {
      track.getBoundingClientRect(); // force reflow so the next transition starts clean
      track.style.transition = '';
    }
    update();
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
        // Keep clones out of the tab order + AT, but still hoverable/clickable
        // (inert would disable :hover, so pull focusables out individually instead).
        // cloneNode copies the active card's tabindex="0", so force them all to -1.
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')
          .forEach((node) => node.setAttribute('tabindex', '-1'));
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
    const before = vpos;
    while (vpos < bufferCount) vpos += n;
    while (vpos > bufferCount + n - 1) vpos -= n;
    if (vpos !== before) position(false); // invisible jump back into the real range
  }

  // One step per gesture. We lock during the transition, then snap the seam and
  // unlock (a timeout rather than transitionend so it also fires under
  // prefers-reduced-motion, where there is no transition).
  function step1(dir, focusCard = false) {
    if (locked) return;
    locked = true;
    vpos += dir;
    position(true);
    if (focusCard) cardLink(realItems[realIndex()])?.focus({ preventScroll: true });
    window.setTimeout(() => {
      normalizeSeam();
      locked = false;
    }, ANIM_MS);
  }

  prevButton.addEventListener('click', () => step1(-1));
  nextButton.addEventListener('click', () => step1(1));

  // Arrow keys move the spotlight between cards (focus follows). Enter/Space is
  // left to the natively-focused CTA anchor.
  viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step1(-1, true); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step1(1, true); }
  });

  // Pointer drag / swipe — one step per gesture. We only capture the pointer
  // once real movement is detected; otherwise a click/tap is left alone so it
  // reaches the CTA link inside the card (capturing on pointerdown would steal
  // the click and the links would never navigate).
  const DRAG_START_PX = 6;
  let pointerActive = false;
  let dragging = false;
  let captured = false;
  let pointerId = null;
  let startX = 0;
  let baseOffset = 0;
  viewport.addEventListener('pointerdown', (e) => {
    pointerActive = true;
    dragging = false;
    captured = false;
    pointerId = e.pointerId;
    startX = e.clientX;
    baseOffset = centerOffset(vpos);
  });
  viewport.addEventListener('pointermove', (e) => {
    if (!pointerActive) return;
    const dx = e.clientX - startX;
    if (!dragging) {
      if (Math.abs(dx) < DRAG_START_PX) return;
      dragging = true;
      track.style.transition = 'none';
      try {
        viewport.setPointerCapture(pointerId);
        captured = true;
      } catch (err) {
        // pointer may already be gone; dragging still works without capture
      }
    }
    track.style.transform = `translate3d(${baseOffset + dx}px, 0, 0)`;
  });
  const endDrag = (e) => {
    if (!pointerActive) return;
    pointerActive = false;
    if (captured) viewport.releasePointerCapture?.(pointerId);
    if (!dragging) return; // a tap/click — let it through to the CTA link
    dragging = false;
    track.style.transition = '';
    const delta = e.clientX - startX;
    if (Math.abs(delta) > step * DRAG_THRESHOLD) step1(delta < 0 ? 1 : -1);
    else position(true); // settle back to center
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  // Wheel / trackpad: track follows the gesture in real time, then snaps to
  // the nearest card once scrolling goes idle.
  // Uses deltaX when the horizontal axis dominates (trackpad swipe), deltaY
  // otherwise (mouse wheel). The snap animates from wherever the finger stopped
  // rather than jumping to center, so it feels like native scroll-snap.
  const WHEEL_IDLE_MS = 150;
  let wheelSteps = 0;     // fractional cards scrolled since gesture start
  let wheelVposStart = 0; // vpos when the current gesture began
  let isWheeling = false;
  let wheelTimer = null;
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (delta === 0) return;

    if (!isWheeling) {
      isWheeling = true;
      locked = true;
      wheelVposStart = vpos;
      track.style.transition = 'none';
      track.getBoundingClientRect();
    }

    wheelSteps += delta / step;
    track.style.transform = `translate3d(${centerOffset(wheelVposStart + wheelSteps)}px, 0, 0)`;

    clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(() => {
      isWheeling = false;
      const stepsToMove = Math.round(wheelSteps);
      // fractional: sub-card offset between where the finger stopped and the snap target.
      // Setting the transform to (centerOffset(vpos) + fractional * step) before
      // re-enabling the transition means the browser animates from the finger's last
      // position rather than from the snap target — no jump.
      const fractional = stepsToMove - wheelSteps;
      wheelSteps = 0;

      vpos = wheelVposStart + stepsToMove;
      // Inline seam normalisation — avoids position()'s side-effects before we're ready.
      while (vpos < bufferCount) vpos += n;
      while (vpos > bufferCount + n - 1) vpos -= n;

      track.style.transition = 'none';
      track.style.transform = `translate3d(${centerOffset(vpos) + fractional * step}px, 0, 0)`;
      track.getBoundingClientRect(); // commit start position to rendering pipeline
      position(true); // re-enables transition, animates to centerOffset(vpos)
      window.setTimeout(() => { locked = false; }, ANIM_MS);
    }, WHEEL_IDLE_MS);
  }, { passive: false });

  const onResize = debounce(layout, 100);
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(viewport);
  layout();

  return {
    control,
    destroy: () => {
      resizeObserver.disconnect();
      clearTimeout(wheelTimer);
    },
  };
}
