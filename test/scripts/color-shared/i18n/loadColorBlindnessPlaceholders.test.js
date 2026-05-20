import { expect } from '@esm-bundle/chai';
import {
  DEFAULT_SHARED_PLACEHOLDERS,
  DEFAULT_BLOCK_PLACEHOLDERS,
  createColorBlindnessSharedPlaceholders,
  createColorBlindnessBlockPlaceholders,
} from '../../../../express/code/scripts/color-shared/i18n/loadColorBlindnessPlaceholders.js';

describe('loadColorBlindnessPlaceholders', () => {
  describe('DEFAULT_SHARED_PLACEHOLDERS', () => {
    it('is frozen', () => {
      expect(Object.isFrozen(DEFAULT_SHARED_PLACEHOLDERS)).to.be.true;
    });

    it('has expected keys', () => {
      const expected = [
        'typeTritan', 'typeProtan', 'typeDeutan',
        'typeDescTritan', 'typeDescProtan', 'typeDescDeutan',
        'tooltip', 'summary', 'statusNone', 'statusNoConflicts',
        'statusConflictsFound', 'mobilePaletteHeader', 'conflictIconAria',
        'badgeNoneAria', 'badgeConflictsAria',
      ];
      expected.forEach((key) => {
        expect(DEFAULT_SHARED_PLACEHOLDERS).to.have.property(key);
      });
    });

    it('summary defaults to "Potential color blind conflicts"', () => {
      expect(DEFAULT_SHARED_PLACEHOLDERS.summary).to.equal('Potential color blind conflicts');
    });
  });

  describe('DEFAULT_BLOCK_PLACEHOLDERS', () => {
    it('is frozen', () => {
      expect(Object.isFrozen(DEFAULT_BLOCK_PLACEHOLDERS)).to.be.true;
    });

    it('has expected keys', () => {
      const expected = [
        'sectionAria', 'navCreatePalette', 'navContrastChecker',
        'navColorBlindness', 'controlUndo', 'controlRedo',
        'wheelAria', 'wheelFocusAnnouncement', 'conflictsFocusAnnouncement',
        'blockError',
      ];
      expected.forEach((key) => {
        expect(DEFAULT_BLOCK_PLACEHOLDERS).to.have.property(key);
      });
    });
  });

  describe('createColorBlindnessSharedPlaceholders', () => {
    it('returns defaults when called without overrides', () => {
      const result = createColorBlindnessSharedPlaceholders();
      expect(result).to.deep.equal(DEFAULT_SHARED_PLACEHOLDERS);
    });

    it('merges overrides over defaults', () => {
      const result = createColorBlindnessSharedPlaceholders({
        typeDeutan: 'Deutéranopie',
      });
      expect(result.typeDeutan).to.equal('Deutéranopie');
      expect(result.typeProtan).to.equal(DEFAULT_SHARED_PLACEHOLDERS.typeProtan);
    });
  });

  describe('createColorBlindnessBlockPlaceholders', () => {
    it('returns defaults when called without overrides', () => {
      const result = createColorBlindnessBlockPlaceholders();
      expect(result).to.deep.equal(DEFAULT_BLOCK_PLACEHOLDERS);
    });

    it('merges overrides over defaults', () => {
      const result = createColorBlindnessBlockPlaceholders({
        controlUndo: 'Annuler',
      });
      expect(result.controlUndo).to.equal('Annuler');
      expect(result.controlRedo).to.equal(DEFAULT_BLOCK_PLACEHOLDERS.controlRedo);
    });
  });
});
