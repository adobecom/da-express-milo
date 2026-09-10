/**
 * Mini Editor fonts loader
 *
 * Two entry points that split font loading into a fast path and a live path,
 * so the Adobe Fonts (Typekit) kit's network round trip never blocks the
 * card's first render (it's the mini-editor's LCP element — see
 * mini-editor.js):
 *
 *   - `getFontOptions` (default export) resolves immediately with the
 *     bundled FALLBACK_FONT_OPTIONS — or, if the kit has already loaded by
 *     the time it's called (e.g. a second mini-editor block decorating after
 *     the first one's kit load finished), the real options straight away.
 *   - `loadWebFontOptions` loads the kit, then reads whatever families it
 *     actually exposes and turns them into options (the live source). Not
 *     awaited before the card renders — mini-editor.js calls it after the
 *     widget has mounted and upgrades the already-visible font control once
 *     it resolves.
 *
 * Every option has the same shape the widget consumes:
 * `{ label, font, italic?, weight?, stretch? }`.
 */

// Fallback used only if the Typekit kit fails to load or exposes no fonts
// (network failure, ad blocker, or API shape change) — see getFontOptions.
const FALLBACK_FONT_OPTIONS = [
  { label: 'Sans', family: '"Cal Sans"', font: '"Cal Sans", "Inter", sans-serif' },
  { label: 'Serif', family: '"Source Serif 4"', font: '"Source Serif 4", Georgia, serif', italic: true },
  { label: 'Script', family: '"Dancing Script"', font: '"Dancing Script", cursive', italic: true },
  { label: 'Bold', family: '"Poppins"', font: '"Poppins", sans-serif', weight: '700' },
  { label: 'Serious', family: 'Georgia', font: 'Georgia, serif' },
];

// Display name for each family slug in ADOBE_FONTS_KIT_ID, taken from the
// kit's own "style tag" naming (Adobe Fonts dashboard) rather than derived
// from the slug — e.g. "old-standard" is tagged "Luxury", not "Old Standard".
// Any family added to the kit later that isn't listed here just falls back
// to familySlugToLabel, so this map never blocks new fonts from showing up.
const FAMILY_TO_STYLE_TAG = {
  rubik: 'Clean',
  kaffeesatz: 'Funky',
  anton: 'Bold',
  orbitron: 'Geometric',
  montara: 'Fun',
  kanit: 'Futuristic',
  lobster: 'Cursive',
  'old-standard': 'Luxury',
  'permanent-marker': 'Marker',
};

// Desired display order for the font picker — matches the attachment's
// "Style tag" table. Only families present BOTH here and in the loaded kit
// are shown, in this order; the first entry is the default selection.
// Any family the kit exposes that isn't listed here is excluded.
const FONT_ORDER = [
  'rubik',
  'kaffeesatz',
  'anton',
  'orbitron',
  'montara',
  'kanit',
  'lobster',
  'old-standard',
  'permanent-marker',
];

// Adobe Fonts (Typekit) kit id — same lazy-load approach as font-generator.js:
// load the JS embed kit (works cross-domain) instead of the CSS endpoint
// (which 412s off non-allow-listed domains), and resolve on active/inactive
// so callers await real font readiness, not just script load.
const ADOBE_FONTS_KIT_ID = 'bxg0yug';

function loadWebFonts() {
  return new Promise((resolve) => {
    const runTypekit = () => {
      try {
        window.Typekit.load({
          kitId: ADOBE_FONTS_KIT_ID,
          scriptTimeout: 3000,
          async: true,
          active: resolve,
          inactive: resolve,
        });
      } catch {
        resolve();
      }
    };
    if (window.Typekit) {
      runTypekit();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://use.typekit.net/${ADOBE_FONTS_KIT_ID}.js`;
    script.async = true;
    script.addEventListener('load', runTypekit, { once: true });
    script.addEventListener('error', resolve, { once: true });
    document.head.append(script);
  });
}

// Turns a Typekit family slug ("gothic-a1", "source-han-sans-japanese") into
// a human label ("Gothic A1", "Source Han Sans Japanese") for the font pill/
// buttons — used only as a fallback for families FAMILY_TO_STYLE_TAG doesn't
// know about, since Typekit's font list exposes no display name, only this
// slug.
function familySlugToLabel(family) {
  return family
    .split('-')
    .map((part) => (part.length <= 2 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1)))
    .join(' ');
}

