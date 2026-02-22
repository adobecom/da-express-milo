import { createTag } from '../../../scripts/utils.js';

export function createGradientModalContent(gradient) {
  const content = createTag('div', { class: 'modal-gradient-content' });

  const { type = 'linear', angle = 90, colorStops = [], gradient: gradientCss } = gradient;
  const hasStops = Array.isArray(colorStops) && colorStops.length > 0;
  const gradientCSS = gradientCss || (hasStops
    ? (type === 'radial'
      ? `radial-gradient(circle, ${colorStops.map((s) => `${s.color} ${s.position * 100}%`).join(', ')})`
      : `linear-gradient(${angle}deg, ${colorStops.map((s) => `${s.color} ${s.position * 100}%`).join(', ')})`)
    : 'linear-gradient(90deg, #ccc, #999)');

  const preview = createTag('div', {
    class: 'modal-gradient-preview',
    style: `background: ${gradientCSS}`,
  });

  const details = createTag('div', { class: 'modal-gradient-details' });
  const typeLabel = createTag('p', {}, `Type: ${type === 'radial' ? 'Radial' : 'Linear'}`);
  const stopsLabel = createTag('p', {}, `Color Stops: ${hasStops ? colorStops.length : '—'}`);
  details.append(typeLabel, stopsLabel);

  const colorsSection = createTag('div', { class: 'modal-gradient-colors' });
  const colorsTitle = createTag('h3', {}, 'Core Colors');
  const colorsGrid = createTag('div', { class: 'modal-colors-grid' });

  const coreColors = gradient.coreColors || (hasStops ? colorStops.map((s) => s.color) : []);
  coreColors.forEach((color) => {
    const colorItem = createTag('div', { class: 'modal-color-item' });
    const colorBox = createTag('div', {
      class: 'modal-color-box',
      style: `background-color: ${color}`,
    });
    const colorLabel = createTag('span', { class: 'modal-color-label' }, color);
    colorItem.append(colorBox, colorLabel);
    colorsGrid.append(colorItem);
  });

  colorsSection.append(colorsTitle, colorsGrid);
  content.append(preview, details, colorsSection);
  return content;
}
