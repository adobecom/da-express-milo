import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';
import { throttle, debounce } from '../../scripts/utils/hofs.js';

let createTag;
let loadStyle;
let getConfig;
const iconRegex = /icon-([^\s]+)/;

/* OLD APPROACH — commented out; replaced by fixed-step navigation below.
const scrollPaddingFallback = 32;

function getScrollPadding(container) {
  const root = container.closest('.how-to-cards') || container;
  const value = getComputedStyle(root).getPropertyValue('--gallery-first-item-margin');
  return parseFloat(value) || scrollPaddingFallback;
}

function getPageTargets(items, container) {
  // Each pip is a concrete scroll position built from live geometry rather than a
  // width estimate, so a pip is only created for a reachable stop. A card move
  // lands on that card; a pure-whitespace move either coincides with the end
  // (kept once) or folds into the previous stop (distance <= 1px) — the widget
  // can never get stuck on a pip it cannot scroll to.
  const maxScroll = Math.max(0, Math.round(container.scrollWidth - container.clientWidth));
  const targets = [0];
  if (maxScroll <= 1) return targets;
  const offset = getScrollPadding(container);
  const containerLeft = container.getBoundingClientRect().left;
  const scrolled = container.scrollLeft;
  for (let i = 1; i < items.length; i += 1) {
    const contentLeft = Math.round(
      items[i].getBoundingClientRect().left - containerLeft + scrolled,
    );
    const target = Math.min(maxScroll, Math.max(0, contentLeft - offset));
    if (target - targets[targets.length - 1] > 1) targets.push(target);
    if (target >= maxScroll) break;
  }
  if (maxScroll - targets[targets.length - 1] > 1) targets.push(maxScroll);
  return targets;
}
--- end old approach helpers --- */

function createChevronButton(direction, ariaLabel) {
  const button = createTag('button', {
    class: `${direction} chevron-control`,
    'aria-label': ariaLabel,
    type: 'button',
  });
  const icon = getIconElementDeprecated('chevron-up', 22, 'chevron', 'chevron-icon');
  if (icon instanceof HTMLElement) {
    icon.setAttribute('aria-hidden', 'true');
    if (icon.tagName === 'IMG') icon.setAttribute('alt', '');
  }
  button.append(icon);
  return button;
}

/* OLD createControl — commented out; replaced by fixed-step version below.
function createControl(items, container) {
  const control = createTag('div', { class: 'gallery-control loading' });
  const status = createTag('div', { class: 'status' });
  const prevButton = createChevronButton('prev', 'Previous');
  const nextButton = createChevronButton('next', 'Next');

  // Pips are the single state. getPageTargets returns the concrete scroll stops;
  // count, current index, navigation and button state all derive from it, so a
  // whitespace-only move can never desync the widget.
  const atEnd = () => Math.ceil(container.scrollLeft + container.clientWidth)
    >= container.scrollWidth - 1;

  const currentPage = (targets) => {
    if (atEnd()) return targets.length - 1;
    const scrolled = container.scrollLeft;
    let idx = 0;
    for (let i = 0; i < targets.length; i += 1) {
      if (scrolled >= targets[i] - 2) idx = i; else break;
    }
    return idx;
  };

  const dots = [];
  const syncDots = (count) => {
    while (dots.length < count) {
      const dot = createTag('div', { class: 'dot' });
      status.append(dot);
      dots.push(dot);
    }
    while (dots.length > count) dots.pop().remove();
  };

  const render = () => {
    const targets = getPageTargets(items, container);
    syncDots(targets.length);
    const page = currentPage(targets);
    prevButton.disabled = page <= 0;
    nextButton.disabled = page >= targets.length - 1;
    dots.forEach((dot, i) => dot.classList.toggle('curr', i === page));
    const allDisplayed = targets.length <= 1;
    control.classList.toggle('hide', allDisplayed);
    container.classList.toggle('gallery--all-displayed', allDisplayed);
    control.classList.remove('loading');
  };

  const pageInc = throttle((inc) => {
    const targets = getPageTargets(items, container);
    const idx = Math.max(0, Math.min(targets.length - 1, currentPage(targets) + inc));
    container.scrollTo({ left: targets[idx], behavior: 'smooth' });
  }, 200);
  prevButton.addEventListener('click', () => pageInc(-1));
  nextButton.addEventListener('click', () => pageInc(1));

  container.addEventListener('scroll', throttle(render, 100), { passive: true });
  window.addEventListener('resize', debounce(render, 150));

  // Trigger (not state): render once laid out, and again if the block starts
  // hidden (e.g. inside a tab panel) and later becomes visible.
  const visObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) render();
  }, { threshold: 0 });
  visObserver.observe(container);
  requestAnimationFrame(render);

  control.append(status, prevButton, nextButton);
  return control;
}
--- end old createControl --- */

