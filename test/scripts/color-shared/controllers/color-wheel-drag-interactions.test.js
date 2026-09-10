import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../../express/code/scripts/utils.js';
import ColorThemeExpressController from '../../../../express/code/scripts/color-shared/controllers/ColorThemeExpressController.js';
import { hsbToHEX } from '../../../../express/code/libs/color-components/utils/ColorConversions.js';
import { scientificToArtisticSmooth } from '../../../../express/code/libs/color-components/utils/harmony/colorwheel.js';

setLibs('/libs');

const HUE_TOLERANCE = 5; // degrees artistic hue
const SAT_TOLERANCE = 5; // percent saturation

function makeController(base, count, rule) {
  const ctrl = new ColorThemeExpressController({
    swatches: Array(count).fill(base),
    harmonyRule: rule,
    baseColorIndex: 0,
  });
  ctrl.setBaseColor(base);
  return ctrl;
}

// hue: 0–360, sat: 0–100, val: 0–100 → hex string
function toHex(hue, sat, val) {
  return hsbToHEX(hue / 360, sat / 100, val / 100);
}

function artHue(swatch) {
  return scientificToArtisticSmooth(swatch.hsv.h);
}

// Signed angular difference in artistic hue space, range -180..180
function artOffset(swatchA, swatchB) {
  let d = (((artHue(swatchA) - artHue(swatchB)) % 360) + 360) % 360;
  if (d > 180) d -= 360;
  return d;
}

// Returns artistic hue offset of each non-base swatch relative to base (index 0)
function harmonyOffsets(swatches) {
  return swatches.slice(1).map((s) => artOffset(s, swatches[0]));
}

