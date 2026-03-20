import { createTag } from '../../../scripts/utils.js';
import { createBaseRenderer } from '../../../scripts/color-shared/renderers/createBaseRenderer.js';
import { announceToScreenReader } from '../../../scripts/color-shared/spectrum/index.js';
import { ensureHash, isMobileOrTabletViewport } from '../../../scripts/color-shared/utils/utilities.js';
import { generateTints } from '../utils/contrastUtils.js';
import createSuggestionsTab from './components/createSuggestionsTab.js';
import createSetRatioTab from './components/createSetRatioTab.js';
import { createColorInput } from './components/createColorInput.js';
import { createExpressTabs } from '../../../scripts/color-shared/spectrum/components/express-tabs.js';
import { loadActionButton, loadBadge, loadTooltip } from '../../../scripts/color-shared/spectrum/load-spectrum.js';
import { createThemeWrapper } from '../../../scripts/color-shared/spectrum/utils/theme.js';
import { createContrastCheckerPlaceholders } from '../utils/placeholders.js';
import { FAIL, createDefaultActionMenuConfig } from '../utils/contrastConstants.js';
import createHistoryCommitController from '../utils/createHistoryCommitController.js';
import syncActionMenuHistoryState from '../utils/syncActionMenuHistoryState.js';
import '../../../scripts/color-shared/components/color-channel-slider/index.js';

const regionMap = { largeText: 'heading', smallText: 'body', graphicsAndUi: 'ui' };
const ACTION_MENU_HISTORY_IDS = ['contrast-checker-menu', 'contrast-checker-controls-only'];
const HISTORY_DEBOUNCE_MS = 300;
const TINT_COUNT = 20;
const MAX_TINT_INDEX = TINT_COUNT - 1;

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
  const tooltip = createTag('sp-tooltip', {
    'self-managed': '',
    placement,
  }, text);
  actionBtn.appendChild(tooltip);
}

function createTooltipLabelButton(label, tooltip, className = 'cc-summary-label') {
  const labelBtn = createTag('sp-action-button', {
    class: className,
    quiet: '',
    size: 's',
  });
  labelBtn.textContent = label;

  if (tooltip) {
    attachTooltip(labelBtn, tooltip, 'top');
  }

  return labelBtn;
}

function createTooltipLabelCell({ label, tooltip, className }) {
  const cell = createTag('div', { class: className });
  cell.appendChild(createTooltipLabelButton(label, tooltip));
  return cell;
}

function createSpectrumIcon(type, options = {}) {
  const normalizedOptions = typeof options === 'string' ? { variant: options } : options;
  const {
    variant = 'table',
    size = 'm',
    slot,
  } = normalizedOptions;
  let tagName;
  if (type === 'pass') {
    tagName = 'sp-icon-checkmark-circle';
  } else {
    tagName = variant === 'badge' ? 'sp-icon-alert-triangle' : 'sp-icon-close-circle';
  }

  const attributes = { 'aria-hidden': 'true' };

  if (variant === 'table') {
    attributes.size = size;
    attributes.class = `cc-result-icon cc-result-icon--${type}`;
  }

  if (slot) {
    attributes.slot = slot;
  }

  return createTag(tagName, attributes);
}

function createCategoryCell({ label, tooltip }) {
  return createTooltipLabelCell({
    label,
    tooltip,
    className: 'cc-summary-cell cc-summary-cell--category',
  });
}

function createLevelHeaderCell({ label, tooltip }) {
  return createTooltipLabelCell({
    label,
    tooltip,
    className: 'cc-summary-header-cell cc-summary-header-cell--level',
  });
}

function updateContrastRatioBadge(badge, ratio, pass, strings) {
  const icon = createSpectrumIcon(pass ? 'pass' : 'fail', {
    variant: 'badge',
    size: 's',
    slot: 'icon',
  });
  const ariaLabel = `${ratio} ${strings.ratioUnitSuffix}`;

  badge.setAttribute('variant', pass ? 'positive' : 'notice');
  badge.setAttribute('aria-label', ariaLabel);
  badge.parentElement?.setAttribute('aria-label', `${strings.contrastRatioLabel} ${ariaLabel}`);
  badge.removeAttribute('hidden');
  badge.replaceChildren(icon, document.createTextNode(`${ratio} ${strings.ratioUnitSuffix}`));
}

