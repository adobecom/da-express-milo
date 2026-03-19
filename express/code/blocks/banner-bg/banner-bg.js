import { getLibs, decorateButtonsDeprecated, fixIcons, getIconElementDeprecated, readBlockConfig } from '../../scripts/utils.js';
import { normalizeHeadings } from '../../scripts/utils/decorate.js';
import { formatSalesPhoneNumber } from '../../scripts/utils/location-utils.js';

const CONFIG = {
  background: {
    variants: {
      'light-bg': '/express/code/blocks/banner-bg/img/light-bg.jpg',
      'blue-green-pink-bg': '/express/code/blocks/banner-bg/img/blue-green-pink-bg.jpg',
      'blue-bg': '/express/code/blocks/banner-bg/img/blue-bg.jpg',
      'blue-pink-orange-bg': '/express/code/blocks/banner-bg/img/blue-pink-orange-bg.jpg',
      'cool-dark-bg': 'cool-dark-bg',
      'green-blue-red-bg': '/express/code/blocks/banner-bg/img/green-blue-red-bg.jpg',
      'blue-purple-gray-bg': '/express/code/blocks/banner-bg/img/blue-purple-gray-bg.jpg',
      'yellow-pink-blue-bg': '/express/code/blocks/banner-bg/img/yellow-pink-blue-bg.jpg',
      'template-page-bg': null,
    },
    get variantClasses() {
      return Object.keys(this.variants);
    },
  },
  buttons: {
    base: ['accent', 'dark'],
    multiButton: ['reverse'],
    background: ['bg-banner-button'],
    backgroundSecondary: ['bg-banner-button-secondary'],
    remove: ['primary', 'secondary'],
  },
  headings: ['h2', 'h3', 'h4'],
  logo: {
    icon: 'adobe-express-logo',
    iconDark: 'adobe-express-logo-white',
    class: 'express-logo',
    target: 'H2',
  },
  phoneNumber: {
    selector: 'a[title="{{business-sales-numbers}}"]',
  },
};

let createTag;

function detectBackgroundVariant(block) {
  return CONFIG.background.variantClasses.find(
    (className) => block.classList.contains(className),
  ) || null;
}

function preloadBackgroundImage(imagePath) {
  // if imagePath is not a valid URL, return
  if (!imagePath || !imagePath.startsWith('/') || document.querySelector(`link[href="${imagePath}"]`)) {
    return;
  }

  const preloadLink = document.createElement('link');
  preloadLink.rel = 'preload';
  preloadLink.as = 'image';
  preloadLink.href = imagePath;
  document.head.appendChild(preloadLink);
}

function createBackgroundContainer(block) {
  const container = createTag('div', { class: 'background-container' });

  while (block.firstChild) {
    container.appendChild(block.firstChild);
  }

  block.appendChild(container);
  normalizeHeadings(block, CONFIG.headings);
}

// ============================================================================
// CONTENT ENHANCEMENT
// ============================================================================

/**
 * Injects Adobe Express logo if configured
 * @param {HTMLElement} block - The banner block element
 * @param {HTMLElement} section - The parent section element
 */
function injectLogo(block, section) {
  const metadata = section?.querySelector('.section-metadata');
  if (!metadata) return;

  const config = readBlockConfig(metadata);
  const shouldInject = ['on', 'yes'].includes(config['inject-logo']?.toLowerCase());

  if (shouldInject) {
    const iconName = theme === 'dark' ? CONFIG.logo.iconDark : CONFIG.logo.icon;
    const logo = getIconElementDeprecated(iconName);
    logo.classList.add(CONFIG.logo.class);
    block.querySelector(CONFIG.logo.target)?.parentElement?.prepend(logo);
  }
}

function styleButtons(block, variantClass) {
  const buttons = Array.from(block.querySelectorAll('a.button'));
  if (buttons.length === 0) return;

  const isMultiButton = buttons.length > 1;
  if (isMultiButton) {
    block.classList.add('multi-button');
  }

  const stylingClasses = [...CONFIG.buttons.base];

  if (variantClass) {
    stylingClasses.push(...CONFIG.buttons.background);
  }

  if (isMultiButton) {
    stylingClasses.push(...CONFIG.buttons.multiButton);
  }

  buttons.forEach((button, index) => {
    const currentClasses = button.className.split(' ').filter((cls) => cls === 'button' || cls === 'a' || !CONFIG.buttons.remove.includes(cls));

    const buttonClasses = [...currentClasses, ...stylingClasses];

    if (variantClass && isMultiButton && index === 1) {
      buttonClasses.push(...CONFIG.buttons.backgroundSecondary);
    }

    button.className = buttonClasses.join(' ');
  });
}

async function formatPhoneNumbers(block) {
  const phoneTags = block.querySelectorAll(CONFIG.phoneNumber.selector);
  if (phoneTags.length === 0) return;

  try {
    await formatSalesPhoneNumber(phoneTags);
  } catch (error) {
    window.lana?.log('banner-bg.js - error formatting phone numbers:', error.message);
  }
}

async function initializeDependencies(block) {
  const [utils] = await Promise.all([
    import(`${getLibs()}/utils/utils.js`),
    decorateButtonsDeprecated(block),
  ]);
  ({ createTag } = utils);
}

function applyAuthoredBackground(block) {
  const firstRow = block.querySelector(':scope > div:first-child');
  if (!firstRow) return false;

  const textContent = firstRow.textContent?.trim();
  const isGradientOrBackground = textContent
    && (textContent.includes('linear-gradient')
      || textContent.includes('radial-gradient')
      || textContent.includes('conic-gradient')
      || textContent.startsWith('background:')
      || /^#[0-9A-Fa-f]{3,8}$/.test(textContent));

  if (isGradientOrBackground) {
    let backgroundValue = textContent;
    if (backgroundValue.startsWith('background:')) {
      backgroundValue = backgroundValue.replace(/^background:\s*/, '');
    }
    backgroundValue = backgroundValue.replace(/;$/, '');
    block.style.background = backgroundValue;
    block.classList.add('has-custom-bg');
    firstRow.remove();
    return true;
  }
  return false;
}

function setupBackground(block) {
  const variantClass = detectBackgroundVariant(block);
  const hasBackground = variantClass !== null;

  if (hasBackground) {
    const hasAuthoredBg = applyAuthoredBackground(block);
    if (!hasAuthoredBg) {
      const imagePath = CONFIG.background.variants[variantClass];
      if (imagePath) {
        preloadBackgroundImage(imagePath);
      }
    }
    createBackgroundContainer(block);
  }

  return variantClass;
}

function handleSectionInheritance(block) {
  const section = block.closest('.section');

  if (section?.style?.background) {
    block.style.background = section.style.background;
  }

  return section;
}

async function enhanceContent(block, section, variantClass) {
  const logoTheme = variantClass === 'cool-dark-bg' ? 'dark' : 'light';
  injectLogo(block, section, logoTheme);
  styleButtons(block, variantClass);
  await formatPhoneNumbers(block);
  fixIcons(block);
}

export default async function decorate(block) {
  await initializeDependencies(block);
  const variantClass = setupBackground(block);
  const section = handleSectionInheritance(block);
  await enhanceContent(block, section, variantClass);
}
