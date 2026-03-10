/**
 * Demo / Mock (not for prod). Single file for all gradient demo content in color-explore.
 * Used only for gradients variant to show shared UI work.
 * To remove: delete this file and demo/gradientDemo.css; update imports in:
 *   - createGradientsRenderer.js
 *   - createColorModalManager.js
 *   - color-explore.js
 */

import { createTag } from '../../../scripts/utils.js';
import { createGradientEditor } from '../../../scripts/color-shared/components/gradients/gradient-editor.js';
import { createGradientDetailSection } from '../../../scripts/color-shared/components/gradients/gradient-strip-tall.js';
import { createGradientStripElements } from '../../../scripts/color-shared/components/gradients/gradient-strip.js';
import { attachGradientHandleTooltips } from '../../../scripts/color-shared/modal/createGradientPickerRebuildContent.js';

/** Demo-only: Figma sizes from gradients/README.md (editor s 343×80, l 668×80). */
const GRADIENT_EDITOR_FIGMA_SIZES = {
  s: { width: 343, height: 80, handles: false },
  l: { width: 668, height: 80, handles: true },
};

/** Demo-only: Figma sizes from gradients/README.md (strip tall S 343×200, M 488×300, L 834×400). */
const GRADIENT_STRIP_TALL_FIGMA_SIZES = {
  s: { width: 343, height: 200, radius: 8 },
  m: { width: 488, height: 300, radius: 8 },
  l: { width: 834, height: 400, radius: 16 },
};

const MOCK_GRADIENT = {
  type: 'linear',
  angle: 90,
  colorStops: [
    { color: '#bfcdd9', position: 0 },
    { color: '#3f8ebf', position: 0.25 },
    { color: '#49590b', position: 0.5 },
    { color: '#8da634', position: 0.75 },
    { color: '#818c2b', position: 1 },
  ],
};