function familyToLabel(family) {
  return FAMILY_TO_STYLE_TAG[family] || familySlugToLabel(family);
}

function getTypekitEntries() {
  const configEntries = window.Typekit?.config?.fc;
  if (Array.isArray(configEntries) && configEntries.length) {
    return configEntries;
  }

  return [];
}

/**
 * Reads the fonts the loaded Typekit kit actually exposes and turns them
 * into option entries, instead of a hand-authored list that can silently
 * drift from whatever the kit (ADOBE_FONTS_KIT_ID) actually contains.
 *
 * The font list lives at `window.Typekit.config.fc` — verified live against
 * ADOBE_FONTS_KIT_ID (kit `bxg0yug`) in a real browser. `config.fc` is the
 * array that actually has one entry per loaded font, each `{ family,
 * descriptors: { weight, style, stretch, display, variable, ... } }` —
 * family is both the slug and the exact CSS font-family name Typekit
 * registered (confirmed via document.fonts).
 *
 * Variants of the same family (weight/style/stretch) collapse into one
 * option that offers italic/bold/non-normal-stretch if any variant of that
 * family has it. Falls back to FALLBACK_FONT_OPTIONS if the kit failed to
 * load or exposes nothing, so the UI still has font choices to show.
 */
function buildFontOptions() {
  const entries = getTypekitEntries();
  if (!entries.length) return FALLBACK_FONT_OPTIONS;

  const byFamily = new Map();
  entries.forEach(({ family, descriptors }) => {
    if (!family) return;
    const { weight, style, stretch } = descriptors || {};
    const existing = byFamily.get(family) || { italic: false, bold: false, stretch: null };
    if (style === 'italic' || style === 'oblique') existing.italic = true;
    if (weight === '700' || weight === 'bold') existing.bold = true;
    if (stretch && stretch !== 'normal') existing.stretch = stretch;
    byFamily.set(family, existing);
  });
  if (!byFamily.size) return FALLBACK_FONT_OPTIONS;

  // Only include families from FONT_ORDER that the kit actually loaded,
  // in the specified order — first entry is the default selection.
  // Families the kit exposes outside FONT_ORDER are excluded.
  const options = FONT_ORDER
    .filter((family) => byFamily.has(family))
    .map((family) => {
      const { italic, bold, stretch } = byFamily.get(family);
      // `family` is the concrete family stored in the content model (canvas export + Express
      // hand-off want a single family); `font` is the DOM/CSS stack used for on-page rendering.
      const option = { label: familyToLabel(family), family: `"${family}"`, font: `"${family}", var(--body-font-family, sans-serif)` };
      if (italic) option.italic = true;
      if (bold) option.weight = '700';
      if (stretch) option.stretch = stretch;
      return option;
    });
  return options.length ? options : FALLBACK_FONT_OPTIONS;
}

// Set once loadWebFontOptions() resolves, so a getFontOptions() call made
// afterwards (e.g. a second mini-editor block decorating later) returns the
// live list immediately instead of the fallback.
let resolvedFontOptions = null;
let webFontOptionsPromise = null;

/**
 * Loads the Adobe Fonts kit and returns the live font-choice list once it
 * resolves. Memoized so every caller on the page (an upgrade after the
 * inline widget mounts, the "Create a design" modal) shares one kit load
 * instead of each triggering their own.
 *
 * @returns {Promise<Array<{ label: string, font: string, italic?: boolean,
 *   weight?: string, stretch?: string }>>}
 */
export function loadWebFontOptions() {
  webFontOptionsPromise ??= loadWebFonts().then(() => {
    resolvedFontOptions = buildFontOptions();
    return resolvedFontOptions;
  });
  return webFontOptionsPromise;
}

/**
 * Returns the mini-editor's initial font-choice list, with no network wait —
 * the bundled fallback, or the live Adobe Fonts list if loadWebFontOptions()
 * already resolved it. Callers that need the live list to load, rather than
 * just use it if already available, should call loadWebFontOptions()
 * directly (see mini-editor.js, which does so only after the card has
 * already rendered with these fallback options).
 *
 * @returns {Promise<Array<{ label: string, font: string, italic?: boolean,
 *   weight?: string, stretch?: string }>>}
 */
export default async function getFontOptions() {
  return resolvedFontOptions || FALLBACK_FONT_OPTIONS;
}
