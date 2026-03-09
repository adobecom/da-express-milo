import { getLibs, getMobileOperatingSystem, getIconElementDeprecated, addTempWrapperDeprecated } from '../../scripts/utils.js';
import { createFloatingButton } from '../../scripts/widgets/floating-cta.js';
import { createMultiFunctionButton, androidCheck, collectFloatingButtonData } from '../../scripts/utils/mobile-fork-button-utils.js';

let createTag; let getMetadata;

export default async function decorate(block) {
  ({ createTag, getMetadata } = await import(`${getLibs()}/utils/utils.js`));
  if (!androidCheck(getMetadata, getMobileOperatingSystem)) {
    const { default: decorateNormal } = await import('../floating-button/floating-button.js');
    decorateNormal(block);
    return;
  }
  addTempWrapperDeprecated(block, 'multifunction-button');
  if (!block.classList.contains('meta-powered')) return;

  const audience = block.querySelector(':scope > div').textContent.trim();
  if (audience === 'mobile') {
    block.closest('.section').remove();
  }
  const data = collectFloatingButtonData(createTag, getIconElementDeprecated);
  const blockWrapper = await createMultiFunctionButton(
    createTag,
    createFloatingButton,
    block,
    data,
    audience,
    'mobile-fork-button',
  );
  const blockLinks = blockWrapper.querySelectorAll('a');
  if (blockLinks && blockLinks.length > 0) {
    const linksPopulated = new CustomEvent('linkspopulated', { detail: blockLinks });
    document.dispatchEvent(linksPopulated);
  }
  if (data.longText) blockWrapper.classList.add('long-text');
}
