import { createTag } from '../../../scripts/utils.js';
import { createBaseRenderer } from '../../../scripts/color-shared/renderers/createBaseRenderer.js';
import { announceToScreenReader } from '../../../scripts/color-shared/spectrum/index.js';
import { ensureHash } from '../../../scripts/color-shared/utils/utilities.js';
import createHistoryService from '../services/createHistoryService.js';
import createRecommendationService from '../services/createRecommendationService.js';
import { generateTints } from '../utils/contrastUtils.js';
import createSuggestionsTab from './components/createSuggestionsTab.js';
import createSetRatioTab from './components/createSetRatioTab.js';
import { createColorInput } from './components/createColorInput.js';
import { createExpressTabs } from '../../../scripts/color-shared/spectrum/components/express-tabs.js';
import { loadActionButton, loadTooltip } from '../../../scripts/color-shared/spectrum/load-spectrum.js';
import { createThemeWrapper } from '../../../scripts/color-shared/spectrum/utils/theme.js';
import { DEFAULT_ACTION_MENU_CONFIG } from '../utils/contrastConstants.js';
import '../../../scripts/color-shared/components/color-channel-slider/index.js';

const regionMap = { 'Large text': 'heading', 'Small text': 'body', 'Graphics and UI': 'ui' };

const categoryTooltips = {
  'Large text': 'Refers to 18pt and above for regular font-weight,\nor 14pt and above for bold font-weight',
  'Small text': 'Refers to 17pt and below for regular font-weight,\nor 13pt and below for bold font-weight',
  'Graphics and UI': 'Refers to graphical objects or user interface components.',
};

async function loadSwapIcon() {
  try {
    const response = await fetch('/express/code/icons/color-swap-icon.svg');
    if (!response.ok) throw new Error(`Failed to load icon: ${response.status}`);
    return response.text();
  } catch {
    return '';
  }
}

function attachTooltip(actionBtn, text, placement = 'top') {
  const tooltip = document.createElement('sp-tooltip');
  tooltip.setAttribute('self-managed', '');
  tooltip.setAttribute('placement', placement);
  tooltip.textContent = text;
  actionBtn.appendChild(tooltip);
}

function createSpectrumIcon(type, variant = 'table') {
  let tagName;
  if (type === 'pass') {
    tagName = 'sp-icon-checkmark-circle';
  } else {
    tagName = variant === 'badge' ? 'sp-icon-alert' : 'sp-icon-close-circle';
  }
  return createTag(tagName, {
    size: 'm',
    class: `cc-result-icon cc-result-icon--${type}`,
    'aria-hidden': 'true',
  });
}

function createCategoryCell(label) {
  const cell = createTag('div', { class: 'cc-summary-cell cc-summary-cell--category' });
  const labelBtn = createTag('sp-action-button', {
    class: 'cc-category-label',
    quiet: '',
    size: 's',
  });
  labelBtn.textContent = label;

  attachTooltip(labelBtn, categoryTooltips[label], 'top');

  cell.appendChild(labelBtn);
  return cell;
}

function createContrastRatioBadge(ratio, pass) {
  const badge = createTag('span', {
    class: `cc-contrast-ratio-badge cc-contrast-ratio-badge--${pass ? 'pass' : 'caution'}`,
    role: 'status',
    'aria-live': 'polite',
  });

  const iconWrapper = createTag('span', {
    class: 'cc-contrast-ratio-badge__icon',
    'aria-hidden': 'true',
  });
  const icon = createTag(pass ? 'sp-icon-checkmark-circle' : 'sp-icon-alert', { size: 's' });
  iconWrapper.appendChild(icon);

  const text = document.createTextNode(`${ratio} : 1`);

  badge.appendChild(iconWrapper);
  badge.appendChild(text);

  return badge;
}

function buildResultCell(pass) {
  const cell = createTag('div', { class: `cc-summary-cell cc-summary-cell--${pass ? 'pass' : 'fail'}` });
  cell.appendChild(document.createTextNode(pass ? 'Pass' : 'Fail'));
  cell.appendChild(createSpectrumIcon(pass ? 'pass' : 'fail'));
  return cell;
}

