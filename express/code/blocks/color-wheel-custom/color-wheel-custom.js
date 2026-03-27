/* This block is for demo purposes only */
import { createTag } from '../../scripts/utils.js';
import createColorWheelExpressAdapter from '../../scripts/color-shared/adapters/createColorWheelExpressAdapter.js';
import ColorThemeExpressController from '../../scripts/color-shared/controllers/ColorThemeExpressController.js';

function randomHex() {
  return `#${Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0')}`;
}

export default async function decorate(block) {
  block.innerHTML = '';
  block.className = 'color-wheel-custom';

  const controller = new ColorThemeExpressController({
    swatches: Array.from({ length: 10 }, () => randomHex()),
    harmonyRule: 'CUSTOM',
    baseColorIndex: 0,
  });

  const wrapper = createTag('div', { class: 'color-wheel-custom-wrapper' });
  const heading = createTag('h2');
  heading.textContent = 'Color Wheel (10 colors)';
  wrapper.appendChild(heading);

  const baseHex = controller.getState().swatches?.[controller.getState().baseColorIndex]?.hex || '#FF0000';
  const adapter = createColorWheelExpressAdapter(baseHex, {
    onChange: (colorDetail) => {
      console.log(colorDetail);
    },
    onChangeEnd: (colorDetail) => {
      console.log(colorDetail);
    },
  }, { controller });

  wrapper.append(adapter.element);
  block.appendChild(wrapper);
}
