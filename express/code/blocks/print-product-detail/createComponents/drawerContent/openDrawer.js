import createDrawerContentPaperType from './createDrawerContentPaperType.js';
import createDrawerContentPrintingProcess from './createDrawerContentPrintingProcess.js';
import createDrawerContentSizeChart from './createDrawerContentSizeChart.js';
import { setupEscapeKeyHandler } from './createDrawerContent.js';

export default async function openDrawer(
  customizationOptions,
  labelText,
  hiddenSelectInputName,
  productDetails,
  defaultValue,
  drawerType,
) {
  const curtain = document.querySelector('.pdpx-curtain');
  const drawer = document.querySelector('#pdpx-drawer');
  drawer.innerHTML = '';
  if (drawerType === 'sizeChart') {
    await createDrawerContentSizeChart(productDetails, drawer);
  } else if (drawerType === 'printingProcess') {
    await createDrawerContentPrintingProcess(productDetails, drawer);
  } else if (drawerType === 'paperType') {
    await createDrawerContentPaperType(
      customizationOptions,
      labelText,
      hiddenSelectInputName,
      productDetails,
      defaultValue,
      drawerType,
      drawer,
    );
  }
  curtain.classList.remove('hidden');
  drawer.classList.remove('hidden');
  document.body.classList.add('disable-scroll');
  setupEscapeKeyHandler();
}
