/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/color-explorer/renderers/createGradientsRenderer.js'),
]);
const { createGradientsRenderer } = imports[1];

describe('createGradientsRenderer', () => {
  let container;
  let renderer;
  let mockModalManager;

  beforeEach(() => {
    container = document.createElement('div');
    container.className = 'color-explorer-container';
    document.body.appendChild(container);

    mockModalManager = {
      open: () => {},
      close: () => {},
    };
  });

  afterEach(() => {
    if (renderer && renderer.destroy) {
      renderer.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Initialization', () => {
    it('should create renderer with default options', () => {
      renderer = createGradientsRenderer({
        container,
        data: [],
        config: {},
        modalManager: mockModalManager,
      });

      expect(renderer).to.exist;
      expect(renderer.render).to.be.a('function');
      expect(renderer.update).to.be.a('function');
      expect(renderer.refresh).to.be.a('function');
      expect(renderer.getAllGradients).to.be.a('function');
      expect(renderer.getMaxGradients).to.be.a('function');
    });

    it('should load hardcoded gradients when no data provided', () => {
      renderer = createGradientsRenderer({
        container,
        data: [],
        config: {},
        modalManager: mockModalManager,
      });

      const gradients = renderer.getAllGradients();
      expect(gradients).to.be.an('array');
      expect(gradients.length).to.be.greaterThan(0);
    });

    it('should use provided data when available', () => {
      const testData = [
        { id: 'test-1', name: 'Test Gradient 1', gradient: 'linear-gradient(90deg, #000 0%, #fff 100%)' },
        { id: 'test-2', name: 'Test Gradient 2', gradient: 'linear-gradient(180deg, #f00 0%, #0f0 100%)' },
      ];

      renderer = createGradientsRenderer({
        container,
        data: testData,
        config: {},
        modalManager: mockModalManager,
      });

      const gradients = renderer.getAllGradients();
      expect(gradients).to.have.length(2);
      expect(gradients[0].id).to.equal('test-1');
      expect(gradients[1].id).to.equal('test-2');
    });
  });

  describe('Rendering', () => {
    beforeEach(async () => {
      renderer = createGradientsRenderer({
        container,
        data: [],
        config: {},
        modalManager: mockModalManager,
      });
      await renderer.render();
    });

    it('should render gradients section', () => {
      const section = container.querySelector('.gradients-main-section');
      expect(section).to.exist;
    });

    it('should render header with title', () => {
      const header = container.querySelector('.gradients-header');
      const title = container.querySelector('.gradients-title');

      expect(header).to.exist;
      expect(title).to.exist;
      expect(title.textContent).to.contain('color gradients');
    });

    it('should render gradients grid', () => {
      const grid = container.querySelector('.gradients-grid');
      expect(grid).to.exist;
      expect(grid.getAttribute('role')).to.equal('grid');
      expect(grid.getAttribute('aria-roledescription')).to.equal('gradient grid');
    });

    it('should render initial gradient cards', () => {
      const cards = container.querySelectorAll('.gradient-card');
      expect(cards.length).to.be.greaterThan(0);
      expect(cards.length).to.be.lessThanOrEqual(24); // Initial display count
    });

    it('should render load more button when more gradients available', () => {
      const loadMoreBtn = container.querySelector('.gradient-load-more-btn');
      const gradients = renderer.getAllGradients();

      if (gradients.length > 24) {
        expect(loadMoreBtn).to.exist;
      }
    });

    it('should render live region for screen readers', () => {
      const liveRegion = container.querySelector('.visually-hidden[aria-live="polite"]');
      expect(liveRegion).to.exist;
      expect(liveRegion.getAttribute('aria-atomic')).to.equal('true');
    });
  });

  describe('Gradient Cards', () => {
    beforeEach(async () => {
      renderer = createGradientsRenderer({
        container,
        data: [],
        config: {},
        modalManager: mockModalManager,
      });
      await renderer.render();
    });

    it('should create cards with correct structure', () => {
      const card = container.querySelector('.gradient-card');
      expect(card).to.exist;
      expect(card.getAttribute('role')).to.equal('gridcell');
      expect(card.getAttribute('data-gradient-id')).to.exist;

      const visual = card.querySelector('.gradient-visual');
      const name = card.querySelector('.gradient-name');
      const actionBtn = card.querySelector('.gradient-action-btn');

      expect(visual).to.exist;
      expect(name).to.exist;
      expect(actionBtn).to.exist;
    });

    it('should set correct ARIA attributes on cards', () => {
      const cards = container.querySelectorAll('.gradient-card');
      const firstCard = cards[0];

      expect(firstCard.getAttribute('aria-posinset')).to.exist;
      expect(firstCard.getAttribute('aria-setsize')).to.exist;
      expect(firstCard.getAttribute('aria-rowindex')).to.exist;
      expect(firstCard.getAttribute('aria-colindex')).to.exist;
    });

    it('should have action button with correct attributes', () => {
      const actionBtn = container.querySelector('.gradient-action-btn');
      expect(actionBtn).to.exist;
      expect(actionBtn.getAttribute('type')).to.equal('button');
      expect(actionBtn.getAttribute('aria-label')).to.exist;
      expect(actionBtn.getAttribute('tabindex')).to.equal('-1');
    });
  });

  describe('Pagination', () => {
    beforeEach(async () => {
      renderer = createGradientsRenderer({
        container,
        data: [],
        config: {},
        modalManager: mockModalManager,
      });
      await renderer.render();
    });

    it('should display initial count of gradients', () => {
      const cards = container.querySelectorAll('.gradient-card');
      expect(cards.length).to.be.lessThanOrEqual(24);
    });

    it('should load more gradients when button clicked', async () => {
      const loadMoreBtn = container.querySelector('.gradient-load-more-btn');
      if (loadMoreBtn) {
        const initialCount = container.querySelectorAll('.gradient-card').length;
        loadMoreBtn.click();
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 100);
        });

        const newCount = container.querySelectorAll('.gradient-card').length;
        expect(newCount).to.be.greaterThan(initialCount);
      }
    });

    it('should hide load more button when all gradients displayed', async () => {
      const gradients = renderer.getAllGradients();
      if (gradients.length <= 24) {
        const loadMoreContainer = container.querySelector('.load-more-container');
        const displayStyle = window.getComputedStyle(loadMoreContainer).display;
        expect(displayStyle).to.equal('none');
      }
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(async () => {
      renderer = createGradientsRenderer({
        container,
        data: [],
        config: {},
        modalManager: mockModalManager,
      });
      await renderer.render();
    });

    it('should set tabindex correctly for grid navigation', () => {
      const cards = container.querySelectorAll('.gradient-card');
      let focusableCount = 0;

      cards.forEach((card) => {
        const tabindex = card.getAttribute('tabindex');
        if (tabindex === '0') {
          focusableCount += 1;
        }
      });

      // Only one card should be focusable at a time
      expect(focusableCount).to.equal(1);
    });

    it('should handle arrow key navigation', () => {
      const cards = container.querySelectorAll('.gradient-card');
      if (cards.length > 1) {
        const firstCard = cards[0];
        const secondCard = cards[1];

        firstCard.focus();
        expect(document.activeElement).to.equal(firstCard);

        // Simulate arrow key press
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
        firstCard.dispatchEvent(event);

        // After navigation, second card should be focusable
        expect(secondCard.getAttribute('tabindex')).to.equal('0');
      }
    });
  });

  describe('Update and Refresh', () => {
    beforeEach(async () => {
      renderer = createGradientsRenderer({
        container,
        data: [],
        config: {},
        modalManager: mockModalManager,
      });
      await renderer.render();
    });

    it('should update with new data', async () => {
      const newData = [
        { id: 'new-1', name: 'New Gradient 1', gradient: 'linear-gradient(90deg, #000 0%, #fff 100%)' },
        { id: 'new-2', name: 'New Gradient 2', gradient: 'linear-gradient(180deg, #f00 0%, #0f0 100%)' },
      ];

      await renderer.update(newData);

      const gradients = renderer.getAllGradients();
      expect(gradients).to.have.length(2);
      expect(gradients[0].id).to.equal('new-1');
    });

    it('should refresh render', async () => {
      const initialCardCount = container.querySelectorAll('.gradient-card').length;
      await renderer.refresh();
      const refreshedCardCount = container.querySelectorAll('.gradient-card').length;

      expect(refreshedCardCount).to.equal(initialCardCount);
    });
  });

  describe('Cleanup', () => {
    it('should have destroy method', async () => {
      renderer = createGradientsRenderer({
        container,
        data: [],
        config: {},
        modalManager: mockModalManager,
      });
      await renderer.render();

      expect(renderer.destroy).to.be.a('function');

      // Destroy should not throw
      expect(() => renderer.destroy()).to.not.throw();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty container gracefully', async () => {
      const emptyContainer = document.createElement('div');
      renderer = createGradientsRenderer({
        container: emptyContainer,
        data: [],
        config: {},
        modalManager: mockModalManager,
      });

      await renderer.render();
      expect(renderer).to.exist;
    });

    it('should handle invalid gradient data', () => {
      const invalidData = [
        { id: 'invalid-1' }, // Missing name and gradient
        { name: 'Invalid 2' }, // Missing id
      ];

      renderer = createGradientsRenderer({
        container,
        data: invalidData,
        config: {},
        modalManager: mockModalManager,
      });

      // Should not throw, but may filter invalid data
      expect(renderer).to.exist;
    });
  });
});
