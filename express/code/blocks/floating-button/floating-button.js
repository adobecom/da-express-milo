import { addTempWrapperDeprecated, isIPad } from '../../scripts/utils.js';
import {
  createFloatingButton,
  collectFloatingButtonData,
} from '../../scripts/widgets/floating-cta.js';
import { formatDynamicCartLink } from '../../scripts/utils/pricing.js';

export default async function decorate(block) {
  addTempWrapperDeprecated(block, 'floating-button');
  if (!block.classList.contains('meta-powered')) {
    block.parentElement?.remove();
    return;
  }

  const audience = block.querySelector(':scope > div').textContent.trim();
  if (audience === 'mobile') {
    block.closest('.section')?.remove();
  }

  const parentSection = block.closest('.section');
  const data = collectFloatingButtonData();
  if (audience === 'desktop' && isIPad()) {
    data.delayUntilViewportPassed = document.querySelector('.resume-hero, .verb-express-hero');
  }

  const blockWrapper = await createFloatingButton(
    block,
    parentSection ? audience : null,
    data,
  );

  const blockLinks = blockWrapper.querySelectorAll('a');
  if (blockLinks && blockLinks.length > 0) {
    formatDynamicCartLink(blockLinks[0]);
    const linksPopulated = new CustomEvent('linkspopulated', { detail: blockLinks });
    document.dispatchEvent(linksPopulated);
  }
}
