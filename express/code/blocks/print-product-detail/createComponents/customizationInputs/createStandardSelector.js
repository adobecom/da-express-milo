import { getLibs } from '../../../../scripts/utils.js';
import { createPicker } from '../../../../scripts/widgets/picker.js';
import updateAllDynamicElements from '../../utilities/event-handlers.js';
import openDrawer from '../drawerContent/openDrawer.js';

let createTag;

export default async function createStandardSelector(argumentObject) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const {
    customizationOptions,
    labelText,
    attributeName,
    productDetails,
    defaultValue,
    CTALinkText,
  } = argumentObject;
  const options = customizationOptions.map((option) => ({
    value: option.name,
    text: option.title,
  }));
  const pickerContainer = await createPicker({
    id: `pdpx-picker-${attributeName}`,
    name: attributeName,
    label: labelText,
    labelPosition: 'side',
    options,
    defaultValue,
    onChange: () => {
      updateAllDynamicElements(productDetails.id);
    },
  });

  if (CTALinkText === 'Size Chart') {
    const wrapper = createTag('div', { class: 'picker-with-link' });
    wrapper.appendChild(pickerContainer);
    const standardSelectorCTA = createTag('button', { class: 'picker-link', type: 'button' }, CTALinkText);
    standardSelectorCTA.addEventListener('click', async () => {
      await openDrawer(customizationOptions, labelText, attributeName, productDetails, defaultValue, 'sizeChart');
    });
    wrapper.appendChild(standardSelectorCTA);
    return wrapper;
  }
  return pickerContainer;
}
