/* eslint-disable max-len */
import { expect } from '@esm-bundle/chai';
import {
  createPaletteVariant,
  createRailControllerFromPalette,
  PALETTE_VARIANT,
} from '../../../../express/code/scripts/color-shared/palettes/createPaletteVariantFactory.js';

const mockPalette = {
  id: 'test-1',
  name: 'Test Palette',
  colors: ['#ff0000', '#00ff00', '#0000ff'],
};

describe('createPaletteVariantFactory', () => {
  describe('createPaletteVariant', () => {
    describe('SUMMARY and COMPACT (color-card)', () => {
      [PALETTE_VARIANT.SUMMARY, PALETTE_VARIANT.COMPACT].forEach((variant) => {
        it(`returns a .color-card div (never a link) for variant ${variant}`, () => {
          const { element } = createPaletteVariant(mockPalette, variant, { emit: () => {} });
          expect(element.tagName).to.equal('DIV');
          expect(element.classList.contains('color-card')).to.be.true;
        });

        it(`card has .color-card-visual, .color-card-info, .color-card-actions for ${variant}`, () => {
          const { element } = createPaletteVariant(mockPalette, variant, { emit: () => {} });
          expect(element.querySelector('.color-card-visual')).to.exist;
          expect(element.querySelector('.color-card-info')).to.exist;
          expect(element.querySelector('.color-card-name')).to.exist;
          expect(element.querySelector('.color-card-actions')).to.exist;
        });

        it(`when cardFocusable is true (default), card has tabindex="0", role="group", aria-label for ${variant}`, () => {
          const { element } = createPaletteVariant(mockPalette, variant, { emit: () => {} });
          expect(element.getAttribute('tabindex')).to.equal('0');
          expect(element.getAttribute('role')).to.equal('group');
          expect(element.getAttribute('aria-label')).to.equal('Palette: Test Palette');
        });

        it(`when cardFocusable is false, card has tabindex="-1" and no role/aria-label for ${variant}`, () => {
          const { element } = createPaletteVariant(mockPalette, variant, {
            emit: () => {},
            cardFocusable: false,
          });
          expect(element.getAttribute('tabindex')).to.equal('-1');
          expect(element.getAttribute('role')).to.be.null;
          expect(element.getAttribute('aria-label')).to.be.null;
        });

        it(`only action buttons (Edit, Share) trigger events for ${variant}`, (done) => {
          const emit = (event, payload) => {
            if (event === 'palette-click') {
              expect(payload).to.equal(mockPalette);
              done();
            }
          };
          const { element } = createPaletteVariant(mockPalette, variant, { emit });
          const editBtn = element.querySelector('.color-card-action-btn[aria-label^="Edit"]');
          expect(editBtn).to.exist;
          expect(editBtn.tagName).to.equal('BUTTON');
          editBtn.click();
        });
      });
    });

    it('SUMMARY card contains strip with data-palette-strip-variant="explore"', () => {
      const { element } = createPaletteVariant(mockPalette, PALETTE_VARIANT.SUMMARY, { emit: () => {} });
      const strip = element.querySelector('.color-shared-palette-strip');
      expect(strip).to.exist;
      expect(strip.getAttribute('data-palette-strip-variant')).to.equal('explore');
    });

    it('COMPACT card contains strip with data-palette-strip-variant="compact"', () => {
      const { element } = createPaletteVariant(mockPalette, PALETTE_VARIANT.COMPACT, { emit: () => {} });
      const strip = element.querySelector('.color-shared-palette-strip');
      expect(strip).to.exist;
      expect(strip.getAttribute('data-palette-strip-variant')).to.equal('compact');
    });

    it('SIMPLIFIED returns element with .ax-color-strip--simplified', () => {
      const { element } = createPaletteVariant(mockPalette, PALETTE_VARIANT.SIMPLIFIED, { emit: () => {} });
      expect(element.classList.contains('ax-color-strip')).to.be.true;
      expect(element.classList.contains('ax-color-strip--simplified')).to.be.true;
    });

    it('HORIZONTAL_CONTAINER returns .ax-color-strip__cell with strip', () => {
      const { element } = createPaletteVariant(mockPalette, PALETTE_VARIANT.HORIZONTAL_CONTAINER, {
        emit: () => {},
      });
      expect(element.classList.contains('ax-color-strip__cell')).to.be.true;
      expect(element.classList.contains('ax-color-strip__cell--with-strip')).to.be.true;
    });
  });

  describe('createRailControllerFromPalette', () => {
    it('subscribes and receives initial swatches', () => {
      const controller = createRailControllerFromPalette(mockPalette);
      let received = null;
      controller.subscribe((state) => { received = state; });
      expect(received).to.exist;
      expect(received.swatches.length).to.equal(3);
      expect(received.swatches[0].hex).to.equal('#ff0000');
    });
  });
});
