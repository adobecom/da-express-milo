import { getIconElementDeprecated, getLibs } from '../utils.js';

let createTag;
let getConfig;
let loadStyle;
let currentVisibleTooltip = null;

/* ========================================
   CSS and Position Management
   ======================================== */

export function adjustElementPosition() {
  const elements = document.querySelectorAll('.tooltip-text');
  if (elements.length === 0) return;
  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      element.classList.remove('overflow-left');
      element.classList.add('overflow-right');
    } else if (rect.left < 0) {
      element.classList.remove('overflow-right');
      element.classList.add('overflow-left');
    }
  }
}

export function getTooltipMatch(elements, tooltipPattern) {
  let tooltipMatch;
  let tooltipContainer;
  let nodes = elements;
  if (elements instanceof Element || elements === document) {
    nodes = elements.querySelectorAll ? elements.querySelectorAll('p') : [];
  }
  Array.from(nodes).forEach((p) => {
    const localPattern = new RegExp(tooltipPattern.source, tooltipPattern.flags);
    const match = localPattern.exec(p.textContent);
    if (match && !tooltipMatch) {
      tooltipMatch = match;
      tooltipContainer = p;
    }
  });
  return { tooltipMatch, tooltipContainer };
}
/* ========================================
   Legacy Tooltip Functions
   ======================================== */

function buildTooltip(elements, tooltipPattern) {
  let tooltipMatch;
  let tooltipContainer;

  let nodes = elements;
  if (elements instanceof Element || elements === document) {
    nodes = elements.querySelectorAll ? elements.querySelectorAll('p') : [];
  }

  Array.from(nodes).forEach((p) => {
    const localPattern = new RegExp(tooltipPattern.source, tooltipPattern.flags);
    const match = localPattern.exec(p.textContent);
    if (match) {
      tooltipMatch = match;
      tooltipContainer = p;
    }
  });
  if (!tooltipMatch) return;

  const cleanupPattern = new RegExp(tooltipPattern.source, tooltipPattern.flags);
  tooltipContainer.innerHTML = tooltipContainer.innerHTML.replace(cleanupPattern, '');
  const tooltipContent = tooltipMatch[2];
  tooltipContainer.classList.add('tooltip');

  const tooltipPopup = createTag('div', { class: 'tooltip-text' });
  tooltipPopup.innerText = tooltipContent;

  const infoIcon = getIconElementDeprecated('info', 44, 'Info', 'tooltip-icon');
  const tooltipButton = createTag('button');
  tooltipButton.setAttribute('aria-label', tooltipContent);

  tooltipButton.append(infoIcon);
  tooltipButton.append(tooltipPopup);
  tooltipContainer.append(tooltipButton);

  let isTooltipVisible = false;
  let hideTimeout;
  let isMouseOverIcon = false;
  let isMouseOverTooltip = false;

  const showTooltip = () => {
    clearTimeout(hideTimeout);
    if (currentVisibleTooltip && currentVisibleTooltip !== tooltipButton) {
      currentVisibleTooltip.classList.remove('hover');
      currentVisibleTooltip.querySelector('.tooltip-text').classList.remove('hover');
    }
    isTooltipVisible = true;
    tooltipButton.classList.add('hover');
    tooltipPopup.classList.add('hover');
    currentVisibleTooltip = tooltipButton;
  };

  const hideTooltip = () => {
    isTooltipVisible = false;
    tooltipButton.classList.remove('hover');
    tooltipPopup.classList.remove('hover');
    if (currentVisibleTooltip === tooltipButton) {
      currentVisibleTooltip = null;
    }
  };

  const checkAndHideTooltip = () => {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      if (!isMouseOverIcon && !isMouseOverTooltip) {
        hideTooltip();
      }
    }, 300);
  };

  const toggleTooltip = () => {
    if (isTooltipVisible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  };

  tooltipButton.addEventListener('click', (e) => {
    e.preventDefault();
    adjustElementPosition();
    toggleTooltip();
  });

  window.addEventListener('resize', adjustElementPosition);
  infoIcon.addEventListener('mouseenter', () => {
    isMouseOverIcon = true;
    showTooltip();
  });

  infoIcon.addEventListener('mouseleave', () => {
    isMouseOverIcon = false;
    checkAndHideTooltip();
  });

  tooltipPopup.addEventListener('mouseenter', () => {
    isMouseOverTooltip = true;
    clearTimeout(hideTimeout);
  });

  tooltipPopup.addEventListener('mouseleave', () => {
    isMouseOverTooltip = false;
    checkAndHideTooltip();
  });

  tooltipButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    toggleTooltip();
  });

  document.addEventListener('touchstart', (e) => {
    if (isTooltipVisible && !tooltipButton.contains(e.target)) {
      hideTooltip();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.activeElement.blur();
      hideTooltip();
    }
  });
}

export default async function handleTooltip(pricingArea, tooltipPattern = /\(\(([^]+)\)\)([^]+)\(\(\/([^]+)\)\)/g) {
  await Promise.all([import(`${getLibs()}/utils/utils.js`)]).then(([utils]) => {
    ({ createTag, getConfig, loadStyle } = utils);
  });
  return new Promise((resolve) => {
    loadStyle(`${getConfig().codeRoot}/scripts/widgets/tooltip.css`);
    buildTooltip(pricingArea, tooltipPattern);
    resolve();
  });
}
