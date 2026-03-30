import { createTag } from '../../scripts/utils.js';
import createColorToolLayout from '../../scripts/color-shared/shell/layouts/createColorToolLayout.js';
import { createExpressTabs } from '../../scripts/color-shared/spectrum/components/express-tabs.js';
import createColorWheelExpressAdapter from '../../scripts/color-shared/adapters/createColorWheelExpressAdapter.js';
import createBaseColorAdapter from '../../scripts/color-shared/adapters/createBaseColorAdapter.js';
import { createStripContainerRenderer } from '../../scripts/color-shared/renderers/createStripContainerRenderer.js';
import ColorThemeExpressController from '../../scripts/color-shared/controllers/ColorThemeExpressController.js';
import createSimpleCarousel from '../../scripts/widgets/simple-carousel.js';
import createImageExtractComponent from './createImageExtractComponent.js';
import { createExpressTooltip } from '../../scripts/color-shared/spectrum/components/express-tooltip.js';
import { createColorPaletteParamApi } from '../../scripts/color-shared/utils/utilities.js';

const BASE_COLOR_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
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
const DEFAULT_ACTION_MENU_CONFIG = {
  id: 'color-wheel-action-menu',
  activeId: 'palette',
  navLinks: [
    { id: 'palette', label: 'Create palette', href: '/express/colors/color-palette-generator' },
    { id: 'contrast', label: 'Contrast Checker', href: '/express/colors/contrast-checker' },
    { id: 'color-blindness', label: 'Color Blindness Simulator', href: '/express/colors/color-blindness-simulator' },
  ],
  controls: [
    { id: 'undo', label: 'Undo' },
    { id: 'redo', label: 'Redo' },
    { id: 'generate-random', label: 'Generate random' },
    { id: 'expand', label: 'Maximize' },
  ],
};
const THEME_NAME = 'Color Wheel Theme';
let harmonyCarouselCleanup = null;
let harmonyStateUnsubscribe = null;
let layoutInstance = null;
let stripRenderer = null;
let paletteUnsubscribe = null;
let swatchRailController = null;
let imagePanelDestroy = null;
let baseColorAdapter = null;

function swatchHexListFromState(state) {
  const swatches = state?.swatches || [];
  if (!swatches.length) return ['#FF0000'];
  return swatches.map((s) => s.hex).slice(0, 10);
}

