import { expect } from '@esm-bundle/chai';
import {
  DEFAULT_PLACEHOLDERS,
  createColorLibrariesPlaceholders,
} from '../../../../express/code/scripts/color-shared/i18n/loadColorLibrariesPlaceholders.js';

describe('loadColorLibrariesPlaceholders', () => {
  describe('DEFAULT_PLACEHOLDERS', () => {
    it('is frozen', () => {
      expect(Object.isFrozen(DEFAULT_PLACEHOLDERS)).to.be.true;
    });

    it('has expected keys', () => {
      const expected = [
        'librariesSignIn',
        'blockError',
        'librariesDefaultName',
        'librariesSearchPlaceholder',
        'librariesSavedLibrary',
        'librariesSavedLibraries',
        'librariesDeleteThemeHeading',
        'librariesDeleteGradientHeading',
        'librariesCountTheme',
        'librariesCountGradients',
      ];
      expected.forEach((key) => {
        expect(DEFAULT_PLACEHOLDERS).to.have.property(key);
      });
    });

    it('librariesSignIn defaults to sign-in prompt', () => {
      expect(DEFAULT_PLACEHOLDERS.librariesSignIn).to.equal(
        'Sign in to view your Creative Cloud Libraries.',
      );
    });
  });

  describe('createColorLibrariesPlaceholders', () => {
    it('returns defaults when called without overrides', () => {
      const result = createColorLibrariesPlaceholders();
      expect(result).to.deep.equal(DEFAULT_PLACEHOLDERS);
    });

    it('merges overrides over defaults', () => {
      const result = createColorLibrariesPlaceholders({
        librariesSignIn: 'Connectez-vous pour voir vos bibliothèques.',
      });
      expect(result.librariesSignIn).to.equal('Connectez-vous pour voir vos bibliothèques.');
      expect(result.librariesSearchPlaceholder).to.equal(DEFAULT_PLACEHOLDERS.librariesSearchPlaceholder);
    });

    it('does not mutate defaults', () => {
      createColorLibrariesPlaceholders({ librariesSignIn: 'custom' });
      expect(DEFAULT_PLACEHOLDERS.librariesSignIn).to.equal(
        'Sign in to view your Creative Cloud Libraries.',
      );
    });
  });
});
