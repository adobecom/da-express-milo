import { expect } from '@esm-bundle/chai';
import {
  DEFAULT_PLACEHOLDERS,
  createBaseColorPlaceholders,
} from '../../../../express/code/scripts/color-shared/i18n/loadBaseColorPlaceholders.js';

describe('loadBaseColorPlaceholders', () => {
  describe('DEFAULT_PLACEHOLDERS', () => {
    it('is frozen', () => {
      expect(Object.isFrozen(DEFAULT_PLACEHOLDERS)).to.be.true;
    });

    it('has expected keys', () => {
      const expected = [
        'title', 'modeLabel', 'fieldLabel', 'lockedAria', 'unlockedAria',
        'hexError', 'brightnessContrast', 'channelRed', 'channelGreen',
        'channelBlue', 'channelHue', 'channelSaturation', 'channelBrightness',
        'channelLightness', 'channelLabA', 'channelLabB',
      ];
      expected.forEach((key) => {
        expect(DEFAULT_PLACEHOLDERS).to.have.property(key);
      });
    });

    it('title defaults to "Base color"', () => {
      expect(DEFAULT_PLACEHOLDERS.title).to.equal('Base color');
    });
  });

  describe('createBaseColorPlaceholders', () => {
    it('returns defaults when called without overrides', () => {
      const result = createBaseColorPlaceholders();
      expect(result).to.deep.equal(DEFAULT_PLACEHOLDERS);
    });

    it('merges overrides over defaults', () => {
      const result = createBaseColorPlaceholders({ title: 'Couleur de base' });
      expect(result.title).to.equal('Couleur de base');
      expect(result.modeLabel).to.equal(DEFAULT_PLACEHOLDERS.modeLabel);
    });

    it('does not mutate defaults', () => {
      createBaseColorPlaceholders({ title: 'custom' });
      expect(DEFAULT_PLACEHOLDERS.title).to.equal('Base color');
    });
  });
});
