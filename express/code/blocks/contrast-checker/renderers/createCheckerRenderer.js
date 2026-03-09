import { createTag } from '../../../scripts/utils.js';
import { createBaseRenderer } from '../../../scripts/color-shared/renderers/createBaseRenderer.js';
import { announceToScreenReader } from '../../../scripts/color-shared/spectrum/index.js';
import { ensureHash } from '../../../scripts/color-shared/utils/utilities.js';
import createHistoryService from '../services/createHistoryService.js';
import createRecommendationService from '../services/createRecommendationService.js';
import { generateTints } from '../utils/contrastUtils.js';
import createTabsComponent from './components/createTabsComponent.js';
import createSuggestionsTab from './components/createSuggestionsTab.js';
import createSetRatioTab from './components/createSetRatioTab.js';
import { createExpressTag } from '../../../scripts/color-shared/spectrum/components/express-tag.js';
import { createExpressTextfield } from '../../../scripts/color-shared/spectrum/components/express-textfield.js';
import createExpressActionButton from '../../../scripts/color-shared/spectrum/components/express-action-button.js';

/* eslint-disable max-len */
const SWAP_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M13 3l4 4-4 4M17 7H7M7 17l-4-4 4-4M3 13h10"/></svg>';
const UNDO_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4 9h10a3 3 0 0 1 0 6H9" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M7 6L4 9l3 3"/></svg>';
const REDO_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16 9H6a3 3 0 0 0 0 6h5" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M13 6l3 3-3 3"/></svg>';
const CHECK_CIRCLE_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" fill="currentColor"/><path d="M8.5 13.5L5.5 10.5l1-1 2 2 4.5-4.5 1 1z" fill="white"/></svg>';
const CLOSE_CIRCLE_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" fill="currentColor"/><path d="M13 7.7L12.3 7 10 9.3 7.7 7 7 7.7 9.3 10 7 12.3l.7.7L10 10.7 12.3 13l.7-.7L10.7 10z" fill="white"/></svg>';
/* eslint-enable max-len */

function buildResultCell(pass) {
  const cell = createTag('div', { class: `cc-summary-cell cc-summary-cell--${pass ? 'pass' : 'fail'}` });
  const icon = pass ? CHECK_CIRCLE_SVG : CLOSE_CIRCLE_SVG;
  cell.appendChild(createTag('span', { class: `cc-result-icon cc-result-icon--${pass ? 'pass' : 'fail'}`, 'aria-hidden': 'true' }, icon));
  cell.appendChild(document.createTextNode(pass ? 'Pass' : 'Fail'));
  return cell;
}

function updateSliderGradient(slider, hex) {
  if (!slider) return;
  const tints = generateTints(hex, 20);
  const gradient = tints.map((t, i) => `${t} ${(i / (tints.length - 1)) * 100}%`).join(', ');
  slider.style.background = `linear-gradient(to right, ${gradient})`;
}

function updateSliderPosition(slider, hex) {
  if (!slider) return;
  const tints = generateTints(hex, 20);
  const idx = tints.findIndex((t) => t.toLowerCase() === hex.toLowerCase());
  if (idx >= 0) {
    slider.value = idx;
  }
}

function switchTabPanel(panels, tabId) {
  panels.forEach((p) => {
    const isActive = p.dataset.tab === tabId;
    p.classList.toggle('cc-tab-panel--active', isActive);
  });
}

