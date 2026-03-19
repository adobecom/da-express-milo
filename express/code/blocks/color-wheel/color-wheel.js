import { createTag } from '../../scripts/utils.js';
import createColorToolLayout from '../../scripts/color-shared/shell/layouts/createColorToolLayout.js';
import { createExpressTabs } from '../../scripts/color-shared/spectrum/components/express-tabs.js';
import createColorWheelExpressAdapter from '../../scripts/color-shared/adapters/createColorWheelExpressAdapter.js';
import { createStripContainerRenderer } from '../../scripts/color-shared/renderers/createStripContainerRenderer.js';
import ColorThemeExpressController from '../../scripts/color-shared/controllers/ColorThemeExpressController.js';

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
const IMAGE_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="mask0_13766_5791" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
<path d="M14.5 7.52112C14.5 8.34955 13.8284 9.02112 13 9.02112C12.1716 9.02112 11.5 8.34955 11.5 7.52112C11.5 6.69269 12.1716 6.02112 13 6.02112C13.8284 6.02112 14.5 6.69269 14.5 7.52112Z" fill="#292929"/>
<path d="M16.75 3H3.25C2.00977 3 1 4.00977 1 5.25V14.75C1 15.9902 2.00977 17 3.25 17H16.75C17.9902 17 19 15.9902 19 14.75V5.25C19 4.00977 17.9902 3 16.75 3ZM3.25 4.5H16.75C17.1631 4.5 17.5 4.83691 17.5 5.25V13.4609L15.5908 11.5518C14.7139 10.6748 13.2861 10.6748 12.4092 11.5518L11.1777 12.7832C11.0781 12.8809 10.9209 12.8799 10.8232 12.7842L7.59082 9.55177C6.74121 8.70216 5.25879 8.70216 4.40918 9.55177L2.5 11.4609V5.25001C2.5 4.83692 2.83691 4.5 3.25 4.5ZM3.25 15.5C2.83691 15.5 2.5 15.1631 2.5 14.75V13.582L5.46973 10.6123C5.7627 10.3193 6.23731 10.3193 6.53028 10.6123L9.76368 13.8457C10.4453 14.5254 11.5557 14.5264 12.2373 13.8447L13.4697 12.6123C13.7627 12.3193 14.2373 12.3193 14.5303 12.6123L17.231 15.313C17.0999 15.425 16.9353 15.5 16.75 15.5L3.25 15.5Z" fill="#292929"/>
</mask>
<g mask="url(#mask0_13766_5791)">
<rect width="20" height="20" fill="#505050"/>
</g>
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
  { value: 'TRIAD', label: 'Triad', thumb: 'triad.png' },
  { value: 'SQUARE', label: 'Square', thumb: 'square.png' },
  { value: 'SPLIT_COMPLEMENTARY', label: 'Split complementary', thumb: 'split-complementary.png' },
  { value: 'MONOCHROMATIC', label: 'Monochromatic', thumb: 'monochromatic.png' },
  { value: 'COMPOUND', label: 'Compound', thumb: 'compound.png' },
  { value: 'SHADES', label: 'Shades', thumb: 'shades.png' },
];

const SCROLL_STEP_PX = 52; /* 48px button + 4px gap */

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

