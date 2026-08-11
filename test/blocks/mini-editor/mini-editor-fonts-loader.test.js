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

  it('builds options from the fonts Typekit actually exposes, humanizing the slug', async () => {
    window.Typekit = {
      load: ({ active }) => active?.(),
      fonts: {
        fonts: [
          { family: 'gothic-a1', weight: '400', style: 'normal' },
          { family: 'source-han-sans-japanese', weight: '700', style: 'normal' },
        ],
      },
    };
    const options = await getFontOptions();
    expect(options).to.deep.equal([
      { label: 'Gothic A1', font: '"gothic-a1", var(--body-font-family, sans-serif)' },
      {
        label: 'Source Han Sans Japanese',
        font: '"source-han-sans-japanese", var(--body-font-family, sans-serif)',
        weight: '700',
      },
    ]);
  });

  it('collapses multiple variants of the same family into one option with italic/bold flags', async () => {
    window.Typekit = {
      load: ({ active }) => active?.(),
      fonts: {
        fonts: [
          { family: 'noto-sans', weight: '400', style: 'normal' },
          { family: 'noto-sans', weight: '400', style: 'italic' },
          { family: 'noto-sans', weight: '700', style: 'normal' },
        ],
      },
    };
    const options = await getFontOptions();
    expect(options).to.have.length(1);
    expect(options[0]).to.deep.equal({
      label: 'Noto Sans',
      font: '"noto-sans", var(--body-font-family, sans-serif)',
      italic: true,
      weight: '700',
    });
  });

  it('falls back when Typekit.fonts.fonts is present but empty', async () => {
    window.Typekit = { load: ({ active }) => active?.(), fonts: { fonts: [] } };
    const options = await getFontOptions();
    expect(options.map((o) => o.label)).to.deep.equal(FALLBACK_LABELS);
  });

  it('skips entries with no family', async () => {
    window.Typekit = {
      load: ({ active }) => active?.(),
      fonts: { fonts: [{ family: '', weight: '400' }, { family: 'gothic-a1', weight: '400' }] },
    };
    const options = await getFontOptions();
    expect(options).to.deep.equal([
      { label: 'Gothic A1', font: '"gothic-a1", var(--body-font-family, sans-serif)' },
    ]);
  });
});
