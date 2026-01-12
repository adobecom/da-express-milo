import { getLibs, createTag } from '../../scripts/utils.js';
import { throttle } from '../../scripts/utils/hofs.js';

const ANIMATION_DURATION = 300;
const ANIMATION_BUFFER = 10;
const SCROLL_THRESHOLD = 100;
const SCROLL_THROTTLE = 100;
const MOBILE_BREAKPOINT = 768;

let loadStyle;
let getConfig;
let accordionInstanceCounter = 0;

const eventHandlers = new WeakMap();
const buttonCache = new WeakMap();

async function initUtils() {
  if (!loadStyle) {
    const utils = await import(`${getLibs()}/utils/utils.js`);
    ({ loadStyle, getConfig } = utils);
  }
}

function createAccordionItem(container, { title, content }, index) {
  const itemContainer = createTag('div', { class: 'ax-accordion-item-container' });
  const instanceId = accordionInstanceCounter;
  accordionInstanceCounter += 1;
  const buttonId = `ax-accordion-button-${instanceId}-${index}`;
  const panelId = `ax-accordion-panel-${instanceId}-${index}`;
  const itemButton = createTag('button', {
    class: 'ax-accordion-item-title-container',
    'aria-expanded': 'false',
    'aria-controls': panelId,
    id: buttonId,
  });
  const itemTitle = createTag('span', { class: 'ax-accordion-item-title' }, title);
  const itemIcon = createTag('div', {
    class: 'ax-accordion-item-icon',
    'aria-hidden': 'true',
  });
  itemButton.append(itemTitle, itemIcon);

  const itemDescription = createTag('div', {
    class: 'ax-accordion-item-description',
    id: panelId,
    role: 'region',
    'aria-labelledby': buttonId,
    'aria-hidden': 'true',
  });
  const contentWrapper = createTag('div');
  contentWrapper.innerHTML = content;
  itemDescription.appendChild(contentWrapper);
  itemContainer.append(itemButton, itemDescription);
  itemButton.addEventListener('click', () => {
    let cachedButtons = buttonCache.get(container);
    if (!cachedButtons || cachedButtons.length === 0) {
      cachedButtons = Array.from(container.querySelectorAll('.ax-accordion-item-title-container'));
      buttonCache.set(container, cachedButtons);
    }
    cachedButtons.forEach((btn) => {
      if (btn !== itemButton && btn.getAttribute('aria-expanded') === 'true') {
        btn.setAttribute('aria-expanded', 'false');
        const otherDescription = btn.nextElementSibling;
        if (otherDescription) {
          otherDescription.setAttribute('aria-hidden', 'true');
        }
      }
    });
    const isExpanded = itemButton.getAttribute('aria-expanded') === 'true';
    itemButton.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
    itemDescription.setAttribute('aria-hidden', isExpanded ? 'true' : 'false');
    if (!isExpanded) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          // Find scrollable parent container
          let scrollParent = itemContainer.parentElement;
          while (scrollParent && scrollParent !== document.body) {
            const { overflowY } = window.getComputedStyle(scrollParent);
            if (overflowY === 'auto' || overflowY === 'scroll') {
              break;
            }
            scrollParent = scrollParent.parentElement;
          }
          // If in a scrollable container, check visibility within that container
          if (scrollParent && scrollParent !== document.body) {
            const containerRect = scrollParent.getBoundingClientRect();
            const itemRect = itemContainer.getBoundingClientRect();
            const isAboveContainer = itemRect.top < containerRect.top;
            const isBelowContainer = itemRect.bottom > containerRect.bottom;
            if (isAboveContainer || isBelowContainer) {
              itemContainer.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest',
              });
            }
          } else {
            // Fallback: check against viewport
            const rect = itemContainer.getBoundingClientRect();
            const needsScroll = rect.top < 0 || rect.bottom > window.innerHeight;
            if (needsScroll) {
              itemContainer.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest',
              });
            }
          }
        });
      }, ANIMATION_DURATION + ANIMATION_BUFFER);
    }
  });
  return itemContainer;
}

