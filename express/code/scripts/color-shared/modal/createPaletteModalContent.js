import { createTag, getLibs } from '../../utils.js';

let contentStylesLoaded = false;
export async function ensurePaletteContentStyles() {
  if (contentStylesLoaded) return;
  try {
    const { loadStyle, getConfig } = (await import(`${getLibs()}/utils/utils.js`));
    const codeRoot = getConfig?.()?.codeRoot || '/express/code';
    await loadStyle(`${codeRoot}/scripts/color-shared/modal/modal-palette-content.css`);
    contentStylesLoaded = true;
  } catch {
    contentStylesLoaded = true;
  }
}

export function createSimplePaletteContent(palette) {
  const wrap = createTag('div', { class: 'color-modal-simple-palette' });
  const name = createTag('p', { class: 'color-modal-simple-palette-name' });
  name.textContent = palette?.name ? `Palette: ${palette.name}` : 'Palette';
  wrap.appendChild(name);
  if (palette?.description) {
    const desc = createTag('p', { class: 'color-modal-simple-description' });
    desc.textContent = palette.description;
    wrap.appendChild(desc);
  }
  const colors = palette?.colors || palette?.colorStops?.map((s) => s?.color) || [];
  if (colors.length) {
    const list = createTag('div', { class: 'color-modal-simple-swatches' });
    colors.forEach((hex) => {
      const swatch = createTag('div', {
        class: 'color-modal-simple-swatch',
        style: `background-color: ${hex}; min-width: 24px; height: 24px; border-radius: 4px;`,
        title: hex,
      });
      list.appendChild(swatch);
    });
    wrap.appendChild(list);
  }
  return wrap;
}

export function createSimpleGradientContent(gradient) {
  const wrap = createTag('div', { class: 'color-modal-simple-gradient' });
  const name = createTag('p', { class: 'color-modal-simple-gradient-name' });
  name.textContent = gradient?.name ? `Gradient: ${gradient.name}` : 'Gradient';
  wrap.appendChild(name);
  if (gradient?.description) {
    const desc = createTag('p', { class: 'color-modal-simple-description' });
    desc.textContent = gradient.description;
    wrap.appendChild(desc);
  }
  const stops = gradient?.colorStops || [];
  const angle = gradient?.angle ?? 90;
  const type = gradient?.type || 'linear';
  let css = `linear-gradient(${angle}deg, ${stops.map((s) => s?.color || '#ccc').join(', ')})`;
  if (type === 'radial') css = `radial-gradient(circle, ${stops.map((s) => s?.color || '#ccc').join(', ')})`;
  if (type === 'conic') css = `conic-gradient(from ${angle}deg, ${stops.map((s) => s?.color || '#ccc').join(', ')})`;
  const preview = createTag('div', {
    class: 'color-modal-simple-gradient-preview',
    style: `background: ${stops.length ? css : 'linear-gradient(90deg, #ccc, #999)'}; height: 80px; border-radius: 8px;`,
  });
  wrap.appendChild(preview);
  return wrap;
}

export function createFullPaletteModalContent(palette, options = {}) {
  const { onSave, onEditColor } = options;
  const colors = palette?.colors || palette?.colorStops?.map((s) => s?.color) || [];
  const container = createTag('div', { class: 'color-modal-full-palette' });

  const header = createTag('div', { class: 'color-modal-full-palette-header' });
  const title = createTag('h2', { class: 'color-modal-full-palette-title' });
  title.textContent = palette?.name || 'Palette';
  header.appendChild(title);
  if (palette?.description) {
    const desc = createTag('p', { class: 'color-modal-full-palette-description' });
    desc.textContent = palette.description;
    header.appendChild(desc);
  }
  container.appendChild(header);

  const colorsSection = createTag('div', { class: 'color-modal-full-palette-colors' });
  const colorsTitle = createTag('h3', { class: 'color-modal-full-palette-section-title' });
  colorsTitle.textContent = 'Colors';
  colorsSection.appendChild(colorsTitle);
  const grid = createTag('div', { class: 'color-modal-full-palette-swatches-grid' });

  colors.forEach((hex, index) => {
    const card = createTag('div', { class: 'color-modal-full-palette-swatch-card' });
    const preview = createTag('div', {
      class: 'color-modal-full-palette-swatch-preview',
      style: `background-color: ${hex}`,
      title: hex,
    });
    const hexEl = createTag('div', { class: 'color-modal-full-palette-swatch-hex' });
    hexEl.textContent = hex;
    const actions = createTag('div', { class: 'color-modal-full-palette-swatch-actions' });

    const copyBtn = createTag('button', { type: 'button', class: 'color-modal-full-palette-btn' });
    copyBtn.textContent = 'Copy';
    copyBtn.setAttribute('aria-label', `Copy ${hex}`);
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(hex).then(() => {
        copyBtn.textContent = 'Copied';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
      });
    });

    const editBtn = createTag('button', { type: 'button', class: 'color-modal-full-palette-btn' });
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit color ${hex}`);
    editBtn.addEventListener('click', () => {
      onEditColor?.(hex, index);
    });

    actions.appendChild(copyBtn);
    actions.appendChild(editBtn);
    card.appendChild(preview);
    card.appendChild(hexEl);
    card.appendChild(actions);
    grid.appendChild(card);
  });

  colorsSection.appendChild(grid);
  container.appendChild(colorsSection);

  const infoSection = createTag('div', { class: 'color-modal-full-palette-info' });
  const nameLabel = createTag('label', { for: 'palette-name-input' });
  nameLabel.textContent = 'Palette name';
  const nameInput = createTag('input', {
    id: 'palette-name-input',
    type: 'text',
    class: 'color-modal-full-palette-name-input',
    value: palette?.name || '',
    placeholder: 'Enter palette name',
  });
  infoSection.appendChild(nameLabel);
  infoSection.appendChild(nameInput);
  container.appendChild(infoSection);

  const saveSection = createTag('div', { class: 'color-modal-full-palette-save' });
  const saveBtn = createTag('button', { type: 'button', class: 'color-modal-full-palette-save-btn' });
  saveBtn.textContent = 'Save to Adobe Libraries';
  saveBtn.addEventListener('click', () => {
    onSave?.({ name: nameInput.value, colors });
  });
  saveSection.appendChild(saveBtn);
  container.appendChild(saveSection);

  return container;
}
