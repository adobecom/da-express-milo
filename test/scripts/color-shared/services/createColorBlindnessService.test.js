/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';

import {
  TYPE_ORDER,
  TYPE_LABELS,
  DEFECT_DEFINITIONS,
  DEFECT_TOOLTIP_DEFINITIONS,
  CONFLICT_THRESHOLD_DELTA_E,
  simulate,
  simulateHex,
  getConflictPairs,
  getConflictingIndices,
} from '../../../../express/code/scripts/color-shared/services/createColorBlindnessService.js';

describe('createColorBlindnessService', () => {
  describe('constants', () => {
    it('TYPE_ORDER contains three deficiency types', () => {
      expect(TYPE_ORDER).to.deep.equal(['deutan', 'protan', 'tritan']);
    });

    it('TYPE_LABELS maps types to human-readable names', () => {
      expect(TYPE_LABELS.deutan).to.equal('Deuteranopia');
      expect(TYPE_LABELS.protan).to.equal('Protanopia');
      expect(TYPE_LABELS.tritan).to.equal('Tritanopia');
    });

    it('DEFECT_DEFINITIONS maps types to descriptions', () => {
      expect(DEFECT_DEFINITIONS.deutan).to.equal('Red-green color blindness');
      expect(DEFECT_DEFINITIONS.protan).to.equal('Red-green color blindness');
      expect(DEFECT_DEFINITIONS.tritan).to.equal('Blue-yellow color blindness');
    });

    it('DEFECT_TOOLTIP_DEFINITIONS maps types to multiline descriptions', () => {
      expect(DEFECT_TOOLTIP_DEFINITIONS.deutan).to.equal('Red-green\ncolor blindness');
      expect(DEFECT_TOOLTIP_DEFINITIONS.protan).to.equal('Red-green\ncolor blindness');
      expect(DEFECT_TOOLTIP_DEFINITIONS.tritan).to.equal('Blue-yellow\ncolor blindness');
    });

    it('CONFLICT_THRESHOLD_DELTA_E is 5', () => {
      expect(CONFLICT_THRESHOLD_DELTA_E).to.equal(5);
    });
  });

  describe('simulate', () => {
    it('clamps output to 0-255 range', () => {
      const [r2, g2, b2] = simulate(0, 0, 0, 'deutan');
      expect(r2).to.be.at.least(0);
      expect(g2).to.be.at.least(0);
      expect(b2).to.be.at.least(0);

      const [r3, g3, b3] = simulate(255, 255, 255, 'tritan');
      expect(r3).to.be.at.most(255);
      expect(g3).to.be.at.most(255);
      expect(b3).to.be.at.most(255);
    });

    it('pure white stays white for all types', () => {
      TYPE_ORDER.forEach((type) => {
        const [r, g, b] = simulate(255, 255, 255, type);
        expect(r).to.be.closeTo(255, 0.01);
        expect(g).to.be.closeTo(255, 0.01);
        expect(b).to.be.closeTo(255, 0.01);
      });
    });

    it('pure black stays black for all types', () => {
      TYPE_ORDER.forEach((type) => {
        const [r, g, b] = simulate(0, 0, 0, type);
        expect(r).to.equal(0);
        expect(g).to.equal(0);
        expect(b).to.equal(0);
      });
    });

    it('defaults to intensity 10', () => {
      TYPE_ORDER.forEach((type) => {
        expect(simulate(200, 100, 50, type)).to.deep.equal(simulate(200, 100, 50, type, 10));
      });
    });

    it('different intensities produce different results for non-neutral colors', () => {
      TYPE_ORDER.forEach((type) => {
        expect(simulate(200, 100, 50, type, 1)).to.not.deep.equal(simulate(200, 100, 50, type, 10));
      });
    });

    it('lower intensity deviates less from the original color', () => {
      const [r, g, b] = [200, 100, 50];
      TYPE_ORDER.forEach((type) => {
        const [r1, g1, b1] = simulate(r, g, b, type, 1);
        const [r10, g10, b10] = simulate(r, g, b, type, 10);
        const dist1 = Math.hypot(r1 - r, g1 - g, b1 - b);
        const dist10 = Math.hypot(r10 - r, g10 - g, b10 - b);
        expect(dist1).to.be.lessThan(dist10);
      });
    });

    it('each type produces distinct output for a non-neutral color', () => {
      const results = TYPE_ORDER.map((type) => simulate(200, 100, 50, type));
      expect(results[0]).to.not.deep.equal(results[1]);
      expect(results[0]).to.not.deep.equal(results[2]);
      expect(results[1]).to.not.deep.equal(results[2]);
    });
  });

  describe('simulateHex', () => {
    it('returns a valid 7-char hex string', () => {
      const result = simulateHex('#FF0000', 'deutan');
      expect(result).to.match(/^#[0-9a-f]{6}$/);
    });

    it('black stays black', () => {
      TYPE_ORDER.forEach((type) => {
        expect(simulateHex('#000000', type)).to.equal('#000000');
      });
    });

    it('white stays white', () => {
      TYPE_ORDER.forEach((type) => {
        expect(simulateHex('#FFFFFF', type)).to.equal('#ffffff');
      });
    });

    it('tritan simulation keeps R unchanged for pure red', () => {
      const result = simulateHex('#FF0000', 'tritan');
      expect(result.slice(1, 3)).to.equal('ff');
    });

    it('defaults to intensity 10', () => {
      TYPE_ORDER.forEach((type) => {
        expect(simulateHex('#FF8000', type)).to.equal(simulateHex('#FF8000', type, 10));
      });
    });

    it('intensity parameter affects the simulated output', () => {
      TYPE_ORDER.forEach((type) => {
        expect(simulateHex('#FF8000', type, 1)).to.not.equal(simulateHex('#FF8000', type, 10));
      });
    });
  });

  describe('getConflictPairs', () => {
    it('returns empty array for well-separated colors', () => {
      const colors = ['#000000', '#FFFFFF'];
      TYPE_ORDER.forEach((type) => {
        const pairs = getConflictPairs(colors, type);
        expect(pairs).to.be.an('array').that.is.empty;
      });
    });

    it('returns pairs for identical colors', () => {
      const colors = ['#FF0000', '#FF0000'];
      const pairs = getConflictPairs(colors, 'deutan');
      expect(pairs).to.deep.include([0, 1]);
    });

    it('returns empty for a single-color array', () => {
      const pairs = getConflictPairs(['#FF0000'], 'deutan');
      expect(pairs).to.be.an('array').that.is.empty;
    });

    it('returns empty for an empty array', () => {
      const pairs = getConflictPairs([], 'deutan');
      expect(pairs).to.be.an('array').that.is.empty;
    });

    it('respects custom threshold', () => {
      const colors = ['#000000', '#FFFFFF'];
      const pairsStrict = getConflictPairs(colors, 'deutan', 0);
      const pairsLoose = getConflictPairs(colors, 'deutan', 200);
      expect(pairsStrict).to.be.an('array').that.is.empty;
      expect(pairsLoose.length).to.be.greaterThan(0);
    });

    it('finds all pairwise conflicts for three identical colors', () => {
      const colors = ['#AABB00', '#AABB00', '#AABB00'];
      const pairs = getConflictPairs(colors, 'protan');
      expect(pairs).to.deep.include.members([[0, 1], [0, 2], [1, 2]]);
    });
  });

  describe('getConflictingIndices', () => {
    it('returns a Set of all unique indices from pairs', () => {
      const pairs = [[0, 2], [1, 3]];
      const indices = getConflictingIndices(pairs);
      expect(indices).to.be.an.instanceOf(Set);
      expect([...indices].sort()).to.deep.equal([0, 1, 2, 3]);
    });

    it('returns empty Set for no pairs', () => {
      const indices = getConflictingIndices([]);
      expect(indices.size).to.equal(0);
    });

    it('deduplicates indices appearing in multiple pairs', () => {
      const pairs = [[0, 1], [0, 2], [1, 2]];
      const indices = getConflictingIndices(pairs);
      expect(indices.size).to.equal(3);
      expect(indices.has(0)).to.be.true;
      expect(indices.has(1)).to.be.true;
      expect(indices.has(2)).to.be.true;
    });
  });
});
