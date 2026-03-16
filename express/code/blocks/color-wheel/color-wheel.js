import { createTag } from '../../scripts/utils.js';
import { createExpressTabs } from '../../scripts/color-shared/spectrum/components/express-tabs.js';

export default async function decorate(block) {
  block.innerHTML = '';
  block.className = 'color-wheel';

  const sidebar = createTag('div', { class: 'color-palette-sidebar' });

  function buildBaseColorContent() {
    const baseColor = createTag('div', { class: 'base-color-content' }, '<h1>Base Color</h1>');
    return baseColor;
  }

  function buildImageContent() {
    const image = createTag('div', { class: 'image-content' }, '<h1>Image</h1>');
    return image;
  }

  function buildColorWheelContent() {
    const colorWheel = createTag('div', { class: 'color-wheel-content' }, '<h1>Color Wheel</h1>');
    return colorWheel;
  }

  async function buildTabs() {
    const tabsInstance = await createExpressTabs({
      selected: 'color-wheel',
      size: 'l',
      quiet: true,
      tabs: [
        { label: 'Base color', value: 'base-color' },
        { label: 'Image', value: 'image' },
        { label: 'Color Wheel', value: 'color-wheel' },
      ],
      onSelectionChange: ({ selected }) => {
        console.log(selected);
      },
    });

    tabsInstance.addPanel('color-wheel', buildColorWheelContent());
    tabsInstance.addPanel('image', buildImageContent());
    tabsInstance.addPanel('base-color', buildBaseColorContent());

    return tabsInstance;
  }

  const tabs = await buildTabs();
  block.appendChild(tabs.element);

  block.append(sidebar);
}
