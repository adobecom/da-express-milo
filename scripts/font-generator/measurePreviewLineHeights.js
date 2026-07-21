import { chromium } from '@playwright/test';

// Same kit the runtime block loads (font-generator.js) — fontSupported values
// only resolve to the intended face once this kit's @font-face rules are
// active, so measurement has to run against the same font data production
// renders with, not a system-font fallback.
const ADOBE_FONTS_KIT_ID = 'iqd6egj';

// Large reference size so actualBoundingBox* rounding error is negligible;
// the result is stored as an em-relative multiplier, not an absolute size.
const MEASURE_FONT_SIZE = 200;

const BASE_LINE_HEIGHT = 1.1;

// Canvas ink measurement and the DOM's own text rasterizer aren't guaranteed
// to produce byte-identical output — this buffer absorbs small cross-engine
// differences so a value that's merely *exact* doesn't clip by a sub-pixel.
const SAFETY_MARGIN = 1.12;

/**
 * Every string a font could render: its character-map values plus any
 * whole-text wrapper pattern. Each is measured independently — combining
 * marks stack on their own base glyph regardless of neighboring text.
 *
 * @param {import('../../express/code/blocks/font-generator/types.js').FontDef} fontDef
 * @returns {string[]}
 */
function collectRenderableStrings(fontDef) {
  const { letters, numbers, specialCharacters } = fontDef.characters;
  const { startPattern, repeatingMiddlePattern, endPattern } = fontDef.pattern ?? {};
  return [
    ...Object.values(letters),
    ...Object.values(numbers),
    ...Object.values(specialCharacters),
    startPattern,
    repeatingMiddlePattern,
    endPattern,
  ].filter(Boolean);
}

/**
 * Worst-case ink ascent/descent this font paints, in a real browser, using
 * its real webfont — canvas measureText's actualBoundingBoxAscent/Descent
 * reflect actual rendered ink (including combining marks stacked outside a
 * font's nominal metrics), unlike any CSS-layout-based measurement.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} fontFamily
 * @param {string[]} strings
 * @returns {Promise<{ maxAscent: number, maxDescent: number }>}
 */
async function measureInkExtent(page, fontFamily, strings) {
  return page.evaluate(({ fontFamily: family, strings: values, fontSize }) => {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `${fontSize}px "${family}"`;
    return values.reduce((acc, value) => {
      const metrics = ctx.measureText(value);
      return {
        maxAscent: Math.max(acc.maxAscent, metrics.actualBoundingBoxAscent),
        maxDescent: Math.max(acc.maxDescent, metrics.actualBoundingBoxDescent),
      };
    }, { maxAscent: 0, maxDescent: 0 });
  }, { fontFamily, strings, fontSize: MEASURE_FONT_SIZE });
}

/**
 * Measures every font's worst-case preview line-height. Requires a page
 * whose document already has the Adobe Fonts kit active (see openMeasurePage)
 * so fontSupported resolves to the real webfont, not a fallback.
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('../../express/code/blocks/font-generator/types.js').FontDef[]} fonts
 * @returns {Promise<Map<string, number>>} fontDef.id -> previewLineHeight
 */
export async function computePreviewLineHeights(page, fonts) {
  const results = new Map();
  for (const fontDef of fonts) {
    const strings = collectRenderableStrings(fontDef);
    const { maxAscent, maxDescent } = await measureInkExtent(page, fontDef.fontSupported, strings);
    const measuredLineHeight = ((maxAscent + maxDescent) / MEASURE_FONT_SIZE) * SAFETY_MARGIN;
    results.set(fontDef.id, Number(Math.max(BASE_LINE_HEIGHT, measuredLineHeight).toFixed(3)));
  }
  return results;
}

async function openMeasurePage(browser) {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><head></head><body></body></html>');
  await page.addScriptTag({ url: `https://use.typekit.net/${ADOBE_FONTS_KIT_ID}.js` });
  await page.evaluate(() => new Promise((resolve) => {
    window.Typekit.load({ active: resolve, inactive: resolve });
  }));
  await page.evaluate(() => document.fonts.ready);
  return page;
}

export async function writePreviewLineHeights() {
  const { readFileSync, writeFileSync } = await import('node:fs');
  const jsonUrl = new URL(
    '../../express/code/blocks/font-generator/font-sheets/font-styles.json',
    import.meta.url,
  );
  const data = JSON.parse(readFileSync(jsonUrl, 'utf8'));

  const browser = await chromium.launch();
  let lineHeights;
  try {
    const page = await openMeasurePage(browser);
    lineHeights = await computePreviewLineHeights(page, data.fonts);
  } finally {
    await browser.close();
  }

  data.fonts.forEach((fontDef) => {
    fontDef.previewLineHeight = lineHeights.get(fontDef.id);
  });

  writeFileSync(jsonUrl, `${JSON.stringify(data, null, 2)}\n`);
  return data;
}

if (
  typeof process !== 'undefined'
  && process.argv?.[1]
  && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href
) {
  await writePreviewLineHeights();
}
