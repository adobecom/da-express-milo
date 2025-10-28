import { getIconElementDeprecated, createTag, getLibs } from '../utils.js';

let getConfig;
let currentVisibleTooltip = null;

/* ========================================
   CSS and Position Management
   ======================================== */

export async function onImageTooltipCSSLoad() {
  const config = getConfig();
  const stylesheetHref = `${config.codeRoot}/scripts/widgets/image-tooltip.css`;
  await new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = stylesheetHref;
    link.onload = resolve;
    link.onerror = () => reject(new Error(`Failed to load ${stylesheetHref}`));
    document.head.appendChild(link);
  });
}

export function adjustImageTooltipPosition() {
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

/* ========================================
   Image Tooltip Helper Functions
   ======================================== */

function parseImageMetadata(altText) {
  const altMatch = altText.match(/alt-text:\s*([^,]+)/);
  const actualAlt = altMatch ? altMatch[1].trim().split(';')[0] : '';
  const tooltipMatch = altText.match(/tooltip-text:\s*([^,]+)/);
  const tooltipText = tooltipMatch ? tooltipMatch[1].trim().split(';')[0] : '';
  const categoryMatch = altText.match(/category:\s*premium/);
  const isPremium = !!categoryMatch;
  const iconMatch = altText.match(/icon:\s*([^,]+)/);
  const icon = iconMatch ? iconMatch[1].trim().split(';')[0] : '';
  return { actualAlt, tooltipText, isPremium, icon };
}

function createTooltipElements(imgElement, tooltipText, actualIconImage) {
  const tooltipContainer = createTag('div', { class: 'image-tooltip' });
  const tooltipPopup = createTag('div', { class: 'tooltip-text' });
  tooltipPopup.innerText = tooltipText;
  const tooltipButton = createTag('button');
  tooltipButton.setAttribute('aria-label', tooltipText);
  actualIconImage.classList.add('tooltip-icon-img');
  tooltipButton.append(actualIconImage);
  tooltipButton.append(tooltipPopup);

  return { tooltipContainer, tooltipButton, tooltipPopup };
}

function addPremiumIcon(tooltipContainer) {
  const premiumWrapper = createTag('div', { class: 'premium-icon-wrapper' });
  const premiumIcon = createTag('img', {
    src: '/express/code/icons/premium.svg',
    alt: 'Premium',
    class: 'premium-icon',
  });
  premiumWrapper.append(premiumIcon);
  tooltipContainer.append(premiumWrapper);
}

/* istanbul ignore next */
function setupTooltipEventHandlers(tooltipButton, tooltipPopup) {
  let isTooltipVisible = false;
  let hideTimeout;
  let isMouseOverIcon = false;
  let isMouseOverTooltip = false;

  const clearAllTooltips = () => {
    document.querySelectorAll('.image-tooltip').forEach((tooltip) => {
      tooltip.classList.remove('hover');
      tooltip.querySelector('.tooltip-text').classList.remove('hover');
    });
  };

  const showTooltip = () => {
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

  // Click and touch events - just focus the button
  tooltipButton.addEventListener('click', (e) => e.target.focus());
  tooltipButton.addEventListener('touchstart', (e) => e.target.focus());

  // Focus management
  tooltipButton.addEventListener('focus', () => {
    clearAllTooltips();
    showTooltip();
    adjustImageTooltipPosition();
  });

  tooltipButton.addEventListener('blur', () => hideTooltip());

  // Mouse events for desktop
  tooltipButton.addEventListener('mouseenter', (e) => {
    e.stopPropagation();
    clearAllTooltips();
    isMouseOverIcon = true;
    showTooltip();
  });

  tooltipButton.addEventListener('mouseleave', () => {
    isMouseOverIcon = false;
    checkAndHideTooltip();
  });

  tooltipPopup.addEventListener('mouseenter', (e) => {
    e.stopPropagation();
    isMouseOverTooltip = true;
    clearTimeout(hideTimeout);
  });

  tooltipPopup.addEventListener('mouseleave', () => {
    isMouseOverTooltip = false;
    checkAndHideTooltip();
  });

  // Global events
  window.addEventListener('resize', adjustImageTooltipPosition);

  document.addEventListener('touchstart', (e) => {
    if (isTooltipVisible && !tooltipButton.contains(e.target)) {
      document.activeElement.blur();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.activeElement.blur();
      hideTooltip();
    }
  });
}

export default async function handleImageTooltip(imgElement) {
  if (!imgElement || imgElement.tagName !== 'IMG') return;
  await Promise.all([import(`${getLibs()}/utils/utils.js`)]).then(([utils]) => {
    ({ getConfig } = utils);
  });
  await onImageTooltipCSSLoad();

  const altText = imgElement.alt || '';
  const { actualAlt, tooltipText, isPremium, icon } = parseImageMetadata(altText);

  const actualIconImage = icon ? getIconElementDeprecated(icon, 44, actualAlt, 'tooltip-icon') : null;

  if (!tooltipText) return;

  imgElement.alt = actualAlt;

  const { tooltipContainer, tooltipButton, tooltipPopup } = createTooltipElements(
    imgElement,
    tooltipText,
    actualIconImage,
  );

  imgElement.replaceWith(tooltipContainer);
  tooltipContainer.append(tooltipButton);

  if (isPremium) {
    addPremiumIcon(tooltipContainer);
  }

  setupTooltipEventHandlers(tooltipButton, tooltipPopup);
}
