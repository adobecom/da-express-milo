import { getIconElementDeprecated, getMetadata } from '../../scripts/utils.js';
import { createAccessibilityVideoControls } from '../../scripts/utils/media.js';
import { addFreePlanWidget } from '../../scripts/widgets/free-plan.js';

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
 * Synchronous first paint: heading, CTA and logo styling, built only from authored content and
 * page metadata. Safe to call before Milo's setConfig (no getConfig, no fetch). The free plan
 * widget and video controls are async and stay in decorate.
 * Called early by scripts.js when the page opts in with `hero-fast`, otherwise by decorate.
 */
export function renderCritical(block) {
  if (block.dataset.heroFast === 'rendered') return true;
  const heading = block.querySelector('h1,h2,h3:first-of-type');
  heading?.classList.add('heading');

  const pWithLink = heading && block.querySelector('p:has(a)');
  if (pWithLink) {
    pWithLink.classList.add(CLASS_NAMES.BUTTON_CONTAINER);
    pWithLink.querySelector('a')?.classList.add(
      CLASS_NAMES.QUICK_LINK,
      CLASS_NAMES.BUTTON,
      CLASS_NAMES.ACCENT,
    );
  }

  block.querySelector('video')?.closest('div')?.classList.add(CLASS_NAMES.HERO_ANIMATION_OVERLAY);
  placeLogo(block);
  block.dataset.heroFast = 'rendered';
  return true;
}

/**
 * Main decorator function for ax-marquee-dynamic-hero block
 * Handles button styling, video controls, logo placement, and analytics
 * @param {Element} block - The main block element
 */
export default async function decorate(block) {
  renderCritical(block);

  const link = block.querySelector('h1,h2,h3:first-of-type') && block.querySelector('p:has(a) a');
  if (link) await addFreePlanWidget(link.parentElement);

  const videoElement = block.querySelector('video');
  if (!videoElement) return;
  try {
    await createAccessibilityVideoControls(videoElement);
  } catch (error) {
    window.lana?.log(`Error creating video controls: ${error}`, { tags: 'ax-marquee-dynamic-hero', severity: 'error' });
  }
}
