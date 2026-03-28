/* eslint-env mocha */
/* eslint-disable no-underscore-dangle */
import { expect } from '@esm-bundle/chai';
import '../../../../express/code/libs/color-components/components/color-swatch-rail/index.js';

function createRail() {
  const rail = document.createElement('color-swatch-rail');
  rail.swatches = [];
  rail.lockedByIndex = new Set();
  rail.tintIndex = null;
  return rail;
}

describe('color-swatch-rail tint bands', () => {
  it('builds 7 tint bands with base in the middle', () => {
    const rail = createRail();
    const baseHex = '#1900AB';
    const bands = rail._buildTintBands(baseHex);

    expect(bands).to.have.length(7);
    expect(bands.map((band) => band.id)).to.deep.equal([
      'tint-1',
      'tint-2',
      'tint-3',
      'base',
      'shade-1',
      'shade-2',
      'shade-3',
    ]);
    bands.forEach((band) => {
      expect(band.hex).to.match(/^#[0-9A-F]{6}$/);
    });
    expect(bands[3].hex).to.equal(baseHex);
  });

  it('applies selected tint band hex and closes tint overlay', () => {
    const rail = createRail();
    rail.swatches = [{ hex: '#1900AB' }];
    rail.tintIndex = 0;

    let capturedState = null;
    let emitted = null;
    rail.controller = {
      setState(next) {
        capturedState = next;
        if (next.swatches) rail.swatches = next.swatches;
        if (Object.prototype.hasOwnProperty.call(next, 'tintIndex')) {
          rail.tintIndex = next.tintIndex;
        }
      },
    };
    rail.addEventListener('color-swatch-rail-tint-apply', (event) => {
      emitted = event.detail;
    });

    const selectedBand = rail._buildTintBands('#1900AB')[0];
    rail._handleTintBandSelect(0, selectedBand);

    expect(capturedState).to.exist;
    expect(capturedState.swatches[0].hex).to.equal(selectedBand.hex);
    expect(capturedState.tintIndex).to.equal(null);
    expect(rail.tintIndex).to.equal(null);
    expect(emitted).to.deep.include({
      index: 0,
      tone: 'tint-1',
      hex: selectedBand.hex,
    });
  });

  it('does not apply tint band when swatch is locked', () => {
    const rail = createRail();
    rail.swatches = [{ hex: '#1900AB' }];
    rail.lockedByIndex = new Set([0]);

    let setStateCalled = false;
    rail.controller = {
      setState() {
        setStateCalled = true;
      },
    };

    const selectedBand = rail._buildTintBands('#1900AB')[1];
    rail._handleTintBandSelect(0, selectedBand);
    expect(setStateCalled).to.equal(false);
  });

  it('returns null when no tint swatch is currently selected', () => {
    const rail = createRail();
    rail.swatches = [{ hex: '#1900AB' }, { hex: '#000000' }];
    rail.tintIndex = null;
    expect(rail._resolveTintIndex()).to.equal(null);
  });
});
