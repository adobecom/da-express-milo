import { createTag } from '../../utils.js';
import loadMiloStyle from '../utils/loadMiloStyle.js';
import { announceToScreenReader } from '../spectrum/utils/a11y.js';
import { loadTooltip } from '../spectrum/load-spectrum.js';
import { createThemeWrapper } from '../spectrum/utils/theme.js';

const STYLE_PATH = 'scripts/color-shared/modal/modal-contrast-content.css';

// SVG icons for tabs and card states
const ICON_TEXT_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 4.5C3 3.67157 3.67157 3 4.5 3H15.5C16.3284 3 17 3.67157 17 4.5V5.5C17 5.77614 16.7761 6 16.5 6C16.2239 6 16 5.77614 16 5.5V4.5C16 4.22386 15.7761 4 15.5 4H10.5V16H12.5C12.7761 16 13 16.2239 13 16.5C13 16.7761 12.7761 17 12.5 17H7.5C7.22386 17 7 16.7761 7 16.5C7 16.2239 7.22386 16 7.5 16H9.5V4H4.5C4.22386 4 4 4.22386 4 4.5V5.5C4 5.77614 3.77614 6 3.5 6C3.22386 6 3 5.77614 3 5.5V4.5Z"/></svg>';
const ICON_ALIGN_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M2 4.5C2 4.22386 2.22386 4 2.5 4H17.5C17.7761 4 18 4.22386 18 4.5C18 4.77614 17.7761 5 17.5 5H2.5C2.22386 5 2 4.77614 2 4.5ZM2 8.5C2 8.22386 2.22386 8 2.5 8H13.5C13.7761 8 14 8.22386 14 8.5C14 8.77614 13.7761 9 13.5 9H2.5C2.22386 9 2 8.77614 2 8.5ZM2.5 12C2.22386 12 2 12.2239 2 12.5C2 12.7761 2.22386 13 2.5 13H17.5C17.7761 13 18 12.7761 18 12.5C18 12.2239 17.7761 12 17.5 12H2.5ZM2 16.5C2 16.2239 2.22386 16 2.5 16H10.5C10.7761 16 11 16.2239 11 16.5C11 16.7761 10.7761 17 10.5 17H2.5C2.22386 17 2 16.7761 2 16.5Z"/></svg>';
const ICON_SHAPES_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7.134 3.22a.5.5 0 0 1 .866 0l3.897 6.75A.5.5 0 0 1 11.464 10.75H3.67a.5.5 0 0 1-.433-.78L7.134 3.22ZM14.5 11a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/></svg>';
const ICON_STAR_SVG = '<svg viewBox="0 0 34 21" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.5635 8.77894C12.9832 7.60849 14.4034 6.43477 15.8825 5.32695C16.5934 4.79443 17.6419 3.9847 18.4631 3.64385C19.3226 3.28716 20.2691 4.08029 19.929 4.89756C19.7258 5.38582 19.255 5.4892 18.8277 5.75257C18.2158 6.12989 17.5853 6.61387 17.0109 7.04376C15.6502 8.06203 14.3364 9.13613 13.0406 10.2223C13.1156 10.2374 13.1996 10.2349 13.2761 10.2314C14.7484 10.166 16.2343 9.95341 17.7051 10.1207C18.7952 10.2447 18.8748 11.5017 17.8624 11.7507C16.5891 12.0641 15.0906 12.1207 13.7685 12.1932C13.6769 12.1982 13.5836 12.1899 13.492 12.1934C13.4791 12.2372 13.5032 12.2249 13.518 12.2367C14.4365 12.9599 15.4886 13.6119 16.2608 14.4863C16.8919 15.2007 16.0655 16.1772 15.1327 15.7312C14.8425 15.5923 14.5076 15.3878 14.2322 15.2198C13.164 14.5693 12.2044 13.7774 11.1737 13.0801C11.1707 13.1332 11.1781 13.1873 11.1731 13.2404C11.0459 14.6282 10.9734 16.113 10.7601 17.4827C10.6548 18.1601 10.5642 19.3107 9.52694 19.188C8.61658 19.0803 8.72873 18.1244 8.66937 17.5051C8.71697 16.2408 8.86004 14.9813 8.97766 13.7218L8.89532 13.7686C7.17418 15.2153 5.54275 16.8023 3.62985 18.0389C3.20859 18.3111 2.79745 18.5216 2.33051 18.1463C1.86357 17.771 1.98147 17.327 2.31082 16.9391C2.70609 16.4738 3.17522 16.0227 3.61235 15.5891C4.75248 14.642 5.86937 13.6718 6.98762 12.7033C5.50555 12.8543 4.02485 13.0195 2.54935 13.2157C2.12508 13.2721 1.64583 13.3828 1.23031 13.4177C-0.195129 13.538 -0.494387 11.6994 0.931603 11.4451C1.95193 11.263 3.07319 11.1342 4.10801 11.0079C5.33158 10.8585 6.56089 10.7526 7.78774 10.6276C6.73568 9.83996 5.65627 9.07777 4.64853 8.24138C4.44201 8.06982 4.08339 7.80771 3.96112 7.59063C3.63943 7.01911 4.02895 6.24812 4.72294 6.13995C5.41692 6.03179 5.83271 6.55803 6.31005 6.93962C7.3022 7.7325 8.33319 8.48538 9.36691 9.23147L9.71596 4.93957C9.853 4.18065 9.80978 3.29521 9.99169 2.55188C10.2581 1.46294 12.0211 1.62242 12.1169 2.63716C12.1595 3.08969 12.002 3.76812 11.9522 4.24153C11.793 5.75131 11.671 7.26487 11.5624 8.77868L11.5635 8.77894Z"/></svg>';
const ICON_CHECK_SVG = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.5 2.5L4 7.5L1.5 5" stroke="#05834e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_CROSS_SVG = '<svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1l6 6M7 1L1 7" stroke="#d32f2f" stroke-width="1.2" stroke-linecap="round"/></svg>';