function createControl(items, container) {
  const control = createTag('div', { class: 'gallery-control loading' });
  const status = createTag('div', { class: 'status' });
  const prevButton = createChevronButton('prev', 'Previous');
  const nextButton = createChevronButton('next', 'Next');

  // Step = one card (card width + gap). A pip's canonical scroll position is
  // pip * step, so page count and current pip use the same rounding and always
  // agree — the last pip is reachable and buttons never gray with pips remaining.
  const getStep = () => {
    if (!items.length) return 0;
    const cardWidth = items[0].getBoundingClientRect().width;
    const { columnGap, gap } = getComputedStyle(container);
    const itemGap = parseFloat(columnGap || gap) || 0;
    return cardWidth + itemGap;
  };
  const maxScroll = () => Math.max(0, container.scrollWidth - container.clientWidth);
  const atEnd = () => Math.ceil(container.scrollLeft + container.clientWidth)
    >= container.scrollWidth - 1;
  const pageCount = () => {
    const step = getStep();
    if (step <= 0 || maxScroll() <= 1) return 1;
    // Any real overflow yields at least two pips; a partial trailing step still
    // gets its own pip so the remaining content is always reachable.
    return Math.ceil(maxScroll() / step) + 1;
  };
  const pipAt = (count) => {
    if (count <= 1) return 0;
    // The last pip maps to the clamped end (a possibly-partial final step); all
    // earlier pips map to whole-card offsets.
    if (atEnd()) return count - 1;
    const step = getStep();
    if (step <= 0) return 0;
    return Math.max(0, Math.min(count - 2, Math.round(container.scrollLeft / step)));
  };

  const dots = [];
  const syncDots = (count) => {
    while (dots.length < count) {
      const dot = createTag('div', { class: 'dot' });
      status.append(dot);
      dots.push(dot);
    }
    while (dots.length > count) dots.pop().remove();
  };

  // The single integrated state. Recomputed from the scroll position; dots, both
  // buttons and the click handlers all read from it.
  let count = 1;
  let pip = 0;
  const render = () => {
    count = pageCount();
    pip = pipAt(count);
    syncDots(count);
    prevButton.disabled = pip <= 0;
    nextButton.disabled = pip >= count - 1;
    dots.forEach((dot, i) => dot.classList.toggle('curr', i === pip));
    const allDisplayed = count <= 1;
    control.classList.toggle('hide', allDisplayed);
    container.classList.toggle('gallery--all-displayed', allDisplayed);
    control.classList.remove('loading');
  };

  const goToPip = (index) => {
    const target = Math.max(0, Math.min(count - 1, index));
    container.scrollTo({ left: target * getStep(), behavior: 'smooth' });
  };
  prevButton.addEventListener('click', () => goToPip(pip - 1));
  nextButton.addEventListener('click', () => goToPip(pip + 1));

  container.addEventListener('scroll', throttle(render, 100, { trailing: true }), { passive: true });
  window.addEventListener('resize', debounce(render, 150));

  // Trigger (not state): render once laid out, and again if the block starts
  // hidden (e.g. inside a tab panel) and later becomes visible.
  const visObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) render();
  }, { threshold: 0 });
  visObserver.observe(container);
  requestAnimationFrame(render);

  control.append(status, prevButton, nextButton);
  return control;
}

