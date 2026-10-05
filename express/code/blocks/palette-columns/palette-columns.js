import { getLibs, createTag } from '../../scripts/utils.js';
import { trackColorBlockLoad } from '../../scripts/instrument.js';
import {
  PALETTE_PRESETS,
  buildPaletteEditUrl,
  decorateAnalyticsAttributes,
} from '../../scripts/color-shared/utils/utilities.js';
import { generateRandomHexCodes } from '../../scripts/color-shared/components/createActionMenuState.js';
import { announceToScreenReader } from '../../scripts/color-shared/spectrum/utils/a11y.js';
import { createSwatchRailAdapter } from '../../scripts/color-shared/adapters/litComponentAdapters.js';
import loadColorSwatchRailPlaceholders from '../../scripts/color-shared/i18n/loadColorSwatchRailPlaceholders.js';

const BLOCK_NAME = 'palette-columns';
const COLOR_COUNT = 5;
const MOBILE_QUERY = '(max-width: 599px)';
const VARIANTS = ['palette-left', 'palette-right'];
const DEFAULT_VARIANT = 'palette-right';

// Read-only rail: hex label + copy button only (matches the extract palette modal).
const SWATCH_FEATURES = {
  copy: true,
  copyFromHex: false,
  colorPicker: false,
  hexCode: true,
  baseColor: false,
};

const ANALYTICS_LABELS = {
  edit: 'Edit in color palette tool',
  generate: 'Generate random',
};

const EXPORT_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none" focusable="false"><path fill="currentColor" d="M19.8 17.3252V13.234C19.8 12.7786 19.4304 12.409 18.975 12.409C18.5195 12.409 18.15 12.7786 18.15 13.234V17.3252C18.15 17.7801 17.7799 18.1502 17.325 18.1502H4.67495C4.22002 18.1502 3.84995 17.7801 3.84995 17.3252V4.6752C3.84995 4.22027 4.22002 3.8502 4.67495 3.8502H8.8671C9.32256 3.8502 9.6921 3.48066 9.6921 3.0252C9.6921 2.56973 9.32256 2.2002 8.8671 2.2002H4.67495C3.31016 2.2002 2.19995 3.3104 2.19995 4.6752V17.3252C2.19995 18.69 3.31016 19.8002 4.67495 19.8002H17.325C18.6897 19.8002 19.8 18.69 19.8 17.3252Z"/><path fill="currentColor" d="M20.9 1.9251V6.59205C20.9 7.04751 20.5304 7.41705 20.075 7.41705C19.6195 7.41705 19.25 7.04751 19.25 6.59205V3.9167L12.1333 11.0334C11.9721 11.1945 11.7611 11.2751 11.55 11.2751C11.3389 11.2751 11.1278 11.1945 10.9667 11.0334C10.6444 10.7111 10.6444 10.1891 10.9667 9.8668L18.0834 2.7501H15.408C14.9526 2.7501 14.583 2.38056 14.583 1.9251C14.583 1.46963 14.9526 1.1001 15.408 1.1001H20.075C20.5304 1.1001 20.9 1.46963 20.9 1.9251Z"/></svg>';

const SHUFFLE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none" focusable="false"><path fill="currentColor" d="M20.6186 4.60635L18.1436 2.13135C17.8213 1.80908 17.2993 1.80908 16.977 2.13135C16.6547 2.45362 16.6547 2.97569 16.977 3.29795L18.0792 4.4001H15.6332C13.3139 4.4001 11.2321 5.82881 10.3566 7.97724L7.63989 13.3376C6.99213 14.9242 5.50971 15.9501 3.86294 15.9501H1.8853C1.42984 15.9501 1.0603 16.3196 1.0603 16.7751C1.0603 17.2306 1.42984 17.6001 1.8853 17.6001H3.86294C6.18326 17.6001 8.26616 16.1714 9.13951 14.023L11.8562 8.6626C12.505 7.07598 13.9875 6.0501 15.6332 6.0501H18.0083L16.977 7.08135C16.6547 7.40362 16.6547 7.92569 16.977 8.24795C17.1381 8.40908 17.3487 8.48966 17.5603 8.48966C17.7719 8.48966 17.9825 8.40909 18.1436 8.24795L20.6186 5.77295C20.9409 5.45069 20.9409 4.92862 20.6186 4.60635Z"/><path fill="currentColor" d="M7.81284 8.12745C7.55502 8.12745 7.30152 8.00713 7.14038 7.78262C6.36587 6.69766 5.14018 6.0499 3.86294 6.0499H1.8853C1.42984 6.0499 1.0603 5.68037 1.0603 5.2249C1.0603 4.76944 1.42984 4.3999 1.8853 4.3999H3.86294C5.67192 4.3999 7.39926 5.30547 8.48316 6.82227C8.74741 7.19395 8.66256 7.70849 8.29194 7.97384C8.14585 8.07804 7.97827 8.12745 7.81284 8.12745Z"/><path fill="currentColor" d="M20.6186 16.2099L18.1436 13.7349C17.8213 13.4126 17.2992 13.4126 16.977 13.7349C16.6547 14.0571 16.6547 14.5792 16.977 14.9015L18.0254 15.9499H15.6342C14.3634 15.9499 13.142 15.3075 12.3664 14.2312C12.1011 13.8638 11.5865 13.7778 11.2149 14.0442C10.8453 14.3106 10.7615 14.8263 11.0279 15.1958C12.1118 16.7008 13.8338 17.5999 15.6342 17.5999H18.0619L16.977 18.6849C16.6547 19.0071 16.6547 19.5292 16.977 19.8515C17.1381 20.0126 17.3486 20.0932 17.5603 20.0932C17.7719 20.0932 17.9824 20.0126 18.1436 19.8515L20.6186 17.3765C20.9408 17.0542 20.9408 16.5321 20.6186 16.2099Z"/></svg>';

