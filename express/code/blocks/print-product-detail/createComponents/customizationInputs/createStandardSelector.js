import { getLibs } from '../../../../scripts/utils.js';
import { createPicker } from '../../../../scripts/widgets/picker.js';
import updateAllDynamicElements from '../../utilities/event-handlers.js';
import openDrawer from '../drawerContent/openDrawer.js';
import { trackPrintAddonInteraction } from '../../../../scripts/instrument.js';

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
    onChange: async (value) => {
      await updateAllDynamicElements(productDetails.id);
      const selectedOption = customizationOptions.find((o) => o.name === value);
      trackPrintAddonInteraction({
        action_type: 'button',
        action_name: attributeName,
        action_value: selectedOption?.title || value,
        productType: productDetails.productType,
      }).catch(() => {});
    },
  });

  if (CTALinkText === 'Size Chart') {
    const wrapper = createTag('div', { class: 'picker-with-link' });
    wrapper.appendChild(pickerContainer);
    const standardSelectorCTA = createTag('button', { class: 'picker-link', type: 'button' }, CTALinkText);
    standardSelectorCTA.addEventListener('click', async () => {
      await openDrawer(argumentObject);
    });
    wrapper.appendChild(standardSelectorCTA);
    return wrapper;
  }
  return pickerContainer;
}
