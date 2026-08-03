import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';
import { throttle, debounce } from '../../scripts/utils/hofs.js';

let createTag;
let loadStyle;
let getConfig;
const iconRegex = /icon-([^\s]+)/;

const scrollPaddingFallback = 32;

function getScrollPadding(container) {
  const root = container.closest('.how-to-cards') || container;
  const value = getComputedStyle(root).getPropertyValue('--gallery-first-item-margin');
  return parseFloat(value) || scrollPaddingFallback;
}

function getSidePadding(container) {
  const root = container.closest('.how-to-cards') || container;
  const value = getComputedStyle(root).getPropertyValue('--side-padding');
  return parseFloat(value) || 0;
}

function scrollWithOffset(target, container, offset = getScrollPadding(container)) {
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const left = targetRect.left - containerRect.left + container.scrollLeft - offset;
  container.scrollTo({ left, behavior: 'smooth' });
}

function isFullyInView(item, container) {
  const itemRect = item.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  if (
    !itemRect.width
    || !itemRect.height
    || !containerRect.width
    || !containerRect.height
  ) return false;
  const tolerance = 1;
  // The rightmost visible card must clear its trailing --side-padding gap to
  // qualify as fully in view, matching the block's end padding.
  const sidePadding = getSidePadding(container);
  return itemRect.left >= containerRect.left - tolerance
    && itemRect.right + sidePadding <= containerRect.right + tolerance
    && itemRect.top >= containerRect.top - tolerance
    && itemRect.bottom <= containerRect.bottom + tolerance;
}

function areEdgeItemsFullyInView(items, container) {
  if (!items.length) return false;
  return isFullyInView(items[0], container)
    && isFullyInView(items[items.length - 1], container);
}

function getFullyFittableCardCount(items, container, fallbackCount = items.length) {
  const containerWidth = container.clientWidth || container.getBoundingClientRect().width;
  if (!containerWidth) return fallbackCount;

  const { columnGap, gap } = getComputedStyle(container);
  const itemGap = parseFloat(columnGap || gap) || 0;
  let usedWidth = 0;
  let fitCount = 0;

  for (const item of items) {
    const itemWidth = item.offsetWidth || item.getBoundingClientRect().width;
    if (!itemWidth) return fallbackCount;

    const { marginLeft, marginRight } = getComputedStyle(item);
    const outerWidth = itemWidth + (parseFloat(marginLeft) || 0) + (parseFloat(marginRight) || 0);
    const nextWidth = usedWidth + (fitCount ? itemGap : 0) + outerWidth;
    if (nextWidth > containerWidth + 1) break;
    usedWidth = nextWidth;
    fitCount += 1;
  }

  return Math.max(1, fitCount);
}

function getClicksToFullyShowLastCard(items, container, fallbackCount) {
  const fitCount = getFullyFittableCardCount(items, container, fallbackCount);
  return Math.max(0, items.length - fitCount);
}

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

function createControl(items, container) {
  const control = createTag('div', { class: 'gallery-control loading' });
  const status = createTag('div', { class: 'status' });
  const prevButton = createChevronButton('prev', 'Previous');
  const nextButton = createChevronButton('next', 'Next');

  const intersecting = Array.from(items).fill(false);

  const pageInc = throttle((inc) => {
    const first = intersecting.indexOf(true);
    if (first === -1) return; // middle of swapping only page
    const visibleCount = Math.max(1, intersecting.lastIndexOf(true) - first + 1);
    const maxFirst = getClicksToFullyShowLastCard(items, container, visibleCount);
    const targetIndex = Math.max(0, Math.min(maxFirst, first + inc));
    if (targetIndex === first) return; // no looping
    const target = items[targetIndex];
    scrollWithOffset(target, container);
  }, 200);
  prevButton.addEventListener('click', () => pageInc(-1));
  nextButton.addEventListener('click', () => pageInc(1));

  const dots = [];
  const createDot = () => {
    const dot = createTag('div', { class: 'dot' });
    status.append(dot);
    return dot;
  };
  const syncDots = (visibleCount) => {
    const clickCount = getClicksToFullyShowLastCard(items, container, visibleCount);
    const dotCount = clickCount + 1;
    while (dots.length < dotCount) dots.push(createDot());
    while (dots.length > dotCount) dots.pop().remove();
  };
  syncDots();

  const updateDOM = debounce((first, last) => {
    const visibleCount = Math.max(1, last - first + 1);
    const maxFirst = getClicksToFullyShowLastCard(items, container, visibleCount);
    syncDots(visibleCount);
    prevButton.disabled = first === 0;
    nextButton.disabled = first >= maxFirst;
    dots.forEach((dot, i) => {
      i === Math.min(first, maxFirst) ? dot.classList.add('curr') : dot.classList.remove('curr');
    });
    items.forEach((item, i) => {
      i === first ? item.classList.add('curr') : item.classList.remove('curr');
    });
    if (areEdgeItemsFullyInView(items, container)) {
      control.classList.add('hide');
      container.classList.add('gallery--all-displayed');
    } else {
      control.classList.remove('hide');
      container.classList.remove('gallery--all-displayed');
    }
    control.classList.remove('loading');
  }, 300);

  const updateFromState = () => {
    const [first, last] = [intersecting.indexOf(true), intersecting.lastIndexOf(true)];
    if (first === -1) {
      syncDots();
      return;
    }
    updateDOM(first, last);
  };
  window.addEventListener('resize', debounce(updateFromState, 300));

  const reactToChange = (entries) => {
    entries.forEach((entry) => {
      intersecting[items.indexOf(entry.target)] = entry.isIntersecting;
    });
    updateFromState();
  };

  const scrollObserver = new IntersectionObserver((entries) => {
    reactToChange(entries);
  }, {
    root: container,
    threshold: 1,
    rootMargin: `0px ${getScrollPadding(container)}px 0px ${getScrollPadding(container)}px`,
  });

  items.forEach((item) => scrollObserver.observe(item));

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