let stylesLoaded = false;

export async function ensureContrastContentStyles() {
  if (stylesLoaded) return;
  try {
    await loadMiloStyle(STYLE_PATH);
    stylesLoaded = true;
  } catch {
    stylesLoaded = true;
  }
}

/**
 * Determine cell size class based on palette color count.
 * @param {number} count
 * @returns {'S'|'M'|'L'}
 */
function getCellSize(count) {
  if (count <= 3) return 'L';
  if (count <= 7) return 'M';
  return 'S';
}

/**
 * Determine if a combination passes the current tab/level criteria.
 * @param {Object} wcagResult - from dataService.checkWCAG()
 * @param {string} tab - 'large-text' | 'small-text' | 'icons-ui'
 * @param {string} level - 'AA' | 'AAA'
 * @returns {boolean}
 */
function doesPass(wcagResult, tab, level) {
  if (tab === 'large-text') return level === 'AAA' ? wcagResult.largeAAA : wcagResult.largeAA;
  if (tab === 'small-text') return level === 'AAA' ? wcagResult.normalAAA : wcagResult.normalAA;
  return wcagResult.uiComponents;
}

/**
 * Pre-compute all N x N WCAG results.
 */
function computeContrastMatrix(colors, dataService) {
  const matrix = new Map();
  for (let bg = 0; bg < colors.length; bg++) {
    for (let fg = 0; fg < colors.length; fg++) {
      if (fg === bg) continue;
      const key = `${fg}-${bg}`;
      matrix.set(key, dataService.checkWCAG(colors[fg], colors[bg]));
    }
  }
  return matrix;
}

/**
 * Check if a color is light enough to need a visible border.
 */
function isLightBackground(hex, dataService) {
  return dataService.getLuminanceForHex(hex) > 0.9;
}

/**
 * Normalize hex colors: ensure they start with # and are uppercase.
 */
function normalizeColors(palette) {
  const raw = Array.isArray(palette?.colors) ? palette.colors : [];
  return raw
    .map((c) => String(c || '').trim())
    .filter(Boolean)
    .map((c) => (c.startsWith('#') ? c : `#${c}`))
    .map((c) => c.toUpperCase());
}

