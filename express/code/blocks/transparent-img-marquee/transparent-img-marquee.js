import { getLibs, decorateButtonsDeprecated, getIconElementDeprecated } from '../../scripts/utils.js';

let getMetadata;

function buildStructure(block) {
  const row = block.firstElementChild;
  const [textCell, imageCell] = [...row.children];
  const foreground = document.createElement('div');
  foreground.className = 'foreground';
  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';
  while (textCell.firstChild) foreground.append(textCell.firstChild);
  if (imageCell) {
    while (imageCell.firstChild) imageContainer.append(imageCell.firstChild);
  }
  row.remove();
  block.append(foreground, imageContainer);
  return foreground;
}

// Mirror Figma's Text-content / CTA-container split inside the foreground.
// Must run after decorateButtonsDeprecated and injectLogo so class names are stable.
function splitForeground(foreground) {
  const textContent = document.createElement('div');
  textContent.className = 'text-content';
  const ctaContainer = document.createElement('div');
  ctaContainer.className = 'cta-container';
  [...foreground.children].forEach((child) => {
    if (child.classList.contains('button-container') || child.classList.contains('disclaimer')) {
      ctaContainer.append(child);
    } else {
      textContent.append(child);
    }
  });
  foreground.append(textContent, ctaContainer);
}

function injectLogo(foreground) {
  if (!['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase())) return;
  const logo = getIconElementDeprecated('adobe-express-logo');
  logo.classList.add('express-logo');
  foreground.prepend(logo);
}

export default async function decorate(block) {
  const foreground = buildStructure(block);
  block.classList.add('appear');
  await decorateButtonsDeprecated(block);
  ({ getMetadata } = await import(`${getLibs()}/utils/utils.js`));
  injectLogo(foreground);
  const lastP = [...foreground.querySelectorAll('p:not(.button-container)')].at(-1);
  if (lastP) lastP.classList.add('disclaimer');
  splitForeground(foreground);
  const ctaLinks = [...block.querySelectorAll('a.button')];
  if (ctaLinks.length) {
    const { default: trackBranchParameters } = await import('../../scripts/branchlinks.js');
    await trackBranchParameters(ctaLinks);
  }
}
