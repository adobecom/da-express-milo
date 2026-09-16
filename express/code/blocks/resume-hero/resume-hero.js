import { getLibs } from '../../scripts/utils.js';

const CLASS_NAMES = {
  BUTTON: 'button',
  ACCENT: 'accent',
  BUTTON_CONTAINER: 'button-container',
};

let createTag;
let getConfig;
let loadStyle;

/**
 * Adds button styling classes to the CTA links
 * @param {Element} block - The main block element
 * @returns {Element|null} The subcopy paragraph (body text without links)
 */
function setupButtonStyling(block) {
  const heading = block.querySelector('h1,h2,h3:first-of-type');
  heading?.classList.add('heading');

  const pWithLink = block.querySelector('p:has(a)');
  if (pWithLink) {
    pWithLink.classList.add(CLASS_NAMES.BUTTON_CONTAINER);
    pWithLink.querySelectorAll('a').forEach((link) => {
      link.classList.add(CLASS_NAMES.BUTTON, CLASS_NAMES.ACCENT);
    });
  }

  const paragraphs = [...block.querySelectorAll('p')];
  return paragraphs.find((p) => !p.classList.contains(CLASS_NAMES.BUTTON_CONTAINER)) || null;
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
  await embedResumeDropzone(subcopy);
}
