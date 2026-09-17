import { getLibs, getIconElementDeprecated, getMetadata } from '../../scripts/utils.js';

const CLASS_NAMES = {
  BUTTON: 'button',
  ACCENT: 'accent',
  BUTTON_CONTAINER: 'button-container',
};

const LOGO_INJECT_VALUES = ['on', 'yes'];
const DROPZONE_MODIFIER = 'resume-hero-dropzone-area';

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
 * Pulls the image authored in the second row / first column of the block and
 * removes that now-consumed row so it doesn't render on its own.
 * @param {Element} block - The main block element
 * @returns {Element|null} The <picture> to embed inside the dropzone
 */
function extractDropzoneImage(block) {
  const row = block.querySelector(':scope > div:nth-child(2)');
  const picture = row?.querySelector(':scope > div:first-child picture');
  if (picture) row.remove();
  return picture || null;
}

/**
 * Builds the verb-dropzone resume-builder widget, initializes it in place, and
 * embeds the authored image inside it. The `resume-hero-dropzone-area` modifier
 * scopes the resume-hero restyle without renaming the base block (which the
 * unity block discovers by the `.verb-dropzone` class).
 * @param {Element} anchor - Element to insert the widget after (the subcopy)
 * @param {Element|null} image - The <picture> to embed inside the dropzone
 */
async function embedResumeDropzone(anchor, image) {
  if (!anchor) return;

  const dropzoneBlock = createTag('div', { class: `verb-dropzone resume-builder ${DROPZONE_MODIFIER}` });
  dropzoneBlock.append(createTag('div'));
  anchor.insertAdjacentElement('afterend', dropzoneBlock);

  loadStyle(`${getConfig().codeRoot}/blocks/verb-dropzone/verb-dropzone.css`);

  const { default: initDropzone } = await import('../verb-dropzone/verb-dropzone.js');
  await initDropzone(dropzoneBlock);

  if (!image) return;
  image.classList.add('resume-hero-dropzone-image');
  const iconSlot = dropzoneBlock.querySelector('.widget-icon');
  if (iconSlot) iconSlot.replaceChildren(image);
  else dropzoneBlock.querySelector('.verb-dropzone-inner')?.prepend(image);
}

/**
 * Main decorator function for resume-hero block
 * @param {Element} block - The main block element
 */
export default async function decorate(block) {
  ({ createTag, getConfig, loadStyle } = await import(`${getLibs()}/utils/utils.js`));

  const dropzoneImage = extractDropzoneImage(block);
  const subcopy = setupButtonStyling(block);
  injectBrandingLogo(block);
  await embedResumeDropzone(subcopy, dropzoneImage);
}
