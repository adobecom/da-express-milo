import {
  createTag,
  getMobileOperatingSystem,
  getLibs,
  addTempWrapperDeprecated,
  getIconElementDeprecated,
} from '../../scripts/utils.js';
import { createFloatingButton } from '../../scripts/widgets/floating-cta.js';
import { createMultiFunctionButton, collectFloatingButtonData } from '../../scripts/utils/mobile-fork-button-utils.js';

export default async function decorate(block) {
  const { getMetadata } = await import(`${getLibs()}/utils/utils.js`);
  const eligible = getMetadata('frictionless-safari')?.toLowerCase() === 'on' || getMobileOperatingSystem() === 'Android'; // safari is frictionless-eligible too now
  addTempWrapperDeprecated(block, 'multifunction-button');
  if (!block.classList.contains('meta-powered')) return;

  const audience = block.querySelector(':scope > div').textContent.trim();
  if (audience === 'mobile') {
    block.closest('.section').remove();
  }

  const data = collectFloatingButtonData(createTag, getIconElementDeprecated, eligible);
  const blockWrapper = await createMultiFunctionButton(
    createTag,
    createFloatingButton,
    block,
    data,
    audience,
    'mobile-fork-button-frictionless',
  );
  const blockLinks = blockWrapper.querySelectorAll('a');
  if (blockLinks && blockLinks.length > 0) {
    const linksPopulated = new CustomEvent('linkspopulated', { detail: blockLinks });
    document.dispatchEvent(linksPopulated);
  }
  if (data.longText) blockWrapper.classList.add('long-text');
}
