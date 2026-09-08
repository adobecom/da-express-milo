import { expect } from '@esm-bundle/chai';

const FALLBACK_LABELS = ['Sans', 'Serif', 'Script', 'Bold', 'Serious'];
const MODULE_PATH = '../../../express/code/blocks/mini-editor/mini-editor-fonts-loader.js';

// Each test gets its own module instance (cache-busting query string) since
// getFontOptions/loadWebFontOptions memoize the kit load/result at module
// scope — without this, tests would leak each other's Typekit mock results.
let importCounter = 0;
async function freshFontsLoader() {
  importCounter += 1;
  return import(`${MODULE_PATH}?instance=${importCounter}`);
}

describe('mini-editor-fonts-loader', () => {
  afterEach(() => {
    delete window.Typekit;
    document.querySelectorAll('script[src*="use.typekit.net"]').forEach((s) => s.remove());
  });

  describe('getFontOptions (fast path)', () => {
    it('resolves immediately with the bundled fallback options, without touching Typekit', async () => {
      window.Typekit = { load: () => { throw new Error('should not be called'); } };
      const { default: getFontOptions } = await freshFontsLoader();
      const options = await getFontOptions();
      expect(options.map((o) => o.label)).to.deep.equal(FALLBACK_LABELS);
    });

    it('returns the live options once loadWebFontOptions has already resolved them', async () => {
      window.Typekit = {
        load: ({ active }) => active?.(),
        config: { fc: [{ family: 'rubik', descriptors: { weight: '400', style: 'normal' } }] },
      };
      const { default: getFontOptions, loadWebFontOptions } = await freshFontsLoader();
      await loadWebFontOptions();
      const options = await getFontOptions();
      expect(options).to.deep.equal([
        { label: 'Clean', family: '"rubik"', font: '"rubik", var(--body-font-family, sans-serif)' },
      ]);
    });
  });

  describe('loadWebFontOptions (live Adobe Fonts kit)', () => {
    it('falls back to the bundled font options when Typekit exposes no fonts', async () => {
      window.Typekit = { load: ({ active }) => active?.() };
      const { loadWebFontOptions } = await freshFontsLoader();
      const options = await loadWebFontOptions();
      expect(options.map((o) => o.label)).to.deep.equal(FALLBACK_LABELS);
    });

    it('falls back when Typekit reports inactive (e.g. blocked kit)', async () => {
      window.Typekit = { load: ({ inactive }) => inactive?.() };
      const { loadWebFontOptions } = await freshFontsLoader();
      const options = await loadWebFontOptions();
      expect(options.map((o) => o.label)).to.deep.equal(FALLBACK_LABELS);
    });

    it('falls back when Typekit.load throws synchronously', async () => {
      window.Typekit = { load: () => { throw new Error('boom'); } };
      const { loadWebFontOptions } = await freshFontsLoader();
      const options = await loadWebFontOptions();
      expect(options.map((o) => o.label)).to.deep.equal(FALLBACK_LABELS);
    });

    it('includes only FONT_ORDER families in their specified order, excluding unknown fonts', async () => {
      window.Typekit = {
        load: ({ active }) => active?.(),
        config: {
          fc: [
            // unknown family — should be excluded
            { family: 'gothic-a1', descriptors: { weight: '400', style: 'normal' } },
            // known families supplied in reverse order — output should follow FONT_ORDER
            { family: 'kanit', descriptors: { weight: '400', style: 'normal' } },
            { family: 'rubik', descriptors: { weight: '400', style: 'normal' } },
          ],
        },
      };
      const { loadWebFontOptions } = await freshFontsLoader();
      const options = await loadWebFontOptions();
      expect(options).to.deep.equal([
        { label: 'Clean', family: '"rubik"', font: '"rubik", var(--body-font-family, sans-serif)' },
        { label: 'Futuristic', family: '"kanit"', font: '"kanit", var(--body-font-family, sans-serif)' },
      ]);
    });

    it('collapses multiple variants of the same family into one option with italic/bold flags', async () => {
      window.Typekit = {
        load: ({ active }) => active?.(),
        config: {
          fc: [
            { family: 'rubik', descriptors: { weight: '400', style: 'normal' } },
            { family: 'rubik', descriptors: { weight: '400', style: 'italic' } },
            { family: 'rubik', descriptors: { weight: '700', style: 'normal' } },
          ],
        },
      };
      const { loadWebFontOptions } = await freshFontsLoader();
      const options = await loadWebFontOptions();
      expect(options).to.have.length(1);
      expect(options[0]).to.deep.equal({
        label: 'Clean',
        family: '"rubik"',
        font: '"rubik", var(--body-font-family, sans-serif)',
        italic: true,
        weight: '700',
      });
    });

    it('falls back when Typekit.config.fc is present but empty', async () => {
      window.Typekit = { load: ({ active }) => active?.(), config: { fc: [] } };
      const { loadWebFontOptions } = await freshFontsLoader();
      const options = await loadWebFontOptions();
      expect(options.map((o) => o.label)).to.deep.equal(FALLBACK_LABELS);
    });

    it('falls back when the kit exposes only unknown families (not in FONT_ORDER)', async () => {
      window.Typekit = {
        load: ({ active }) => active?.(),
        config: {
          fc: [
            { family: 'gothic-a1', descriptors: { weight: '400', style: 'normal' } },
            { family: 'source-han-sans-japanese', descriptors: { weight: '700', style: 'normal' } },
          ],
        },
      };
      const { loadWebFontOptions } = await freshFontsLoader();
      const options = await loadWebFontOptions();
      expect(options.map((o) => o.label)).to.deep.equal(FALLBACK_LABELS);
    });

    it('skips entries with no family', async () => {
      window.Typekit = {
        load: ({ active }) => active?.(),
        config: {
          fc: [
            { family: '', descriptors: { weight: '400' } },
            { family: 'rubik', descriptors: { weight: '400' } },
          ],
        },
      };
      const { loadWebFontOptions } = await freshFontsLoader();
      const options = await loadWebFontOptions();
      expect(options).to.deep.equal([
        { label: 'Clean', family: '"rubik"', font: '"rubik", var(--body-font-family, sans-serif)' },
      ]);
    });
  });
});
