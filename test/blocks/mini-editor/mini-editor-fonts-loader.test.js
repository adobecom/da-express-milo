import { expect } from '@esm-bundle/chai';
import getFontOptions from '../../../express/code/blocks/mini-editor/mini-editor-fonts-loader.js';

const FALLBACK_LABELS = ['Sans', 'Serif', 'Script', 'Bold', 'Serious'];

describe('mini-editor-fonts-loader', () => {
  afterEach(() => {
    delete window.Typekit;
    document.querySelectorAll('script[src*="use.typekit.net"]').forEach((s) => s.remove());
  });

  it('falls back to the bundled font options when Typekit exposes no fonts', async () => {
    window.Typekit = { load: ({ active }) => active?.() };
    const options = await getFontOptions();
    expect(options.map((o) => o.label)).to.deep.equal(FALLBACK_LABELS);
  });

  it('falls back when Typekit reports inactive (e.g. blocked kit)', async () => {
    window.Typekit = { load: ({ inactive }) => inactive?.() };
    const options = await getFontOptions();
    expect(options.map((o) => o.label)).to.deep.equal(FALLBACK_LABELS);
  });

  it('falls back when Typekit.load throws synchronously', async () => {
    window.Typekit = { load: () => { throw new Error('boom'); } };
    const options = await getFontOptions();
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
    const options = await getFontOptions();
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
    const options = await getFontOptions();
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
    const options = await getFontOptions();
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
    const options = await getFontOptions();
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
    const options = await getFontOptions();
    expect(options).to.deep.equal([
      { label: 'Clean', family: '"rubik"', font: '"rubik", var(--body-font-family, sans-serif)' },
    ]);
  });
});
