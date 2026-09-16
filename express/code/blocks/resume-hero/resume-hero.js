import { getLibs } from '../../scripts/utils.js';

const CLASS_NAMES = {
  BUTTON: 'button',
  ACCENT: 'accent',
  BUTTON_CONTAINER: 'button-container',
};

let getMetadata;

/**
 * Sets up button styling for the resume-hero block
 * @param {Element} block - The main block element
 */
async function setupButtonStyling(block) {
  const heading = block.querySelector('h1,h2,h3:first-of-type');
  heading?.classList.add('heading');
  if (!heading) return;

  const pWithLink = block.querySelector('p:has(a)');
  if (!pWithLink) return;

  pWithLink.classList.add(CLASS_NAMES.BUTTON_CONTAINER);

  const links = pWithLink.querySelectorAll('a');
  links.forEach((link) => {
    link.classList.add(CLASS_NAMES.BUTTON, CLASS_NAMES.ACCENT);
  });
}

/**
 * Main decorator function for resume-hero block
 * @param {Element} block - The main block element
 */
export default async function decorate(block) {
  await Promise.all([import(`${getLibs()}/utils/utils.js`)]).then(([utils]) => {
    ({ getMetadata } = utils);
  });

  await setupButtonStyling(block);
}
