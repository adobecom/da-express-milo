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

/* eslint-disable max-len */
const SWAP_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M13 3l4 4-4 4M17 7H7M7 17l-4-4 4-4M3 13h10"/></svg>';
const UNDO_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4 9h10a3 3 0 0 1 0 6H9" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M7 6L4 9l3 3"/></svg>';
const REDO_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16 9H6a3 3 0 0 0 0 6h5" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M13 6l3 3-3 3"/></svg>';
const CHECK_BADGE_SVG = '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 9L2 6.5l.7-.7L4.5 7.6l4.8-4.8.7.7z"/></svg>';
const FAIL_BADGE_SVG = '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M9 3.7L8.3 3 6 5.3 3.7 3 3 3.7 5.3 6 3 8.3l.7.7L6 6.7 8.3 9l.7-.7L6.7 6z"/></svg>';
const CHECK_GREEN_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" fill="#05834E"/><path d="M8.5 13.5L5.5 10.5l1-1 2 2 4.5-4.5 1 1z" fill="white"/></svg>';
/* eslint-enable max-len */

function buildResultCell(pass) {
  if (pass) {
    const cell = createTag('div', { class: 'cc-summary-cell cc-summary-cell--pass' });
    cell.appendChild(createTag('span', { 'aria-hidden': 'true' }, CHECK_GREEN_SVG));
    cell.appendChild(document.createTextNode('Pass'));
    return cell;
  }
  return createTag('div', { class: 'cc-summary-cell cc-summary-cell--fail' }, 'Fail');
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
  let badgeEl;
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
    if (!badgeEl || !results) return;
    const level = dataService.getWCAGLevel(results);
    const pass = level !== 'FAIL';
    const icon = pass ? CHECK_BADGE_SVG : FAIL_BADGE_SVG;
    const cls = pass ? 'cc-contrast-badge cc-contrast-badge--pass' : 'cc-contrast-badge cc-contrast-badge--fail';
    const ratioText = `${results.ratio} :1`;

    badgeEl.className = cls;
    badgeEl.innerHTML = '';
    badgeEl.appendChild(createTag('span', { 'aria-hidden': 'true' }, icon));
    badgeEl.appendChild(document.createTextNode(ratioText));
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
      const row = createTag('div', { class: 'cc-summary-row' });
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

  function createColorInput(label, value, onChange) {
    const group = createTag('div', { class: 'cc-color-input-group' });
    const labelEl = createTag('label', { class: 'cc-color-label' }, label);
    const row = createTag('div', { class: 'cc-color-input-row' });

    const swatch = createTag('input', {
      type: 'color',
      class: 'cc-color-swatch-input',
      value,
      'aria-label': `${label} color picker`,
    });

    const hexInput = createTag('input', {
      type: 'text',
      class: 'cc-hex-input',
      value,
      maxlength: '7',
      'aria-label': `${label} hex value`,
      spellcheck: 'false',
    });

    swatch.addEventListener('input', (e) => {
      const hex = e.target.value;
      hexInput.value = hex;
      onChange(hex, false);
    });

    swatch.addEventListener('change', (e) => {
      const hex = e.target.value;
      hexInput.value = hex;
      onChange(hex, true);
    });

    hexInput.addEventListener('change', (e) => {
      let hex = e.target.value.trim();
      hex = ensureHash(hex);
      if (dataService.isValidHex(hex)) {
        swatch.value = hex;
        hexInput.value = hex;
        onChange(hex, true);
      } else {
        hexInput.value = swatch.value;
      }
    });

    row.appendChild(swatch);
    row.appendChild(hexInput);
    group.appendChild(labelEl);
    group.appendChild(row);

    return {
      element: group,
      setValue(hex) {
        swatch.value = hex;
        hexInput.value = hex;
      },
    };
  }

  function createBrightnessSlider(hex, onInput, onCommit) {
    const wrapper = createTag('div', { class: 'cc-slider-container' });
    const slider = createTag('input', {
      type: 'range',
      class: 'cc-brightness-slider',
      min: '0',
      max: '19',
      value: '10',
    });

    let tints = generateTints(hex, 20);
    updateSliderGradient(slider, hex);

    slider.addEventListener('input', () => {
      const newHex = tints[Number(slider.value)];
      if (newHex) onInput(newHex);
    });

    slider.addEventListener('change', () => {
      const newHex = tints[Number(slider.value)];
      if (newHex) onCommit(newHex);
    });

    wrapper.appendChild(slider);

    return {
      element: wrapper,
      slider,
      refreshTints(newHex) {
        tints = generateTints(newHex, 20);
        updateSliderGradient(slider, newHex);
      },
    };
  }

  function buildRatioBar() {
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
    badgeEl = createTag('span', { class: 'cc-contrast-badge cc-contrast-badge--pass' });
    bottom.appendChild(badgeEl);

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
      dataService,
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

  function render() {
    container.replaceChildren();
    container.classList.add('contrast-checker-layout');

    const inputsSection = createTag('div', { class: 'cc-inputs-section' });

    fgInput = createColorInput('Text color', foreground, (hex, commit) => {
      handleColorChange('fg', hex, commit);
    });

    const swapBtn = createTag('button', {
      type: 'button',
      class: 'cc-swap-btn',
      'aria-label': 'Swap foreground and background colors',
      title: 'Swap colors',
    }, SWAP_SVG);

    swapBtn.addEventListener('click', () => {
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
    });

    bgInput = createColorInput('Background color', background, (hex, commit) => {
      handleColorChange('bg', hex, commit);
    });

    inputsSection.appendChild(fgInput.element);
    inputsSection.appendChild(swapBtn);
    inputsSection.appendChild(bgInput.element);

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

    const ratioBar = buildRatioBar();
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

    container.appendChild(inputsSection);
    container.appendChild(fgSliderObj.element);
    container.appendChild(bgSliderObj.element);
    container.appendChild(ratioBar);
    container.appendChild(tabsComponent.element);
    container.appendChild(tabContent.element);

    pushHistory();
    updateUI();
  }

  function destroy() {
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