function buildTintGradient(hex) {
  const tints = generateTints(hex, 20);
  const stops = tints.map((t, i) => {
    const percent = (i / (tints.length - 1)) * 100;
    return `${t} ${percent}%`;
  });
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

function findTintIndex(hex) {
  const tints = generateTints(hex, 20);
  const idx = tints.findIndex((t) => t.toLowerCase() === hex.toLowerCase());
  return Math.max(idx, 0);
}

function createTintSlider(hex, onInput, onCommit) {
  const container = createTag('div', { class: 'cc-slider-container' });
  const sliderRow = createTag('div', { class: 'cc-tint-slider-row' });
  const sliderWrapper = createTag('div', { class: 'cc-tint-slider-wrapper' });
  const slider = document.createElement('color-channel-slider');

  const tintInput = createTag('input', {
    type: 'text',
    class: 'cc-tint-value-input',
    value: '0',
    'aria-label': 'Tint value',
    maxlength: '3',
  });

  let tints = generateTints(hex, 20);

  slider.min = 0;
  slider.max = 19;
  slider.value = findTintIndex(hex);
  slider.label = 'Tint adjustment';
  slider.gradient = buildTintGradient(hex);
  tintInput.value = slider.value;

  slider.addEventListener('input', (e) => {
    const val = e.detail?.value ?? e.target.value;
    const newHex = tints[Number(val)];
    if (newHex) {
      tintInput.value = val;
      onInput(newHex);
    }
  });

  slider.addEventListener('change', (e) => {
    const val = e.detail?.value ?? e.target.value;
    const newHex = tints[Number(val)];
    if (newHex) {
      tintInput.value = val;
      onCommit(newHex);
    }
  });

  tintInput.addEventListener('change', () => {
    const val = Math.max(0, Math.min(19, Number.parseInt(tintInput.value, 10) || 0));
    tintInput.value = val;
    slider.value = val;
    const newHex = tints[val];
    if (newHex) onCommit(newHex);
  });

  sliderWrapper.appendChild(slider);
  sliderRow.appendChild(sliderWrapper);
  sliderRow.appendChild(tintInput);
  container.appendChild(sliderRow);

  return {
    element: container,
    slider,
    tintInput,
    refreshTints(newHex) {
      tints = generateTints(newHex, 20);
      slider.gradient = buildTintGradient(newHex);
    },
    updatePosition(newHex) {
      const idx = findTintIndex(newHex);
      slider.value = idx;
      tintInput.value = idx;
    },
  };
}

// eslint-disable-next-line import/prefer-default-export
export function createCheckerRenderer(options) {
  const { container, dataService, config = {} } = options;
  const base = createBaseRenderer({ ...options, data: [] });
  const { emit } = base;
  const historyService = createHistoryService();
  const recommendationService = createRecommendationService();

  let foreground = config.initialForeground || '#1B1B1B';
  let background = config.initialBackground || '#FFFFFF';
  let results = null;

  let fgInput;
  let bgInput;
  let fgSlider;
  let bgSlider;
  let ratioBadge;
  let ratioBadgeContainer;
  let swapButtonInstance;
  let summaryBody;
  let tabsElement;
  let suggestionsTab;
  let setRatioTab;
  let mobileActionMenu;

  function recalculate() {
    results = dataService.checkWCAG(foreground, background);
    emit('contrast-change', { foreground, background, ...results });
  }

  function pushHistory() {
    historyService.push({ fg: foreground, bg: background });
  }

  function updateContrastBadge() {
    if (!ratioBadgeContainer || !results) return;
    const level = dataService.getWCAGLevel(results);
    const pass = level !== 'FAIL';

    const newBadge = createContrastRatioBadge(results.ratio, pass);
    if (ratioBadge) {
      ratioBadge.replaceWith(newBadge);
    } else {
      ratioBadgeContainer.appendChild(newBadge);
    }
    ratioBadge = newBadge;
  }

  function updateSummaryTable() {
    if (!summaryBody || !results) return;
    summaryBody.replaceChildren();

    const rows = [
      { label: 'Large text', aa: results.largeAA, aaa: results.largeAAA },
      { label: 'Small text', aa: results.normalAA, aaa: results.normalAAA },
      { label: 'Graphics and UI', aa: results.uiComponents, aaa: null },
    ];

    rows.forEach(({ label, aa, aaa }) => {
      const row = createTag('div', { class: 'cc-summary-row', tabindex: '0', role: 'row' });
      row.appendChild(createCategoryCell(label));
      row.appendChild(buildResultCell(aa));
      row.appendChild(aaa === null
        ? createTag('div', { class: 'cc-summary-cell' }, '—')
        : buildResultCell(aaa));

      row.addEventListener('mouseenter', () => {
        emit('contrast-highlight', { region: regionMap[label] });
      });
      row.addEventListener('mouseleave', () => {
        emit('contrast-highlight', { region: null });
      });
      row.addEventListener('focusin', () => {
        emit('contrast-highlight', { region: regionMap[label] });
      });
      row.addEventListener('focusout', () => {
        emit('contrast-highlight', { region: null });
      });

      summaryBody.appendChild(row);
    });
  }

  function updateUI() {
    recalculate();
    if (!results) return;
    updateContrastBadge();
    updateSummaryTable();
    suggestionsTab?.update(foreground, background, results);
    setRatioTab?.update(foreground, background, results);
    announceToScreenReader(`Contrast ratio ${results.ratio} to 1`);
  }

  function createCheckerColorInput(label, initialValue, onChange) {
    const input = createColorInput({
      label,
      value: initialValue,
      onInput: ({ value: v }) => {
        const hex = ensureHash(v.trim());
        if (dataService.isValidHex(hex)) {
          onChange(hex, false);
        }
      },
      onChange: ({ value: v }) => {
        const hex = ensureHash(v.trim());
        if (dataService.isValidHex(hex)) {
          onChange(hex, true);
        }
      },
    });

    return input;
  }

  function buildRatioBar() {
    const bar = createTag('div', { class: 'cc-ratio-bar' });
    const top = createTag('div', { class: 'cc-ratio-bar-top' });
    const createActionMenu = options.actionMenu;

    const ratioLabelContainer = createTag('div', { class: 'cc-ratio-label-container' });
    const labelText = createTag('span', { class: 'cc-ratio-label-text' }, 'Contrast ratio');

    ratioBadgeContainer = createTag('span', { class: 'cc-ratio-badge-container' });

    ratioLabelContainer.appendChild(labelText);
    ratioLabelContainer.appendChild(ratioBadgeContainer);

    const compareLink = createTag('a', {
      class: 'cc-compare-link',
      href: '#',
      role: 'button',
    }, 'Compare entire palette');

    top.appendChild(ratioLabelContainer);
    top.appendChild(compareLink);
    
    if (createActionMenu) {
      mobileActionMenu = createActionMenu(top, { 
        ...DEFAULT_ACTION_MENU_CONFIG,
        id: 'contrast-checker-controls-only',
        type: 'controls-only',
        onUndo: handleUndo,
        onRedo: handleRedo,
      });
    }

    const bottom = createTag('div', { class: 'cc-ratio-bar-bottom' });

    bar.appendChild(top);
    bar.appendChild(bottom);

    return { bar, bottom };
  }

  function buildSummaryContent() {
    const content = createTag('div', { class: 'cc-summary-content' });

    const table = createTag('div', { class: 'cc-summary-table' });

    const header = createTag('div', { class: 'cc-summary-header' });
    header.appendChild(createTag('div', { class: 'cc-summary-header-cell' }, 'Category'));
    header.appendChild(createTag('div', { class: 'cc-summary-header-cell cc-summary-header-cell--level' }, 'AA'));
    header.appendChild(createTag('div', { class: 'cc-summary-header-cell cc-summary-header-cell--level' }, 'AAA'));
    table.appendChild(header);

    summaryBody = createTag('div', { class: 'cc-summary-body' });
    table.appendChild(summaryBody);

    content.appendChild(table);

    return content;
  }

  function applyColorState(fg, bg) {
    foreground = fg;
    background = bg;
    fgInput?.setValue(fg);
    bgInput?.setValue(bg);
    fgSlider?.refreshTints(fg);
    bgSlider?.refreshTints(bg);
    fgSlider?.updatePosition(fg);
    bgSlider?.updatePosition(bg);
    updateUI();
  }

  function handleSuggestionApply({ fg, bg }) {
    applyColorState(fg, bg);
    pushHistory();
  }

  function handleUndo() {
    const state = historyService.undo();
    if (!state) return;
    applyColorState(state.fg, state.bg);
  }

  function handleRedo() {
    const state = historyService.redo();
    if (!state) return;
    applyColorState(state.fg, state.bg);
  }

  async function buildTabs() {
    const tabsInstance = await createExpressTabs({
      selected: 'summary',
      size: 'm',
      quiet: true,
      tabs: [
        { label: 'Summary', value: 'summary' },
        { label: 'Contrast suggestions', value: 'suggestions' },
        { label: 'Set a contrast ratio', value: 'set-ratio' },
      ],
    });

    tabsInstance.tabsEl.classList.add('cc-tabs');

    tabsInstance.addPanel('summary', buildSummaryContent());

    suggestionsTab = createSuggestionsTab({
      recommendationService,
      onApply: handleSuggestionApply,
    });
    tabsInstance.addPanel('suggestions', suggestionsTab.element);

    setRatioTab = createSetRatioTab({
      dataService,
      recommendationService,
      onApply: handleSuggestionApply,
    });
    tabsInstance.addPanel('set-ratio', setRatioTab.element);

    tabsInstance.tabsEl.addEventListener('change', (e) => {
      if (e.target.selected === 'suggestions') {
        suggestionsTab.onVisible?.();
      }
    });

    return tabsInstance;
  }

  function handleColorChange(type, hex, commit) {
    if (type === 'fg') {
      foreground = hex;
      fgSlider?.refreshTints(hex);
      fgSlider?.updatePosition(hex);
    } else {
      background = hex;
      bgSlider?.refreshTints(hex);
      bgSlider?.updatePosition(hex);
    }
    updateUI();
    if (commit) pushHistory();
  }

  async function render() {
    container.replaceChildren();
    container.classList.add('contrast-checker-layout');

    fgInput = createCheckerColorInput('Foreground color', foreground, (hex, commit) => {
      handleColorChange('fg', hex, commit);
    });

    bgInput = createCheckerColorInput('Background color', background, (hex, commit) => {
      handleColorChange('bg', hex, commit);
    });

    function swapColors() {
      [foreground, background] = [background, foreground];
      fgInput.setValue(foreground);
      bgInput.setValue(background);
      fgSlider?.refreshTints(foreground);
      bgSlider?.refreshTints(background);
      fgSlider?.updatePosition(foreground);
      bgSlider?.updatePosition(background);
      updateUI();
      pushHistory();
    }

    await Promise.all([loadActionButton(), loadTooltip()]);

    const swapSvg = await loadSwapIcon();
    const theme = createThemeWrapper();
    const swapButton = createTag('sp-action-button', {
      quiet: '',
      label: 'Swap foreground and background colors',
      size: 'm',
    });

    const iconWrapper = createTag('span', {
      slot: 'icon',
      class: 'cc-swap-icon',
      'aria-hidden': 'true',
    }, swapSvg);
    swapButton.appendChild(iconWrapper);
    swapButton.addEventListener('click', swapColors);

    attachTooltip(swapButton, 'Swap');

    theme.appendChild(swapButton);
    swapButtonInstance = { element: theme, destroy: () => theme.remove() };

    const fgSliderObj = createTintSlider(foreground, (hex) => {
      foreground = hex;
      fgInput.setValue(hex);
      updateUI();
    }, (hex) => {
      foreground = hex;
      fgInput.setValue(hex);
      updateUI();
      pushHistory();
    });
    fgSlider = fgSliderObj;

    const bgSliderObj = createTintSlider(background, (hex) => {
      background = hex;
      bgInput.setValue(hex);
      updateUI();
    }, (hex) => {
      background = hex;
      bgInput.setValue(hex);
      updateUI();
      pushHistory();
    });
    bgSlider = bgSliderObj;

    const colorInputsWrapper = createTag('div', { class: 'cc-color-inputs-wrapper' });
    const fgColumn = createTag('div', { class: 'cc-color-column' });
    fgColumn.appendChild(fgInput.element);
    fgColumn.appendChild(fgSliderObj.element);

    const swapButtonContainer = createTag('div', { class: 'cc-swap-button-container' });
    swapButtonContainer.appendChild(swapButtonInstance.element);

    const bgColumn = createTag('div', { class: 'cc-color-column' });
    bgColumn.appendChild(bgInput.element);
    bgColumn.appendChild(bgSliderObj.element);

    colorInputsWrapper.appendChild(fgColumn);
    colorInputsWrapper.appendChild(swapButtonContainer);
    colorInputsWrapper.appendChild(bgColumn);

    const { bar: ratioBar, bottom: ratioBarBottom } = buildRatioBar();
    ratioBarBottom.appendChild(colorInputsWrapper);
    tabsElement = await buildTabs();

    container.appendChild(ratioBar);
    container.appendChild(tabsElement.element);

    pushHistory();
    updateUI();
  }

  function destroy() {
    fgInput?.destroy();
    bgInput?.destroy();
    swapButtonInstance?.destroy();
    tabsElement?.destroy();
    suggestionsTab?.destroy();
    setRatioTab?.destroy();
    historyService.clear();
    container.replaceChildren();
    mobileActionMenu?.destroy();
  }

  return {
    ...base,
    render,
    destroy,
    handleUndo,
    handleRedo,
  };
}