/* ── Initial palette: unique per block on a page ───────────────── */

let presetQueue = [];

function shuffledPresetIndexes() {
  const indexes = PALETTE_PRESETS.map((_, i) => i);
  for (let i = indexes.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }
  return indexes;
}

/** Returns the next preset's colors; each call on a page yields a different palette. */
export function takeUniquePreset() {
  if (!presetQueue.length) presetQueue = shuffledPresetIndexes();
  const index = presetQueue.shift();
  return [...PALETTE_PRESETS[index].colors];
}

export function resetPresetQueue() {
  presetQueue = [];
}

export function generateRandomPalette() {
  return generateRandomHexCodes(COLOR_COUNT).map((hex) => hex.toUpperCase());
}

/* ── Strings ───────────────────────────────────────────────────── */

async function loadStrings() {
  const [{ getConfig }, { replaceKeyArray }, railStrings] = await Promise.all([
    import(`${getLibs()}/utils/utils.js`),
    import(`${getLibs()}/features/placeholders.js`),
    loadColorSwatchRailPlaceholders(),
  ]);
  const KEYS = ['palette-columns-edit', 'generate-random', 'new-random-palette-generated'];
  const values = await replaceKeyArray(KEYS, getConfig());
  const v = (i, fallbackText) => {
    const value = values?.[i];
    return value && value !== KEYS[i].replaceAll('-', ' ') ? value : fallbackText;
  };
  return {
    railStrings,
    edit: v(0, 'Edit in the color palette tool'),
    generateRandom: v(1, 'Generate random'),
    newRandomPaletteGenerated: v(2, 'New random palette generated'),
  };
}

/* ── Edit link ─────────────────────────────────────────────────── */

async function getEditBasePath() {
  const { getConfig } = await import(`${getLibs()}/utils/utils.js`);
  const { locale, env } = getConfig();
  const base = `${locale?.contentRoot ?? ''}/create/color-wheel`;
  // Same non-prod override the floating toolbar supports (?palette-link=...).
  if (env?.name === 'prod') return base;
  return new URLSearchParams(window.location.search).get('palette-link') || base;
}

export function buildEditHref(basePath, colors) {
  return buildPaletteEditUrl(basePath, colors);
}

/* ── CTAs ──────────────────────────────────────────────────────── */

function buildIcon(svg) {
  return createTag('span', { class: 'palette-columns-icon', 'aria-hidden': 'true' }, svg);
}

function buildCtaLabel(text) {
  const label = createTag('span', { class: 'palette-columns-cta-label' });
  label.textContent = text;
  return label;
}

function buildEditCta(text, href) {
  const link = createTag('a', {
    class: 'con-button fill palette-columns-cta palette-columns-edit',
    href,
  }, [buildIcon(EXPORT_ICON), buildCtaLabel(text)]);
  decorateAnalyticsAttributes(link, { linkLabel: ANALYTICS_LABELS.edit });
  return link;
}

function buildGenerateCta(text) {
  const button = createTag('button', {
    type: 'button',
    class: 'con-button outline palette-columns-cta palette-columns-generate',
  }, [buildIcon(SHUFFLE_ICON), buildCtaLabel(text)]);
  decorateAnalyticsAttributes(button, { linkLabel: ANALYTICS_LABELS.generate });
  return button;
}

/* ── Decorate ──────────────────────────────────────────────────── */

function resolveVariant(block) {
  if (!VARIANTS.some((cls) => block.classList.contains(cls))) {
    block.classList.add(DEFAULT_VARIANT);
  }
}

function buildContent(block) {
  const content = createTag('div', { class: 'palette-columns-content' });
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => content.append(...cell.childNodes));
    row.remove();
  });
  return content;
}

async function decorateAsync(block, railMount, ctas) {
  const [strings, editBasePath] = await Promise.all([loadStrings(), getEditBasePath()]);
  let colors = takeUniquePreset();
  const mobileQuery = window.matchMedia?.(MOBILE_QUERY);

  const adapter = createSwatchRailAdapter({ colors }, {
    orientation: mobileQuery?.matches ? 'stacked' : 'vertical',
    swatchFeatures: SWATCH_FEATURES,
    strings: strings.railStrings,
  });
  railMount.append(adapter.element);

  mobileQuery?.addEventListener?.('change', (e) => {
    adapter.setOrientation(e.matches ? 'stacked' : 'vertical');
  });

  const editCta = buildEditCta(strings.edit, buildEditHref(editBasePath, colors));
  const generateCta = buildGenerateCta(strings.generateRandom);
  generateCta.addEventListener('click', () => {
    colors = generateRandomPalette();
    adapter.update({ colors });
    editCta.href = buildEditHref(editBasePath, colors);
    announceToScreenReader(strings.newRandomPaletteGenerated);
  });
  ctas.append(editCta, generateCta);

  block.classList.add('is-ready');
  trackColorBlockLoad(BLOCK_NAME);
}

export default function decorate(block) {
  resolveVariant(block);
  const content = buildContent(block);

  const swatches = createTag('div', { class: 'palette-columns-swatches', 'daa-lh': BLOCK_NAME });
  const railMount = createTag('div', { class: 'palette-columns-rail' });
  const ctas = createTag('div', { class: 'palette-columns-ctas' });
  swatches.append(railMount, ctas);
  block.append(content, swatches);

  return decorateAsync(block, railMount, ctas).catch((error) => {
    window.lana?.log(`palette-columns failed to decorate: ${error?.message || error}`, {
      tags: BLOCK_NAME,
      severity: 'error',
    });
  });
}