function formatRatio(ratio) {
  return `${Number(ratio).toFixed(2)} : 1`;
}

function setCellTooltipText(cell, text) {
  cell.dataset.tooltip = text;
}

/**
 * Creates a single shared floating tooltip for the entire matrix grid.
 * Appends to document.body (outside overflow:hidden cells) and uses
 * event delegation — the same pattern as express-tooltip.js.
 * Returns a destroy() to clean up on layout switch or modal close.
 */
function setupMatrixTooltip(grid) {
  const theme = createThemeWrapper();
  theme.style.cssText = 'position: fixed; pointer-events: none; z-index: 10001; top: 0; left: 0;';
  const tooltip = document.createElement('sp-tooltip');
  theme.appendChild(tooltip);
  document.body.appendChild(theme);

  let showTimer = null;

  function show(cell) {
    clearTimeout(showTimer);
    showTimer = setTimeout(() => {
      const text = cell.dataset.tooltip;
      if (!text) return;
      tooltip.textContent = text;
      const rect = cell.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top - 8;
      theme.style.transform = `translate(calc(${cx}px - 50%), calc(${cy}px - 100%))`;
      tooltip.setAttribute('open', '');
    }, 200);
  }

  function hide() {
    clearTimeout(showTimer);
    tooltip.removeAttribute('open');
  }

  const ac = new AbortController();
  const { signal } = ac;

  grid.addEventListener('mouseover', (e) => {
    const cell = e.target.closest('[data-tooltip]');
    if (cell) show(cell);
  }, { signal });

  grid.addEventListener('mouseout', (e) => {
    const cell = e.target.closest('[data-tooltip]');
    if (cell && !cell.contains(e.relatedTarget)) hide();
  }, { signal });

  grid.addEventListener('focusin', (e) => {
    const cell = e.target.closest('[data-tooltip]');
    if (cell && e.target.matches(':focus-visible')) show(cell);
  }, { signal });

  grid.addEventListener('focusout', hide, { signal });

  return {
    destroy() {
      ac.abort();
      clearTimeout(showTimer);
      theme.remove();
    },
  };
}

// ── Cell Rendering (Desktop Matrix) ───────────────────────────────

function createCellContent(tab) {
  const isIcon = tab === 'icons-ui';
  const textEl = createTag('span', {
    class: `cc-modal-cell-text${isIcon ? ' cc-modal-hidden' : ''}`,
  }, 'Aa');
  const iconEl = createTag('span', {
    class: `cc-modal-cell-icon${isIcon ? '' : ' cc-modal-hidden'}`,
  });
  iconEl.innerHTML = ICON_STAR_SVG;
  const frag = document.createDocumentFragment();
  frag.append(textEl, iconEl);
  return { fragment: frag, textEl, iconEl };
}

function buildCell(fgIdx, bgIdx, colors, state, matrix, sizeClass, dataService) {
  const cell = createTag('div', {
    class: `cc-modal-cell cc-modal-cell--${sizeClass}`,
    role: 'gridcell',
    tabindex: '-1',
  });

  const fgHex = colors[fgIdx];
  const bgHex = colors[bgIdx];
  cell.dataset.fg = String(fgIdx);
  cell.dataset.bg = String(bgIdx);

  // Diagonal (same color) = 1:1 ratio, always fails — render as striped
  if (fgIdx === bgIdx) {
    cell.classList.add('cc-modal-cell--fail');
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('aria-label',
      `${fgHex} on ${bgHex}, same color, contrast ratio 1.00 : 1, fails ${state.activeLevel}`);
    setCellTooltipText(cell, `Low contrast ${formatRatio(1)}`);
    return cell;
  }

  const key = `${fgIdx}-${bgIdx}`;
  const result = matrix.get(key);
  const pass = doesPass(result, state.activeTab, state.activeLevel);
  const ratio = result.ratio;

  cell.setAttribute('tabindex', '0');
  cell.setAttribute('aria-label',
    `${fgHex} on ${bgHex}, contrast ratio ${formatRatio(ratio)}, ${pass ? 'passes' : 'fails'} ${state.activeLevel} for ${state.activeTab.replace('-', ' ')}`);

  if (pass) {
    cell.classList.add('cc-modal-cell--pass');
    cell.style.backgroundColor = bgHex;
    if (isLightBackground(bgHex, dataService)) {
      cell.classList.add('cc-modal-cell--light-bg');
    }

    const { fragment, textEl, iconEl } = createCellContent(state.activeTab);
    textEl.style.color = fgHex;
    iconEl.style.color = fgHex;
    cell.append(fragment);
    cell._textEl = textEl;
    cell._iconEl = iconEl;
  } else {
    cell.classList.add('cc-modal-cell--fail');
  }

  setCellTooltipText(cell, pass ? `Pass ${formatRatio(ratio)}` : `Low contrast ${formatRatio(ratio)}`);
  return cell;
}