function buildHarmonySelector(controller) {
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
  const initialRule = controller.getState().harmonyRule || 'ANALOGOUS';
  const initialLabel = HARMONY_RULES.find((r) => r.value === initialRule)?.label || 'Analogous';
  currentName.textContent = initialLabel;

  const kbdHint = createTag('span', {
    id: `${uid}-kbd-hint`,
    class: 'color-wheel-sr-only',
  });
  kbdHint.textContent = 'Use Left and Right arrow keys to choose a color harmony. Home and End jump to the first or last option.';

  titleRow.append(titleStatic, currentName);
  section.appendChild(titleRow);

  const toolbar = createTag('div', { class: 'color-wheel-harmony-toolbar' });
  const scrollRegionId = `${uid}-scroll-region`;

  const scrollPrev = createTag('button', {
    type: 'button',
    class: 'color-wheel-harmony-scroll color-wheel-harmony-scroll--prev',
    'aria-label': 'Show previous color harmony options',
    hidden: true,
  });
  scrollPrev.innerHTML = '<span class="color-wheel-harmony-scroll-icon" aria-hidden="true">‹</span>';
  scrollPrev.setAttribute('aria-controls', scrollRegionId);

  const scrollNext = createTag('button', {
    type: 'button',
    class: 'color-wheel-harmony-scroll color-wheel-harmony-scroll--next',
    'aria-label': 'Show more color harmony options',
    hidden: true,
  });
  scrollNext.innerHTML = '<span class="color-wheel-harmony-scroll-icon" aria-hidden="true">›</span>';
  scrollNext.setAttribute('aria-controls', scrollRegionId);

  const scrollRegion = createTag('div', {
    id: scrollRegionId,
    class: 'color-wheel-harmony-scroll-region',
    tabindex: '-1',
  });

  const radiogroup = createTag('div', {
    class: 'color-wheel-harmony-radiogroup',
    role: 'radiogroup',
    'aria-labelledby': headingId,
    'aria-describedby': kbdHint.id,
  });

  const harmonyButtons = [];

  function setCurrentNameLabel(rule) {
    const lbl = HARMONY_RULES.find((r) => r.value === rule)?.label || rule;
    currentName.textContent = lbl;
  }

  function updateRovingTabindex(selectedValue) {
    harmonyButtons.forEach((btn) => {
      const isSel = btn.dataset.harmonyValue === selectedValue;
      btn.setAttribute('tabindex', isSel ? '0' : '-1');
      btn.setAttribute('aria-checked', isSel ? 'true' : 'false');
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
    const scrollBehave = prefersReducedMotion() ? 'instant' : 'smooth';
    requestAnimationFrame(() => {
      const btn = harmonyButtons.find((b) => b.dataset.harmonyValue === value);
      btn?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: scrollBehave });
    });
  }

  HARMONY_RULES.forEach(({ value, label, thumb }) => {
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
    radiogroup.appendChild(btn);
  });

  updateRovingTabindex(initialRule);

  scrollRegion.appendChild(radiogroup);
  toolbar.append(scrollPrev, scrollRegion, scrollNext);

  function updateScrollArrows() {
    const el = scrollRegion;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth > clientWidth + 1;
    const atStart = scrollLeft <= 1;
    const atEnd = scrollLeft + clientWidth >= scrollWidth - 1;

    if (!overflow) {
      scrollPrev.hidden = true;
      scrollNext.hidden = true;
      scrollPrev.tabIndex = -1;
      scrollNext.tabIndex = -1;
      return;
    }
    scrollPrev.hidden = atStart;
    scrollNext.hidden = atEnd;
    scrollPrev.tabIndex = atStart ? -1 : 0;
    scrollNext.tabIndex = atEnd ? -1 : 0;
  }

  const scrollBehave = () => (prefersReducedMotion() ? 'instant' : 'smooth');
  scrollPrev.addEventListener('click', () => {
    scrollRegion.scrollBy({ left: -SCROLL_STEP_PX, behavior: scrollBehave() });
  });
  scrollNext.addEventListener('click', () => {
    scrollRegion.scrollBy({ left: SCROLL_STEP_PX, behavior: scrollBehave() });
  });
  scrollRegion.addEventListener('scroll', () => updateScrollArrows(), { passive: true });

  const ro = new ResizeObserver(() => updateScrollArrows());
  ro.observe(scrollRegion);
  ro.observe(radiogroup);

  requestAnimationFrame(() => updateScrollArrows());

  controller.subscribe((state) => {
    if (state.harmonyRule) {
      setCurrentNameLabel(state.harmonyRule);
      updateRovingTabindex(state.harmonyRule);
    }
  });

  section.append(kbdHint, toolbar);
  return section;
}