export async function buildGallery(
  items,
  container = items?.[0]?.parentNode,
  root = container?.parentNode,
) {
  if (!root) throw new Error('Invalid Gallery input');
  const control = createControl([...items], container);
  container.classList.add('gallery');
  container.setAttribute('tabindex', '0');
  [...items].forEach((item) => {
    item.classList.add('gallery--item');
  });
  root.append(control);
}

export function addSchema(bl, heading) {
  const schema = {
    '@context': 'http://schema.org',
    '@type': 'HowTo',
    name: (heading && heading.textContent.trim()) || document.title,
    step: [],
  };

  bl.querySelectorAll('li').forEach((step, i) => {
    const h = step.querySelector('h3, h4, h5, h6');
    const p = step.querySelector('p');

    if (h && p) {
      schema.step.push({
        '@type': 'HowToStep',
        position: i + 1,
        name: h.textContent.trim(),
        itemListElement: {
          '@type': 'HowToDirection',
          text: p.textContent.trim(),
        },
      });
    }
  });
  document.head.append(createTag('script', { type: 'application/ld+json' }, JSON.stringify(schema)));
}

function getSummaryStepIcon(content) {
  const iconContainer = createTag('div', { class: 'step-icon' });
  const authoredIcon = content.querySelector('.icon');
  if (authoredIcon) {
    const match = iconRegex.exec(authoredIcon.className);
    if (!match?.[1]) {
      authoredIcon.remove();
      return null;
    }

    const icon = getIconElementDeprecated(match[1]);
    if (!(icon instanceof HTMLElement)) {
      authoredIcon.remove();
      return null;
    }
    icon.setAttribute('aria-hidden', 'true');
    if (icon.tagName === 'IMG') icon.setAttribute('alt', '');
    iconContainer.append(icon);
    authoredIcon.remove();
    return iconContainer;
  }

  const firstElement = content.firstElementChild;
  if (firstElement?.tagName === 'P' && firstElement.childElementCount === 1) {
    const picture = firstElement.firstElementChild;
    if (picture?.tagName === 'PICTURE') {
      iconContainer.append(picture);
      firstElement.remove();
      return iconContainer;
    }
  }

  return null;
}

export default async function init(bl) {
  ({ createTag, loadStyle, getConfig } = await import(`${getLibs()}/utils/utils.js`));
  const heading = bl.querySelector('h3, h4, h5, h6');
  const isSummaryVariant = bl.classList.contains('summary');
  if (isSummaryVariant) {
    loadStyle(`${getConfig().codeRoot}/blocks/how-to-cards/how-to-cards-summary.css`);
  }
  const cardsContainer = createTag('ol', { class: 'cards-container' });
  let steps = [...bl.querySelectorAll(':scope > div')];
  if (steps.length > 0 && steps[0].querySelector('h2')) {
    const text = steps[0];
    steps = steps.slice(1);
    text.classList.add('text');
  }
  const cards = steps.map((div, index) => {
    const content = div.querySelector('div');
    if (!content) {
      div.remove();
      return null;
    }
    const li = createTag('li', { class: 'card' });
    if (isSummaryVariant) {
      const stepIcon = getSummaryStepIcon(content);
      if (stepIcon) li.append(stepIcon);
    } else {
      const tipNumber = createTag('div', { class: 'number' });
      tipNumber.append(
        createTag('span', { class: 'number-txt' }, index + 1),
        createTag('div', { class: 'number-bg' }),
      );
      li.append(tipNumber);
    }
    while (content.firstChild) {
      li.append(content.firstChild);
    }
    div.remove();
    cardsContainer.append(li);
    return li;
  }).filter(Boolean);
  bl.append(cardsContainer);

  if (!isSummaryVariant) {
    await buildGallery(cards, cardsContainer, bl);
  }
  // add count-based class to top-level if not already present
  const existingCountClass = [...bl.classList].find((c) => c.startsWith('cards-count-'));
  if (!existingCountClass) {
    bl.classList.add(`cards-count-${cards.length}`);
  }
  if (bl.classList.contains('schema')) {
    addSchema(bl, heading);
  }
  return bl;
}
