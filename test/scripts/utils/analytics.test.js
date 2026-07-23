import { expect } from '@esm-bundle/chai';
import { setDaaLL, setDaaLH } from '../../../express/code/scripts/utils/analytics.js';

describe('Analytics daa attributes', () => {
  describe('setDaaLL', () => {
    it('sets a sanitized daa-ll from a label', () => {
      const a = document.createElement('a');
      const value = setDaaLL(a, 'Get more fonts');
      expect(value).to.equal('Get more fonts');
      expect(a.getAttribute('daa-ll')).to.equal('Get more fonts');
    });

    it('strips punctuation and collapses whitespace', () => {
      const a = document.createElement('a');
      setDaaLL(a, '  Explore | Adobe® Fonts!  ');
      expect(a.getAttribute('daa-ll')).to.equal('Explore Adobe Fonts');
    });

    it('caps length at 30 characters', () => {
      const a = document.createElement('a');
      setDaaLL(a, 'a'.repeat(50));
      expect(a.getAttribute('daa-ll')).to.have.length(30);
    });

    it('falls back to "link" when nothing survives sanitizing', () => {
      const a = document.createElement('a');
      setDaaLL(a, '@#$%');
      expect(a.getAttribute('daa-ll')).to.equal('link');
    });

    it('returns "" and no-ops on an invalid element', () => {
      expect(setDaaLL(null, 'x')).to.equal('');
      expect(setDaaLL({}, 'x')).to.equal('');
    });
  });

  describe('setDaaLH', () => {
    it('sets a sanitized daa-lh scope', () => {
      const el = document.createElement('div');
      setDaaLH(el, 'Gothic A1 Bold');
      expect(el.getAttribute('daa-lh')).to.equal('Gothic A1 Bold');
    });

    it('uses the fallback when the header is empty', () => {
      const el = document.createElement('div');
      setDaaLH(el, '', { fallback: 'Font' });
      expect(el.getAttribute('daa-lh')).to.equal('Font');
    });

    it('returns "" and no-ops on an invalid element', () => {
      expect(setDaaLH(null, 'x')).to.equal('');
    });
  });
});
