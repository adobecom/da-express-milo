import { expect } from '@esm-bundle/chai';
import { generateTints } from '../../../../express/code/blocks/contrast-checker/utils/contrastUtils.js';

const HEX_REGEX = /^#[0-9a-f]{6}$/i;

describe('generateTints', () => {
  describe('basic behavior', () => {
    it('returns an array of hex strings', () => {
      const tints = generateTints('#FF0000');
      expect(tints).to.be.an('array');
      tints.forEach((t) => expect(t).to.be.a('string'));
    });

    it('default count is 20', () => {
      const tints = generateTints('#FF0000');
      expect(tints).to.have.lengthOf(20);
    });

    it('custom count works', () => {
      const tints = generateTints('#FF0000', 10);
      expect(tints).to.have.lengthOf(10);
    });

    it('all returned values are valid hex strings', () => {
      const tints = generateTints('#3366CC');
      tints.forEach((t) => expect(t).to.match(HEX_REGEX));
    });
  });

  describe('color correctness', () => {
    it('pure red tints keep reddish hue', () => {
      const tints = generateTints('#FF0000', 5);
      tints.forEach((t) => {
        const r = Number.parseInt(t.slice(1, 3), 16);
        const g = Number.parseInt(t.slice(3, 5), 16);
        const b = Number.parseInt(t.slice(5, 7), 16);
        expect(r).to.be.greaterThan(0);
        expect(g).to.equal(0);
        expect(b).to.equal(0);
      });
    });

    it('last tint is the brightest', () => {
      const tints = generateTints('#FF0000', 10);
      const last = tints.at(-1);
      const r = Number.parseInt(last.slice(1, 3), 16);
      expect(r).to.equal(255);
    });

    it('first tint is the darkest', () => {
      const tints = generateTints('#FF0000', 10);
      const first = tints[0];
      const last = tints.at(-1);
      const firstR = Number.parseInt(first.slice(1, 3), 16);
      const lastR = Number.parseInt(last.slice(1, 3), 16);
      expect(firstR).to.be.lessThan(lastR);
    });

    it('white (#FFFFFF) produces grayscale tints', () => {
      const tints = generateTints('#FFFFFF', 5);
      tints.forEach((t) => {
        const r = Number.parseInt(t.slice(1, 3), 16);
        const g = Number.parseInt(t.slice(3, 5), 16);
        const b = Number.parseInt(t.slice(5, 7), 16);
        expect(r).to.equal(g);
        expect(g).to.equal(b);
      });
    });

    it('black (#000000) produces grayscale tints', () => {
      const tints = generateTints('#000000', 5);
      tints.forEach((t) => {
        const r = Number.parseInt(t.slice(1, 3), 16);
        const g = Number.parseInt(t.slice(3, 5), 16);
        const b = Number.parseInt(t.slice(5, 7), 16);
        expect(r).to.equal(g);
        expect(g).to.equal(b);
      });
    });
  });

  describe('edge cases', () => {
    it('works with lowercase hex', () => {
      const tints = generateTints('#ff0000', 5);
      expect(tints).to.have.lengthOf(5);
      tints.forEach((t) => expect(t).to.match(HEX_REGEX));
    });

    it('works with hex without # prefix', () => {
      const tints = generateTints('ff0000', 5);
      expect(tints).to.have.lengthOf(5);
      tints.forEach((t) => expect(t).to.match(HEX_REGEX));
    });

    it('count of 1 returns 1 tint', () => {
      const tints = generateTints('#FF0000', 1);
      expect(tints).to.have.lengthOf(1);
    });

    it('returned array has exactly count elements', () => {
      [1, 5, 10, 20, 50].forEach((count) => {
        const tints = generateTints('#336699', count);
        expect(tints).to.have.lengthOf(count);
      });
    });
  });
});
