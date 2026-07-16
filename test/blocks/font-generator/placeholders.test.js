import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const [{ getLibs }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
await import(`${getLibs()}/utils/utils.js`).then((mod) => mod.setConfig({}));

const { default: loadFontGeneratorPlaceholders, DEFAULT_PLACEHOLDERS } = await import('../../../express/code/blocks/font-generator/placeholders.js');

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
    it('defaults to 200', () => {
      expect(DEFAULT_PLACEHOLDERS.maxLength).to.equal(200);
    });

    it('falls back to the default number when nothing is authored', async () => {
      const strings = await loadFontGeneratorPlaceholders();
      expect(strings.maxLength).to.equal(200);
    });
  });

  describe('placeholders-stage overlay', () => {
    it('leaves defaults untouched when the placeholders-stage metadata is absent', async () => {
      const strings = await loadFontGeneratorPlaceholders();
      expect(strings.maxLength).to.equal(200);
    });

    it('overlays an authored stage value when placeholders-stage is on', async function test() {
      this.timeout(5000);
      const meta = document.createElement('meta');
      meta.name = 'placeholders-stage';
      meta.content = 'on';
      document.head.append(meta);

      const fetchStub = sinon.stub(window, 'fetch');
      fetchStub.withArgs(sinon.match(/placeholders-stage\.json/)).resolves({
        ok: true,
        json: async () => ({ data: [{ key: 'font-generator-max-length', value: '42' }] }),
      });
      fetchStub.callThrough();

      try {
        const strings = await loadFontGeneratorPlaceholders();
        expect(strings.maxLength).to.equal(42);
      } finally {
        fetchStub.restore();
        meta.remove();
      }
    });
  });
});
