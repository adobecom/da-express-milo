import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../express/code/scripts/utils.js';
import isDarkOverlayReadable from '../../../express/code/scripts/utils/color-tools.js';

setLibs('/libs');

describe('Color Tools', () => {
  describe('isDarkOverlayReadable', () => {
    it('should return true for light colors (high HSP)', () => {
      // White should be readable
      expect(isDarkOverlayReadable('#ffffff')).to.be.true;
      expect(isDarkOverlayReadable('#FFFFFF')).to.be.true;
      expect(isDarkOverlayReadable('rgb(255, 255, 255)')).to.be.true;
      expect(isDarkOverlayReadable('rgba(255, 255, 255, 1)')).to.be.true;

      // Light colors
      expect(isDarkOverlayReadable('#ffff00')).to.be.true; // Yellow
      expect(isDarkOverlayReadable('#00ff00')).to.be.true; // Green
      expect(isDarkOverlayReadable('#ff00ff')).to.be.true; // Magenta
      expect(isDarkOverlayReadable('rgb(200, 200, 200)')).to.be.true; // Light gray
    });

    it('should return false for dark colors (low HSP)', () => {
      // Black should not be readable
      expect(isDarkOverlayReadable('#000000')).to.be.false;
      expect(isDarkOverlayReadable('#000')).to.be.false;
      expect(isDarkOverlayReadable('rgb(0, 0, 0)')).to.be.false;
      expect(isDarkOverlayReadable('rgba(0, 0, 0, 1)')).to.be.false;

      // Dark colors
      expect(isDarkOverlayReadable('#000080')).to.be.false; // Navy blue
      expect(isDarkOverlayReadable('#800000')).to.be.false; // Maroon
      expect(isDarkOverlayReadable('#008000')).to.be.false; // Dark green
      expect(isDarkOverlayReadable('rgb(50, 50, 50)')).to.be.false; // Dark gray
    });

    it('should handle 3-digit hex colors', () => {
      expect(isDarkOverlayReadable('#fff')).to.be.true; // White
      expect(isDarkOverlayReadable('#000')).to.be.false; // Black
      expect(isDarkOverlayReadable('#f00')).to.be.false; // Red (HSP 139.4, below threshold)
      expect(isDarkOverlayReadable('#0f0')).to.be.true; // Green
      expect(isDarkOverlayReadable('#00f')).to.be.false; // Blue (not bright enough)
    });

    it('should handle RGB format', () => {
      expect(isDarkOverlayReadable('rgb(255, 255, 255)')).to.be.true; // White
      expect(isDarkOverlayReadable('rgb(0, 0, 0)')).to.be.false; // Black
      expect(isDarkOverlayReadable('rgb(255, 0, 0)')).to.be.false; // Red (HSP 139.4, below threshold)
      expect(isDarkOverlayReadable('rgb(0, 255, 0)')).to.be.true; // Green
      expect(isDarkOverlayReadable('rgb(0, 0, 255)')).to.be.false; // Blue (not bright enough)
    });

    it('should handle RGBA format', () => {
      expect(isDarkOverlayReadable('rgba(255, 255, 255, 1)')).to.be.true; // White
      expect(isDarkOverlayReadable('rgba(0, 0, 0, 1)')).to.be.false; // Black
      expect(isDarkOverlayReadable('rgba(255, 0, 0, 0.5)')).to.be.false; // Red with alpha (HSP 139.4, below threshold)
      expect(isDarkOverlayReadable('rgba(0, 0, 255, 0.8)')).to.be.false; // Blue with alpha (not bright enough)
    });

    it('should handle edge cases around the threshold (140)', () => {
      // Colors with HSP around 140 should be tested
      // These values are calculated based on the formula:
      // sqrt(0.299 * r² + 0.587 * g² + 0.114 * b²)

      // Just above threshold (should be true)
      expect(isDarkOverlayReadable('rgb(150, 150, 150)')).to.be.true;

      // Just below threshold (should be false)
      expect(isDarkOverlayReadable('rgb(130, 130, 130)')).to.be.false;
    });

    it('should handle mixed case hex colors', () => {
      expect(isDarkOverlayReadable('#FfFfFf')).to.be.true; // White
      expect(isDarkOverlayReadable('#000000')).to.be.false; // Black
      expect(isDarkOverlayReadable('#FfF')).to.be.true; // White 3-digit
      expect(isDarkOverlayReadable('#000')).to.be.false; // Black 3-digit
    });

    it('should handle various color intensities', () => {
      // Test different shades of gray
      expect(isDarkOverlayReadable('rgb(255, 255, 255)')).to.be.true; // White
      expect(isDarkOverlayReadable('rgb(200, 200, 200)')).to.be.true; // Light gray
      expect(isDarkOverlayReadable('rgb(150, 150, 150)')).to.be.true; // Medium-light gray
      expect(isDarkOverlayReadable('rgb(100, 100, 100)')).to.be.false; // Medium-dark gray
      expect(isDarkOverlayReadable('rgb(50, 50, 50)')).to.be.false; // Dark gray
      expect(isDarkOverlayReadable('rgb(0, 0, 0)')).to.be.false; // Black
    });

    it('should handle primary colors', () => {
      expect(isDarkOverlayReadable('rgb(255, 0, 0)')).to.be.false; // Red (HSP 139.4, below threshold)
      expect(isDarkOverlayReadable('rgb(0, 255, 0)')).to.be.true; // Green
      expect(isDarkOverlayReadable('rgb(0, 0, 255)')).to.be.false; // Blue (not bright enough)
      expect(isDarkOverlayReadable('rgb(255, 255, 0)')).to.be.true; // Yellow
      expect(isDarkOverlayReadable('rgb(255, 0, 255)')).to.be.true; // Magenta
      expect(isDarkOverlayReadable('rgb(0, 255, 255)')).to.be.true; // Cyan
    });
  });
});