function updateAllCells(container, colors, state, matrix) {
  // Update column headers: "Aa" for text tabs, star icon for icons-ui
  const colHeaders = container.querySelectorAll('.cc-modal-col-header');
  colHeaders.forEach((header) => {
    if (state.activeTab === 'icons-ui') {
      header.innerHTML = ICON_STAR_SVG;
      header.classList.add('cc-modal-col-header--icon');
    } else {
      header.textContent = 'Aa';
      header.classList.remove('cc-modal-col-header--icon');
    }
  });

  // Update data cells
  const cells = container.querySelectorAll('.cc-modal-cell[data-fg]');
  cells.forEach((cell) => {
    const fgIdx = parseInt(cell.dataset.fg, 10);
    const bgIdx = parseInt(cell.dataset.bg, 10);

    // Diagonal cells always stay as fail
    if (fgIdx === bgIdx) {
      cell.setAttribute('aria-label',
        `${colors[fgIdx]} on ${colors[bgIdx]}, same color, contrast ratio 1.00 : 1, fails ${state.activeLevel}`);
      return;
    }

    const key = `${fgIdx}-${bgIdx}`;
    const result = matrix.get(key);
    if (!result) return;

    const pass = doesPass(result, state.activeTab, state.activeLevel);
    const fgHex = colors[fgIdx];
    const bgHex = colors[bgIdx];

    cell.setAttribute('aria-label',
      `${fgHex} on ${bgHex}, contrast ratio ${formatRatio(result.ratio)}, ${pass ? 'passes' : 'fails'} ${state.activeLevel} for ${state.activeTab.replace('-', ' ')}`);

    setCellTooltipText(cell, pass ? `Pass ${formatRatio(result.ratio)}` : `Low contrast ${formatRatio(result.ratio)}`);

    cell.classList.remove('cc-modal-cell--pass', 'cc-modal-cell--fail');
    cell.style.backgroundColor = '';

    if (pass) {
      cell.classList.add('cc-modal-cell--pass');
      cell.style.backgroundColor = bgHex;

      if (!cell._textEl) {
        const { fragment, textEl, iconEl } = createCellContent(state.activeTab);
        textEl.style.color = fgHex;
        iconEl.style.color = fgHex;
        cell.append(fragment);
        cell._textEl = textEl;
        cell._iconEl = iconEl;
      }
      cell._textEl.style.color = fgHex;
      cell._iconEl.style.color = fgHex;
      cell._textEl.classList.toggle('cc-modal-hidden', state.activeTab === 'icons-ui');
      cell._iconEl.classList.toggle('cc-modal-hidden', state.activeTab !== 'icons-ui');
    } else {
      cell.classList.add('cc-modal-cell--fail');
      if (cell._textEl) cell._textEl.classList.add('cc-modal-hidden');
      if (cell._iconEl) cell._iconEl.classList.add('cc-modal-hidden');
    }
  });
}

// ── Desktop Matrix Layout ─────────────────────────────────────────

