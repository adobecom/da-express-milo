/**
 * Mini Editor fonts loader
 *
 * Single entry point (`getFontOptions`) that returns the font-choice list the
 * mini-editor's font control renders. It owns the decision of WHERE those
 * options come from, so callers never branch on it:
 *
 *   - Load the Adobe Fonts (Typekit) kit, then read whatever families it
 *     actually exposes and turn them into options (the live source).
 *   - If the kit fails to load or exposes nothing, fall back to the bundled
 *     FALLBACK_FONT_OPTIONS so the UI always has choices to show.
 *
 * Every option has the same shape the widget consumes:
 * `{ label, font, italic?, weight? }`.
 */

// Fallback used only if the Typekit kit fails to load or exposes no fonts
// (network failure, ad blocker, or API shape change) — see getFontOptions.
const FALLBACK_FONT_OPTIONS = [
  { label: 'Sans', font: '"Cal Sans", "Inter", sans-serif' },
  { label: 'Serif', font: '"Source Serif 4", Georgia, serif', italic: true },
  { label: 'Script', font: '"Dancing Script", cursive', italic: true },
  { label: 'Bold', font: '"Poppins", sans-serif', weight: '700' },
  { label: 'Serious', font: 'Georgia, serif' },
];

// Adobe Fonts (Typekit) kit id — same lazy-load approach as font-generator.js:
// load the JS embed kit (works cross-domain) instead of the CSS endpoint
// (which 412s off non-allow-listed domains), and resolve on active/inactive
// so callers await real font readiness, not just script load.
const ADOBE_FONTS_KIT_ID = 'iqd6egj';

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
// buttons — Typekit's font list exposes no display name, only this slug.
function familySlugToLabel(family) {
  return family
    .split('-')
    .map((part) => (part.length <= 2 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1)))
    .join(' ');
}

/**
 * Reads the fonts the loaded Typekit kit actually exposes (window.Typekit
 * .fonts.fonts — each entry's `family` is both its slug and the exact CSS
 * font-family name Typekit registered, confirmed via document.fonts) and
 * turns them into option entries, instead of a hand-authored list that can
 * silently drift from whatever the kit (ADOBE_FONTS_KIT_ID) actually
 * contains. Variants of the same family (weight/style) collapse into one
 * option that offers italic/bold if any variant of that family has it.
 * Falls back to FALLBACK_FONT_OPTIONS if the kit failed to load or exposes
 * nothing, so the UI still has font choices to show.
 */
function buildFontOptions() {
  const entries = window.Typekit?.fonts?.fonts;
  if (!Array.isArray(entries) || !entries.length) return FALLBACK_FONT_OPTIONS;

  const byFamily = new Map();
  entries.forEach(({ family, weight, style }) => {
    if (!family) return;
    const existing = byFamily.get(family) || { italic: false, bold: false };
    if (style === 'italic') existing.italic = true;
    if (weight === '700' || weight === 'bold') existing.bold = true;
    byFamily.set(family, existing);
  });
  if (!byFamily.size) return FALLBACK_FONT_OPTIONS;

  return Array.from(byFamily, ([family, { italic, bold }]) => {
    const option = { label: familySlugToLabel(family), font: `"${family}", var(--body-font-family, sans-serif)` };
    if (italic) option.italic = true;
    if (bold) option.weight = '700';
    return option;
  });
}

/**
 * Returns the mini-editor's font-choice list as `[{ label, font, italic?,
 * weight? }, ...]`. Loads the Adobe Fonts kit first so the options reflect
 * whatever families it actually registered, then builds them — the caller
 * does not need to load the kit or know which source (live/fallback) was
 * used.
 *
 * @returns {Promise<Array<{ label: string, font: string, italic?: boolean,
 *   weight?: string }>>}
 */
export default async function getFontOptions() {
  await loadWebFonts();
  return buildFontOptions();
}
