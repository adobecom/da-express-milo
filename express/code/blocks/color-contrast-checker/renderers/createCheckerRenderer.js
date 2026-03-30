import { createTag } from '../../../scripts/utils.js';
import { createBaseRenderer } from '../../../scripts/color-shared/renderers/createBaseRenderer.js';
import { announceToScreenReader } from '../../../scripts/color-shared/spectrum/index.js';
import { ensureHash, isMobileOrTabletViewport, isMobileViewport } from '../../../scripts/color-shared/utils/utilities.js';
import { generateTints, hexToRgb, rgbToHsv } from '../utils/contrastUtils.js';
import createSuggestionsTab from './components/createSuggestionsTab.js';
import createSetRatioTab from './components/createSetRatioTab.js';
import { createColorInput } from './components/createColorInput.js';
import { createExpressTabs } from '../../../scripts/color-shared/spectrum/components/express-tabs.js';
import { loadActionButton, loadBadge, loadTooltip } from '../../../scripts/color-shared/spectrum/load-spectrum.js';
import { createThemeWrapper } from '../../../scripts/color-shared/spectrum/utils/theme.js';
import { createActionMenuState } from '../../../scripts/color-shared/components/createActionMenuState.js';
import { createContrastCheckerPlaceholders } from '../utils/placeholders.js';
import { FAIL, createDefaultActionMenuConfig } from '../utils/contrastConstants.js';
import '../../../scripts/color-shared/components/color-channel-slider/index.js';

const regionMap = { largeText: 'heading', smallText: 'body', graphicsAndUi: 'ui' };
const ACTION_MENU_ID = 'color-contrast-checker-menu';
const HISTORY_EVENT = `${ACTION_MENU_ID}:history-index-changed`;
const HISTORY_DEBOUNCE_MS = 300;
const TINT_COUNT = 21;
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
  const tints = generateTintScale(hex);
  const stops = tints.map((t, i) => {
    const percent = (i / (tints.length - 1)) * 100;
    return `${t} ${percent}%`;
  });
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

function generateTintScale(hex) {
  return ['#000000', ...generateTints(hex, TINT_COUNT - 1)];
}

function findTintIndex(hex) {
  const { r, g, b } = hexToRgb(hex);
  const { v } = rgbToHsv(r, g, b);
  return clampTintIndex(Math.round(v * MAX_TINT_INDEX));
}

function clampTintIndex(index) {
  return Math.max(0, Math.min(MAX_TINT_INDEX, Number(index) || 0));
}

function tintIndexToPercentValue(index) {
  return Math.round((clampTintIndex(index) / MAX_TINT_INDEX) * 100);
}

function formatTintDisplayValue(index) {
  return (Math.floor((tintIndexToPercentValue(index) / 10)) / 10).toString();
}

function sanitizeTintInputValue(value) {
  const numericValue = value.replaceAll(/[^\d.]/g, '');
  const decimalIndex = numericValue.indexOf('.');

  if (decimalIndex === -1) {
    return numericValue.slice(0, 3);
  }

  const integerPart = numericValue.slice(0, decimalIndex + 1);
  const fractionalPart = numericValue.slice(decimalIndex + 1).replaceAll('.', '').slice(0, 2);
  return `${integerPart}${fractionalPart}`.slice(0, 5);
}

function tintInputValueToNormalizedValue(value) {
  if (!value) {
    return null;
  }

  const parsedValue = Number.parseFloat(value);

  if (Number.isNaN(parsedValue)) {
    return null;
  }

  if (value.includes('.')) {
    return Math.max(0, Math.min(1, parsedValue));
  }

  return Math.max(0, Math.min(100, parsedValue)) / 100;
}

function tintNormalizedValueToIndex(value) {
  return clampTintIndex(Math.round(value * MAX_TINT_INDEX));
}

function createTintControlName(label) {
  return `${label.toLowerCase().replaceAll(/\s+/g, '-').replaceAll(/[^a-z0-9-]/g, '')}-tint-value`;
}

function createTintAccessibleLabel(label, description) {
  return label ? `${label}: ${description}` : description;
}