function buildMatrixLayout(colors, state, matrix, dataService) {
  const sizeClass = getCellSize(colors.length);
  const cellSizes = { S: 34, M: 58, L: 80 };
  const cellSize = cellSizes[sizeClass];
  const colCount = colors.length;

  const wrapper = createTag('div', { class: 'cc-modal-matrix' });
  const content = createTag('div', { class: 'cc-modal-matrix-content' });

  const grid = createTag('div', {
    class: 'cc-modal-grid',
    role: 'grid',
    'aria-label': 'Contrast comparison matrix',
  });
  grid.style.gridTemplateColumns = `auto repeat(${colCount}, ${cellSize}px)`;

  // Column headers row
  const spacer = createTag('div', {
    class: 'cc-modal-col-spacer',
    role: 'columnheader',
    'aria-hidden': 'true',
  });
  grid.appendChild(spacer);

  colors.forEach((hex) => {
    const isIconTab = state.activeTab === 'icons-ui';
    const header = createTag('div', {
      class: `cc-modal-col-header${isIconTab ? ' cc-modal-col-header--icon' : ''}`,
      role: 'columnheader',
      'aria-label': `Foreground: ${hex}`,
    });
    if (isIconTab) {
      header.innerHTML = ICON_STAR_SVG;
    } else {
      header.textContent = 'Aa';
    }
    header.style.color = hex;
    grid.appendChild(header);
  });

  // Data rows
  colors.forEach((bgHex, bgIdx) => {
    // Row title
    const rowTitle = createTag('div', {
      class: 'cc-modal-row-title',
      role: 'rowheader',
      'aria-label': `Background: ${bgHex}`,
    });
    const swatch = createTag('div', { class: 'cc-modal-row-swatch' });
    swatch.style.backgroundColor = bgHex;
    if (isLightBackground(bgHex, dataService)) {
      swatch.style.border = '0.5px solid rgba(31, 31, 31, 0.2)';
    }
    const label = createTag('span', { class: 'cc-modal-row-label' }, 'Background');
    rowTitle.append(swatch, label);
    grid.appendChild(rowTitle);

    // Cells
    colors.forEach((_, fgIdx) => {
      grid.appendChild(buildCell(fgIdx, bgIdx, colors, state, matrix, sizeClass, dataService));
    });
  });

  content.appendChild(grid);
  wrapper.appendChild(content);

  const tooltipManager = setupMatrixTooltip(grid);
  wrapper._destroyTooltip = () => tooltipManager.destroy();

  return wrapper;
}

// ── Tablet/Mobile Card Layout ─────────────────────────────────────

function buildCard(fgIdx, bgIdx, colors, state, matrix, dataService) {
  const fgHex = colors[fgIdx];
  const bgHex = colors[bgIdx];

  // Diagonal = same color, 1:1 ratio, always fails
  const isDiagonal = fgIdx === bgIdx;
  const key = isDiagonal ? null : `${fgIdx}-${bgIdx}`;
  const result = isDiagonal ? { ratio: 1 } : matrix.get(key);
  const pass = isDiagonal ? false : doesPass(result, state.activeTab, state.activeLevel);
  const ratio = result.ratio;

  const card = createTag('div', {
    class: 'cc-modal-card',
    role: 'listitem',
    'aria-label': `${fgHex} on ${bgHex}, ratio ${formatRatio(ratio)}, ${pass ? 'passes' : 'fails'} ${state.activeLevel}`,
  });

  // Swatch
  const swatch = createTag('div', { class: 'cc-modal-card-swatch' });
  if (pass) {
    swatch.style.backgroundColor = bgHex;
    if (isLightBackground(bgHex, dataService)) {
      swatch.classList.add('cc-modal-card-swatch--light-bg');
    }
    if (state.activeTab === 'icons-ui') {
      const icon = createTag('span', { class: 'cc-modal-card-swatch-icon' });
      icon.style.color = fgHex;
      icon.innerHTML = ICON_STAR_SVG;
      swatch.appendChild(icon);
    } else {
      const text = createTag('span', { class: 'cc-modal-card-swatch-text' }, 'Aa');
      text.style.color = fgHex;
      swatch.appendChild(text);
    }
  } else {
    swatch.classList.add('cc-modal-card-swatch--fail');
  }

  // Info
  const info = createTag('div', { class: 'cc-modal-card-info' });

  // FG hex line
  const fgLine = createTag('div', { class: 'cc-modal-card-hex-line' });
  const fgDot = createTag('span', { class: 'cc-modal-card-hex-dot' });
  fgDot.style.backgroundColor = fgHex;
  fgLine.append(fgDot, createTag('span', { class: 'cc-modal-card-hex-text' }, fgHex));

  // BG hex line
  const bgLine = createTag('div', { class: 'cc-modal-card-hex-line' });
  const bgDot = createTag('span', { class: 'cc-modal-card-hex-dot' });
  bgDot.style.backgroundColor = bgHex;
  bgLine.append(bgDot, createTag('span', { class: 'cc-modal-card-hex-text' }, bgHex));

  // Ratio line
  const ratioLine = createTag('div', { class: 'cc-modal-card-ratio' });
  const ratioIcon = createTag('span', { class: 'cc-modal-card-ratio-icon' });
  ratioIcon.innerHTML = pass ? ICON_CHECK_SVG : ICON_CROSS_SVG;
  ratioLine.append(
    ratioIcon,
    createTag('span', { class: 'cc-modal-card-ratio-label' }, 'Ratio:'),
    createTag('span', { class: 'cc-modal-card-ratio-value' }, formatRatio(ratio)),
  );

  info.append(fgLine, bgLine, ratioLine);
  card.append(swatch, info);
  return card;
}

