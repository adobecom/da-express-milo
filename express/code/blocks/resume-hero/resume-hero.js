import { getLibs, getIconElementDeprecated, getMetadata } from '../../scripts/utils.js';

const CLASS_NAMES = {
  BUTTON: 'button',
  ACCENT: 'accent',
  BUTTON_CONTAINER: 'button-container',
  BUTTON_GROUP: 'button-group',
  CONTENT: 'resume-hero-content',
};

const LOGO_INJECT_VALUES = ['on', 'yes'];

let createTag;
let getConfig;
let loadStyle;

/**
 * Normalizes both supported authoring shapes into a content/media pair.
 *
 * Legacy layout: one row containing the text and media cells.
 * New layout: the first row contains the text and background color cells,
 * while the second row contains the media cell.
 *
 * @param {Element} block - The main block element
 * @returns {Element|null} The text cell
 */
function normalizeAuthoring(block) {
  const rows = [...block.children];
  const firstRow = rows[0];
  if (!firstRow) return null;

  const [textCell, secondCell] = [...firstRow.children];
  const mediaCell = rows[1]?.children[0];
  const usesSplitRows = mediaCell?.querySelector('picture');

  if (usesSplitRows) {
    const background = secondCell?.textContent?.trim();
    if (background) block.style.background = background;

    firstRow.replaceChildren(textCell, mediaCell);
    rows.slice(1).forEach((row) => row.remove());
  }

  firstRow.classList.add(CLASS_NAMES.CONTENT);
  return textCell || null;
}

/**
 * Wraps consecutive CTA paragraphs so separately authored actions share one row.
 * @param {Element} block - The main block element
 */
function groupButtons(block) {
  const parents = new Set(
    [...block.querySelectorAll(`.${CLASS_NAMES.BUTTON_CONTAINER}`)]
      .map((paragraph) => paragraph.parentElement),
  );

  parents.forEach((parent) => {
    let group = null;
    [...parent.children].forEach((child) => {
      if (child.classList.contains(CLASS_NAMES.BUTTON_CONTAINER)) {
        if (!group) {
          group = createTag('div', { class: CLASS_NAMES.BUTTON_GROUP });
          parent.insertBefore(group, child);
        }
        group.append(child);
      } else {
        group = null;
      }
    });
  });
}

/**
 * Adds button styling classes to every CTA and marks the media cell.
 * @param {Element} block - The main block element
 * @param {Element|null} textCell - The authored text cell
 * @returns {Element|null} The subcopy paragraph (body text without links)
 */
function setupButtonStyling(block, textCell) {
  const heading = textCell?.querySelector('h1,h2,h3,h4,h5,h6');
  heading?.classList.add('heading');

  block.querySelectorAll('p:has(a)').forEach((p) => {
    p.classList.add(CLASS_NAMES.BUTTON_CONTAINER);
    p.querySelectorAll('a').forEach((link) => {
      link.classList.add(CLASS_NAMES.BUTTON, CLASS_NAMES.ACCENT);
    });
  });
  groupButtons(block);

  block.querySelector('div:has(> picture)')?.classList.add('media');

  return textCell?.querySelector('p:not(:has(a))') || null;
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
 * @param {Element} anchor - Element that will contain the widget
 */
async function embedResumeDropzone(anchor) {
  if (!anchor) return;

  const dropzoneBlock = createTag('div', { class: 'verb-dropzone resume-builder' });
  dropzoneBlock.append(createTag('div'));
  anchor.append(dropzoneBlock);

  loadStyle(`${getConfig().codeRoot}/blocks/verb-dropzone/verb-dropzone.css`);

  const { default: initDropzone } = await import('../verb-dropzone/verb-dropzone.js');
  await initDropzone(dropzoneBlock, { placeholderPrefix: 'resume-hero' });
}

/**
 * Main decorator function for resume-hero block
 * @param {Element} block - The main block element
 */
export default async function decorate(block) {
  ({ createTag, getConfig, loadStyle } = await import(`${getLibs()}/utils/utils.js`));

  const mediaCell = block.children[1]?.children[0];
  const textCell = normalizeAuthoring(block);
  const subcopy = setupButtonStyling(block, textCell);
  injectBrandingLogo(block);
  await embedResumeDropzone(mediaCell || subcopy);
}