function createBrightnessSlider(hex, onInput, onCommit) {
  const wrapper = createTag('div', { class: 'cc-slider-container' });
  const sliderRow = createTag('div', { class: 'cc-tint-slider-row' });
  const sliderWrapper = createTag('div', { class: 'cc-tint-slider-wrapper' });

  const slider = createTag('input', {
    type: 'range',
    class: 'cc-brightness-slider',
    min: '0',
    max: '19',
    value: '0',
    'aria-label': 'Tint adjustment',
  });

  const tintInput = createTag('input', {
    type: 'text',
    class: 'cc-tint-value-input',
    value: '0',
    'aria-label': 'Tint value',
    maxlength: '3',
  });

  let tints = generateTints(hex, 20);
  updateSliderGradient(slider, hex);

  function updateTintInputValue() {
    tintInput.value = slider.value;
  }

  slider.addEventListener('input', () => {
    const newHex = tints[Number(slider.value)];
    if (newHex) {
      updateTintInputValue();
      onInput(newHex);
    }
  });

  slider.addEventListener('change', () => {
    const newHex = tints[Number(slider.value)];
    if (newHex) {
      updateTintInputValue();
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
  wrapper.appendChild(sliderRow);

  return {
    element: wrapper,
    slider,
    tintInput,
    refreshTints(newHex) {
      tints = generateTints(newHex, 20);
      updateSliderGradient(slider, newHex);
    },
    updateTintValue(val) {
      tintInput.value = val;
      slider.value = val;
    },
  };
}

// eslint-disable-next-line import/prefer-default-export
export function createCheckerRenderer(options) {
  const { container, dataService } = options;
  const base = createBaseRenderer({ ...options, data: [] });
  const { emit } = base;
  const historyService = createHistoryService();
  const recommendationService = createRecommendationService();

  let foreground = '#1B1B1B';
  let background = '#FFFFFF';
  let results = null;

  let fgInput;
  let bgInput;
  let fgSlider;
  let bgSlider;
  let undoBtn;
  let redoBtn;
  let badgeTagInstance;
  let badgeInnerTag;
  let swapButtonInstance;
  let summaryBody;
  let tabsComponent;
  let suggestionsTab;
  let setRatioTab;

  function recalculate() {
    results = dataService.checkWCAG(foreground, background);
    emit('contrast-change', { foreground, background, ...results });
  }

  function updateHistoryButtons() {
    if (undoBtn) undoBtn.disabled = !historyService.canUndo();
    if (redoBtn) redoBtn.disabled = !historyService.canRedo();
  }

  function pushHistory() {
    historyService.push({ fg: foreground, bg: background });
    updateHistoryButtons();
  }

  function updateContrastBadge() {
    if (!badgeInnerTag || !results) return;
    const level = dataService.getWCAGLevel(results);
    const pass = level !== 'FAIL';
    const ratioText = `${results.ratio} : 1`;

    const textNode = Array.from(badgeInnerTag.childNodes).find((n) => n.nodeType === 3);
    if (textNode) textNode.textContent = ratioText;
    else badgeInnerTag.appendChild(document.createTextNode(ratioText));

    const iconSlot = badgeInnerTag.querySelector('[slot="icon"]');
    if (iconSlot) {
      iconSlot.innerHTML = pass ? CHECK_CIRCLE_SVG : CLOSE_CIRCLE_SVG;
    }

    badgeInnerTag.classList.toggle('cc-badge--pass', pass);
    badgeInnerTag.classList.toggle('cc-badge--caution', !pass);
  }

  const regionMap = { 'Large text': 'heading', 'Small text': 'body', 'Graphics and UI': 'ui' };

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
      row.appendChild(createTag('div', { class: 'cc-summary-cell cc-summary-cell--category' }, label));
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

  function restoreState(state) {
    if (!state) return;
    foreground = state.fg;
    background = state.bg;
    fgInput?.setValue(foreground);
    bgInput?.setValue(background);
    updateSliderGradient(fgSlider?.slider, foreground);
    updateSliderGradient(bgSlider?.slider, background);
    updateSliderPosition(fgSlider?.slider, foreground);
    updateSliderPosition(bgSlider?.slider, background);
    updateUI();
    updateHistoryButtons();
  }

  async function createSpectrumColorInput(label, initialValue, onChange) {
    let lastValidHex = initialValue;

    const swatch = document.createElement('div');
    swatch.className = 'cc-color-swatch-circle';
    swatch.style.background = initialValue;

    let actualSwatch = swatch;

    const field = await createExpressTextfield({
      label,
      value: initialValue,
      size: 'l',
      maxlength: 7,
      leadingSlot: swatch,
      onInput: ({ value: v }) => {
        const hex = ensureHash(v.trim());
        if (dataService.isValidHex(hex)) {
          lastValidHex = hex;
          actualSwatch.style.background = hex;
          onChange(hex, false);
        }
      },
      onChange: ({ value: v }) => {
        const hex = ensureHash(v.trim());
        if (dataService.isValidHex(hex)) {
          lastValidHex = hex;
          actualSwatch.style.background = hex;
          onChange(hex, true);
        } else {
          field.setValue(lastValidHex);
          actualSwatch.style.background = lastValidHex;
        }
      },
    });

    actualSwatch = field.element.querySelector('.cc-color-swatch-circle') || swatch;

    return {
      element: field.element,
      setValue(hex) {
        lastValidHex = hex;
        field.setValue(hex);
        actualSwatch.style.background = hex;
      },
      destroy() {
        field.destroy();
      },
    };
  }

  async function buildRatioBar() {
    const bar = createTag('div', { class: 'cc-ratio-bar' });

    const top = createTag('div', { class: 'cc-ratio-bar-top' });
    const labelText = createTag('span', { class: 'cc-ratio-label-text' }, 'Contrast ratio');

    const actions = createTag('div', { class: 'cc-ratio-actions' });
    undoBtn = createTag('button', {
      type: 'button',
      class: 'cc-undo-btn',
      'aria-label': 'Undo',
      disabled: true,
    }, UNDO_SVG);
    redoBtn = createTag('button', {
      type: 'button',
      class: 'cc-redo-btn',
      'aria-label': 'Redo',
      disabled: true,
    }, REDO_SVG);

    undoBtn.addEventListener('click', () => restoreState(historyService.undo()));
    redoBtn.addEventListener('click', () => restoreState(historyService.redo()));

    actions.appendChild(undoBtn);
    actions.appendChild(redoBtn);
    top.appendChild(labelText);
    top.appendChild(actions);

    const bottom = createTag('div', { class: 'cc-ratio-bar-bottom' });
    badgeTagInstance = await createExpressTag({
      label: '\u2014 : 1',
      icon: CHECK_CIRCLE_SVG,
    });
    badgeInnerTag = badgeTagInstance.element.querySelector('sp-tag');
    if (badgeInnerTag) {
      badgeInnerTag.classList.add('cc-ratio-badge');
    }
    bottom.appendChild(badgeTagInstance.element);

    bar.appendChild(top);
    bar.appendChild(bottom);

    return bar;
  }

  function buildSummaryPanel() {
    const panel = createTag('div', {
      class: 'cc-tab-panel cc-tab-panel--active',
      'data-tab': 'summary',
      role: 'tabpanel',
    });

    const table = createTag('div', { class: 'cc-summary-table' });

    const header = createTag('div', { class: 'cc-summary-header' });
    header.appendChild(createTag('div', { class: 'cc-summary-header-cell' }, 'Category'));
    header.appendChild(createTag('div', { class: 'cc-summary-header-cell cc-summary-header-cell--level' }, 'AA'));
    header.appendChild(createTag('div', { class: 'cc-summary-header-cell cc-summary-header-cell--level' }, 'AAA'));
    table.appendChild(header);

    summaryBody = createTag('div', { class: 'cc-summary-body' });
    table.appendChild(summaryBody);

    const compareLink = createTag('a', {
      class: 'cc-compare-link',
      href: '#',
      role: 'button',
    }, 'Compare entire palette');

    panel.appendChild(table);
    panel.appendChild(compareLink);

    return panel;
  }

  function handleSuggestionApply({ fg, bg }) {
    foreground = fg;
    background = bg;
    fgInput?.setValue(fg);
    bgInput?.setValue(bg);
    fgSlider?.refreshTints(fg);
    bgSlider?.refreshTints(bg);
    updateSliderPosition(fgSlider?.slider, fg);
    updateSliderPosition(bgSlider?.slider, bg);
    updateUI();
    pushHistory();
  }

  function buildTabContent() {
    const content = createTag('div', { class: 'cc-tab-content' });

    const summaryPanel = buildSummaryPanel();

    const suggestionsPanel = createTag('div', {
      class: 'cc-tab-panel',
      'data-tab': 'suggestions',
      role: 'tabpanel',
    });
    suggestionsTab = createSuggestionsTab({
      recommendationService,
      onApply: handleSuggestionApply,
    });
    suggestionsPanel.appendChild(suggestionsTab.element);

    const setRatioPanel = createTag('div', {
      class: 'cc-tab-panel',
      'data-tab': 'set-ratio',
      role: 'tabpanel',
    });
    setRatioTab = createSetRatioTab({
      dataService,
      recommendationService,
      onApply: handleSuggestionApply,
    });
    setRatioPanel.appendChild(setRatioTab.element);

    content.appendChild(summaryPanel);
    content.appendChild(suggestionsPanel);
    content.appendChild(setRatioPanel);

    return { element: content, panels: [summaryPanel, suggestionsPanel, setRatioPanel] };
  }

  function handleColorChange(type, hex, commit) {
    if (type === 'fg') {
      foreground = hex;
      fgSlider?.refreshTints(hex);
      updateSliderPosition(fgSlider?.slider, hex);
    } else {
      background = hex;
      bgSlider?.refreshTints(hex);
      updateSliderPosition(bgSlider?.slider, hex);
    }
    updateUI();
    if (commit) pushHistory();
  }

  async function render() {
    container.replaceChildren();
    container.classList.add('contrast-checker-layout');

    fgInput = await createSpectrumColorInput('Foreground color', foreground, (hex, commit) => {
      handleColorChange('fg', hex, commit);
    });

    bgInput = await createSpectrumColorInput('Background color', background, (hex, commit) => {
      handleColorChange('bg', hex, commit);
    });

    swapButtonInstance = await createExpressActionButton({
      label: 'Swap foreground and background colors',
      iconOnly: true,
      icon: SWAP_SVG,
      onClick: () => {
        const tmp = foreground;
        foreground = background;
        background = tmp;
        fgInput.setValue(foreground);
        bgInput.setValue(background);
        fgSlider?.refreshTints(foreground);
        bgSlider?.refreshTints(background);
        updateSliderPosition(fgSlider?.slider, foreground);
        updateSliderPosition(bgSlider?.slider, background);
        updateUI();
        pushHistory();
      },
    });

    const fgSliderObj = createBrightnessSlider(foreground, (hex) => {
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

    const bgSliderObj = createBrightnessSlider(background, (hex) => {
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

    const ratioBar = await buildRatioBar();
    const tabContent = buildTabContent();

    tabsComponent = createTabsComponent({
      tabs: [
        { id: 'summary', label: 'Summary' },
        { id: 'suggestions', label: 'Contrast suggestions' },
        { id: 'set-ratio', label: 'Set a contrast ratio' },
      ],
      defaultTab: 'summary',
      onChange: (tabId) => switchTabPanel(tabContent.panels, tabId),
    });

    container.appendChild(colorInputsWrapper);
    container.appendChild(ratioBar);
    container.appendChild(tabsComponent.element);
    container.appendChild(tabContent.element);

    pushHistory();
    updateUI();
  }

  function destroy() {
    fgInput?.destroy();
    bgInput?.destroy();
    badgeTagInstance?.destroy();
    swapButtonInstance?.destroy();
    tabsComponent?.destroy();
    suggestionsTab?.destroy();
    setRatioTab?.destroy();
    historyService.clear();
    container.replaceChildren();
  }

  return {
    ...base,
    render,
    destroy,
  };
}