function buildCardGrid(colors, state, matrix, dataService) {
  const grid = createTag('div', {
    class: 'cc-modal-card-grid',
    role: 'list',
    'aria-label': `Contrast results for background ${colors[state.selectedBgIndex]}`,
  });

  const bgIdx = state.selectedBgIndex;
  for (let fgIdx = 0; fgIdx < colors.length; fgIdx++) {
    grid.appendChild(buildCard(fgIdx, bgIdx, colors, state, matrix, dataService));
  }
  return grid;
}

function buildBackgroundSelector(colors, state, onSelect) {
  const container = createTag('div', { class: 'cc-modal-bg-selector' });
  container.appendChild(createTag('span', { class: 'cc-modal-bg-label' }, 'Select background color'));

  const swatches = createTag('div', {
    class: 'cc-modal-bg-swatches',
    role: 'radiogroup',
    'aria-label': 'Select background color',
  });

  colors.forEach((hex, idx) => {
    const btn = createTag('button', {
      class: `cc-modal-bg-swatch${idx === state.selectedBgIndex ? ' cc-modal-bg-swatch--selected' : ''}`,
      role: 'radio',
      'aria-checked': idx === state.selectedBgIndex ? 'true' : 'false',
      'aria-label': hex,
      type: 'button',
    });
    btn.style.backgroundColor = hex;

    btn.addEventListener('click', () => {
      if (state.selectedBgIndex === idx) return;
      onSelect(idx);
    });

    btn.addEventListener('keydown', (e) => {
      let nextIdx = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextIdx = (idx + 1) % colors.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIdx = (idx - 1 + colors.length) % colors.length;
      }
      if (nextIdx >= 0) {
        e.preventDefault();
        onSelect(nextIdx);
        const nextBtn = swatches.children[nextIdx];
        nextBtn?.focus();
      }
    });

    swatches.appendChild(btn);
  });

  container.appendChild(swatches);
  return container;
}

function updateBgSwatches(container, selectedIdx) {
  const swatches = container.querySelectorAll('.cc-modal-bg-swatch');
  swatches.forEach((btn, idx) => {
    btn.classList.toggle('cc-modal-bg-swatch--selected', idx === selectedIdx);
    btn.setAttribute('aria-checked', idx === selectedIdx ? 'true' : 'false');
    btn.setAttribute('tabindex', idx === selectedIdx ? '0' : '-1');
  });
}