let layoutInstance = null;
let stripRenderer = null;
let paletteUnsubscribe = null;

function paletteFromThemeState(state) {
  const colors = (state?.swatches || []).map((s) => s?.hex).filter(Boolean);
  return {
    colors: colors.length ? colors : ['#FF0000'],
    name: state?.name || 'Harmony Theme',
  };
}

function cleanup() {
  paletteUnsubscribe?.();
  paletteUnsubscribe = null;
  stripRenderer?.destroy?.();
  stripRenderer = null;
  layoutInstance?.destroy();
  layoutInstance = null;
}

export default async function decorate(block) {
  block.innerHTML = '';
  block.className = 'color-wheel';

  function buildBaseColorContent() {
    const baseColor = createTag('div', { class: 'base-color-content' }, '<h1>Base Color</h1>');
    return baseColor;
  }

  function buildImageContent() {
    const image = createTag('div', { class: 'image-content' }, '<h1>Image</h1>');
    return image;
  }

  function buildColorWheelContent(controller) {
    const colorWheel = createTag('div', { class: 'color-wheel-content' });

    const baseHex = controller.getState().swatches?.[controller.getState().baseColorIndex]?.hex || '#FF0000';
    const adapter = createColorWheelExpressAdapter(baseHex, {
      onChange: (colorDetail) => {
        console.log(colorDetail);
      },
      onChangeEnd: (colorDetail) => {
        console.log(colorDetail);
      },
    }, { controller });
    const harmonySelector = buildHarmonySelector(controller);

    colorWheel.append(adapter.element, harmonySelector);

    return colorWheel;
  }

  async function buildTabs(controller) {
    const tabsInstance = await createExpressTabs({
      selected: 'color-wheel',
      size: 'l',
      quiet: true,
      tabs: [
        { label: 'Base color', value: 'base-color', spIcon: 'sp-icon-sampler' },
        { label: 'Image', value: 'image', spIcon: 'sp-icon-image' },
        { label: 'Color Wheel', value: 'color-wheel', spIcon: 'sp-icon-color-wheel' },
      ],
      onSelectionChange: ({ selected }) => {
        console.log(selected);
      },
    });

    tabsInstance.addPanel('color-wheel', buildColorWheelContent(controller));
    tabsInstance.addPanel('image', buildImageContent());
    tabsInstance.addPanel('base-color', buildBaseColorContent());

    return tabsInstance;
  }

  try {
    const controller = new ColorThemeExpressController({
      swatches: ['#FFFF00', '#FF0000', '#FF7F00', '#00A8FF', '#7F00FF'],
      harmonyRule: 'ANALOGOUS',
      baseColorIndex: 0,
    });

    layoutInstance = await createColorToolLayout(block, {
      palette: paletteFromThemeState(controller.getState()),
      toolbar: {
        showEdit: true,
      },
    });

    block.classList.add('ax-shell-host');

    const tabs = await buildTabs(controller);
    layoutInstance.slots.sidebar.appendChild(tabs.element);

    const stripHost = createTag('div', { class: 'color-wheel-strip-host' });
    layoutInstance.slots.canvas.appendChild(stripHost);

    stripRenderer = createStripContainerRenderer({
      container: stripHost,
      data: [controller],
      config: {
        stripContainerOrientations: ['vertical-responsive'],
        swatchFeatures: {
          copy: true,
          hexCode: true,
          baseColor: true,
          lock: true,
          editTint: true,
          drag: true,
          trash: true,
        },
        swatchVerticalMaxPerRow: 6,
      },
    });
    await stripRenderer.render(stripHost);

    paletteUnsubscribe = controller.subscribe((state) => {
      layoutInstance?.context?.set('palette', paletteFromThemeState(state));
    });

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
