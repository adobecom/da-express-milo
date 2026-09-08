import { expect } from '@esm-bundle/chai';
import { isAtScrollEnd, getFaderRoles } from '../../../express/code/scripts/widgets/carousel.js';

// initToggleTriggers itself is driven by IntersectionObserver callbacks,
// which are unreliable to assert on directly in a full parallel test run
// (they get throttled/never fire when the tab isn't focused - the same class
// of flakiness documented in how-to-cards/gallery.test.js). The two pieces of
// logic that actually contained the RTL bug - which fader-control/gradient a
// trigger drives, and where the far end of the scroll range is - are pure
// functions carousel.js exports, so test those directly instead of racing
// the observer through a real DOM.

describe('carousel widget - getFaderRoles', () => {
  it('ltr: the left trigger (scroll origin) drives the left fader, the right trigger drives the right fader', () => {
    expect(getFaderRoles(false)).to.deep.equal({ origin: 'left', end: 'right' });
  });

  it('rtl: the left trigger (still the scroll origin, now rendered on the physical right) drives the right fader', () => {
    expect(getFaderRoles(true)).to.deep.equal({ origin: 'right', end: 'left' });
  });
});

describe('carousel widget - isAtScrollEnd', () => {
  // A platform with 1000px of scrollable content in a 400px viewport, so the
  // far end of the range is +/-600 depending on direction.
  const clientWidth = 400;
  const scrollWidth = 1000;

  describe('ltr', () => {
    it('is false at the scroll origin', () => {
      expect(isAtScrollEnd({ scrollLeft: 0, scrollWidth, clientWidth }, false)).to.be.false;
    });

    it('is false part-way through the scroll range', () => {
      expect(isAtScrollEnd({ scrollLeft: 300, scrollWidth, clientWidth }, false)).to.be.false;
    });

    it('is true once scrolled to the far (rightmost) end', () => {
      expect(isAtScrollEnd({ scrollLeft: 600, scrollWidth, clientWidth }, false)).to.be.true;
    });

    it('is true within the 10px tolerance of the far end', () => {
      expect(isAtScrollEnd({ scrollLeft: 595, scrollWidth, clientWidth }, false)).to.be.true;
    });
  });

  describe('rtl', () => {
    it('is false at the scroll origin (0, the physical right/start)', () => {
      expect(isAtScrollEnd({ scrollLeft: 0, scrollWidth, clientWidth }, true)).to.be.false;
    });

    it('is false part-way through the scroll range', () => {
      expect(isAtScrollEnd({ scrollLeft: -300, scrollWidth, clientWidth }, true)).to.be.false;
    });

    it('is true once scrolled to the far (leftmost) end - the most negative scrollLeft', () => {
      expect(isAtScrollEnd({ scrollLeft: -600, scrollWidth, clientWidth }, true)).to.be.true;
    });

    it('is true within the 10px tolerance of the far end', () => {
      expect(isAtScrollEnd({ scrollLeft: -595, scrollWidth, clientWidth }, true)).to.be.true;
    });

    it('does not flag the far ltr-style boundary as the end', () => {
      // Regression guard: before the rtl branch existed, this used the ltr
      // formula unconditionally, which this positive scrollLeft would satisfy.
      expect(isAtScrollEnd({ scrollLeft: 600, scrollWidth, clientWidth }, true)).to.be.false;
    });
  });
});
