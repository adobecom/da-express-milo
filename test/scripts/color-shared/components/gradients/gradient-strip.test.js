/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import createGradientStripElementsDefault, { createGradientStripElements } from '../../../../../express/code/scripts/color-shared/components/gradients/gradient-strip.js';

const SAMPLE_GRADIENTS = [
  { id: 'g1', name: 'Sunset', colorStops: [{ color: '#ff0000', position: 0 }, { color: '#0000ff', position: 1 }] },
  { id: 'g2', name: 'Ocean', colorStops: [{ color: '#006994', position: 0 }, { color: '#00a8cc', position: 1 }] },
];

describe('createGradientStripElements', () => {
  describe('API', () => {
    it('export and default export both provide the same function', () => {
      expect(createGradientStripElements).to.equal(createGradientStripElementsDefault);
    });
  });

  describe('empty input', () => {
    it('returns empty array when gradients is not an array', () => {
      expect(createGradientStripElements(null)).to.deep.equal([]);
      expect(createGradientStripElements(undefined)).to.deep.equal([]);
    });

    it('returns empty array when gradients is empty', () => {
      expect(createGradientStripElements([])).to.deep.equal([]);
    });
  });

  describe('DOM structure', () => {
    it('returns one article per gradient', () => {
      const elements = createGradientStripElements(SAMPLE_GRADIENTS);
      expect(elements).to.have.lengthOf(2);
      elements.forEach((el) => {
        expect(el.tagName).to.equal('ARTICLE');
        expect(el.classList.contains('gradient-strip')).to.be.true;
      });
    });

    it('each strip has visual, info, name, and action button', () => {
      const elements = createGradientStripElements(SAMPLE_GRADIENTS);
      const first = elements[0];
      expect(first.querySelector('.gradient-strip-visual')).to.exist;
      expect(first.querySelector('.gradient-strip-info')).to.exist;
      expect(first.querySelector('.gradient-strip-name')).to.exist;
      expect(first.querySelector('.gradient-strip-action-btn')).to.exist;
    });

    it('sets data-gradient-id and name from gradient', () => {
      const elements = createGradientStripElements(SAMPLE_GRADIENTS);
      expect(elements[0].getAttribute('data-gradient-id')).to.equal('g1');
      expect(elements[0].querySelector('.gradient-strip-name').textContent).to.equal('Sunset');
      expect(elements[1].querySelector('.gradient-strip-name').textContent).to.equal('Ocean');
    });

    it('visual has aria-label and background image', () => {
      const elements = createGradientStripElements(SAMPLE_GRADIENTS);
      const visual = elements[0].querySelector('.gradient-strip-visual');
      expect(visual.getAttribute('aria-label')).to.include('Sunset');
      expect(visual.style.backgroundImage).to.include('linear-gradient');
    });

    it('action button has aria-label and title', () => {
      const elements = createGradientStripElements(SAMPLE_GRADIENTS);
      const btn = elements[0].querySelector('.gradient-strip-action-btn');
      expect(btn.getAttribute('aria-label')).to.include('Open');
      expect(btn.getAttribute('title')).to.equal('Open in modal');
      expect(btn.getAttribute('tabindex')).to.equal('-1');
    });
  });

  describe('onExpandClick', () => {
    it('calls onExpandClick with gradient when button is clicked', () => {
      let received;
      const elements = createGradientStripElements(SAMPLE_GRADIENTS, {
        onExpandClick: (g) => { received = g; },
      });
      const btn = elements[0].querySelector('.gradient-strip-action-btn');
      btn.click();
      expect(received).to.exist;
      expect(received.id).to.equal('g1');
      expect(received.name).to.equal('Sunset');
    });
  });

  describe('gradient without name', () => {
    it('uses "Gradient" as fallback for name', () => {
      const elements = createGradientStripElements([{ id: 'x', colorStops: [{ color: '#000', position: 0 }, { color: '#fff', position: 1 }] }]);
      expect(elements[0].querySelector('.gradient-strip-name').textContent).to.equal('Gradient');
    });
  });

  describe('analytics (daa-ll / data-ll)', () => {
    it('does not set daa-ll or data-ll when analytics is not passed', () => {
      const elements = createGradientStripElements(SAMPLE_GRADIENTS);
      const btn = elements[0].querySelector('.gradient-strip-action-btn');
      expect(btn.getAttribute('daa-ll')).to.be.null;
      expect(btn.getAttribute('data-ll')).to.be.null;
    });

    it('sets daa-ll and data-ll when analytics.linkIndex and analytics.headerText are provided', () => {
      const elements = createGradientStripElements(SAMPLE_GRADIENTS, {
        analytics: { linkIndex: 1, headerText: '35 color gradients', linkLabel: 'View details' },
      });
      const btn = elements[0].querySelector('.gradient-strip-action-btn');
      const expected = 'View details-1--35 color gradients';
      expect(btn.getAttribute('daa-ll')).to.equal(expected);
      expect(btn.getAttribute('data-ll')).to.equal(expected);
    });

    it('uses startIndex to assign link index per card when creating multiple', () => {
      const elements = createGradientStripElements(SAMPLE_GRADIENTS, {
        analytics: { headerText: '35 color gradients', startIndex: 0 },
      });
      expect(elements[0].querySelector('.gradient-strip-action-btn').getAttribute('daa-ll')).to.equal('View details-1--35 color gradients');
      expect(elements[1].querySelector('.gradient-strip-action-btn').getAttribute('daa-ll')).to.equal('View details-2--35 color gradients');
    });

    it('uses custom linkLabel when provided', () => {
      const elements = createGradientStripElements([SAMPLE_GRADIENTS[0]], {
        analytics: { linkIndex: 5, headerText: 'Gradient editor', linkLabel: 'Open in modal' },
      });
      expect(elements[0].querySelector('.gradient-strip-action-btn').getAttribute('daa-ll')).to.equal('Open in modal-5--Gradient editor');
    });
  });
});
