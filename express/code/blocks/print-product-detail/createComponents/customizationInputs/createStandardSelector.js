import { getLibs } from '../../../../scripts/utils.js';
import { createPicker } from '../../../../scripts/widgets/picker.js';
import updateAllDynamicElements from '../../utilities/event-handlers.js';
import openDrawer from '../drawerContent/openDrawer.js';

let createTag;

export default async function createStandardSelector(
  customizationOptions,
  labelText,
  hiddenSelectInputName,
  productDetails,
  formDataObject,
  CTAText,
) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const options = customizationOptions.map((option) => ({
    value: option.name,
    text: option.title,
  }));
  const defaultValue = formDataObject[hiddenSelectInputName] || customizationOptions[0].name;
  const pickerContainer = await createPicker({
    id: `pdpx-picker-${hiddenSelectInputName}`,
    name: hiddenSelectInputName,
    label: labelText,
    labelPosition: 'side',
    options,
    defaultValue,
    onChange: () => {
      updateAllDynamicElements(productDetails.id);
    },
  });
  let isTriBlend = false;
  if (productDetails.productType === 'zazzle_shirt') {
    isTriBlend = formDataObject.style === 'triblend_shortsleeve3413';
  }
  if (CTAText && isTriBlend) {
    const wrapper = createTag('div', { class: 'picker-with-link' });
    wrapper.appendChild(pickerContainer);
    const standardSelectorCTA = createTag('button', { class: 'picker-link', type: 'button' }, CTAText);
    standardSelectorCTA.addEventListener('click', async () => {
      await openDrawer(customizationOptions, labelText, hiddenSelectInputName, productDetails, defaultValue, 'sizeChart');
    });
    wrapper.appendChild(standardSelectorCTA);
    return wrapper;
  }
  return pickerContainer;
}
