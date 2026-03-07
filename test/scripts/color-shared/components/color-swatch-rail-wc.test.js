/* eslint-disable max-len */
import { expect } from '@esm-bundle/chai';
import '../../../../express/code/libs/color-components/components/color-swatch-rail/index.js';

const makeSwatches = (count) => Array.from({ length: count }, (_, i) => ({ hex: `#${String(i).padStart(6, '0')}` }));

describe('color-swatch-rail WC (vertical layout)', () => {
  let el;

  afterEach(() => {
    el?.remove();
  });

  describe('vertical single row (≤6 slots)', () => {
    it('2 swatches + empty: single row with --rail-columns 3, no two-row class', async () => {
      el = document.createElement('color-swatch-rail');
      el.orientation = 'vertical';
      el.swatches = makeSwatches(2);
      el.swatchFeatures = { emptyStrip: true };
      document.body.appendChild(el);
      await el.updateComplete;

      const rail = el.shadowRoot.querySelector('.swatch-rail');
      expect(rail).to.exist;
      expect(rail.classList.contains('vertical--two-rows')).to.be.false;
      expect(rail.getAttribute('style')).to.include('--rail-columns: 3');

      const columns = el.shadowRoot.querySelectorAll('.swatch-column');
      expect(columns.length).to.equal(3);
      expect(columns[2].classList.contains('swatch-column--empty')).to.be.true;
    });

    it('6 swatches + empty: single row with --rail-columns 7 is two-row (7 > 6)', async () => {
      el = document.createElement('color-swatch-rail');
      el.orientation = 'vertical';
      el.swatches = makeSwatches(6);
      el.swatchFeatures = { emptyStrip: true };
      document.body.appendChild(el);
      await el.updateComplete;

      const rail = el.shadowRoot.querySelector('.swatch-rail');
      expect(rail).to.exist;
      expect(rail.classList.contains('vertical--two-rows')).to.be.true;
    });

    it('5 swatches + empty: single row --rail-columns 6', async () => {
      el = document.createElement('color-swatch-rail');
      el.orientation = 'vertical';
      el.swatches = makeSwatches(5);
      el.swatchFeatures = { emptyStrip: true };
      document.body.appendChild(el);
      await el.updateComplete;

      const rail = el.shadowRoot.querySelector('.swatch-rail');
      expect(rail).to.exist;
      expect(rail.classList.contains('vertical--two-rows')).to.be.false;
      expect(rail.getAttribute('style')).to.include('--rail-columns: 6');
    });
  });

  describe('vertical two rows (>6 slots)', () => {
    it('7 swatches + empty: two-row layout, 5 then 3 columns, last is empty', async () => {
      el = document.createElement('color-swatch-rail');
      el.orientation = 'vertical';
      el.swatches = makeSwatches(7);
      el.swatchFeatures = { emptyStrip: true };
      document.body.appendChild(el);
      await el.updateComplete;

      const rail = el.shadowRoot.querySelector('.swatch-rail.vertical--two-rows');
      expect(rail).to.exist;

      const columns = el.shadowRoot.querySelectorAll('.swatch-rail .swatch-column');
      expect(columns.length).to.equal(8);
      expect(columns[columns.length - 1].classList.contains('swatch-column--empty')).to.be.true;
    });

    it('10 swatches (no empty): two-row layout, 5 + 5 columns', async () => {
      el = document.createElement('color-swatch-rail');
      el.orientation = 'vertical';
      el.swatches = makeSwatches(10);
      el.swatchFeatures = { emptyStrip: false };
      document.body.appendChild(el);
      await el.updateComplete;

      const rail = el.shadowRoot.querySelector('.swatch-rail.vertical--two-rows');
      expect(rail).to.exist;

      const columns = el.shadowRoot.querySelectorAll('.swatch-rail .swatch-column');
      expect(columns.length).to.equal(10);
    });
  });
});