/** Mock (not for prod). Returns static gradient data for demo/development. */
export function getGradientsMockData() {
  const gradientTemplates = [
    { name: 'Eternal Sunshine of the Spotless Mind', colors: ['#7B9EA6', '#D0ECF2', '#59391D', '#D99066', '#F34822'], angle: 90 },
    { name: 'Sunset Vibes', colors: ['#FF6B6B', '#FF8E53', '#FFA06B', '#FFD06B', '#FFF96B'], angle: 90 },
    { name: 'Ocean Deep', colors: ['#0A1172', '#1B2B8C', '#2C3FA6', '#3D52C0', '#4E65DA'], angle: 135 },
    { name: 'Aurora Borealis', colors: ['#00FFA3', '#03E1FF', '#8B70FF', '#DC1FFF', '#FF6B9D'], angle: 45 },
    { name: 'Desert Heat', colors: ['#FFE259', '#FFC355', '#FFA751', '#FF8643', '#FF6B35'], angle: 90 },
    { name: 'Purple Dream', colors: ['#8B008B', '#9932CC', '#BA55D3', '#DA70D6', '#EE82EE'], angle: 180 },
    { name: 'Forest Mist', colors: ['#0D3B0D', '#1E5C1E', '#2F7D2F', '#409E40', '#51BF51'], angle: 90 },
    { name: 'Coral Reef', colors: ['#FF6F61', '#FF8577', '#FF9B8D', '#FFB1A3', '#FFC7B9'], angle: 45 },
    { name: 'Midnight Sky', colors: ['#001F3F', '#003D5C', '#005B7A', '#007998', '#0097B6'], angle: 135 },
    { name: 'Cherry Blossom', colors: ['#FFB7C5', '#FFC7D4', '#FFD7E3', '#FFE7F2', '#FFF7FF'], angle: 90 },
    { name: 'Tropical Paradise', colors: ['#00D9FF', '#00E6C3', '#00F387', '#7FFF4B', '#FFFF0F'], angle: 60 },
    { name: 'Autumn Leaves', colors: ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F4A460'], angle: 120 },
    { name: 'Ice Cold', colors: ['#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA'], angle: 90 },
    { name: 'Fire & Flame', colors: ['#FF0000', '#FF4500', '#FF6347', '#FF7F50', '#FFA07A'], angle: 45 },
    { name: 'Emerald Green', colors: ['#006400', '#228B22', '#32CD32', '#00FF00', '#7FFF00'], angle: 135 },
    { name: 'Royal Purple', colors: ['#4B0082', '#6A0DAD', '#7B1FA2', '#8E24AA', '#9C27B0'], angle: 90 },
    { name: 'Golden Hour', colors: ['#FFD700', '#FFDB58', '#FFDF70', '#FFE388', '#FFE7A0'], angle: 60 },
    { name: 'Deep Ocean', colors: ['#000080', '#00008B', '#0000CD', '#0000FF', '#1E90FF'], angle: 180 },
    { name: 'Peachy Keen', colors: ['#FFDAB9', '#FFDFC4', '#FFE4CF', '#FFE9DA', '#FFEEE5'], angle: 90 },
    { name: 'Neon Lights', colors: ['#FF00FF', '#FF1493', '#FF69B4', '#FF82AB', '#FFB6C1'], angle: 45 },
    { name: 'Misty Morning', colors: ['#F5F5F5', '#E8E8E8', '#DCDCDC', '#D3D3D3', '#C0C0C0'], angle: 135 },
    { name: 'Lavender Fields', colors: ['#E6E6FA', '#DDA0DD', '#DA70D6', '#BA55D3', '#9370DB'], angle: 90 },
    { name: 'Citrus Burst', colors: ['#FFA500', '#FFB733', '#FFC966', '#FFDB99', '#FFEDCC'], angle: 60 },
    { name: 'Stormy Weather', colors: ['#2F4F4F', '#3D5656', '#4B5D5D', '#596464', '#676B6B'], angle: 120 },
    { name: 'Rose Garden', colors: ['#FF0066', '#FF3385', '#FF66A3', '#FF99C2', '#FFCCE0'], angle: 90 },
    { name: 'Electric Blue', colors: ['#0000FF', '#0033FF', '#0066FF', '#0099FF', '#00CCFF'], angle: 45 },
    { name: 'Minty Fresh', colors: ['#98FF98', '#B2FFB2', '#CCFFCC', '#E6FFE6', '#F0FFF0'], angle: 135 },
    { name: 'Sunset Beach', colors: ['#FF6B35', '#F7931E', '#FDBB30', '#FFE66D', '#FFF4CC'], angle: 90 },
    { name: 'Deep Space', colors: ['#0C0C1E', '#1A1A3E', '#28285E', '#36367E', '#44449E'], angle: 180 },
    { name: 'Cotton Candy', colors: ['#FFB6D9', '#FFC7E3', '#FFD8ED', '#FFE9F7', '#FFF5FB'], angle: 60 },
    { name: 'Forest Green', colors: ['#0B3D0B', '#145214', '#1D671D', '#267C26', '#2F912F'], angle: 90 },
    { name: 'Cherry Red', colors: ['#8B0000', '#A52A2A', '#B22222', '#CD5C5C', '#DC143C'], angle: 45 },
    { name: 'Sky Blue', colors: ['#87CEEB', '#87CEFA', '#87CEEB', '#ADD8E6', '#B0E0E6'], angle: 135 },
    { name: 'Lime Green', colors: ['#32CD32', '#7FFF00', '#ADFF2F', '#BFFF00', '#DFFF00'], angle: 90 },
    { name: 'Plum Perfect', colors: ['#8E4585', '#9B5896', '#A86BA7', '#B57EB8', '#C291C9'], angle: 120 },
  ];

  return gradientTemplates.map((template, index) => {
    const stops = template.colors.map((color, i) => ({
      color,
      position: i / (template.colors.length - 1),
    }));
    return {
      id: `gradient-${index + 1}`,
      name: template.name,
      type: 'linear',
      angle: template.angle,
      colorStops: stops,
      coreColors: template.colors,
    };
  });
}

/**
 * Inline gradient editor (before grid). Mock only.
 * @param {Object} options - { gradient?, size?: 's'|'m'|'l'|'responsive' }
 * @returns {HTMLElement}
 */
export function createGradientInspectorMock(options = {}) {
  const { gradient = MOCK_GRADIENT, size = 'responsive' } = options;

  const wrapper = createTag('div', {
    class: 'gradient-editor',
    'data-mock': 'true',
    'aria-label': 'Gradient editor (mock)',
    role: 'region',
  });

  const label = createTag('p', { class: 'gradient-editor-label' });
  label.textContent = 'Gradient editor';

  const editorSize = size === 'responsive' ? 'l' : size;
  const editor = createGradientEditor(gradient, {
    height: 80,
    size: editorSize,
    showMockHandlesOrder: true,
  });
  const editorEl = editor.element;
  editorEl.classList.add('gradient-editor-strip');

  wrapper.appendChild(label);
  wrapper.appendChild(editorEl);

  return wrapper;
}

/**
 * Figma sizes demo section: gradient editor S/L + gradient strip tall S/M/L. Mock only.
 * @returns {HTMLElement}
 */
export function createGradientSizesDemoSection() {
  const section = createTag('section', {
    class: 'color-explore-gradient-sizes-demo',
    'data-mock': 'true',
    'aria-label': 'Gradient Figma sizes (mock — not for prod)',
  });

  const intro = createTag('p', { class: 'gradient-sizes-demo-intro' });
  intro.textContent = 'Sizes here are to illustrate Design intent at breakpoints. Full UX review and testing is in integration (e.g. Extract Page > Gradient Editor; Explore Page > Gradients: grid and modal).';

  const inScopeWrap = createTag('div', { class: 'gradient-sizes-demo-in-scope' });
  const inScopeTitle = createTag('h3', { class: 'gradient-sizes-demo-title' });
  inScopeTitle.textContent = 'In scope to test and review';
  const inScopeList = createTag('ul', { class: 'gradient-sizes-demo-in-scope-list' });
  [
    'Gradient editor: sizes S (343×80, color handles) and L (668×80, color + gradient handles).',
    'Gradient strip tall (modal): sizes S (343×200), M (488×300), L (834×400). Content stops at L.',
    'Handles are interactive: copy (button) and keyboard navigation; color handles and midpoint are focusable.',
    'Full UX: review and test in integration (e.g. Extract Page > Gradient Editor; Explore Page > Gradients: grid and modal).',
    'Blue lines for Gradient Editor still pending from Design. Integrated Mar 4.',
  ].forEach((text) => {
    const li = createTag('li', {});
    li.textContent = text;
    inScopeList.appendChild(li);
  });
  inScopeWrap.appendChild(inScopeTitle);
  inScopeWrap.appendChild(inScopeList);
  section.appendChild(intro);
  section.appendChild(inScopeWrap);

  const editorWrap = createTag('div', { class: 'gradient-sizes-demo-block' });
  const editorTitle = createTag('h3', { class: 'gradient-sizes-demo-title' });
  editorTitle.textContent = '1. Gradient editor';
  editorWrap.appendChild(editorTitle);
  const editorRow = createTag('div', { class: 'gradient-sizes-demo-row' });
  ['s', 'l'].forEach((size) => {
    const spec = GRADIENT_EDITOR_FIGMA_SIZES[size];
    const cell = createTag('div', { class: `gradient-sizes-demo-cell gradient-sizes-demo-cell--editor-${size}` });
    const label = createTag('span', { class: 'gradient-sizes-demo-label' });
    label.textContent = `Size ${size.toUpperCase()} — ${spec.width}×${spec.height}${spec.handles ? ' (color + gradient handles)' : ' (color handles)'}`;
    const editor = createGradientEditor(MOCK_GRADIENT, {
      height: 80,
      size,
      showMockHandlesOrder: size === 'l',
    });
    const editorEl = editor.element;
    editorEl.classList.add('gradient-editor-strip');
    cell.appendChild(label);
    cell.appendChild(editorEl);
    editorRow.appendChild(cell);
  });
  editorWrap.appendChild(editorRow);

  const responsiveRow = createTag('div', { class: 'gradient-sizes-demo-row gradient-sizes-demo-row--responsive' });
  const responsiveCell = createTag('div', { class: 'gradient-sizes-demo-cell gradient-sizes-demo-cell--editor-responsive' });
  const responsiveLabel = createTag('span', { class: 'gradient-sizes-demo-label' });
  responsiveLabel.textContent = 'Responsive — drag the container edge to simulate breakpoints (600px, 1200px) without resizing the page';
  const widthDisplayWrap = createTag('span', { class: 'gradient-sizes-demo-width-display' });
  const widthDisplay = createTag('span', { class: 'gradient-sizes-demo-width-value' });
  const midpointHint = createTag('span', { class: 'gradient-sizes-demo-width-midpoint-hint' });
  const MIDPOINT_BREAKPOINT = 600;
  const resizableWrap = createTag('div', { class: 'gradient-sizes-demo-resizable-wrap' });
  const responsiveEditor = createGradientEditor(MOCK_GRADIENT, {
    height: 80,
    size: 'responsive',
    showMockHandlesOrder: false,
  });
  responsiveEditor.element.classList.add('gradient-sizes-demo-resize-target');
  resizableWrap.appendChild(responsiveEditor.element);

  const updateWidthDisplay = () => {
    const w = resizableWrap.getBoundingClientRect().width;
    const rounded = Math.round(w);
    widthDisplay.textContent = `${rounded}px`;
    if (rounded >= MIDPOINT_BREAKPOINT) {
      midpointHint.textContent = ' — midpoints shown';
      midpointHint.classList.add('gradient-sizes-demo-width-midpoint-hint--on');
    } else {
      midpointHint.textContent = ` — midpoints at ${MIDPOINT_BREAKPOINT}px`;
      midpointHint.classList.remove('gradient-sizes-demo-width-midpoint-hint--on');
    }
  };
  const ro = new ResizeObserver(updateWidthDisplay);
  ro.observe(resizableWrap);
  updateWidthDisplay();

  widthDisplayWrap.appendChild(widthDisplay);
  widthDisplayWrap.appendChild(midpointHint);
  responsiveCell.appendChild(responsiveLabel);
  responsiveCell.appendChild(widthDisplayWrap);
  responsiveCell.appendChild(resizableWrap);
  responsiveRow.appendChild(responsiveCell);
  editorWrap.appendChild(responsiveRow);

  section.appendChild(editorWrap);

  const stripWrap = createTag('div', { class: 'gradient-sizes-demo-block gradient-sizes-demo-block--strip-tall' });
  const stripTitle = createTag('h3', { class: 'gradient-sizes-demo-title' });
  stripTitle.textContent = '2. Gradient strip tall (modal) — navigate + copy';
  stripWrap.appendChild(stripTitle);
  const stripRow = createTag('div', { class: 'gradient-sizes-demo-row gradient-sizes-demo-row--one-row' });
  ['strip-s', 'strip-m', 'strip-l'].forEach((stripSize) => {
    const sizeKey = stripSize.replace('strip-', '');
    const spec = GRADIENT_STRIP_TALL_FIGMA_SIZES[sizeKey];
    const cell = createTag('div', { class: `gradient-sizes-demo-cell gradient-sizes-demo-cell--strip-${sizeKey}` });
    const label = createTag('span', { class: 'gradient-sizes-demo-label' });
    label.textContent = `Size ${sizeKey.toUpperCase()} — ${spec.width}×${spec.height}`;
    const editor = createGradientEditor(MOCK_GRADIENT, {
      layout: 'responsive',
      size: stripSize,
      draggable: false,
      copyable: true,
      ariaLabel: 'Gradient preview',
    });
    cell.appendChild(label);
    cell.appendChild(editor.element);
    stripRow.appendChild(cell);
  });
  stripWrap.appendChild(stripRow);
  section.appendChild(stripWrap);

  /* 3. Gradient strip (grid card) — static hardcoded S, M, L; same component as grid */
  const gridStripDataBySize = {
    s: { id: 'demo-s', name: 'Strip S', colorStops: MOCK_GRADIENT.colorStops, angle: 90 },
    m: { id: 'demo-m', name: 'Strip M', gradient: 'linear-gradient(90deg, #F07DF2 0%, #6A65D9 50%, #1D64F2 100%)' },
    l: { id: 'demo-l', name: 'Strip L (Eternal Sunshine)', colorStops: [{ color: '#7B9EA6', position: 0 }, { color: '#D0ECF2', position: 0.5 }, { color: '#F34822', position: 1 }], angle: 90 },
  };
  const gridStripSizes = [
    { key: 's', width: 343, height: 50, label: 'S' },
    { key: 'm', width: 488, height: 50, label: 'M' },
    { key: 'l', width: 437, height: 80, label: 'L' },
  ];
  const gridStripWrap = createTag('div', { class: 'gradient-sizes-demo-block gradient-sizes-demo-grid-strip' });
  const gridStripTitle = createTag('h3', { class: 'gradient-sizes-demo-title' });
  gridStripTitle.textContent = '3. Gradient strip (grid card)';
  const gridStripLabel = createTag('p', { class: 'gradient-sizes-demo-intro' });
  gridStripLabel.textContent = 'Static example — same component as in the gradients grid. Bar height: 50px (S, M), 80px (L) per Figma. L width = 1/3 column at 1360px content + gutter.';
  const gridStripRow = createTag('div', { class: 'gradient-sizes-demo-grid-strip-row' });
  gridStripSizes.forEach(({ key, width, height, label }) => {
    const cell = createTag('div', { class: `gradient-sizes-demo-cell gradient-sizes-demo-cell--grid-strip-${key}` });
    const cellLabel = createTag('span', { class: 'gradient-sizes-demo-label' });
    const widthLabel = label === 'L' ? '~437px' : `${width}px`;
    cellLabel.textContent = `Size ${label} — Width ${widthLabel}, Bar height ${height}px`;
    const [stripEl] = createGradientStripElements([gridStripDataBySize[key]], {});
    cell.appendChild(cellLabel);
    cell.appendChild(stripEl);
    gridStripRow.appendChild(cell);
  });
  gridStripWrap.appendChild(gridStripTitle);
  gridStripWrap.appendChild(gridStripLabel);
  gridStripWrap.appendChild(gridStripRow);
  section.appendChild(gridStripWrap);

  function applyCopyAnalytics(handle) {
    const hex = handle.getAttribute('data-color') || '';
    const copyLabel = `Copy #${hex.replace(/^#/, '').toUpperCase()}`;
    handle.setAttribute('daa-ll', copyLabel);
    handle.setAttribute('data-ll', copyLabel);
  }
  section.querySelectorAll('.gradient-editor-handle[data-color]').forEach(applyCopyAnalytics);

  attachGradientHandleTooltips(section).catch(() => {});

  return section;
}

/**
 * Mock (not for prod). Gradient modal content — strip + toolbar + CTA placeholder.
 * Circle/handle content is owned only by color-shared (createGradientPickerRebuildContent);
 * consumers must not duplicate or modify that inner content.
 */
export function createGradientModalContentMock(gradient) {
  const content = createTag('div', { class: 'modal-gradient-content', 'data-mock': 'true' });

  const { type = 'linear', angle = 90, colorStops = [] } = gradient;
  const hasStops = Array.isArray(colorStops) && colorStops.length > 0;

  /* Floating bar — gradient strip (MWPW-185800); strip inner content from color-shared only */
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