function createContrastRatioBadgeWrapper(ratio, pass, strings) {
  const theme = createThemeWrapper();
  const trigger = createTag('sp-action-button', {
    class: 'cc-contrast-ratio-badge-trigger',
    quiet: '',
    size: 's',
  });
  const badge = createTag('sp-badge', {
    class: 'cc-contrast-ratio-badge',
    size: 's',
    role: 'status',
    'aria-live': 'polite',
  });
  attachTooltip(trigger, strings.contrastRatioTooltip, 'top');
  trigger.appendChild(badge);
  theme.appendChild(trigger);
  updateContrastRatioBadge(badge, ratio, pass, strings);
  return { element: theme, badge };
}

function buildResultCell(pass, strings) {
  const cell = createTag('div', { class: `cc-summary-cell cc-summary-cell--${pass ? 'pass' : 'fail'}` });
  cell.appendChild(document.createTextNode(pass ? strings.pass : strings.fail));
  cell.appendChild(createSpectrumIcon(pass ? 'pass' : 'fail'));
  return cell;
}

function buildTintGradient(hex) {
  const tints = generateTints(hex, TINT_COUNT);
  const stops = tints.map((t, i) => {
    const percent = (i / (tints.length - 1)) * 100;
    return `${t} ${percent}%`;
  });
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

function findTintIndex(hex) {
  const tints = generateTints(hex, TINT_COUNT);
  const idx = tints.findIndex((t) => t.toLowerCase() === hex.toLowerCase());
  return Math.max(idx, 0);
}

function createTintSlider(hex, onInput, onCommit, strings) {
  const container = createTag('div', { class: 'cc-slider-container' });
  const sliderRow = createTag('div', { class: 'cc-tint-slider-row' });
  const sliderWrapper = createTag('div', { class: 'cc-tint-slider-wrapper' });
  const slider = createTag('color-channel-slider');

  const tintInput = createTag('input', {
    type: 'text',
    class: 'cc-tint-value-input',
    value: '0',
    'aria-label': strings.tintValueAriaLabel,
    maxlength: '3',
  });

  let tints = generateTints(hex, TINT_COUNT);

  slider.min = 0;
  slider.max = MAX_TINT_INDEX;
  slider.value = findTintIndex(hex);
  slider.label = strings.tintAdjustmentLabel;
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
    const val = Math.max(0, Math.min(MAX_TINT_INDEX, Number.parseInt(tintInput.value, 10) || 0));
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
      tints = generateTints(newHex, TINT_COUNT);
      slider.gradient = buildTintGradient(newHex);
    },
    updatePosition(newHex) {
      const idx = findTintIndex(newHex);
      slider.value = idx;
      tintInput.value = idx;
    },
  };
}

function syncColorControl(input, slider, hex) {
  input?.setValue(hex);
  slider?.refreshTints(hex);
  slider?.updatePosition(hex);
}

