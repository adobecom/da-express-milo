import {
  createTag,
  getMobileOperatingSystem,
  getIconElementDeprecated,
  addTempWrapperDeprecated,
} from '../../scripts/utils.js';
import { createFloatingButton } from '../../scripts/widgets/floating-cta.js';
import {
  createMultiFunctionButton,
  collectOsSplitFloatingButtonData,
} from '../../scripts/utils/mobile-fork-button-utils.js';

const OS_METADATA_PREFIXES = {
  Android: 'android',
  iOS: 'ios',
};

export default async function decorate(block) {
  const metadataPrefix = OS_METADATA_PREFIXES[getMobileOperatingSystem()];
  if (!metadataPrefix) {
    const { default: decorateNormal } = await import('../floating-button/floating-button.js');
    await decorateNormal(block);
    return;
  }

  addTempWrapperDeprecated(block, 'multifunction-button');
  if (!block.classList.contains('meta-powered')) return;

  const audience = block.querySelector(':scope > div').textContent.trim();
  if (audience === 'mobile') {
    block.closest('.section')?.remove();
  }

  const data = collectOsSplitFloatingButtonData(
    createTag,
    getIconElementDeprecated,
    metadataPrefix,
  );
  const blockWrapper = await createMultiFunctionButton(
    createTag,
    createFloatingButton,
    block,
    data,
    audience,
    'mobile-fork-button-os-split',
  );
  const blockLinks = blockWrapper.querySelectorAll('a');
  if (blockLinks && blockLinks.length > 0) {
    const linksPopulated = new CustomEvent('linkspopulated', { detail: blockLinks });
    document.dispatchEvent(linksPopulated);
  }
  if (data.longText) blockWrapper.classList.add('long-text');
}