describe('Color wheel drag interactions', () => {
  // Scenario 1: Dragging the base color marker medially (toward/away from center)
  // simulates a saturation change. The base hue must be preserved, and the
  // harmony-derived swatches must maintain their angular relationship to the base.
  describe('Scenario 1: base medial (saturation change)', () => {
    it('preserves base hue, changes saturation, maintains harmony hue offsets', () => {
      const ctrl = makeController('#FF0000', 3, 'ANALOGOUS');
      const before = ctrl.getState();

      const { h, v } = before.swatches[0].hsv;
      const initSat = before.swatches[0].hsv.s;
      const beforeOffsets = harmonyOffsets(before.swatches);

      // Medial: same hue, lower saturation
      const newSat = 50;
      ctrl.setBaseColor(toHex(h, newSat, v));
      const after = ctrl.getState();

      // Base hue preserved
      expect(after.swatches[0].hsv.h).to.be.closeTo(h, HUE_TOLERANCE);
      // Base saturation changed
      expect(after.swatches[0].hsv.s).to.be.closeTo(newSat, SAT_TOLERANCE);
      expect(Math.abs(after.swatches[0].hsv.s - initSat)).to.be.greaterThan(10);
      // Harmony hue offsets preserved
      const afterOffsets = harmonyOffsets(after.swatches);
      beforeOffsets.forEach((offset, i) => {
        expect(afterOffsets[i]).to.be.closeTo(offset, HUE_TOLERANCE);
      });
    });
  });

  // Scenario 2: Dragging the base color marker laterally (angularly around the wheel)
  // simulates a hue change. All swatches must shift together so their relative angular
  // positions (harmony offsets) remain the same.
  describe('Scenario 2: base lateral (hue change)', () => {
    it('shifts base hue, maintains harmony hue offsets for all swatches', () => {
      const ctrl = makeController('#FF0000', 3, 'ANALOGOUS');
      const before = ctrl.getState();

      const { s, v } = before.swatches[0].hsv;
      const initArtH = artHue(before.swatches[0]);
      const beforeOffsets = harmonyOffsets(before.swatches);

      // Lateral: different hue (120° scientific = green), same saturation and value
      ctrl.setBaseColor(toHex(120, s, v));
      const after = ctrl.getState();

      // Base hue changed significantly
      expect(Math.abs(artHue(after.swatches[0]) - initArtH)).to.be.greaterThan(10);
      // Harmony hue offsets preserved for all derived swatches
      const afterOffsets = harmonyOffsets(after.swatches);
      beforeOffsets.forEach((offset, i) => {
        expect(afterOffsets[i]).to.be.closeTo(offset, HUE_TOLERANCE);
      });
    });
  });

  // Scenario 3: Dragging a non-base marker medially changes only that swatch's
  // saturation. Because the harmony engine uses independent radius deltas for non-base
  // regions, the other swatches are not recomputed and remain at their original values.
  describe('Scenario 3: non-base medial (only moved swatch changes)', () => {
    it('changes saturation of moved swatch only, leaves other swatches unchanged', () => {
      const ctrl = makeController('#9E2BFC', 3, 'ANALOGOUS');
      const before = ctrl.getState();
      const nonBaseIdx = 1;

      const { h, s, v } = before.swatches[nonBaseIdx].hsv;
      // Medial: same hue, adjusted saturation
      const newSat = s > 50 ? s - 30 : s + 30;
      ctrl.setSwatchHex(nonBaseIdx, toHex(h, newSat, v));
      const after = ctrl.getState();

      // Moved swatch: hue preserved, saturation changed
      expect(after.swatches[nonBaseIdx].hsv.h).to.be.closeTo(h, HUE_TOLERANCE);
      expect(after.swatches[nonBaseIdx].hsv.s).to.be.closeTo(newSat, SAT_TOLERANCE);
      // Other swatches: effectively unchanged (tolerance of 1 accounts for 8-bit
      // hex quantization in the HSV roundtrip through the harmony engine)
      [0, 2].forEach((i) => {
        expect(after.swatches[i].hsv.h).to.be.closeTo(before.swatches[i].hsv.h, 1);
        expect(after.swatches[i].hsv.s).to.be.closeTo(before.swatches[i].hsv.s, 1);
        expect(after.swatches[i].hsv.v).to.be.closeTo(before.swatches[i].hsv.v, 1);
      });
    });
  });

  // Scenario 4: Dragging a non-base marker laterally (angularly) shifts all swatches
  // together. The non-base region has linkHue=true, so moving it angularly causes the
  // harmony engine to rotate the base color, which in turn re-derives all swatches at
  // their same relative angular offsets from the new base position.
  describe('Scenario 4: non-base lateral (all swatches shift hue)', () => {
    it('shifts all swatches by same hue delta, preserving harmony offsets and saturation', () => {
      const ctrl = makeController('#FF0000', 3, 'ANALOGOUS');
      const before = ctrl.getState();
      const nonBaseIdx = 1;
      const beforeOffsets = harmonyOffsets(before.swatches);
      const beforeBaseArtH = artHue(before.swatches[0]);

      const { s, v } = before.swatches[nonBaseIdx].hsv;
      // Lateral: shift hue by +60° in scientific space (stays clear of yellow nonlinearity)
      const newSciH = (before.swatches[nonBaseIdx].hsv.h + 60) % 360;
      ctrl.setSwatchHex(nonBaseIdx, toHex(newSciH, s, v));
      const after = ctrl.getState();

      // Base hue shifted (moved by the lateral drag)
      expect(Math.abs(artHue(after.swatches[0]) - beforeBaseArtH)).to.be.greaterThan(5);
      // Harmony offsets preserved: all swatches maintain their relative positions
      const afterOffsets = harmonyOffsets(after.swatches);
      beforeOffsets.forEach((offset, i) => {
        expect(afterOffsets[i]).to.be.closeTo(offset, HUE_TOLERANCE);
      });
      // Saturation of re-derived swatches (base and swatch 2) approximately preserved
      [0, 2].forEach((i) => {
        expect(after.swatches[i].hsv.s).to.be.closeTo(before.swatches[i].hsv.s, SAT_TOLERANCE);
      });
    });
  });
});