// eslint-disable-next-line import/prefer-default-export
export function createCheckerRenderer(options) {
  const { container, dataService, config = {}, services = {} } = options;
  const base = createBaseRenderer({ ...options, data: [] });
  const { emit } = base;
  const { history: historyService, recommendation: recommendationService } = services;
  const strings = createContrastCheckerPlaceholders(config.strings);
  const tabs = config.tabs || strings.tabs;
  const historyController = createHistoryCommitController(historyService, {
    debounceMs: HISTORY_DEBOUNCE_MS,
    onUpdate: () => syncActionMenuHistoryState(ACTION_MENU_HISTORY_IDS, historyService),
  });

  let foreground = config.initialForeground;
  let background = config.initialBackground;
  let results = null;

  let fgInput;
  let bgInput;
  let fgSlider;
  let bgSlider;
  let ratioBadge;
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

  function getHistoryState() {
    return { fg: foreground, bg: background };
  }

  function pushHistory({ debounced = false } = {}) {
    if (debounced) {
      historyController.schedule(getHistoryState());
      return;
    }

    historyController.commit(getHistoryState());
  }

  function flushPendingHistory() {
    historyController.flush();
  }

  function updateContrastBadge() {
    if (!ratioBadge || !results) return;
    const level = dataService.getWCAGLevel(results);
    const pass = level !== FAIL;

    updateContrastRatioBadge(ratioBadge, results.ratio, pass, strings);
  }

  function updateSummaryTable() {
    if (!summaryBody || !results) return;
    summaryBody.replaceChildren();

    const rows = [
      {
        id: 'largeText',
        label: strings.largeText,
        tooltip: strings.largeTextTooltip,
        aa: results.largeAA,
        aaa: results.largeAAA,
      },
      {
        id: 'smallText',
        label: strings.smallText,
        tooltip: strings.smallTextTooltip,
        aa: results.normalAA,
        aaa: results.normalAAA,
      },
      {
        id: 'graphicsAndUi',
        label: strings.graphicsAndUi,
        tooltip: strings.graphicsAndUiTooltip,
        aa: results.uiComponents,
        aaa: null,
      },
    ];

    rows.forEach((rowData) => {
      const {
        id,
        label,
        tooltip,
        aa,
        aaa,
      } = rowData;
      const row = createTag('div', { class: 'cc-summary-row', tabindex: '0', role: 'row' });
      row.appendChild(createCategoryCell({ label, tooltip }));
      row.appendChild(buildResultCell(aa, strings));
      row.appendChild(aaa === null
        ? createTag('div', { class: 'cc-summary-cell' }, '—')
        : buildResultCell(aaa, strings));

      row.addEventListener('mouseenter', () => {
        emit('contrast-highlight', { region: regionMap[id] });
      });
      row.addEventListener('mouseleave', () => {
        emit('contrast-highlight', { region: null });
      });
      row.addEventListener('focusin', () => {
        emit('contrast-highlight', { region: regionMap[id] });
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
    announceToScreenReader(strings.contrastRatioAnnouncement.replace('{ratio}', results.ratio));
  }

  function setColorPair(fg, bg, { syncControls = true, historyMode = 'none' } = {}) {
    if (historyMode === 'immediate') {
      flushPendingHistory();
    }

    foreground = fg;
    background = bg;

    if (syncControls) {
      syncColorControl(fgInput, fgSlider, foreground);
      syncColorControl(bgInput, bgSlider, background);
    }

    updateUI();

    if (historyMode === 'debounced') {
      pushHistory({ debounced: true });
    } else if (historyMode === 'immediate') {
      pushHistory();
    }
  }

  function createCheckerColorInput(label, initialValue, onChange) {
    const input = createColorInput({
      label,
      ariaLabel: strings.colorValueAriaLabel,
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

  function handleSuggestionApply({ fg, bg }) {
    setColorPair(fg, bg, { historyMode: 'immediate' });
  }

  function handleUndo() {
    flushPendingHistory();
    const state = historyService.undo();
    syncActionMenuHistoryState(ACTION_MENU_HISTORY_IDS, historyService);
    if (!state) return;
    setColorPair(state.fg, state.bg);
  }

  function handleRedo() {
    flushPendingHistory();
    const state = historyService.redo();
    syncActionMenuHistoryState(ACTION_MENU_HISTORY_IDS, historyService);
    if (!state) return;
    setColorPair(state.fg, state.bg);
  }

  async function buildRatioBar() {
    const bar = createTag('div', { class: 'cc-ratio-bar' });
    const top = createTag('div', { class: 'cc-ratio-bar-top' });
    const createActionMenu = options.actionMenu;

    const ratioLabelContainer = createTag('div', { class: 'cc-ratio-label-container' });
    const labelText = createTag('span', { class: 'cc-ratio-label-text' }, strings.contrastRatioLabel);

    const ratioBadgeComponent = createContrastRatioBadgeWrapper(results?.ratio ?? '', true, strings);
    ratioBadge = ratioBadgeComponent.badge;
    ratioBadge.setAttribute('hidden', '');

    ratioLabelContainer.appendChild(labelText);
    ratioLabelContainer.appendChild(ratioBadgeComponent.element);

    const compareLink = createTag('button', {
      type: 'button',
      class: 'cc-compare-link',
    }, strings.compareEntirePalette);

    top.appendChild(ratioLabelContainer);

    if (!isMobileOrTabletViewport()) {
      top.appendChild(compareLink);
    }

    if (createActionMenu && isMobileOrTabletViewport()) {
      mobileActionMenu = await createActionMenu(top, {
        ...createDefaultActionMenuConfig(strings),
        id: 'contrast-checker-controls-only',
        type: 'controls-only',
        onUndo: handleUndo,
        onRedo: handleRedo,
      });
    }

    const bottom = createTag('div', { class: 'cc-ratio-bar-bottom' });

    bar.appendChild(top);
    bar.appendChild(bottom);

    return { bar, bottom, compareLink };
  }

  function buildSummaryContent() {
    const content = createTag('div', { class: 'cc-summary-content' });

    const table = createTag('div', { class: 'cc-summary-table' });

    const header = createTag('div', { class: 'cc-summary-header' });
    header.appendChild(createTag('div', { class: 'cc-summary-header-cell' }, strings.category));
    header.appendChild(createLevelHeaderCell({
      label: strings.levelAa,
      tooltip: strings.levelAaTooltip,
    }));
    header.appendChild(createLevelHeaderCell({
      label: strings.levelAaa,
      tooltip: strings.levelAaaTooltip,
    }));
    table.appendChild(header);

    summaryBody = createTag('div', { class: 'cc-summary-body' });
    table.appendChild(summaryBody);

    content.appendChild(table);

    return content;
  }

  async function buildTabs() {
    const tabsInstance = await createExpressTabs({
      selected: 'summary',
      size: 'm',
      quiet: true,
      tabs,
    });

    tabsInstance.tabsEl.classList.add('cc-tabs');

    tabsInstance.addPanel('summary', buildSummaryContent());

    suggestionsTab = createSuggestionsTab({
      recommendationService,
      onApply: handleSuggestionApply,
      strings,
    });
    tabsInstance.addPanel('suggestions', suggestionsTab.element);

    setRatioTab = createSetRatioTab({
      dataService,
      recommendationService,
      onApply: handleSuggestionApply,
      strings,
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
      setColorPair(hex, background, { historyMode: commit ? 'immediate' : 'none' });
      return;
    }

    setColorPair(foreground, hex, { historyMode: commit ? 'immediate' : 'none' });
  }

  function createSliderFor(type, inputControl) {
    const initialHex = type === 'fg' ? foreground : background;

    return createTintSlider(
      initialHex,
      (nextHex) => {
        inputControl.setValue(nextHex);
        if (type === 'fg') {
          setColorPair(nextHex, background, { syncControls: false, historyMode: 'debounced' });
        } else {
          setColorPair(foreground, nextHex, { syncControls: false, historyMode: 'debounced' });
        }
      },
      (nextHex) => {
        if (type === 'fg') {
          setColorPair(nextHex, background, { historyMode: 'immediate' });
        } else {
          setColorPair(foreground, nextHex, { historyMode: 'immediate' });
        }
      },
      strings,
    );
  }

  async function createSwapButton() {
    const swapSvg = await loadSwapIcon();
    const theme = createThemeWrapper();
    const swapButton = createTag('sp-action-button', {
      quiet: '',
      label: strings.swapColorsAriaLabel,
      size: 'm',
    });

    const iconWrapper = createTag('span', {
      slot: 'icon',
      class: 'cc-swap-icon',
      'aria-hidden': 'true',
    }, swapSvg);
    swapButton.appendChild(iconWrapper);
    swapButton.addEventListener('click', () => {
      setColorPair(background, foreground, { historyMode: 'immediate' });
    });

    attachTooltip(swapButton, strings.swap);

    theme.appendChild(swapButton);
    return { element: theme, destroy: () => theme.remove() };
  }

  async function render() {
    container.replaceChildren();
    container.classList.add('contrast-checker-layout');

    await Promise.all([loadBadge(), loadActionButton(), loadTooltip()]);

    fgInput = createCheckerColorInput(strings.foregroundColor, foreground, (hex, commit) => {
      handleColorChange('fg', hex, commit);
    });

    bgInput = createCheckerColorInput(strings.backgroundColor, background, (hex, commit) => {
      handleColorChange('bg', hex, commit);
    });

    swapButtonInstance = await createSwapButton();

    fgSlider = createSliderFor('fg', fgInput);
    bgSlider = createSliderFor('bg', bgInput);

    const colorInputsWrapper = createTag('div', { class: 'cc-color-inputs-wrapper' });
    const fgColumn = createTag('div', { class: 'cc-color-column' });
    fgColumn.appendChild(fgInput.element);
    fgColumn.appendChild(fgSlider.element);

    const swapButtonContainer = createTag('div', { class: 'cc-swap-button-container' });
    swapButtonContainer.appendChild(swapButtonInstance.element);

    const bgColumn = createTag('div', { class: 'cc-color-column' });
    bgColumn.appendChild(bgInput.element);
    bgColumn.appendChild(bgSlider.element);

    colorInputsWrapper.appendChild(fgColumn);
    colorInputsWrapper.appendChild(swapButtonContainer);
    colorInputsWrapper.appendChild(bgColumn);

    const { bar: ratioBar, bottom: ratioBarBottom, compareLink } = await buildRatioBar();
    ratioBarBottom.appendChild(colorInputsWrapper);

    if (isMobileOrTabletViewport()) {
      ratioBar.appendChild(compareLink);
    }

    tabsElement = await buildTabs();

    container.appendChild(ratioBar);
    container.appendChild(tabsElement.element);

    pushHistory();
    syncActionMenuHistoryState(ACTION_MENU_HISTORY_IDS, historyService);
    updateUI();
  }

  function destroy() {
    fgInput?.destroy();
    bgInput?.destroy();
    swapButtonInstance?.destroy();
    tabsElement?.destroy();
    suggestionsTab?.destroy();
    setRatioTab?.destroy();
    historyController.cancel();
    historyService.clear();
    syncActionMenuHistoryState(ACTION_MENU_HISTORY_IDS, historyService);
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
