/* eslint-disable max-len */
import { expect } from '@esm-bundle/chai';
import { createPaletteSummaryRenderer } from '../../../../express/code/scripts/color-shared/renderers/createPaletteSummaryRenderer.js';

describe('createPaletteSummaryRenderer', () => {
  const mockPalette = {
    name: 'Test Palette',
    colors: ['#FFE0FE', '#EDC3FF', '#BCB2FF', '#ACAAED', '#B3BBED'],
  };

  describe('render', () => {
    it('renders nothing when no palette in data', () => {
      const container = document.createElement('div');
      const renderer = createPaletteSummaryRenderer({ data: [], config: {} });
      renderer.render(container);
      expect(container.querySelector('.ax-color-strip-summary-card')).to.be.null;
      expect(container.classList.contains('color-explorer-palette-summary')).to.be.true;
    });

    it('renders 3 cards when fullWidthSummary is false', () => {
      const container = document.createElement('div');
      const renderer = createPaletteSummaryRenderer({
        data: [mockPalette],
        config: { fullWidthSummary: false },
      });
      renderer.render(container);
      const cards = container.querySelectorAll('.ax-color-strip-summary-card');
      expect(cards.length).to.equal(3);
      expect(cards[0].querySelector('.ax-color-strip-summary-card__count')?.textContent).to.include('10');
      expect(cards[1].querySelector('.ax-color-strip-summary-card__count')?.textContent).to.include('5');
    });

    it('renders 5 cards when fullWidthSummary is true', () => {
      const container = document.createElement('div');
      const renderer = createPaletteSummaryRenderer({
        data: [mockPalette],
        config: { fullWidthSummary: true },
      });
      renderer.render(container);
      const cards = container.querySelectorAll('.ax-color-strip-summary-card');
      expect(cards.length).to.equal(5);
      const fullWidthCards = container.querySelectorAll('.ax-color-strip-summary-card--full-width');
      expect(fullWidthCards.length).to.equal(2);
    });

    it('full-width cards have strip--full and short or mobile modifier', () => {
      const container = document.createElement('div');
      const renderer = createPaletteSummaryRenderer({
        data: [mockPalette],
        config: { fullWidthSummary: true },
      });
      renderer.render(container);
      const strips = container.querySelectorAll('.ax-color-strip-summary-card__strip--full');
      expect(strips.length).to.equal(2);
      const hasShort = container.querySelector('.ax-color-strip-summary-card__strip--short');
      const hasMobile = container.querySelector('.ax-color-strip-summary-card__strip--mobile');
      expect(hasShort).to.exist;
      expect(hasMobile).to.exist;
    });
  });

  describe('update', () => {
    it('updates content with new data', () => {
      const container = document.createElement('div');
      const renderer = createPaletteSummaryRenderer({
        data: [mockPalette],
        config: {},
      });
      renderer.render(container);
      const newPalette = { name: 'Updated', colors: ['#000000', '#ffffff'] };
      renderer.update([newPalette]);
      const title = container.querySelector('.ax-color-strip-summary-card__title');
      expect(title?.textContent).to.equal('Updated');
      const cards = container.querySelectorAll('.ax-color-strip-summary-card');
      expect(cards[1].querySelector('.ax-color-strip-summary-card__count')?.textContent).to.include('2');
    });
  });
});
