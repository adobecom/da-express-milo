import { expect } from '@esm-bundle/chai';

const [{ getLibs }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
await import(`${getLibs()}/utils/utils.js`).then((mod) => mod.setConfig({}));

const {
  default: loadFontGeneratorPlaceholders,
  DEFAULT_PLACEHOLDERS,
  loadFontLabels,
  getCategoryKey,
  getFontNameKey,
} = await import('../../../express/code/blocks/font-generator/placeholders.js');

// Every UI string the toolbar / card grid / input rely on. filters.js and
// panel.js own their own fg-* keys, so those are intentionally not here.
const EXPECTED_KEYS = [
  'previewPlaceholder', 'inputLabel', 'tryThese', 'suggestions', 'filterTrigger',
  'layoutGroupLabel', 'gridViewLabel', 'rowViewLabel', 'fontSizeLabel',
  'fontCountLabel', 'loadMore', 'copyLabel', 'copiedLabel',
  'copiedMessage', 'sampleText', 'cardCtaText',
];

describe('font-generator/placeholders', () => {
  it('exposes DEFAULT_PLACEHOLDERS as a frozen object', () => {
    expect(Object.isFrozen(DEFAULT_PLACEHOLDERS)).to.be.true;
  });

  it('provides a non-empty English default for every UI string', () => {
    EXPECTED_KEYS.forEach((key) => {
      expect(DEFAULT_PLACEHOLDERS, key).to.have.property(key).that.is.a('string');
      expect(DEFAULT_PLACEHOLDERS[key].length, key).to.be.greaterThan(0);
    });
  });

  it('resolves to an object carrying every default key', async () => {
    const strings = await loadFontGeneratorPlaceholders();
    EXPECTED_KEYS.forEach((key) => {
      expect(strings, key).to.have.property(key).that.is.a('string');
    });
  });

  it('falls back to the English defaults when nothing is authored', async () => {
    // The placeholders sheet 404s in the test env, so every value falls back.
    const strings = await loadFontGeneratorPlaceholders();
    EXPECTED_KEYS.forEach((key) => {
      expect(strings[key], key).to.equal(DEFAULT_PLACEHOLDERS[key]);
    });
  });

  describe('maxLength', () => {
    it('defaults to 2000', () => {
      expect(DEFAULT_PLACEHOLDERS.maxLength).to.equal(2000);
    });

    it('falls back to the default number when nothing is authored', async () => {
      const strings = await loadFontGeneratorPlaceholders();
      expect(strings.maxLength).to.equal(2000);
    });
  });

  describe('loadFontLabels', () => {
    const FONTS = [
      { id: 'light-text-bubble', styleName: 'Light text bubble', category: 'Cool' },
      { id: 'bandaid', styleName: 'Bandaid', category: 'Glitch' },
      { id: 'dark-text-bubble', styleName: 'Dark text bubble', category: 'Cool' },
    ];

    it('reuses the filter category keys and keys font names by id', () => {
      expect(getCategoryKey('Cool')).to.equal('font-generator-cool');
      expect(getCategoryKey('Glitch')).to.equal('font-generator-glitch');
      expect(getCategoryKey('Symbol')).to.equal('font-generator-symbol');
      expect(getFontNameKey('light-text-bubble')).to.equal('font-generator-light-text-bubble');
    });

    it('falls back to the raw catalog values when nothing is authored', async () => {
      const { categoryLabels, fontNames } = await loadFontLabels(FONTS);
      expect(categoryLabels).to.deep.equal({ Cool: 'Cool', Glitch: 'Glitch' });
      expect(fontNames).to.deep.equal({
        'light-text-bubble': 'Light text bubble',
        bandaid: 'Bandaid',
        'dark-text-bubble': 'Dark text bubble',
      });
    });

    it('returns empty maps for an empty catalog', async () => {
      expect(await loadFontLabels()).to.deep.equal({ categoryLabels: {}, fontNames: {} });
    });
  });
});
