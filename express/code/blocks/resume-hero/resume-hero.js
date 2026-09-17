import { getLibs, getIconElementDeprecated, getMetadata } from '../../scripts/utils.js';

const CLASS_NAMES = {
  BUTTON: 'button',
  ACCENT: 'accent',
  BUTTON_CONTAINER: 'button-container',
};

const LOGO_INJECT_VALUES = ['on', 'yes'];

let createTag;
let getConfig;
let loadStyle;

/**
 * Adds button styling classes to every CTA and marks the media cell.
 * @param {Element} block - The main block element
 * @returns {Element|null} The subcopy paragraph (body text without links)
 */
function setupButtonStyling(block) {
  const heading = block.querySelector('h1,h2,h3:first-of-type');
  heading?.classList.add('heading');

  block.querySelectorAll('p:has(a)').forEach((p) => {
    p.classList.add(CLASS_NAMES.BUTTON_CONTAINER);
    p.querySelectorAll('a').forEach((link) => {
      link.classList.add(CLASS_NAMES.BUTTON, CLASS_NAMES.ACCENT);
    });
  });

  block.querySelector('div:has(> picture)')?.classList.add('media');

  return block.querySelector('p:not(:has(a))') || null;
}

/**
 * Injects the Adobe Express branding logo above the heading when enabled
 * via the `marquee-inject-logo` page metadata.
 * @param {Element} block - The main block element
 */
function injectBrandingLogo(block) {
  const shouldInject = LOGO_INJECT_VALUES.includes(
    getMetadata('marquee-inject-logo')?.toLowerCase()?.trim(),
  );
  if (!shouldInject) return;

  const logo = getIconElementDeprecated('adobe-express-logo');
  logo.classList.add('express-logo');

  const heading = block.querySelector('[class*="heading"]');
  heading?.parentElement?.insertBefore(logo, heading);
}

/**
 * Builds the verb-dropzone resume-builder widget and initializes it in place.
 * @param {Element} anchor - Element to insert the widget after (the subcopy)
 */
async function embedResumeDropzone(anchor) {
  if (!anchor) return;

  const dropzoneBlock = createTag('div', { class: 'verb-dropzone resume-builder' });
  dropzoneBlock.append(createTag('div'));
  anchor.insertAdjacentElement('afterend', dropzoneBlock);

  loadStyle(`${getConfig().codeRoot}/blocks/verb-dropzone/verb-dropzone.css`);

  const { default: initDropzone } = await import('../verb-dropzone/verb-dropzone.js');
  await initDropzone(dropzoneBlock);
}

/**
 * Main decorator function for resume-hero block
 * @param {Element} block - The main block element
 */
export default async function decorate(block) {
  ({ createTag, getConfig, loadStyle } = await import(`${getLibs()}/utils/utils.js`));

  const subcopy = setupButtonStyling(block);
  injectBrandingLogo(block);
  await embedResumeDropzone(subcopy);
}