function buildCardLayout(colors, state, matrix, dataService) {
  const wrapper = createTag('div', { class: 'cc-modal-cards' });
  let cardGrid = null;

  function rerenderCards() {
    const newGrid = buildCardGrid(colors, state, matrix, dataService);
    if (cardGrid) {
      cardGrid.replaceWith(newGrid);
    } else {
      wrapper.appendChild(newGrid);
    }
    cardGrid = newGrid;
  }

  const bgSelector = buildBackgroundSelector(colors, state, (idx) => {
    state.selectedBgIndex = idx;
    updateBgSwatches(bgSelector, idx);
    rerenderCards();
    announceToScreenReader(
      `Background color ${colors[idx]} selected, showing ${colors.length - 1} foreground options`,
    );
  });

  wrapper.appendChild(bgSelector);
  rerenderCards();
  return wrapper;
}

// ── Header ────────────────────────────────────────────────────────

async function buildHeader(colors, state, onTabChange, onLevelChange) {
  const header = createTag('div', { class: 'cc-modal-header' });

  // Title wrap
  const titleWrap = createTag('div', { class: 'cc-modal-title-wrap' });
  titleWrap.appendChild(createTag('h2', {
    class: 'cc-modal-title',
    id: 'cc-modal-title-id',
  }, 'See contrast for your full palette'));

  // Palette strip (desktop only)
  const strip = createTag('div', { class: 'cc-modal-palette-strip' });
  colors.forEach((hex) => {
    const swatch = createTag('div', { class: 'cc-modal-palette-strip-swatch' });
    swatch.style.backgroundColor = hex;
    strip.appendChild(swatch);
  });
  titleWrap.appendChild(strip);
  header.appendChild(titleWrap);

  // Level picker + Tabs wrapper for desktop
  const { createExpressPicker } = await import('../spectrum/components/express-picker.js');
  const levelPicker = await createExpressPicker({
    label: 'WCAG Contrast Level',
    value: state.activeLevel,
    size: 's',
    options: [
      { value: 'AA', label: 'AA' },
      { value: 'AAA', label: 'AAA' },
    ],
    onChange: ({ value }) => {
      state.activeLevel = value;
      onLevelChange(value);
    },
  });

  const levelWrap = createTag('div', { class: 'cc-modal-level-wrap' });
  levelWrap.append(
    createTag('span', { class: 'cc-modal-level-label' }, 'WCAG Contrast Level'),
    levelPicker.element,
  );

  // Tabs
  const { createExpressTabs } = await import('../spectrum/components/express-tabs.js');
  const tabs = await createExpressTabs({
    selected: state.activeTab,
    size: 'm',
    quiet: true,
    tabs: [
      { label: 'Large text', value: 'large-text', iconSlotHtml: ICON_TEXT_SVG },
      { label: 'Small text', value: 'small-text', iconSlotHtml: ICON_ALIGN_SVG },
      { label: 'Icons and UI', value: 'icons-ui', iconSlotHtml: ICON_SHAPES_SVG },
    ],
    onSelectionChange: ({ selected }) => {
      state.activeTab = selected;
      onTabChange(selected);
    },
  });

  // Controls row: tabs left, WCAG level picker right (same horizontal line)
  const controls = createTag('div', { class: 'cc-modal-header-controls' });
  const tabBar = createTag('div', { class: 'cc-modal-tab-bar' });
  tabBar.appendChild(tabs.element);
  controls.appendChild(tabBar);
  controls.appendChild(levelWrap);
  header.appendChild(controls);

  return { element: header, tabs, levelPicker };
}

// ── Main Factory ──────────────────────────────────────────────────