function buildAccordion(block, items, forceExpandTitle = null) {
  const existingItems = block.querySelectorAll('.ax-accordion-item-container');
  const existingTitles = Array.from(existingItems).map((item) => {
    const titleElement = item.querySelector('.ax-accordion-item-title');
    return titleElement?.textContent?.trim();
  });
  const newTitles = items.map((item) => item.title);
  const isSameStructure = existingTitles.length === newTitles.length
    && existingTitles.every((title, index) => title === newTitles[index]);
  const currentlyExpandedTitle = Array.from(existingItems)
    .map((item) => {
      const button = item.querySelector('.ax-accordion-item-title-container');
      const titleElement = item.querySelector('.ax-accordion-item-title');
      return button?.getAttribute('aria-expanded') === 'true'
        ? titleElement?.textContent?.trim()
        : null;
    })
    .find((title) => title !== null);
  const isForceExpandAlreadyExpanded = forceExpandTitle
    && forceExpandTitle === currentlyExpandedTitle;
  if (isSameStructure && (!forceExpandTitle || isForceExpandAlreadyExpanded)) {
    existingItems.forEach((existingItem, index) => {
      const descriptionElement = existingItem.querySelector('.ax-accordion-item-description > *');
      if (descriptionElement && items[index]) {
        const newContent = items[index].content;
        const currentContent = descriptionElement.innerHTML;
        if (currentContent !== newContent) {
          descriptionElement.innerHTML = newContent;
        }
      }
    });
    return;
  }
  let expandedTitle = forceExpandTitle;
  if (!expandedTitle) {
    existingItems.forEach((item) => {
      const button = item.querySelector('.ax-accordion-item-title-container');
      if (button?.getAttribute('aria-expanded') === 'true') {
        const titleElement = item.querySelector('.ax-accordion-item-title');
        expandedTitle = titleElement?.textContent?.trim();
      }
    });
  }
  existingItems.forEach((item) => item.remove());
  buttonCache.delete(block);
  items.forEach((item, index) => {
    const accordionItem = createAccordionItem(block, item, index);
    block.appendChild(accordionItem);
    if (expandedTitle && item.title === expandedTitle) {
      const button = accordionItem.querySelector('.ax-accordion-item-title-container');
      const description = button.nextElementSibling;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          button.setAttribute('aria-expanded', 'true');
          if (description) {
            description.setAttribute('aria-hidden', 'false');
          }
        });
      });
    }
  });
}

function extractItemsFromBlock(block) {
  const items = [];
  const rows = Array.from(block.children);
  rows.forEach((row) => {
    const cells = Array.from(row.children);
    if (cells.length >= 2) {
      items.push({
        title: cells[0].textContent.trim(),
        content: cells[1].innerHTML,
      });
    }
  });
  return items;
}

function setupAutoCollapse(block) {
  let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollHandler = throttle(() => {
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    if (!isMobile) return;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const isScrollingUp = scrollTop < lastScrollTop;
    if (isScrollingUp) {
      const blockRect = block.getBoundingClientRect();
      if (blockRect.top > SCROLL_THRESHOLD) {
        const expandedButtons = block.querySelectorAll('.ax-accordion-item-title-container[aria-expanded="true"]');
        if (expandedButtons.length > 0) {
          expandedButtons.forEach((button) => {
            button.setAttribute('aria-expanded', 'false');
            const description = button.nextElementSibling;
            if (description) {
              description.setAttribute('aria-hidden', 'true');
            }
          });
        }
      }
    }
    lastScrollTop = scrollTop;
  }, SCROLL_THROTTLE);
  const existingHandlers = eventHandlers.get(block);
  if (existingHandlers?.scrollHandler) {
    window.removeEventListener('scroll', existingHandlers.scrollHandler);
  }
  eventHandlers.set(block, { scrollHandler });
  window.addEventListener('scroll', scrollHandler, { passive: true });
}

export default async function decorate(block) {
  await initUtils();
  const config = getConfig();
  await new Promise((resolve) => {
    loadStyle(`${config.codeRoot}/blocks/ax-accordion/ax-accordion.css`, resolve);
  });
  let items;
  if (block.accordionData && Array.isArray(block.accordionData)) {
    items = block.accordionData;
  } else {
    items = extractItemsFromBlock(block);
  }
  setupAutoCollapse(block);
  buildAccordion(block, items);
  block.updateAccordion = (newItems, forceExpandTitle = null) => {
    buildAccordion(block, newItems, forceExpandTitle);
  };
  block.destroyAccordion = () => {
    const handlers = eventHandlers.get(block);
    if (handlers?.scrollHandler) {
      window.removeEventListener('scroll', handlers.scrollHandler);
    }
    eventHandlers.delete(block);
    buttonCache.delete(block);
    block.innerHTML = '';
    delete block.updateAccordion;
    delete block.destroyAccordion;
    delete block.accordionData;
  };
}
