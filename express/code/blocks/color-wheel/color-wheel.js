import { createTag, getLibs } from '../../scripts/utils.js';
import adoptHeadline from '../../scripts/color-shared/utils/adoptHeadline.js';
import { createColorPaletteParamApi, decorateAnalyticsAttributes } from '../../scripts/color-shared/utils/utilities.js';

// CSS deps previously loaded via @import (serial waterfall). Injecting <link>
// elements at module evaluation starts downloads in parallel with the heavy JS
// imports below — no need to await a loadStyle helper first.
const CSS_DEPS = [
  '/express/code/scripts/color-shared/components/strips/color-strip.css',
  '/express/code/scripts/color-shared/components/image-upload/image-upload.css',
  '/express/code/blocks/color-wheel/image-extract.css',
];
CSS_DEPS.forEach((href) => {
  if (!document.querySelector(`link[href="${href}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
});

// Module-level refs populated by loadHeavyModules(). Existing helper functions
// (buildHarmonySelector, buildTabs, etc.) reference these directly.
let trackColorBlockLoad;
let createColorToolLayout;
let createExpressTabs;
let createColorWheelExpressAdapter;
let createBaseColorAdapter;
let createStripContainerRenderer;
let ColorThemeExpressController;
let randomHex;
let createSimpleCarousel;
let createImageExtractComponent;
let createExpressTooltip;

// All imports start downloading in parallel at module evaluation time.
// They are split into groups so loadHeavyModules() can yield between
// evaluation phases — spreading the JS evaluation cost across multiple tasks
// to reduce TBT on throttled-CPU environments (e.g. Lighthouse desktop).
// NOTE: Per-module yields (one yield per import) was tested and INCREASED
// TBT from 420ms to 920ms — the scheduling overhead and lost batch-evaluation
// of shared Spectrum dependencies outweighed the finer granularity.
const heavyModulesPromise1 = Promise.all([
  import('../../scripts/instrument.js'),
  import('../../scripts/color-shared/controllers/ColorThemeExpressController.js'),
  import('../../scripts/widgets/simple-carousel.js'),
]);
// Layout shell + tabs: register the outer Spectrum chrome first
const heavyModulesPromise2a = Promise.all([
  import('../../scripts/color-shared/shell/layouts/createColorToolLayout.js'),
  import('../../scripts/color-shared/spectrum/components/express-tabs.js'),
]);
// Color adapters + strip renderer: the core interaction layer
const heavyModulesPromise2b = Promise.all([
  import('../../scripts/color-shared/adapters/createColorWheelExpressAdapter.js'),
  import('../../scripts/color-shared/adapters/createBaseColorAdapter.js'),
  import('../../scripts/color-shared/renderers/createStripContainerRenderer.js'),
]);
// Image extract + tooltip: used only when switching tabs or on desktop hover
const heavyModulesPromise2c = Promise.all([
  import('./createImageExtractComponent.js'),
  import('../../scripts/color-shared/spectrum/components/express-tooltip.js'),
]);

// Always yields to a new task — uses scheduler.yield() when available,
// falls back to setTimeout(0) so the boundary is guaranteed in all runtimes.
function yieldToMain() {
  if ('scheduler' in window && 'yield' in window.scheduler) {
    return window.scheduler.yield();
  }
  return new Promise((resolve) => { setTimeout(resolve, 0); });
}

async function loadHeavyModules() {
  const [a, g, h] = await heavyModulesPromise1;
  trackColorBlockLoad = a.trackColorBlockLoad;
  ColorThemeExpressController = g.default;
  randomHex = g.randomHex;
  createSimpleCarousel = h.default;

  // Yield between each sub-group so Spectrum/Lit web-component evaluation
  // is spread across separate tasks rather than one 350ms+ burst.
  await yieldToMain();

  const [b, c] = await heavyModulesPromise2a;
  createColorToolLayout = b.default;
  createExpressTabs = c.createExpressTabs;

  await yieldToMain();

  const [d, e, f] = await heavyModulesPromise2b;
  createColorWheelExpressAdapter = d.default;
  createBaseColorAdapter = e.default;
  createStripContainerRenderer = f.createStripContainerRenderer;

  await yieldToMain();

  const [i, j] = await heavyModulesPromise2c;
  createImageExtractComponent = i.default;
  createExpressTooltip = j.createExpressTooltip;
}

async function loadPlaceholders() {
  const [{ getConfig }, { replaceKeyArray }] = await Promise.all([
    import(`${getLibs()}/utils/utils.js`),
    import(`${getLibs()}/features/placeholders.js`),
  ]);
  const values = await replaceKeyArray([
    'primary-color',
    'image',
    'color-wheel',
    'custom',
    'analogous',
    'complementary',
    'split-complementary',
    'triad',
    'square',
    'compound',
    'shades',
    'monochromatic',
    'color-harmonies',
    'undo',
    'redo',
    'generate-random',
    'maximize',
    'create-palette',
    'contrast-checker',
    'color-blindness-simulator',
    'no-image-try-ours',
    'use-this-image',
    'extracting-colors',
  ], getConfig());
  return {
    tabPrimaryColor: values[0] || 'Primary color',
    tabImage: values[1] || 'Image',
    tabColorWheel: values[2] || 'Color Wheel',
    harmonyLabels: {
      CUSTOM: values[3] || 'Custom',
      ANALOGOUS: values[4] || 'Analogous',
      COMPLEMENTARY: values[5] || 'Complementary',
      SPLIT_COMPLEMENTARY: values[6] || 'Split complementary',
      TRIAD: values[7] || 'Triad',
      SQUARE: values[8] || 'Square',
      COMPOUND: values[9] || 'Compound',
      SHADES: values[10] || 'Shades',
      MONOCHROMATIC: values[11] || 'Monochromatic',
    },
    colorHarmonies: values[12] || 'Color harmonies:',
    undo: values[13] || 'Undo',
    redo: values[14] || 'Redo',
    generateRandom: values[15] || 'Generate random',
    maximize: values[16] || 'Maximize',
    createPalette: values[17] || 'Create palette',
    contrastChecker: values[18] || 'Contrast Checker',
    colorBlindnessSimulator: values[19] || 'Color Blindness Simulator',
    noImageTryOurs: values[20] || 'Don\u2019t have an image? Try one of ours:',
    useThisImage: values[21] || 'Use this image',
    extractingColors: values[22] || 'Extracting colors...',
  };
}

const PRIMARY_COLOR_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="mask0_13766_5780" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
<g clip-path="url(#clip0_13766_5780)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M13.361 1.2644L11.4236 3.20072L10.8403 2.61749C10.4063 2.18347 9.70319 2.18347 9.26917 2.61749C8.83515 3.05152 8.83515 3.75465 9.26917 4.18867L9.85267 4.77217L2.28566 12.3386C2.13809 12.4862 2.03501 12.6717 1.98835 12.8746L1.21035 16.2481C1.03674 17.0001 1.25809 17.7748 1.80388 18.3206C2.22706 18.7438 2.78804 18.9717 3.36855 18.9717C3.53674 18.9717 3.70709 18.9532 3.87527 18.9141L7.24984 18.1361C7.45275 18.0895 7.63829 17.9864 7.78586 17.8388L15.3523 10.2718L15.9358 10.8553C16.1528 11.0723 16.4371 11.1808 16.7214 11.1808C17.0057 11.1808 17.29 11.0723 17.507 10.8553C17.941 10.4213 17.941 9.71817 17.507 9.28415L16.9238 8.70093L18.8601 6.76354C19.6081 6.01553 19.987 5.03578 19.9968 4.05302C20.0068 3.04422 19.6279 2.03224 18.8601 1.2644C18.1116 0.515882 17.1321 0.136716 16.1497 0.126905C15.1411 0.116827 14.1294 0.495993 13.361 1.2644ZM11.2231 11.259C11.1843 11.2546 11.1504 11.2362 11.1105 11.2362H6.53072L11.4238 6.34335L13.7811 8.70066L11.2231 11.259Z" fill="#292929"/>
</g>
</mask>
<g mask="url(#mask0_13766_5780)">
<rect width="20" height="20" fill="#505050"/>
</g>
<defs>
<clipPath id="clip0_13766_5780">
<rect width="20" height="20" fill="white"/>
</clipPath>
</defs>
</svg>`;
const COLOR_WHEEL_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="mask0_13766_5803" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
<path d="M10 1.75C5.45117 1.75 1.75 5.45117 1.75 10C1.75 14.5488 5.45117 18.25 10 18.25C14.5488 18.25 18.25 14.5488 18.25 10C18.25 5.45117 14.5488 1.75 10 1.75ZM9.99927 9.99976L9.99182 3.25049C9.99457 3.25049 9.99725 3.25 10 3.25C12.4848 3.25 14.6545 4.60327 15.8262 6.60791C16.4097 7.60596 16.75 8.7627 16.75 10C16.75 11.2285 16.4148 12.3779 15.8389 13.3713C14.6702 15.3874 12.4935 16.75 10 16.75C9.99176 16.75 9.98376 16.7488 9.97552 16.7488C7.48352 16.7397 5.31018 15.3713 4.14831 13.3501C3.58007 12.3616 3.24999 11.2197 3.24999 10C3.24999 8.77148 3.58513 7.62231 4.16094 6.62891L9.99927 9.99976Z" fill="#292929"/>
<path opacity="0.7" d="M4.16095 6.62891C3.58514 7.62232 3.25 8.77149 3.25 10C3.25 11.2197 3.58008 12.3616 4.14832 13.3501L9.99927 9.99976L4.16095 6.62891Z" fill="#292929"/>
<path opacity="0.5" d="M4.14844 13.3501C5.31031 15.3713 7.48365 16.7397 9.97565 16.7488L9.99939 9.99976L4.14844 13.3501Z" fill="#292929"/>
<path opacity="0.35" d="M9.99835 9.99976L9.97461 16.7488C9.98285 16.7488 9.99085 16.75 9.99909 16.75C12.4926 16.75 14.6693 15.3874 15.838 13.3713L9.99835 9.99976Z" fill="#292929"/>
<path opacity="0.12" d="M10 9.99976L15.8397 13.3713C16.4155 12.3779 16.7507 11.2285 16.7507 10C16.7507 8.7627 16.4105 7.60596 15.827 6.60791L10 9.99976Z" fill="#292929"/>
</mask>
<g mask="url(#mask0_13766_5803)">
<rect width="20" height="20" fill="#292929"/>
</g>
</svg>
`;
const HARMONY_THUMB_BASE = '/express/code/blocks/color-wheel/harmony-thumbnails';
const HARMONY_RULES = [
  { value: 'CUSTOM', label: 'Custom', thumb: 'custom.png' },
  { value: 'ANALOGOUS', label: 'Analogous', thumb: 'analogous.png' },
  { value: 'COMPLEMENTARY', label: 'Complementary', thumb: 'complementary.png' },
  { value: 'SPLIT_COMPLEMENTARY', label: 'Split complementary', thumb: 'split-complementary.png' },
  { value: 'TRIAD', label: 'Triad', thumb: 'triad.png' },
  { value: 'SQUARE', label: 'Square', thumb: 'square.png' },
  { value: 'COMPOUND', label: 'Compound', thumb: 'compound.png' },
  { value: 'SHADES', label: 'Shades', thumb: 'shades.png' },
  { value: 'MONOCHROMATIC', label: 'Monochromatic', thumb: 'monochromatic.png' },
];
const HARMONY_ALLOWED_FOR_TWO = new Set([
  'CUSTOM', 'MONOCHROMATIC', 'COMPLEMENTARY', 'SHADES',
]);
const HARMONY_ALLOWED_FOR_THREE = new Set([
  'CUSTOM', 'ANALOGOUS', 'MONOCHROMATIC', 'TRIAD', 'COMPLEMENTARY',
  'SPLIT_COMPLEMENTARY', 'SHADES',
]);
const HARMONY_CAROUSEL_ACTIVE_CLASS = 'color-wheel-harmony-option--selected';
const ACTION_MENU_ID = 'color-wheel-action-menu';

function buildDefaultActionMenuConfig(strings) {
  return {
    id: ACTION_MENU_ID,
    activeId: 'palette',
    navLinks: [
      { id: 'palette', label: strings.createPalette, href: '/create/color-wheel' },
      { id: 'contrast', label: strings.contrastChecker, href: '/create/color-contrast-analyzer' },
      { id: 'color-blindness', label: strings.colorBlindnessSimulator, href: '/create/color-accessibility' },
    ],
  };
}
const THEME_NAME = 'My Color Theme';
const HISTORY_EVENT = `${ACTION_MENU_ID}:history-index-changed`;
const HISTORY_SKIP_SOURCES = new Set(['active-index', 'metadata', 'base-index']);
let harmonyCarouselCleanup = null;
let harmonyStateUnsubscribe = null;
let layoutInstance = null;
let stripRenderer = null;
let paletteUnsubscribe = null;
let swatchRailController = null;
let imagePanelDestroy = null;
let primaryColorAdapter = null;
let sidebarNaturalWidth = 0;
let sidebarTransitionCleanup = null;
let historyCleanup = null;

function swatchHexListFromState(state) {
  const swatches = state?.swatches || [];
  if (!swatches.length) return ['#FF0000'];
  return swatches.map((s) => s.hex).slice(0, 10);
}

function countThemeSwatches(state) {
  return (state?.swatches || []).filter((s) => s?.hex).length;
}

function harmonyRulesForSwatchCount(n) {
  if (n >= 4) return HARMONY_RULES.slice();
  if (n === 3) {
    return HARMONY_RULES.filter((r) => HARMONY_ALLOWED_FOR_THREE.has(r.value));
  }
  return HARMONY_RULES.filter((r) => HARMONY_ALLOWED_FOR_TWO.has(r.value));
}

async function buildHarmonySelector(controller, strings = {}) {
  const uid = `cw-h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const headingId = `${uid}-heading`;
  const currentNameId = `${uid}-current`;
  const section = createTag('div', { class: 'color-wheel-harmony-section' });
  const titleRow = createTag('div', { class: 'color-wheel-harmony-title-row' });
  const titleStatic = createTag('span', {
    class: 'color-wheel-harmony-title-static',
    id: headingId,
  });
  titleStatic.textContent = strings.colorHarmonies || 'Color harmonies:';
  function getHarmonyLabel(value) {
    const rule = HARMONY_RULES.find((r) => r.value === value);
    return strings.harmonyLabels?.[value] || rule?.label || value;
  }
  const currentName = createTag('span', {
    class: 'color-wheel-harmony-current-name',
    id: currentNameId,
    'aria-live': 'polite',
    'aria-atomic': 'true',
  });
  const kbdHint = createTag('span', {
    id: `${uid}-kbd-hint`,
    class: 'color-wheel-sr-only',
  });
  kbdHint.textContent = 'Use Left and Right arrow keys to choose a color harmony. Home and End jump to the first or last option.';
  titleRow.append(titleStatic, currentName);
  section.appendChild(titleRow);

  const carouselHost = createTag('div', { class: 'color-wheel-harmony-carousel-host' });
  let harmonyButtons = [];
  let lastRulesSig = '';
  let mountGeneration = 0;

  function setCurrentNameLabel(rule) {
    currentName.textContent = getHarmonyLabel(rule);
  }

  function updateRovingTabindex(selectedValue) {
    harmonyButtons.forEach((btn) => {
      const isSel = btn.dataset.harmonyValue === selectedValue;
      btn.setAttribute('tabindex', isSel ? '0' : '-1');
      btn.setAttribute('aria-checked', isSel ? 'true' : 'false');
      btn.classList.toggle(HARMONY_CAROUSEL_ACTIVE_CLASS, isSel);
    });
  }

  function selectHarmony(value, { focusButton } = {}) {
    controller.setHarmonyRule(value);
    setCurrentNameLabel(value);
    updateRovingTabindex(value);
    if (focusButton) {
      const btn = harmonyButtons.find((b) => b.dataset.harmonyValue === value);
      btn?.focus();
    }
  }

  async function mountHarmonyCarousel(rules) {
    mountGeneration += 1;
    const gen = mountGeneration;
    harmonyCarouselCleanup?.();
    harmonyCarouselCleanup = null;
    carouselHost.replaceChildren();
    harmonyButtons = [];

    rules.forEach(({ value, thumb }) => {
      const btn = createTag('button', {
        type: 'button',
        role: 'radio',
        class: 'color-wheel-harmony-option',
        'aria-label': `${getHarmonyLabel(value)} color harmony`,
        'data-harmony-value': value,
        tabindex: '-1',
      });
      decorateAnalyticsAttributes(btn, { linkLabel: `${getHarmonyLabel(value)} harmony` });
      const img = createTag('img', {
        src: `${HARMONY_THUMB_BASE}/${thumb}`,
        alt: '',
        width: '48',
        height: '48',
        loading: 'lazy',
        decoding: 'async',
      });
      btn.appendChild(img);
      btn.addEventListener('click', () => selectHarmony(value, { focusButton: true }));

      btn.addEventListener('keydown', (e) => {
        const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];
        if (!keys.includes(e.key)) return;
        e.preventDefault();
        e.stopPropagation();
        const idx = harmonyButtons.indexOf(btn);
        let next = idx;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          next = (idx + 1) % harmonyButtons.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          next = (idx - 1 + harmonyButtons.length) % harmonyButtons.length;
        } else if (e.key === 'Home') {
          next = 0;
        } else if (e.key === 'End') {
          next = harmonyButtons.length - 1;
        }
        const nextBtn = harmonyButtons[next];
        const nextVal = nextBtn.dataset.harmonyValue;
        selectHarmony(nextVal, { focusButton: true });
      });

      harmonyButtons.push(btn);
      carouselHost.appendChild(btn);
    });

    const selectedRule = controller.getState().harmonyRule || 'CUSTOM';
    updateRovingTabindex(selectedRule);

    const carouselApi = await createSimpleCarousel(null, carouselHost, {
      centerActive: true,
      activeClass: HARMONY_CAROUSEL_ACTIVE_CLASS,
    });

    if (gen !== mountGeneration) {
      carouselApi?.cleanup?.();
      return;
    }

    carouselHost.querySelectorAll('.simple-carousel-arrow').forEach((arrow) => {
      arrow.setAttribute('tabindex', '-1');
    });

    if (carouselApi?.cleanup) {
      harmonyCarouselCleanup = carouselApi.cleanup;
    }

    const { platform } = carouselApi || {};
    if (platform) {
      platform.setAttribute('role', 'radiogroup');
      platform.setAttribute('aria-labelledby', headingId);
      platform.setAttribute('aria-describedby', kbdHint.id);
    }

    harmonyButtons.forEach((btn) => {
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-label', `${getHarmonyLabel(btn.dataset.harmonyValue)} color harmony`);
    });

    updateRovingTabindex(controller.getState().harmonyRule || 'CUSTOM');

    if (window.matchMedia('(min-width: 1200px)').matches) {
      const tooltips = await Promise.all(
        harmonyButtons.map((btn, i) => createExpressTooltip({
          targetEl: btn,
          content: getHarmonyLabel(rules[i].value),
          placement: 'top',
        })),
      );

      if (gen !== mountGeneration) {
        tooltips.forEach((t) => t.destroy());
        return;
      }

      const prevCleanup = harmonyCarouselCleanup;
      harmonyCarouselCleanup = () => {
        prevCleanup?.();
        tooltips.forEach((t) => t.destroy());
      };
    }
  }

  const state0 = controller.getState();
  const allowed0 = new Set(
    harmonyRulesForSwatchCount(countThemeSwatches(state0)).map((r) => r.value),
  );
  const initialRule = state0.harmonyRule || 'CUSTOM';
  if (!allowed0.has(initialRule)) {
    controller.setHarmonyRule('CUSTOM');
  }
  setCurrentNameLabel(controller.getState().harmonyRule || 'CUSTOM');

  const rules0 = harmonyRulesForSwatchCount(countThemeSwatches(controller.getState()));
  lastRulesSig = rules0.map((r) => r.value).join('|');
  await mountHarmonyCarousel(rules0);

  harmonyStateUnsubscribe?.();
  harmonyStateUnsubscribe = controller.subscribe((state) => {
    const nextRules = harmonyRulesForSwatchCount(countThemeSwatches(state));
    const sig = nextRules.map((r) => r.value).join('|');
    const allowed = new Set(nextRules.map((r) => r.value));

    if (state.harmonyRule && !allowed.has(state.harmonyRule)) {
      controller.setHarmonyRule('CUSTOM');
      return;
    }

    if (sig !== lastRulesSig) {
      lastRulesSig = sig;
      mountHarmonyCarousel(nextRules).catch(() => {});
      return;
    }

    if (state.harmonyRule) {
      setCurrentNameLabel(state.harmonyRule);
      updateRovingTabindex(state.harmonyRule);
    }
  });

  section.append(kbdHint, carouselHost);
  return section;
}

function paletteFromThemeState(state) {
  const colors = (state?.swatches || []).map((s) => s?.hex).filter(Boolean);
  return {
    colors: colors.length ? colors : ['#FF0000'],
    name: state?.name || THEME_NAME,
  };
}

function buildPrimaryColorContent(controller) {
  primaryColorAdapter?.destroy?.();
  primaryColorAdapter = null;

  const state = controller.getState();
  const baseColor = swatchHexListFromState(state)[0];
  const adapter = createBaseColorAdapter(
    baseColor,
    'HEX',
    {
      onColorChange: (detail) => {
        if (!detail?.hex) return;
        controller.setBaseColor(detail.hex);
        controller.setSwatchHex(0, detail.hex);
      },
      onColorChangeEnd: () => {
        // eslint-disable-next-line no-underscore-dangle
        adapter.element._setLocked?.(true);
      },
      onLockChange: (detail) => {
        const locked = detail?.locked;
        const current = swatchRailController?.getState?.()?.lockedByIndex || new Set();
        const next = new Set(current);
        if (locked) {
          next.add(0);
        } else {
          next.delete(0);
        }
        swatchRailController?.setState?.({ lockedByIndex: next });
      },
    },
  );
  primaryColorAdapter = adapter;

  const wrapper = createTag('div', { class: 'primary-color-content' });
  wrapper.appendChild(adapter.element);
  return wrapper;
}

function buildImageContent(controller, suggestionsRow, strings) {
  const image = createTag('div', { class: 'image-content' });
  const panel = createImageExtractComponent({
    controller,
    maxColors: 5,
    suggestionsRowEl: suggestionsRow,
    strings,
  });
  imagePanelDestroy = panel.destroy;
  image.appendChild(panel.element);
  return image;
}

async function buildColorWheelContent(controller, strings) {
  const colorWheel = createTag('div', { class: 'color-wheel-content' });
  const baseHex = controller.getState().swatches?.[controller.getState().baseColorIndex]?.hex || '#FF0000';
  const adapter = createColorWheelExpressAdapter(baseHex, {}, { controller });
  const harmonySelector = await buildHarmonySelector(controller, strings);

  colorWheel.append(adapter.element, harmonySelector);

  return colorWheel;
}

async function buildTabs(controller, suggestionsRow, { onSelectionChange, strings = {} } = {}) {
  // Create the tabs shell and the color-wheel panel content in parallel
  const [tabsInstance, cwContent] = await Promise.all([
    createExpressTabs({
      selected: 'color-wheel',
      size: 'm',
      quiet: true,
      tabs: [
        { label: strings.tabPrimaryColor || 'Primary color', value: 'primary-color', iconSlotHtml: PRIMARY_COLOR_ICON },
        { label: strings.tabImage || 'Image', value: 'image', spIcon: 'sp-icon-image' },
        { label: strings.tabColorWheel || 'Color Wheel', value: 'color-wheel', iconSlotHtml: COLOR_WHEEL_ICON },
      ],
      onSelectionChange,
    }),
    buildColorWheelContent(controller, strings),
  ]);

  tabsInstance.addPanel('color-wheel', cwContent);
  tabsInstance.addPanel('image', buildImageContent(controller, suggestionsRow, strings));
  tabsInstance.addPanel('primary-color', buildPrimaryColorContent(controller));

  return tabsInstance;
}

function normalizeSwatchHexes(swatches = []) {
  return swatches
    .map((swatch) => swatch?.hex)
    .filter(Boolean)
    .map((hex) => (hex.startsWith('#') ? hex.toUpperCase() : `#${hex}`.toUpperCase()));
}

function createSwatchRailControllerBridge(controller) {
  let lockedByIndex = new Set();
  let tintIndex = null;
  const subscribers = new Set();

  const emit = () => {
    const snapshot = {
      ...controller.getState(),
      lockedByIndex: new Set(lockedByIndex),
      tintIndex,
    };
    subscribers.forEach((callback) => callback(snapshot));
  };

  const controllerUnsubscribe = controller.subscribe(() => {
    emit();
  });

  return {
    subscribe(callback) {
      if (typeof callback !== 'function') return () => {};
      subscribers.add(callback);
      callback({
        ...controller.getState(),
        lockedByIndex: new Set(lockedByIndex),
        tintIndex,
      });
      return () => {
        subscribers.delete(callback);
      };
    },
    getState() {
      return {
        ...controller.getState(),
        lockedByIndex: new Set(lockedByIndex),
        tintIndex,
      };
    },
    setState(next = {}) {
      if (!next || typeof next !== 'object') return;

      if (Object.prototype.hasOwnProperty.call(next, 'lockedByIndex')) {
        let incoming;
        if (next.lockedByIndex instanceof Set) {
          incoming = [...next.lockedByIndex];
        } else if (Array.isArray(next.lockedByIndex)) {
          incoming = next.lockedByIndex;
        } else {
          incoming = [];
        }
        lockedByIndex = new Set(incoming.filter((index) => Number.isInteger(index) && index >= 0));
      }

      const current = controller.getState();

      if (Array.isArray(next.swatches)) {
        const nextHexes = normalizeSwatchHexes(next.swatches);
        if (!nextHexes.length) {
          emit();
          return;
        }

        const requestedBase = Object.prototype.hasOwnProperty.call(next, 'baseColorIndex')
          ? next.baseColorIndex
          : current.baseColorIndex;
        const clampedBase = Number.isInteger(requestedBase)
          ? Math.min(Math.max(0, requestedBase), nextHexes.length - 1)
          : 0;

        const currentHexes = (current.swatches || []).map((s) => (s?.hex || '').toUpperCase());
        const sameLength = nextHexes.length === currentHexes.length;

        // If only the base color changed, use setSwatchHex so the harmony engine
        // recalculates the non-base colors via onBaseColorChange().
        const onlyBaseChanged = sameLength
          && !Object.prototype.hasOwnProperty.call(next, 'baseColorIndex')
          && nextHexes[clampedBase] !== currentHexes[clampedBase]
          && nextHexes.every((hex, i) => i === clampedBase || hex === currentHexes[i]);
        if (onlyBaseChanged) {
          if (Object.prototype.hasOwnProperty.call(next, 'tintIndex')) {
            tintIndex = Number.isInteger(next.tintIndex) ? next.tintIndex : null;
          }
          controller.setSwatchHex(clampedBase, nextHexes[clampedBase]);
          return;
        }

        // If a non-base color changed and a harmony is active, switch to CUSTOM
        // because the palette no longer follows the harmony rule.
        const currentHarmony = current.harmonyRule || 'CUSTOM';
        let nextHarmonyRule = currentHarmony;
        if (currentHarmony !== 'CUSTOM') {
          const nonBaseChanged = nextHexes.some((hex, i) => (
            i !== clampedBase && hex !== currentHexes[i]));
          if (nonBaseChanged) nextHarmonyRule = 'CUSTOM';
        }

        controller.replaceSwatchesFromHexes(nextHexes, {
          baseIndex: clampedBase,
          harmonyRule: nextHarmonyRule,
        });

        if (requestedBase == null) {
          controller.setBaseColorIndex(null);
        }

        const requestedActive = Number.isInteger(next.activeSwatchIndex)
          ? next.activeSwatchIndex
          : current.activeSwatchIndex;
        if (Number.isInteger(requestedActive)) {
          const clampedActive = Math.min(Math.max(0, requestedActive), nextHexes.length - 1);
          controller.setActiveSwatchIndex(clampedActive);
        }

        if (Object.prototype.hasOwnProperty.call(next, 'tintIndex')) {
          tintIndex = Number.isInteger(next.tintIndex) ? next.tintIndex : null;
        }

        emit();
        return;
      }

      if (Object.prototype.hasOwnProperty.call(next, 'baseColorIndex')) {
        const count = current.swatches?.length || 0;
        const requestedBase = next.baseColorIndex;
        if (requestedBase == null) {
          controller.setBaseColorIndex(null);
        } else if (Number.isInteger(requestedBase) && count > 0) {
          controller.setBaseColorIndex(Math.min(Math.max(0, requestedBase), count - 1));
        }
      }

      if (Number.isInteger(next.activeSwatchIndex)) {
        const count = current.swatches?.length || 0;
        if (count > 0) {
          controller.setActiveSwatchIndex(Math.min(Math.max(0, next.activeSwatchIndex), count - 1));
        }
      }

      if (typeof next.harmonyRule === 'string' && next.harmonyRule !== current.harmonyRule) {
        controller.setHarmonyRule(next.harmonyRule);
      }

      if (Object.prototype.hasOwnProperty.call(next, 'tintIndex')) {
        tintIndex = Number.isInteger(next.tintIndex) ? next.tintIndex : null;
      }

      emit();
    },
    destroy() {
      controllerUnsubscribe?.();
      subscribers.clear();
    },
  };
}

function makeTransformPalette(getActiveHarmonyRule, getSwatchRailController, getControllerState) {
  return (rawHexes) => {
    if (getActiveHarmonyRule() !== 'CUSTOM') return rawHexes;
    const { lockedByIndex } = getSwatchRailController().getState();
    if (!lockedByIndex?.size) return rawHexes;
    const currentHexes = getControllerState().swatches.map((s) => s.hex);
    return rawHexes.map((h, i) => (lockedByIndex.has(i) ? currentHexes[i] : h));
  };
}

function cleanup() {
  harmonyStateUnsubscribe?.();
  harmonyStateUnsubscribe = null;
  harmonyCarouselCleanup?.();
  harmonyCarouselCleanup = null;
  paletteUnsubscribe?.();
  paletteUnsubscribe = null;
  swatchRailController?.destroy?.();
  swatchRailController = null;
  imagePanelDestroy?.();
  imagePanelDestroy = null;
  primaryColorAdapter?.destroy?.();
  primaryColorAdapter = null;
  stripRenderer?.destroy?.();
  stripRenderer = null;
  layoutInstance?.destroy();
  layoutInstance = null;
  sidebarTransitionCleanup?.();
  sidebarTransitionCleanup = null;
  sidebarNaturalWidth = 0;
  historyCleanup?.();
  historyCleanup = null;
}

export default async function decorate(block) {
  const layoutRows = [...block.children];
  const suggestionsRow = layoutRows[0] || null;
  const desktopQuery = window.matchMedia('(min-width: 1200px)');

  // Preserved across breakpoint re-inits so the user's palette survives resize
  let currentPalette = null;

  async function init() {
    // Save before clearing — adoptHeadline uses document.querySelector and would lose it otherwise
    const headline = document.querySelector('.color-headline.tools');
    // On re-init (breakpoint change), tear down immediately to prevent two layouts running in
    // parallel. On first load, keep authored content visible during the async stall so the block
    // doesn't show as a blank white area while placeholders and CSS load.
    const isReinit = !!layoutInstance;
    if (isReinit) {
      cleanup();
      block.innerHTML = '';
    }
    block.className = 'color-wheel';

    try {
      const [strings, { getResolvedPalette, getResolvedPaletteName }] = await Promise.all([
        loadPlaceholders(),
        Promise.resolve(createColorPaletteParamApi()),
        loadHeavyModules(),
      ]);

      // First load: authored content was preserved during the async wait; clear it now
      if (!isReinit) {
        cleanup();
        block.innerHTML = '';
      }
      const section = createTag('section');
      block.appendChild(section);
      const initialPalette = currentPalette || {
        name: getResolvedPaletteName() || THEME_NAME,
        colors: getResolvedPalette(),
      };

      const controller = new ColorThemeExpressController({
        swatches: initialPalette.colors,
        harmonyRule: 'CUSTOM',
        baseColorIndex: 0,
      });
      swatchRailController = createSwatchRailControllerBridge(controller);

      let isGeneratingRandom = false;
      let activeHarmonyRule = controller.getState().harmonyRule || 'CUSTOM';

      const isDesktop = desktopQuery.matches;
      const defaultActionMenuConfig = buildDefaultActionMenuConfig(strings);

      layoutInstance = await createColorToolLayout(section, {
        palette: initialPalette,
        toolbar: {
          variant: 'sticky-on-scroll',
          showEdit: false,
          showPalette: true,
          showPaletteName: true,
          editPaletteName: true,
        },
        actionMenu: {
          ...defaultActionMenuConfig,
          controls: [
            { id: 'undo', label: strings.undo },
            { id: 'redo', label: strings.redo },
            { id: 'generate-random', label: strings.generateRandom },
            { id: 'expand', label: strings.maximize },
          ],
          type: isDesktop ? 'full' : 'nav-only',
          getName: () => currentPalette?.name || initialPalette.name,
          onGenerateRandom: () => {
            isGeneratingRandom = true;
            // If no HISTORY_EVENT fires (e.g. all colors locked, palette unchanged),
            // reset the flag so it doesn't corrupt the next undo/redo
            queueMicrotask(() => { isGeneratingRandom = false; });
            primaryColorAdapter?.element?.resetOriginalColor?.();
          },
          transformPalette: makeTransformPalette(
            () => activeHarmonyRule,
            () => swatchRailController,
            () => controller.getState(),
          ),
          onExpand: (expanded) => {
            const sidebarSlot = block.querySelector('.ax-shell-slot--sidebar');
            const layout = block.querySelector('.ax-color-tool-layout');

            sidebarTransitionCleanup?.();
            sidebarTransitionCleanup = null;

            if (!sidebarSlot || !layout) {
              if (expanded) block.dataset.sidebarCollapsed = '';
              else delete block.dataset.sidebarCollapsed;
              return;
            }

            if (expanded) {
              const rect = sidebarSlot.getBoundingClientRect();
              sidebarNaturalWidth = rect.width;
              sidebarSlot.style.minWidth = `${sidebarNaturalWidth}px`;
              // Pin height to current pixel value so flex children (sp-theme) don't collapse
              sidebarSlot.style.height = `${rect.height}px`;
              block.dataset.sidebarCollapsed = '';
            } else {
              sidebarSlot.style.minWidth = `${sidebarNaturalWidth || 300}px`;
              delete block.dataset.sidebarCollapsed;
            }

            const onTransitionEnd = (e) => {
              if (e.propertyName !== 'grid-template-columns') return;
              sidebarSlot.style.minWidth = '';
              sidebarSlot.style.height = '';
              layout.removeEventListener('transitionend', onTransitionEnd);
              sidebarTransitionCleanup = null;
            };
            layout.addEventListener('transitionend', onTransitionEnd);
            sidebarTransitionCleanup = () => {
              sidebarSlot.style.minWidth = '';
              sidebarSlot.style.height = '';
              layout.removeEventListener('transitionend', onTransitionEnd);
            };
          },
        },
      });

      const stripHost = createTag('div', { class: 'color-wheel-strip-host' });
      layoutInstance.slots.canvas.appendChild(stripHost);

      let activeTab = 'color-wheel';

      const updateBaseColorBadge = () => {
        const hide = activeTab !== 'color-wheel' || activeHarmonyRule === 'CUSTOM';
        const hideLock = activeTab === 'color-wheel' && activeHarmonyRule !== 'CUSTOM';
        stripHost.querySelectorAll('color-swatch-rail').forEach((rail) => {
          rail.hideBaseColorBadge = hide;
          rail.hideLock = hideLock;
        });
      };

      // actionMenuReady and buildTabs are independent — resolve in parallel
      const [, tabs] = await Promise.all([
        layoutInstance.actionMenuReady,
        buildTabs(controller, suggestionsRow?.cloneNode(true), {
          onSelectionChange: ({ selected }) => {
            activeTab = selected;
            updateBaseColorBadge();
            if (selected !== 'color-wheel') {
              controller.setHarmonyRule('CUSTOM');
            }
          },
          strings,
        }),
      ]);

      // Both resolved — wire up action menu history and append tabs
      const actionMenuApi = layoutInstance.actionMenu;
      let restoringFromHistory = false;
      let pushingState = false;
      let historyDebounceTimer = null;

      const pushCurrentPalette = () => {
        if (restoringFromHistory) return;
        const hexes = controller.getState().swatches.map((s) => s.hex);
        pushingState = true;
        actionMenuApi?.pushState?.(hexes);
        pushingState = false;
      };

      // Push initial palette into history
      actionMenuApi?.pushState?.(initialPalette.colors);

      // Subscribe to controller — push history on user-facing state changes
      const historyUnsubscribe = controller.subscribe((_, detail) => {
        if (restoringFromHistory) return;
        const { source } = detail || {};
        if (!source || HISTORY_SKIP_SOURCES.has(source)) return;
        clearTimeout(historyDebounceTimer);
        historyDebounceTimer = setTimeout(pushCurrentPalette, 300);
      });

      // Restore palette when undo/redo or generate-random changes the history index.
      // For non-custom generate-random, setBaseColor re-applies the harmony from the
      // new random base (palette[0]). For all other cases the palette is applied as-is
      // because either the harmony was already applied (non-custom undo/redo restores
      // pre-computed hexes) or we're on custom harmony where locked colors are already
      // preserved in the history entry by transformPalette.
      const onHistoryChange = () => {
        if (pushingState) return;
        const palette = actionMenuApi?.getCurrentPalette?.();
        if (!palette?.length) return;
        restoringFromHistory = true;
        const isRandom = isGeneratingRandom;
        isGeneratingRandom = false;
        if (isRandom && activeHarmonyRule !== 'CUSTOM') {
          const opts = { baseIndex: 0, harmonyRule: activeHarmonyRule };
          controller.replaceSwatchesFromHexes(palette, opts);
          controller.setBaseColor(palette[0]);
        } else {
          controller.replaceSwatchesFromHexes(palette, { baseIndex: 0, harmonyRule: 'CUSTOM' });
        }
        // Cancel any pending debounce push — a timer set before this history change
        // would otherwise push the just-restored palette as a new forward entry
        clearTimeout(historyDebounceTimer);
        historyDebounceTimer = null;
        restoringFromHistory = false;
      };
      document.addEventListener(HISTORY_EVENT, onHistoryChange);

      historyCleanup = () => {
        historyUnsubscribe?.();
        document.removeEventListener(HISTORY_EVENT, onHistoryChange);
        clearTimeout(historyDebounceTimer);
      };

      tabs.setPanelEntryFocus('primary-color', () => {
        primaryColorAdapter?.element?.shadowRoot?.querySelector('.bc-mode-trigger')?.focus();
      });
      tabs.setPanelEntryFocus('color-wheel', () => {
        tabs.getPanel('color-wheel')?.querySelector('color-wheel-express')?.focus();
      });
      layoutInstance.slots.sidebar.appendChild(tabs.element);

      if (!isDesktop) {
        const { createActionMenuComponent } = await import('../../scripts/color-shared/components/createActionMenuComponent.js');

        const actionMenu = await createActionMenuComponent({
          ...defaultActionMenuConfig,
          type: 'controls-only',
          onGenerateRandom: () => {
            isGeneratingRandom = true;
            queueMicrotask(() => { isGeneratingRandom = false; });
            primaryColorAdapter?.element?.resetOriginalColor?.();
          },
          transformPalette: makeTransformPalette(
            () => activeHarmonyRule,
            () => swatchRailController,
            () => controller.getState(),
          ),
          controls: [
            { id: 'undo', label: strings.undo },
            { id: 'redo', label: strings.redo },
            { id: 'generate-random', label: strings.generateRandom },
          ],
        });
        layoutInstance.slots.canvas.insertAdjacentElement('afterbegin', actionMenu.element);
      }
      stripRenderer = createStripContainerRenderer({
        container: stripHost,
        data: [swatchRailController],
        mobileBreakpointQuery: '(max-width: 599px)',
        config: {
          stripContainerOrientations: ['vertical-responsive'],
          swatchFeatures: {
            copy: true,
            hexCode: true,
            colorPicker: false,
            lock: true,
            trash: true,
            drag: true,
            addLeft: true,
            addRight: true,
            editTint: true,
            baseColor: true,
            emptyStrip: true,
            rightActionsHoverOnly: true,
            minSwatches: 2,
          },
          swatchVerticalMaxPerRow: 6,
        },
      });
      await stripRenderer.render(stripHost);

      // Initial base color badge state
      updateBaseColorBadge();

      // Re-evaluate badge visibility when harmony rule changes
      const badgeRuleUnsubscribe = controller.subscribe((state) => {
        const rule = state.harmonyRule || 'CUSTOM';
        if (rule !== activeHarmonyRule) {
          activeHarmonyRule = rule;
          updateBaseColorBadge();
        }
      });
      const prevHistoryCleanup = historyCleanup;
      historyCleanup = () => {
        prevHistoryCleanup?.();
        badgeRuleUnsubscribe?.();
      };

      // Use a random color when adding a new swatch;
      // for non-custom harmonies, recompute all positions
      stripHost.addEventListener('color-swatch-rail-add', (e) => {
        e.preventDefault();
        const { insertIndex } = e.detail;
        const state = controller.getState();
        const hexes = state.swatches.map((s) => s.hex);
        hexes.splice(insertIndex, 0, randomHex());

        if (state.harmonyRule === 'CUSTOM') {
          swatchRailController.setState({ swatches: hexes.map((h) => ({ hex: h })) });
        } else {
          const newBaseIndex = insertIndex <= state.baseColorIndex
            ? state.baseColorIndex + 1
            : state.baseColorIndex;
          controller.replaceSwatchesFromHexes(
            hexes,
            {
              baseIndex: newBaseIndex,
              harmonyRule: state.harmonyRule,
            },
          );
          controller.harmonyAdapter.onRuleChange(state.harmonyRule);
        }
      });

      paletteUnsubscribe = controller.subscribe((state) => {
        currentPalette = paletteFromThemeState(state);
        layoutInstance?.context?.set('palette', currentPalette);
        const firstHex = swatchHexListFromState(state)[0];
        const currentColor = primaryColorAdapter?.element?.color;
        if (primaryColorAdapter?.setColor && firstHex
          && String(currentColor).toUpperCase() !== String(firstHex).toUpperCase()) {
          primaryColorAdapter.setColor(firstHex);
        }
      });

      if (headline) section.appendChild(headline);
      adoptHeadline(section, layoutInstance);
      block.classList.add('ax-shell-host');
      block.dataset.shellState = 'ready';
      trackColorBlockLoad('color-wheel');
    } catch (error) {
      window.lana?.log(`Color Wheel init error: ${error.message}`, {
        tags: 'color-wheel,init',
      });
      block.dataset.blockStatus = 'error';
      cleanup();
      block.replaceChildren();
      block.append(createTag('p', { class: 'color-wheel-error' }, 'Failed to load Color Wheel.'));
    }
  }

  await init();

  const onBreakpointChange = async () => {
    if (!block.isConnected) {
      desktopQuery.removeEventListener('change', onBreakpointChange);
      return;
    }
    await init();
  };
  desktopQuery.addEventListener('change', onBreakpointChange);
}

export {
  normalizeSwatchHexes,
  harmonyRulesForSwatchCount,
  makeTransformPalette,
  paletteFromThemeState,
  swatchHexListFromState,
};