export function createContrastCheckerModalContent(palette, options = {}) {
  const colors = normalizeColors(palette);
  if (colors.length < 2) {
    const el = createTag('div', { class: 'cc-modal-empty' }, 'At least 2 colors are needed to compare contrast.');
    return { element: el, destroy() {} };
  }

  // Create or reuse data service
  let dataService = options.dataService;
  let ownDataService = false;

  const state = {
    activeTab: options.initialTab || 'large-text',
    activeLevel: options.initialLevel || 'AA',
    selectedBgIndex: 0,
  };

  // If a selected background was passed, find its index
  if (options.selectedBackground) {
    const idx = colors.indexOf(options.selectedBackground.toUpperCase());
    if (idx >= 0) state.selectedBgIndex = idx;
  }

  const element = createTag('div', { class: 'cc-modal-contrast-checker' });
  let matrixLayout = null;
  let cardLayout = null;
  let headerRef = null;
  let desktopQuery = null;
  let onBreakpointChange = null;
  let contrastMatrix = null;

  async function init() {
    // Lazy-load data service and tooltip component
    const serviceLoad = !dataService
      ? import('../../../blocks/color-contrast-checker/services/createContrastDataService.js')
        .then(({ default: createContrastDataService }) => {
          dataService = createContrastDataService();
          ownDataService = true;
        })
      : Promise.resolve();
    await Promise.all([serviceLoad, loadTooltip()]);

    contrastMatrix = computeContrastMatrix(colors, dataService);

    const onTabChange = (tab) => {
      const tabLabels = { 'large-text': 'large text', 'small-text': 'small text', 'icons-ui': 'icons and UI' };
      if (matrixLayout) updateAllCells(matrixLayout, colors, state, contrastMatrix);
      if (cardLayout) rerenderCardLayout();
      const passCount = countPassing(colors, state, contrastMatrix);
      announceToScreenReader(`Showing results for ${tabLabels[tab]}, ${passCount} passing combinations`);
    };

    const onLevelChange = (level) => {
      if (matrixLayout) updateAllCells(matrixLayout, colors, state, contrastMatrix);
      if (cardLayout) rerenderCardLayout();
      const passCount = countPassing(colors, state, contrastMatrix);
      announceToScreenReader(`${level} level selected, ${passCount} passing combinations`);
    };

    headerRef = await buildHeader(colors, state, onTabChange, onLevelChange);
    element.appendChild(headerRef.element);

    // Content area
    const contentArea = createTag('div', { class: 'cc-modal-content-area' });
    element.appendChild(contentArea);

    function renderDesktop() {
      matrixLayout?._destroyTooltip?.();
      contentArea.innerHTML = '';
      cardLayout = null;
      matrixLayout = buildMatrixLayout(colors, state, contrastMatrix, dataService);
      contentArea.appendChild(matrixLayout);
    }

    function renderCards() {
      matrixLayout?._destroyTooltip?.();
      contentArea.innerHTML = '';
      matrixLayout = null;
      cardLayout = buildCardLayout(colors, state, contrastMatrix, dataService);
      contentArea.appendChild(cardLayout);
    }

    function rerenderCardLayout() {
      if (!cardLayout) return;
      const parent = cardLayout.parentNode;
      if (!parent) return;
      const newLayout = buildCardLayout(colors, state, contrastMatrix, dataService);
      parent.replaceChild(newLayout, cardLayout);
      cardLayout = newLayout;
    }

    // Responsive layout switching
    desktopQuery = window.matchMedia('(min-width: 1200px)');
    onBreakpointChange = () => {
      if (desktopQuery.matches) {
        renderDesktop();
      } else {
        renderCards();
      }
    };
    desktopQuery.addEventListener('change', onBreakpointChange);
    onBreakpointChange();
  }

  init();

  function destroy() {
    if (desktopQuery && onBreakpointChange) {
      desktopQuery.removeEventListener('change', onBreakpointChange);
    }
    headerRef?.tabs?.destroy?.();
    headerRef?.levelPicker?.destroy?.();
    if (ownDataService) dataService?.clearCache?.();
    matrixLayout?._destroyTooltip?.();
    element.innerHTML = '';
    matrixLayout = null;
    cardLayout = null;
    headerRef = null;
    contrastMatrix = null;
  }

  return { element, destroy };
}

function countPassing(colors, state, matrix) {
  let count = 0;
  for (let bg = 0; bg < colors.length; bg++) {
    for (let fg = 0; fg < colors.length; fg++) {
      if (fg === bg) continue;
      const result = matrix.get(`${fg}-${bg}`);
      if (result && doesPass(result, state.activeTab, state.activeLevel)) count++;
    }
  }
  return count;
}
