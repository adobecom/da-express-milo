import { getIconElementDeprecated, fixIcons } from '../../scripts/utils.js';

export default async function decorate(block) {
  const rows = [...block.children];
  const [textCell, bgCell] = [...rows[0].children];
  const imageCell = rows[1]?.children[0];

  // Single-value cell (EDS delivers no <p> wrapper): read textContent as fallback
  const bgColor = bgCell?.querySelector('p')?.textContent?.trim() ?? bgCell?.textContent?.trim();
  const picture = imageCell?.querySelector('picture');

  // First <p> is the brand eyebrow — prepend Express logo icon to authored text
  const textEls = [...textCell.children];
  const eyebrow = textEls.find((el) => el.tagName === 'P');
  if (eyebrow) {
    eyebrow.classList.add('logo-eyebrow');
    eyebrow.prepend(getIconElementDeprecated('adobe-express-logo'));
  }

  const heading = textEls.find((el) => /^H[1-6]$/.test(el.tagName));
  const bodyParas = textEls.filter((el) => el.tagName === 'P' && el !== eyebrow);

  const textContainer = document.createElement('div');
  textContainer.className = 'text-container';
  if (heading) textContainer.append(heading);
  bodyParas.forEach((p) => textContainer.append(p));

  const textContent = document.createElement('div');
  textContent.className = 'text-content';
  if (eyebrow) textContent.append(eyebrow);
  textContent.append(textContainer);

  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';
  if (picture) imageContainer.append(picture);

  const foreground = document.createElement('div');
  foreground.className = 'foreground';
  foreground.append(textContent, imageContainer);

  block.textContent = '';
  if (bgColor) block.style.background = bgColor;
  block.append(foreground);

  fixIcons(block);
}
