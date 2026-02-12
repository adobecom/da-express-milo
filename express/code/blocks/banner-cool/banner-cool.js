import {
  getLibs,
  decorateButtonsDeprecated,
  fixIcons,
  getIconElementDeprecated,
  readBlockConfig,
} from '../../scripts/utils.js';
import { normalizeHeadings } from '../../scripts/utils/decorate.js';
import { formatSalesPhoneNumber } from '../../scripts/utils/location-utils.js';

const AX_HEADING_BY_LEVEL = {
  h2: 'ax-heading-xxl',
  h3: 'ax-body-xl',
  h4: 'ax-body-xs',
};

const CONFIG = {
  headings: ['h2', 'h3', 'h4'],
  logo: {
    icon: 'adobe-express-logo',
    class: 'express-logo',
    target: 'h2',
  },
  logoDark: {
    icon: 'adobe-express-logo-white',
    class: 'express-logo',
    target: 'h2',
  },
  phoneNumber: {
    selector: 'a[title="{{business-sales-numbers}}"]',
  },
  buttons: {
    base: ['accent', 'dark'],
    multiButton: ['reverse'],
    background: ['bg-banner-button'],
    backgroundSecondary: ['bg-banner-button-secondary'],
    remove: ['primary', 'secondary'],
  },
};

let createTag;

function applyVariantFromMetadata(block, section) {
  const metadata = section?.querySelector('.section-metadata');
  if (!metadata) return;
  const config = readBlockConfig(metadata);
  const style = (config.style || '').trim().toLowerCase();
  if (style === 'dark') {
    block.classList.add('dark');
  }
}

function injectLogo(block, section) {
  const metadata = section?.querySelector('.section-metadata');
  if (!metadata) return;

  const config = readBlockConfig(metadata);
  const shouldInject = ['on', 'yes'].includes(config['inject-logo']?.toLowerCase());

  if (shouldInject) {
    const logo = getIconElementDeprecated(block.classList.contains('dark') ? CONFIG.logoDark.icon : CONFIG.logo.icon);
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
    const currentClasses = button.className.split(' ').filter(
      (cls) => cls === 'button' || cls === 'a' || !CONFIG.buttons.remove.includes(cls),
    );
    const buttonClasses = [...currentClasses, ...stylingClasses];
    if (variantClass && isMultiButton && index === 1) {
      buttonClasses.push(...CONFIG.buttons.backgroundSecondary);
    }
    button.className = buttonClasses.join(' ');
  });
}

async function formatPhoneNumbers(block) {
  const tags = block.querySelectorAll(CONFIG.phoneNumber.selector);
  if (tags.length === 0) return;
  try {
    await formatSalesPhoneNumber(tags);
  } catch (e) {
    window.lana?.log('banner-cool.js - error formatting sales phone numbers:', e.message);
  }
}

export default async function decorate(block) {
  const [utils] = await Promise.all([
    import(`${getLibs()}/utils/utils.js`),
    decorateButtonsDeprecated(block),
  ]);
  ({ createTag } = utils);

  const section = block.closest('.section');
  if (section?.style?.background) block.style.background = section.style.background;

  applyVariantFromMetadata(block, section);

  const wrapper = createTag('div', { class: 'banner-cool-wrapper' });
  const innerWrap = createTag('div', { class: 'banner-cool-inner' });
  const contentWrap = createTag('div', { class: 'banner-cool-content' });
  const textWrap = createTag('div', { class: 'banner-cool-text-wrap' });
  const actionsFootnote = createTag('div', { class: 'banner-cool-actions-footnote' });

  while (block.children.length) {
    const child = block.children[0];
    if (child.querySelector('.button-container')) {
      while (block.children.length) actionsFootnote.appendChild(block.children[0]);
    } else {
      textWrap.appendChild(child);
    }
  }

  contentWrap.append(textWrap, actionsFootnote);
  innerWrap.appendChild(contentWrap);
  wrapper.appendChild(innerWrap);
  block.appendChild(wrapper);

  injectLogo(block, section);
  normalizeHeadings(block, CONFIG.headings);
  block.querySelectorAll('h2, h3, h4').forEach((heading) => {
    const level = heading.tagName.toLowerCase();
    const axClass = AX_HEADING_BY_LEVEL[level];
    if (axClass) heading.classList.add(axClass);
  });
  styleButtons(block, true);
  await formatPhoneNumbers(block);
  fixIcons(block);
}
