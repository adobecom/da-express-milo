import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';
import { createAccessibilityVideoControls } from '../../scripts/utils/media.js';

// Constants for better maintainability
const METADATA_KEYS = {
  MARQUEE_INJECT_LOGO: 'marquee-inject-logo',
};

const CLASS_NAMES = {
  BUTTON_CONTAINER: 'button-container',
  QUICK_LINK: 'quick-link',
  BUTTON: 'button',
  ACCENT: 'accent',
  EXPRESS_LOGO: 'express-logo',
  HERO_TOP: 'hero-top-mobile',
  HERO_ANIMATION_OVERLAY: 'hero-animation-overlay',
  VIDEO_CONTAINER: 'video-container',
  AX_MARQUEE_DYNAMIC_HERO: 'ax-marquee-dynamic-hero',
};

const LOGO_INJECT_VALUES = ['on', 'yes'];

let getMetadata;

/**
 * Adds button styling classes to the CTA link
 * @param {Element} block - The main block element
 */
function setupButtonStyling(block) {
  const heading = block.querySelector('h1,h2,h3:first-of-type');
  heading?.classList.add('heading');
  if (!heading) return;

  const pWithLink = block.querySelector('p:has(a)');
  if (!pWithLink) return;

  pWithLink.classList.add(CLASS_NAMES.BUTTON_CONTAINER);

  const link = pWithLink.querySelector('a');
  if (link) {
    link.classList.add(CLASS_NAMES.QUICK_LINK, CLASS_NAMES.BUTTON, CLASS_NAMES.ACCENT);
  }
}

/**
 * Sets up video accessibility controls and container structure
 * @param {Element} block - The main block element
 */
async function setupVideoControls(block) {
  const videoElement = block.querySelector('video');
  if (!videoElement) return;

  try {
    const videoParent = videoElement.closest('div');
    if (videoParent) {
      videoParent.classList.add(CLASS_NAMES.HERO_ANIMATION_OVERLAY);
    }

    await createAccessibilityVideoControls(videoElement);
  } catch (error) {
    window.lana?.log('Error creating video controls:', error);
  }
}

/**
 * Places the Adobe Express logo in the appropriate location
 * @param {Element} block - The main block element
 */
function placeLogo(block) {
  const shouldInjectLogo = LOGO_INJECT_VALUES.includes(
    getMetadata(METADATA_KEYS.MARQUEE_INJECT_LOGO)?.toLowerCase(),
  );

  if (!shouldInjectLogo) return;

  const logo = getIconElementDeprecated('adobe-express-logo');
  logo.classList.add(CLASS_NAMES.EXPRESS_LOGO);

  const headerElement = block.querySelector('h1,h2,h3:first-of-type');

  if (headerElement?.parentElement) {
    headerElement.parentElement.insertBefore(logo, headerElement);
  }
}

/**
 * Main decorator function for ax-marquee-dynamic-hero block
 * Handles button styling, video controls, logo placement, and analytics
 * @param {Element} block - The main block element
 */
export default async function decorate(block) {
  await Promise.all([import(`${getLibs()}/utils/utils.js`)]).then(([utils]) => {
    ({ getMetadata } = utils);
  });

  setupButtonStyling(block);
  await setupVideoControls(block);
  placeLogo(block);
}
