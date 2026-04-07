/* eslint-env mocha */

import { expect } from '@esm-bundle/chai';

window.isTestEnv = true;

const {
  normalizeSwatchHexes,
  harmonyRulesForSwatchCount,
  makeTransformPalette,
  paletteFromThemeState,
  swatchHexListFromState,
} = await import('../../../express/code/blocks/color-wheel/color-wheel.js');

describe('color-wheel utilities', () => {
  describe('normalizeSwatchHexes', () => {
    it('uppercases hex values', () => {
      expect(normalizeSwatchHexes([{ hex: '#aabbcc' }])).to.deep.equal(['#AABBCC']);
    });

    it('adds missing # prefix', () => {
      expect(normalizeSwatchHexes([{ hex: 'ff0000' }])).to.deep.equal(['#FF0000']);
    });

    it('filters out swatches with no hex', () => {
      expect(normalizeSwatchHexes([{ hex: '#FF0000' }, {}, { hex: null }])).to.deep.equal(['#FF0000']);
    });

    it('returns empty array for empty input', () => {
      expect(normalizeSwatchHexes([])).to.deep.equal([]);
    });

    it('returns empty array for undefined input', () => {
      expect(normalizeSwatchHexes()).to.deep.equal([]);
    });
  });

  describe('harmonyRulesForSwatchCount', () => {
    it('returns all rules for 4+ swatches', () => {
      const rules4 = harmonyRulesForSwatchCount(4);
      const rules10 = harmonyRulesForSwatchCount(10);
      expect(rules4.length).to.equal(rules10.length);
      expect(rules4.map((r) => r.value)).to.include('ANALOGOUS');
      expect(rules4.map((r) => r.value)).to.include('SQUARE');
    });

    it('returns a restricted set for 3 swatches', () => {
      const rules = harmonyRulesForSwatchCount(3);
      expect(rules.map((r) => r.value)).to.include('ANALOGOUS');
      expect(rules.map((r) => r.value)).to.not.include('SQUARE');
    });

    it('returns the most restricted set for 2 swatches', () => {
      const rules = harmonyRulesForSwatchCount(2);
      expect(rules.map((r) => r.value)).to.include('COMPLEMENTARY');
      expect(rules.map((r) => r.value)).to.not.include('ANALOGOUS');
      expect(rules.map((r) => r.value)).to.not.include('SQUARE');
    });

    it('returns fewer rules for 2 than for 3', () => {
      const rules2 = harmonyRulesForSwatchCount(2).length;
      const rules3 = harmonyRulesForSwatchCount(3).length;
      expect(rules2).to.be.lessThan(rules3);
    });
  });

  describe('makeTransformPalette', () => {
    it('returns rawHexes unchanged when harmony rule is not CUSTOM', () => {
      const transform = makeTransformPalette(
        () => 'ANALOGOUS',
        () => ({ getState: () => ({ lockedByIndex: new Set([0]) }) }),
        () => ({ swatches: [{ hex: '#111111' }] }),
      );
      const raw = ['#FF0000', '#00FF00'];
      expect(transform(raw)).to.equal(raw);
    });

    it('returns rawHexes unchanged when no colors are locked', () => {
      const transform = makeTransformPalette(
        () => 'CUSTOM',
        () => ({ getState: () => ({ lockedByIndex: new Set() }) }),
        () => ({ swatches: [{ hex: '#111111' }, { hex: '#222222' }] }),
      );
      const raw = ['#FF0000', '#00FF00'];
      expect(transform(raw)).to.equal(raw);
    });

    it('preserves locked colors from current state', () => {
      const transform = makeTransformPalette(
        () => 'CUSTOM',
        () => ({ getState: () => ({ lockedByIndex: new Set([1]) }) }),
        () => ({ swatches: [{ hex: '#AAAAAA' }, { hex: '#LOCKED' }] }),
      );
      const result = transform(['#NEW0', '#NEW1']);
      expect(result[0]).to.equal('#NEW0');
      expect(result[1]).to.equal('#LOCKED');
    });

    it('preserves multiple locked colors', () => {
      const transform = makeTransformPalette(
        () => 'CUSTOM',
        () => ({ getState: () => ({ lockedByIndex: new Set([0, 2]) }) }),
        () => ({ swatches: [{ hex: '#LOCK0' }, { hex: '#FREE1' }, { hex: '#LOCK2' }] }),
      );
      const result = transform(['#NEW0', '#NEW1', '#NEW2']);
      expect(result).to.deep.equal(['#LOCK0', '#NEW1', '#LOCK2']);
    });
  });

  describe('paletteFromThemeState', () => {
    it('extracts colors and name from state', () => {
      const palette = paletteFromThemeState({ swatches: [{ hex: '#FF0000' }, { hex: '#00FF00' }], name: 'My Theme' });
      expect(palette.colors).to.deep.equal(['#FF0000', '#00FF00']);
      expect(palette.name).to.equal('My Theme');
    });

    it('falls back to default red when swatches are empty', () => {
      expect(paletteFromThemeState({ swatches: [] }).colors).to.deep.equal(['#FF0000']);
    });

    it('falls back to default name when name is absent', () => {
      const palette = paletteFromThemeState({ swatches: [{ hex: '#FF0000' }] });
      expect(palette.name).to.be.a('string').and.have.length.above(0);
    });
  });

  describe('swatchHexListFromState', () => {
    it('returns hex values from state swatches', () => {
      const state = { swatches: [{ hex: '#FF0000' }, { hex: '#00FF00' }] };
      expect(swatchHexListFromState(state)).to.deep.equal(['#FF0000', '#00FF00']);
    });

    it('falls back to red when swatches are empty', () => {
      expect(swatchHexListFromState({ swatches: [] })).to.deep.equal(['#FF0000']);
    });

    it('falls back to red when state is null', () => {
      expect(swatchHexListFromState(null)).to.deep.equal(['#FF0000']);
    });

    it('caps output at 10 colors', () => {
      const state = { swatches: Array.from({ length: 15 }, (_, i) => ({ hex: `#${String(i).padStart(6, '0')}` })) };
      expect(swatchHexListFromState(state)).to.have.length(10);
    });
  });
});