function createTintSlider(hex, onInput, onCommit, strings, label = '') {
  const container = createTag('div', { class: 'cc-slider-container' });
  const sliderRow = createTag('div', { class: 'cc-tint-slider-row' });
  const sliderWrapper = createTag('div', { class: 'cc-tint-slider-wrapper' });
  const slider = createTag('color-channel-slider');
  const tintInputAriaLabel = createTintAccessibleLabel(label, strings.tintValueAriaLabel);
  const tintSliderAriaLabel = createTintAccessibleLabel(label, strings.tintAdjustmentLabel);

  const tintInput = createTag('input', {
    type: 'text',
    class: 'cc-tint-value-input',
    value: '0',
    name: createTintControlName(label || 'tint'),
    'aria-label': tintInputAriaLabel,
    inputmode: 'decimal',
    autocomplete: 'off',
    spellcheck: 'false',
    maxlength: '5',
  });

  let tints = generateTintScale(hex);

  function syncTintValue(index) {
    const displayValue = formatTintDisplayValue(index);
    tintInput.value = displayValue;
    slider.valuetext = displayValue;
  }

  slider.min = 0;
  slider.max = MAX_TINT_INDEX;
  slider.value = findTintIndex(hex);
  slider.label = tintSliderAriaLabel;
  slider.gradient = buildTintGradient(hex);
  syncTintValue(slider.value);

  slider.addEventListener('input', (e) => {
    const val = clampTintIndex(e.detail?.value ?? e.target.value);
    const newHex = tints[val];
    if (newHex) {
      slider.value = val;
      syncTintValue(val);
      onInput(newHex);
    }
  });

  slider.addEventListener('change', (e) => {
    const val = clampTintIndex(e.detail?.value ?? e.target.value);
    const newHex = tints[val];
    if (newHex) {
      slider.value = val;
      syncTintValue(val);
      onCommit(newHex);
    }
  });

  tintInput.addEventListener('input', () => {
    const sanitizedValue = sanitizeTintInputValue(tintInput.value);

    if (tintInput.value !== sanitizedValue) {
      tintInput.value = sanitizedValue;
    }
  });

  tintInput.addEventListener('change', () => {
    const sanitizedValue = sanitizeTintInputValue(tintInput.value);
    const normalizedValue = tintInputValueToNormalizedValue(sanitizedValue);

    if (normalizedValue === null) {
      syncTintValue(slider.value);
      return;
    }

    const val = tintNormalizedValueToIndex(normalizedValue);
    slider.value = val;
    syncTintValue(val);
    const newHex = tints[val];
    if (newHex) onCommit(newHex);
  });

  tintInput.addEventListener('blur', () => {
    syncTintValue(slider.value);
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
      tints = generateTintScale(newHex);
      slider.gradient = buildTintGradient(newHex);
    },
    updatePosition(newHex) {
      const idx = findTintIndex(newHex);
      slider.value = idx;
      syncTintValue(idx);
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
  const {
    container,
    dataService,
    config = {},
    services = {},
    actionMenu: actionMenuApi,
    context,
  } = options;
  const base = createBaseRenderer({ ...options, data: [] });
  const { emit } = base;
  const { recommendation: recommendationService } = services;
  const strings = createContrastCheckerPlaceholders(config.strings);
  const tabs = config.tabs || strings.tabs;
  const actionMenuState = createActionMenuState(ACTION_MENU_ID);

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
  let mobilePreviewHost;
  let historyTimerId = null;
  let pendingHistoryState = null;
  let restoringFromHistory = false;
  let pushingState = false;
  let historyHandler = null;
  let handlePaletteChange = null;

  function getColorEditPalette(type, currentValue) {
    const palette = context?.get('palette');
    const colors = Array.isArray(palette?.colors)
      ? palette.colors.filter((hex) => dataService.isValidHex(hex))
      : [];
    const selectedColor = type === 'fg'
      ? palette?.selectedForeground ?? currentValue
      : palette?.selectedBackground ?? currentValue;
    const selectedIndex = colors.findIndex((hex) => hex?.toUpperCase() === selectedColor?.toUpperCase());

    if (!colors.length || selectedIndex === -1) {
      return {
        palette: [currentValue],
        selectedIndex: 0,
      };
    }

    return { palette: colors, selectedIndex };
  }

  function recalculate() {
    results = dataService.checkWCAG(foreground, background);
    emit('contrast-change', { foreground, background, ...results });
  }

  function getHistoryState() {
    return [foreground, background];
  }

  function isSameHistoryState(a, b) {
    return a?.[0]?.toUpperCase() === b?.[0]?.toUpperCase()
      && a?.[1]?.toUpperCase() === b?.[1]?.toUpperCase();
  }

  function clearHistoryTimer() {
    if (historyTimerId !== null) {
      clearTimeout(historyTimerId);
      historyTimerId = null;
    }
  }

  function commitHistoryState(state) {
    if (restoringFromHistory || !state || !actionMenuApi?.pushState) {
      return false;
    }

    if (isSameHistoryState(state, actionMenuApi.getCurrentPalette?.())) {
      return false;
    }

    pushingState = true;
    actionMenuApi.pushState(state);
    pushingState = false;
    return true;
  }

  function pushHistory({ debounced = false } = {}) {
    const nextState = getHistoryState();
    if (debounced) {
      pendingHistoryState = nextState;
      clearHistoryTimer();
      historyTimerId = setTimeout(() => {
        historyTimerId = null;
        const stateToCommit = pendingHistoryState;
        pendingHistoryState = null;
        commitHistoryState(stateToCommit);
      }, HISTORY_DEBOUNCE_MS);
      return;
    }

    clearHistoryTimer();
    pendingHistoryState = null;
    commitHistoryState(nextState);
  }

  function flushPendingHistory() {
    if (historyTimerId === null) return false;

    clearHistoryTimer();
    const stateToCommit = pendingHistoryState;
    pendingHistoryState = null;
    return commitHistoryState(stateToCommit);
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

  function createCheckerColorInput(type, label, initialValue, onChange) {
    const input = createColorInput({
      label,
      ariaLabel: strings.colorValueAriaLabel,
      value: initialValue,
      getColorEditPalette: ({ value }) => getColorEditPalette(type, value),
      onInput: ({ value: v }) => {
        const hex = ensureHash(v.trim());
        if (dataService.isValidHex(hex)) {
          onChange(hex, false);
        }
      },
      onColorChangeEnd: ({ value: v }) => {
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

  function clickHistoryButton(className) {
    flushPendingHistory();
    const button = mobileActionMenu?.element?.querySelector(className)
      || actionMenuApi?.element?.querySelector(className);
    button?.click();
  }

  function handleUndo() {
    clickHistoryButton('.undo-btn');
  }

  function handleRedo() {
    clickHistoryButton('.redo-btn');
  }

  async function buildRatioBar() {
    const bar = createTag('div', { class: 'cc-ratio-bar' });
    const top = createTag('div', { class: 'cc-ratio-bar-top' });

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

    if (isMobileOrTabletViewport()) {
      const { createActionMenuComponent } = await import(
        '../../../scripts/color-shared/components/createActionMenuComponent.js'
      );
      mobileActionMenu = await createActionMenuComponent({
        ...createDefaultActionMenuConfig(strings),
        id: ACTION_MENU_ID,
        type: 'controls-only',
        enableState: true,
        onUndo: () => actionMenuState.onUndo(),
        onRedo: () => actionMenuState.onRedo(),
      });
      if (mobileActionMenu?.element) {
        top.appendChild(mobileActionMenu.element);
      }
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
    const label = type === 'fg' ? strings.foregroundColor : strings.backgroundColor;

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
      label,
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
    container.classList.add('color-contrast-checker-layout');
    mobilePreviewHost = null;

    await Promise.all([loadBadge(), loadActionButton(), loadTooltip()]);

    fgInput = createCheckerColorInput('fg', strings.foregroundColor, foreground, (hex, commit) => {
      handleColorChange('fg', hex, commit);
    });

    bgInput = createCheckerColorInput('bg', strings.backgroundColor, background, (hex, commit) => {
      handleColorChange('bg', hex, commit);
    });

    if (handlePaletteChange) {
      context?.off?.('palette', handlePaletteChange);
    }
    handlePaletteChange = () => {
      fgInput?.refreshColorEditPalette?.();
      bgInput?.refreshColorEditPalette?.();
    };
    context?.on?.('palette', handlePaletteChange);

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
    if (isMobileViewport()) {
      mobilePreviewHost = createTag('div', { class: 'cc-mobile-preview-host' });
      container.appendChild(mobilePreviewHost);
    }
    container.appendChild(tabsElement.element);

    if (historyHandler) {
      document.removeEventListener(HISTORY_EVENT, historyHandler);
    }
    historyHandler = () => {
      if (pushingState) return;
      const [nextForeground, nextBackground] = actionMenuApi?.getCurrentPalette?.() || [];
      if (!nextForeground || !nextBackground) return;
      if (isSameHistoryState([nextForeground, nextBackground], getHistoryState())) return;

      restoringFromHistory = true;
      setColorPair(nextForeground, nextBackground);
      restoringFromHistory = false;
    };
    document.addEventListener(HISTORY_EVENT, historyHandler);

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
    clearHistoryTimer();
    pendingHistoryState = null;
    if (historyHandler) {
      document.removeEventListener(HISTORY_EVENT, historyHandler);
      historyHandler = null;
    }
    if (handlePaletteChange) {
      context?.off?.('palette', handlePaletteChange);
      handlePaletteChange = null;
    }
    container.replaceChildren();
    mobileActionMenu?.destroy();
  }

  return {
    ...base,
    render,
    destroy,
    handleUndo,
    handleRedo,
    getPreviewMountPoint: () => mobilePreviewHost,
  };
}