function palettesEqual(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return false;
  return a.every((c, i) => String(c).toUpperCase() === String(b[i]).toUpperCase());
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

async function buildHarmonySelector(controller) {
  const uid = `cw-h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const headingId = `${uid}-heading`;
  const currentNameId = `${uid}-current`;
  const section = createTag('div', { class: 'color-wheel-harmony-section' });
  const titleRow = createTag('div', { class: 'color-wheel-harmony-title-row' });
  const titleStatic = createTag('span', {
    class: 'color-wheel-harmony-title-static',
    id: headingId,
  });
  titleStatic.textContent = 'Color harmonies:';
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
    const lbl = HARMONY_RULES.find((r) => r.value === rule)?.label || rule;
    currentName.textContent = lbl;
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

    rules.forEach(({ value, label, thumb }) => {
      const btn = createTag('button', {
        type: 'button',
        role: 'radio',
        class: 'color-wheel-harmony-option',
        'aria-label': `${label} color harmony`,
        'data-harmony-value': value,
        tabindex: '-1',
      });
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
      const rule = btn.dataset.harmonyValue;
      const lbl = HARMONY_RULES.find((r) => r.value === rule)?.label || rule;
      btn.setAttribute('aria-label', `${lbl} color harmony`);
    });

    updateRovingTabindex(controller.getState().harmonyRule || 'CUSTOM');

    if (window.matchMedia('(min-width: 1200px)').matches) {
      const tooltips = await Promise.all(
        harmonyButtons.map((btn, i) => createExpressTooltip({
          targetEl: btn,
          content: rules[i].label,
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

function buildBaseColorContent(controller) {
  baseColorAdapter?.destroy?.();
  baseColorAdapter = null;

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
      onLockChange: () => {
        // TODO
      },
    },
  );
  baseColorAdapter = adapter;

  const wrapper = createTag('div', { class: 'base-color-content' });
  wrapper.appendChild(adapter.element);
  return wrapper;
}

function buildImageContent(controller, suggestionsRow) {
  const image = createTag('div', { class: 'image-content' });
  const panel = createImageExtractComponent({
    controller,
    maxColors: Math.max(1, controller.getState().swatches?.length || 5),
    suggestionsRowEl: suggestionsRow,
  });
  imagePanelDestroy = panel.destroy;
  image.appendChild(panel.element);
  return image;
}

async function buildColorWheelContent(controller) {
  const colorWheel = createTag('div', { class: 'color-wheel-content' });
  const baseHex = controller.getState().swatches?.[controller.getState().baseColorIndex]?.hex || '#FF0000';
  const adapter = createColorWheelExpressAdapter(baseHex, {}, { controller });
  const harmonySelector = await buildHarmonySelector(controller);

  colorWheel.append(adapter.element, harmonySelector);

  return colorWheel;
}

async function buildTabs(controller, suggestionsRow) {
  const tabsInstance = await createExpressTabs({
    selected: 'color-wheel',
    size: 'm',
    quiet: true,
    tabs: [
      { label: 'Base color', value: 'base-color', iconSlotHtml: BASE_COLOR_ICON },
      { label: 'Image', value: 'image', spIcon: 'sp-icon-image' },
      { label: 'Color Wheel', value: 'color-wheel', iconSlotHtml: COLOR_WHEEL_ICON },
    ],
  });

  tabsInstance.addPanel('color-wheel', await buildColorWheelContent(controller));
  tabsInstance.addPanel('image', buildImageContent(controller, suggestionsRow));
  tabsInstance.addPanel('base-color', buildBaseColorContent(controller));

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
  const subscribers = new Set();

  const emit = () => {
    const snapshot = {
      ...controller.getState(),
      lockedByIndex: new Set(lockedByIndex),
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
      });
      return () => {
        subscribers.delete(callback);
      };
    },
    getState() {
      return {
        ...controller.getState(),
        lockedByIndex: new Set(lockedByIndex),
      };
    },
    setState(next = {}) {
      if (!next || typeof next !== 'object') return;

      if (Object.prototype.hasOwnProperty.call(next, 'lockedByIndex')) {
        const incoming = next.lockedByIndex instanceof Set
          ? [...next.lockedByIndex]
          : Array.isArray(next.lockedByIndex)
            ? next.lockedByIndex
            : [];
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

        controller.replaceSwatchesFromHexes(nextHexes, {
          baseIndex: clampedBase,
          harmonyRule: current.harmonyRule || 'CUSTOM',
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

      emit();
    },
    destroy() {
      controllerUnsubscribe?.();
      subscribers.clear();
    },
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
  baseColorAdapter?.destroy?.();
  baseColorAdapter = null;
  stripRenderer?.destroy?.();
  stripRenderer = null;
  layoutInstance?.destroy();
  layoutInstance = null;
}

export default async function decorate(block) {
  const layoutRows = [...block.children];
  const suggestionsRow = layoutRows[0] || null;

  block.innerHTML = '';
  block.className = 'color-wheel';

  try {
    const { getResolvedPalette, getResolvedPaletteName } = createColorPaletteParamApi();
    const initialPalette = {
      name: getResolvedPaletteName() || THEME_NAME,
      colors: getResolvedPalette(),
    };

    const controller = new ColorThemeExpressController({
      swatches: initialPalette.colors,
      harmonyRule: 'CUSTOM',
      baseColorIndex: 0,
    });
    swatchRailController = createSwatchRailControllerBridge(controller);

    const isDesktop = window.matchMedia('(min-width: 1200px)').matches;

    layoutInstance = await createColorToolLayout(block, {
      palette: initialPalette,
      toolbar: {
        variant: 'standalone',
        showEdit: false,
        showPalette: isDesktop,
        showPaletteName: true,
        editPaletteName: false,
      },
      actionMenu: {
        ...DEFAULT_ACTION_MENU_CONFIG,
        type: isDesktop ? 'full' : 'nav-only',
        onExpand: (expanded) => {
          if (expanded) {
            block.dataset.sidebarCollapsed = '';
          } else {
            delete block.dataset.sidebarCollapsed;
          }
        },
      },
      content: {
        heading: createTag('h1', null, 'Color palette generator and color wheel tool.'),
        paragraph: createTag('p', null, 'Use the color palette generator to create harmonious color schemes for any project. Choose a base color, apply a color harmony, and generate a balanced palette instantly.'),
        icon: true,
      },
    });

    const tabs = await buildTabs(controller, suggestionsRow);
    layoutInstance.slots.sidebar.appendChild(tabs.element);

    if (!isDesktop) {
      const { createActionMenuComponent } = await import('../../scripts/color-shared/components/createActionMenuComponent.js');

      const actionMenu = await createActionMenuComponent({
        ...DEFAULT_ACTION_MENU_CONFIG,
        type: 'controls-only',
        controls: [
          { id: 'undo', label: 'Undo' },
          { id: 'redo', label: 'Redo' },
          { id: 'generate-random', label: 'Generate random' },
        ],
      });
      layoutInstance.slots.canvas.appendChild(actionMenu.element);
    }
    const stripHost = createTag('div', { class: 'color-wheel-strip-host' });
    layoutInstance.slots.canvas.appendChild(stripHost);

    stripRenderer = createStripContainerRenderer({
      container: stripHost,
      data: [swatchRailController],
      config: {
        stripContainerOrientations: ['vertical-responsive'],
        swatchFeatures: {
          copy: true,
          hexCode: true,
          colorPicker: true,
          lock: true,
          trash: true,
          drag: true,
          addLeft: true,
          addRight: true,
          editTint: true,
          baseColor: true,
          emptyStrip: true,
          rightActionsHoverOnly: true,
        },
        swatchVerticalMaxPerRow: 6,
      },
    });
    await stripRenderer.render(stripHost);

    // What is this?
    paletteUnsubscribe = controller.subscribe((state) => {
      layoutInstance?.context?.set('palette', paletteFromThemeState(state));
      if (!baseColorAdapter?.setPalette) return;
      const pal = swatchHexListFromState(state);
      const el = baseColorAdapter.getElement?.();
      const nextIdx = Math.min(
        Math.max(0, state.baseColorIndex ?? 0),
        Math.max(0, pal.length - 1),
      );
      if (!palettesEqual(el?.palette, pal)) {
        baseColorAdapter.setPalette(pal);
      }
      if (el && el.selectedIndex !== nextIdx) {
        baseColorAdapter.setSelectedIndex(nextIdx);
      }
    });

    block.classList.add('ax-shell-host');
    block.dataset.shellState = 'ready';
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
