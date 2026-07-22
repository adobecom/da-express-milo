import { expect } from '@esm-bundle/chai';
import {
  PASS,
  FAIL,
  CONTRAST_LEVELS,
  MAX_RECOMMENDATION,
  HISTORY_LIMIT,
  WCAG_THRESHOLDS,
} from '../../../../express/code/blocks/color-contrast-checker/utils/contrastConstants.js';

describe('contrastConstants', () => {
  describe('PASS and FAIL', () => {
    it('PASS equals "PASS"', () => {
      expect(PASS).to.equal('PASS');
    });

    it('FAIL equals "FAIL"', () => {
      expect(FAIL).to.equal('FAIL');
    });
  });

  describe('CONTRAST_LEVELS', () => {
    it('contains AAA and AA', () => {
      expect(CONTRAST_LEVELS).to.include('AAA');
      expect(CONTRAST_LEVELS).to.include('AA');
    });

    it('has exactly 2 entries', () => {
      expect(CONTRAST_LEVELS).to.have.lengthOf(2);
    });
  });

  describe('MAX_RECOMMENDATION', () => {
    it('equals 3', () => {
      expect(MAX_RECOMMENDATION).to.equal(3);
    });
  });

  describe('HISTORY_LIMIT', () => {
    it('equals 200', () => {
      expect(HISTORY_LIMIT).to.equal(200);
    });
  });

  describe('WCAG_THRESHOLDS', () => {
    it('has correct NORMAL_AA value', () => {
      expect(WCAG_THRESHOLDS.NORMAL_AA).to.equal(4.5);
    });

    it('has correct LARGE_AA value', () => {
      expect(WCAG_THRESHOLDS.LARGE_AA).to.equal(3);
    });

    it('has correct NORMAL_AAA value', () => {
      expect(WCAG_THRESHOLDS.NORMAL_AAA).to.equal(7);
    });

    it('has correct LARGE_AAA value', () => {
      expect(WCAG_THRESHOLDS.LARGE_AAA).to.equal(4.5);
    });

    it('has correct UI_AA value', () => {
      expect(WCAG_THRESHOLDS.UI_AA).to.equal(3);
    });
  });
});
