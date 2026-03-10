/* eslint-disable max-len */
import { expect } from '@esm-bundle/chai';
import { createStripsRenderer } from '../../../../express/code/scripts/color-shared/renderers/createStripsRenderer.js';

const mockPalettes = [
  { id: 'palette-1', name: 'Palette One', colors: ['#ff0000', '#00ff00', '#0000ff'] },
  { id: 'palette-2', name: 'Palette Two', colors: ['#ffff00', '#ff00ff'] },
  { id: 'palette-3', name: 'Palette Three', colors: ['#00ffff'] },
];

describe('createStripsRenderer', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  describe('simpleSizeVariants (Strips L/M/S)', () => {
    it('renders 3 palette-cards with sizes l, m, s when simpleSizeVariants is true', () => {
      const renderer = createStripsRenderer({
        data: mockPalettes,
        config: { simpleSizeVariants: true },
      });
      renderer.render(container);

      const cards = container.querySelectorAll('.palette-card');
      expect(cards.length).to.equal(3);
      expect(container.classList.contains('color-explorer-strips')).to.be.true;
      expect(container.classList.contains('palettes-variants')).to.be.true;

      expect(cards[0].classList.contains('palette-card--size-l')).to.be.true;
      expect(cards[1].classList.contains('palette-card--size-m')).to.be.true;
      expect(cards[2].classList.contains('palette-card--size-s')).to.be.true;
    });

    it('each card is a div (never a link) with strip-wrap and footer', () => {
      const renderer = createStripsRenderer({
        data: mockPalettes,
        config: { simpleSizeVariants: true },
      });
      renderer.render(container);

      const cards = container.querySelectorAll('.palette-card');
      cards.forEach((card) => {
        expect(card.tagName).to.equal('DIV');
        expect(card.querySelector('.palette-card__strip-wrap')).to.exist;
        expect(card.querySelector('.palette-card__footer')).to.exist;
        expect(card.querySelector('.palette-name')).to.exist;
        expect(card.querySelector('.palette-card__actions')).to.exist;
      });
    });

    it('when cardFocusable is true (default), cards have tabindex="0", role="group", and aria-label', () => {
      const renderer = createStripsRenderer({
        data: mockPalettes,
        config: { simpleSizeVariants: true },
      });
      renderer.render(container);

      const cards = container.querySelectorAll('.palette-card');
      expect(cards[0].getAttribute('tabindex')).to.equal('0');
      expect(cards[0].getAttribute('role')).to.equal('group');
      expect(cards[0].getAttribute('aria-label')).to.equal('Palette: Palette One');
    });

    it('when cardFocusable is false, cards have tabindex="-1" and no role/aria-label', () => {
      const renderer = createStripsRenderer({
        data: mockPalettes,
        config: { simpleSizeVariants: true, cardFocusable: false },
      });
      renderer.render(container);

      const cards = container.querySelectorAll('.palette-card');
      cards.forEach((card) => {
        expect(card.getAttribute('tabindex')).to.equal('-1');
        expect(card.getAttribute('role')).to.be.null;
        expect(card.getAttribute('aria-label')).to.be.null;
      });
    });

    it('strip-wrap contains color-palette; footer has Edit and View actions', () => {
      const renderer = createStripsRenderer({
        data: mockPalettes,
        config: { simpleSizeVariants: true },
      });
      renderer.render(container);

      const firstCard = container.querySelector('.palette-card');
      const stripWrap = firstCard.querySelector('.palette-card__strip-wrap');
      expect(stripWrap.querySelector('color-palette')).to.exist;

      const actions = firstCard.querySelectorAll('.palette-card__action');
      expect(actions.length).to.be.at.least(2);
      const labels = [...actions].map((a) => a.getAttribute('aria-label'));
      expect(labels).to.include('Edit palette');
      expect(labels).to.include('View palette');
    });

    it('when showDemoVariants is true, Edit action has href="#" and View emits palette-click', (done) => {
      const renderer = createStripsRenderer({
        data: mockPalettes,
        config: { simpleSizeVariants: true, showDemoVariants: true },
      });
      renderer.on('palette-click', (palette) => {
        expect(palette.id).to.equal('palette-1');
        done();
      });
      renderer.render(container);

      const firstCard = container.querySelector('.palette-card');
      const editLink = firstCard.querySelector('.palette-card__action[href="#"]');
      expect(editLink).to.exist;

      const viewBtn = firstCard.querySelector('.palette-card__action[aria-label="View palette"]');
      expect(viewBtn).to.exist;
      viewBtn.click();
    });
  });
});
