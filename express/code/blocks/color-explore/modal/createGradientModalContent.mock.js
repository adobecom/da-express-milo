import { createTag } from '../../../scripts/utils.js';
import { createGradientDetailSection } from '../../../scripts/color-shared/components/gradients/gradient-strip-tall.js';

export function createGradientModalContent(gradient) {
  const content = createTag('div', { class: 'modal-gradient-content' });

  const { type = 'linear', angle = 90, colorStops = [], gradient: gradientCss } = gradient;
  const hasStops = Array.isArray(colorStops) && colorStops.length > 0;

  /* Floating bar — gradient strip with color stops (MWPW-185800) */
  const stripWrap = createTag('div', { class: 'ax-color-modal-gradient-strip-wrap' });
  const stripSection = createGradientDetailSection(
    { type, angle, colorStops: hasStops ? colorStops : [{ color: '#ccc', position: 0 }, { color: '#999', position: 1 }] },
    { size: 'responsive' },
  );
  stripWrap.appendChild(stripSection);
  content.appendChild(stripWrap);

  /* Toolbar: Share, Download, Save to Library */
  const toolbar = createTag('div', { class: 'ax-color-modal-toolbar' });
  const shareBtn = createTag('button', { type: 'button', class: 'ax-color-modal-toolbar-btn', 'aria-label': 'Share' });
  shareBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M15 13.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zM5 13.5c.83 0 1.5.67 1.5 1.5S5.83 16.5 5 16.5 3.5 15.83 3.5 15 4.17 13.5 5 13.5zm5-9c.83 0 1.5.67 1.5 1.5S10.83 8 10 8 8.5 7.33 8.5 6.5 9.17 5 10 5z"/></svg>';
  const downloadBtn = createTag('button', { type: 'button', class: 'ax-color-modal-toolbar-btn', 'aria-label': 'Download' });
  downloadBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M10 12.5l-4-4h2.5V4h3v4.5H14l-4 4zm-5 2.5h10v1.5H5V15z"/></svg>';
  const saveBtn = createTag('button', { type: 'button', class: 'ax-color-modal-toolbar-btn', 'aria-label': 'Save to Libraries' });
  saveBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M4 2h12v16l-6-4-6 4V2zm2 2v10l4-2.67 4 2.67V4H6z"/></svg>';
  toolbar.append(shareBtn, downloadBtn, saveBtn);
  content.appendChild(toolbar);

  /* Primary CTA */
  const cta = createTag('button', { type: 'button', class: 'ax-color-modal-cta' });
  cta.textContent = 'Open gradient in Adobe Express';
  content.appendChild(cta);

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
  content.append(details, colorsSection);
  return content;
}
