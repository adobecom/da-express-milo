import { getLibs, getMobileOperatingSystem, getIconElementDeprecated, addTempWrapperDeprecated } from '../../scripts/utils.js';
import { createFloatingButton } from '../../scripts/widgets/floating-cta.js';
import { collectFloatingButtonData, collectOsSplitFloatingButtonData, SUPPORTED_MWEB_OS } from '../../scripts/utils/mobile-fork-button-utils.js';

let createTag;
let getMetadata;

function buildUnityAction(entry, buttonType) {
  const wrapper = createTag('div', { class: 'floating-button-inner-row mobile-gating-row' });
  const a = entry?.anchor;
  if (a) {
    a.classList.add(buttonType, 'button', 'mobile-gating-link');
    wrapper.append(a);
  }
  return wrapper;
}

async function createUnityMultiFunctionButton(block, data, audience) {
  const buttonWrapper = await createFloatingButton(block, audience, data);
  buttonWrapper.classList.add('multifunction', 'mobile-fork-button-unity');

  const floatingButton = buttonWrapper.querySelector('.floating-button');
  floatingButton.firstElementChild?.remove();
  const header = createTag('div', { class: 'mobile-gating-header' });
  header.textContent = data.forkButtonHeader ?? '';
  floatingButton.append(
    header,
    buildUnityAction(data.tools[0], 'accent'),
    buildUnityAction(data.tools[1], 'outline'),
  );

  return buttonWrapper;
}

export default async function decorate(block) {
  ({ createTag, getMetadata } = await import(`${getLibs()}/utils/utils.js`));
  const eligibilityOn = getMetadata('fork-eligibility-check')?.toLowerCase()?.trim() === 'on';
  if (eligibilityOn && !SUPPORTED_MWEB_OS.includes(getMobileOperatingSystem())) {
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

  const os = getMobileOperatingSystem();
  const osPrefixes = { Android: 'android', iOS: 'ios' };
  const platform = osPrefixes[os];
  const data = platform
    ? collectOsSplitFloatingButtonData(createTag, getIconElementDeprecated, platform, {}, 'unity-upload')
    : collectFloatingButtonData(createTag, getIconElementDeprecated, false, {}, 'unity-upload');

  const blockWrapper = await createUnityMultiFunctionButton(block, data, audience);
  const blockLinks = blockWrapper.querySelectorAll('a');
  if (blockLinks && blockLinks.length > 0) {
    const linksPopulated = new CustomEvent('linkspopulated', { detail: blockLinks });
    document.dispatchEvent(linksPopulated);
  }
  if (data.longText) blockWrapper.classList.add('long-text');
}
