import { createTag } from '../../../scripts/utils.js';
import { createBaseRenderer } from '../../../scripts/color-shared/renderers/createBaseRenderer.js';
import { announceToScreenReader } from '../../../scripts/color-shared/spectrum/index.js';
import { ensureHash } from '../../../scripts/color-shared/utils/utilities.js';
import createHistoryService from '../services/createHistoryService.js';
import createRecommendationService from '../services/createRecommendationService.js';
import { generateTints } from '../utils/contrastUtils.js';
import createSuggestionsTab from './components/createSuggestionsTab.js';
import createSetRatioTab from './components/createSetRatioTab.js';
import { createExpressTag } from '../../../scripts/color-shared/spectrum/components/express-tag.js';
import { createColorInput } from './components/createColorInput.js';
import { createExpressTabs } from '../../../scripts/color-shared/spectrum/components/express-tabs.js';
import { createIconButton } from '../../../scripts/color-shared/utils/icons.js';
import '../../../scripts/color-shared/components/color-channel-slider/index.js';

function createSpectrumIcon(type, variant = 'table') {
  let tagName;
  if (type === 'pass') {
    tagName = 'sp-icon-checkmark-circle';
  } else {
    tagName = variant === 'badge' ? 'sp-icon-alert' : 'sp-icon-close-circle';
  }
  return createTag(tagName, {
    size: 's',
    class: `cc-result-icon cc-result-icon--${type}`,
    'aria-hidden': 'true',
  });
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
  let badgeTagInstance;
  let badgeInnerTag;
  let swapButtonInstance;
  let summaryBody;
  let tabsElement;
  let suggestionsTab;
  let setRatioTab;

  function recalculate() {
    results = dataService.checkWCAG(foreground, background);
    emit('contrast-change', { foreground, background, ...results });
  }

  function pushHistory() {
    historyService.push({ fg: foreground, bg: background });
  }

  function updateContrastBadge() {
    if (!badgeInnerTag || !results) return;
    const level = dataService.getWCAGLevel(results);
    const pass = level !== 'FAIL';
    const ratioText = `${results.ratio} : 1`;

    const textNode = Array.from(badgeInnerTag.childNodes).find((n) => n.nodeType === 3);
    if (textNode) textNode.textContent = ratioText;
    else badgeInnerTag.appendChild(document.createTextNode(ratioText));

    const oldIcon = badgeInnerTag.querySelector('[slot="icon"]');
    if (oldIcon) {
      const newIcon = createSpectrumIcon(pass ? 'pass' : 'fail', 'badge');
      newIcon.setAttribute('slot', 'icon');
      oldIcon.replaceWith(newIcon);
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

  async function buildRatioBar() {
    const bar = createTag('div', { class: 'cc-ratio-bar' });

    const top = createTag('div', { class: 'cc-ratio-bar-top' });

    const ratioLabelContainer = createTag('div', { class: 'cc-ratio-label-container' });
    const labelText = createTag('span', { class: 'cc-ratio-label-text' }, 'Contrast ratio');

    badgeTagInstance = await createExpressTag({
      label: '\u2014 : 1',
      icon: createSpectrumIcon('pass', 'badge'),
    });
    badgeInnerTag = badgeTagInstance.element.querySelector('sp-tag');
    if (badgeInnerTag) {
      badgeInnerTag.classList.add('cc-ratio-badge');
    }

    ratioLabelContainer.appendChild(labelText);
    ratioLabelContainer.appendChild(badgeTagInstance.element);

    const compareLink = createTag('a', {
      class: 'cc-compare-link',
      href: '#',
      role: 'button',
    }, 'Compare entire palette');

    top.appendChild(ratioLabelContainer);
    top.appendChild(compareLink);

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

  function handleSuggestionApply({ fg, bg }) {
    foreground = fg;
    background = bg;
    fgInput?.setValue(fg);
    bgInput?.setValue(bg);
    fgSlider?.refreshTints(fg);
    bgSlider?.refreshTints(bg);
    fgSlider?.updatePosition(fg);
    bgSlider?.updatePosition(bg);
    updateUI();
    pushHistory();
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

    const swapButton = createIconButton({
      icon: 'Switch',
      label: 'Swap foreground and background colors',
      size: 'm',
      onClick: swapColors,
    });

    const tooltip = createTag('sp-tooltip', { 'self-managed': '', placement: 'bottom' }, 'Swap');
    swapButton.appendChild(tooltip);

    swapButtonInstance = { element: swapButton, destroy: () => swapButton.remove() };

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

    const { bar: ratioBar, bottom: ratioBarBottom } = await buildRatioBar();
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
    badgeTagInstance?.destroy();
    swapButtonInstance?.destroy();
    tabsElement?.destroy();
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
