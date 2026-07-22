import { expect } from '@esm-bundle/chai';
import {
  DEFAULT_PLACEHOLDERS,
  createColorEditPlaceholders,
} from '../../../../express/code/scripts/color-shared/i18n/loadColorEditPlaceholders.js';

describe('loadColorEditPlaceholders', () => {
  describe('DEFAULT_PLACEHOLDERS', () => {
    it('is frozen', () => {
      expect(Object.isFrozen(DEFAULT_PLACEHOLDERS)).to.be.true;
    });

    it('has expected keys', () => {
      const expected = [
        'title', 'dialogAria', 'modeLabel', 'paletteColors',
        'hexLabel', 'hexFieldLabel',
      ];
      expected.forEach((key) => {
        expect(DEFAULT_PLACEHOLDERS).to.have.property(key);
      });
    });

    it('title defaults to "Edit color"', () => {
      expect(DEFAULT_PLACEHOLDERS.title).to.equal('Edit color');
    });
  });

  describe('createColorEditPlaceholders', () => {
    it('returns defaults when called without overrides', () => {
      const result = createColorEditPlaceholders();
      expect(result).to.deep.equal(DEFAULT_PLACEHOLDERS);
    });

    it('merges overrides over defaults', () => {
      const result = createColorEditPlaceholders({ title: 'Modifier la couleur' });
      expect(result.title).to.equal('Modifier la couleur');
      expect(result.dialogAria).to.equal(DEFAULT_PLACEHOLDERS.dialogAria);
    });

    it('does not mutate defaults', () => {
      createColorEditPlaceholders({ title: 'custom' });
      expect(DEFAULT_PLACEHOLDERS.title).to.equal('Edit color');
    });
  });
});
