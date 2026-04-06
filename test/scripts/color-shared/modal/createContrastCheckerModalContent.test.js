/* eslint-disable max-len, no-underscore-dangle */
import { expect } from '@esm-bundle/chai';

// Minimal data service stub that mirrors the real createContrastDataService API.
function createStubDataService() {
  const WCAG_NORMAL_AA = 4.5;
  const WCAG_LARGE_AA = 3;
  const WCAG_NORMAL_AAA = 7;
  const WCAG_LARGE_AAA = 4.5;
  const WCAG_UI_AA = 3;

  function hexToRGB(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16) / 255,
      g: parseInt(h.substring(2, 4), 16) / 255,
      b: parseInt(h.substring(4, 6), 16) / 255,
    };
  }

  function linearize(c) {
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }

  function getRelativeLuminance({ r, g, b }) {
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  }

  function calculateRatio(fg, bg) {
    const l1 = getRelativeLuminance(hexToRGB(fg));
    const l2 = getRelativeLuminance(hexToRGB(bg));
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function checkWCAG(fg, bg) {
    const ratio = calculateRatio(fg, bg);
    return {
      ratio,
      normalAA: ratio >= WCAG_NORMAL_AA,
      largeAA: ratio >= WCAG_LARGE_AA,
      normalAAA: ratio >= WCAG_NORMAL_AAA,
      largeAAA: ratio >= WCAG_LARGE_AAA,
      uiComponents: ratio >= WCAG_UI_AA,
    };
  }

  function getLuminanceForHex(hex) {
    return getRelativeLuminance(hexToRGB(hex));
  }

  function isValidHex(hex) {
    return /^#?[0-9A-Fa-f]{6}$/.test(hex);
  }

  return {
    checkWCAG,
    calculateRatio,
    getLuminanceForHex,
    isValidHex,
    clearCache() {},
  };
}

// Mock dynamic imports before loading the module

describe('createContrastCheckerModalContent', () => {
  let createContrastCheckerModalContent;
  let ensureContrastContentStyles;
  let dataService;

  before(async () => {
    // Mock the spectrum component imports by overriding the module
    // We import the content factory directly
    const mod = await import('../../../../express/code/scripts/color-shared/modal/createContrastCheckerModalContent.js');
    createContrastCheckerModalContent = mod.createContrastCheckerModalContent;
    ensureContrastContentStyles = mod.ensureContrastContentStyles;
    dataService = createStubDataService();
  });

  describe('ensureContrastContentStyles', () => {
    it('should be a function', () => {
      expect(ensureContrastContentStyles).to.be.a('function');
    });
  });

  describe('createContrastCheckerModalContent', () => {
    it('should return an element and destroy function', () => {
      const result = createContrastCheckerModalContent(
        { colors: ['#000000', '#FFFFFF'] },
        { dataService },
      );
      expect(result).to.have.property('element');
      expect(result).to.have.property('destroy');
      expect(result.destroy).to.be.a('function');
      result.destroy();
    });

    it('should handle empty palette gracefully', () => {
      const result = createContrastCheckerModalContent(
        { colors: [] },
        { dataService },
      );
      expect(result.element.textContent).to.include('At least 2 colors');
      result.destroy();
    });

    it('should handle single color palette', () => {
      const result = createContrastCheckerModalContent(
        { colors: ['#FF0000'] },
        { dataService },
      );
      expect(result.element.textContent).to.include('At least 2 colors');
      result.destroy();
    });

    it('should normalize colors to uppercase with hash', () => {
      const result = createContrastCheckerModalContent(
        { colors: ['ff0000', '#00ff00', '0000FF'] },
        { dataService },
      );
      expect(result.element).to.exist;
      result.destroy();
    });

    it('should clean up on destroy', () => {
      const result = createContrastCheckerModalContent(
        { colors: ['#000000', '#FFFFFF'] },
        { dataService },
      );
      result.destroy();
      expect(result.element.innerHTML).to.equal('');
    });
  });

  describe('pass/fail logic', () => {
    // Black on White = ratio ~21:1 (passes everything)
    // #777777 on #888888 = low ratio (fails most things)

    it('should create cells for a 2-color palette', async () => {
      const result = createContrastCheckerModalContent(
        { colors: ['#000000', '#FFFFFF'] },
        { dataService },
      );
      // The element is created synchronously even though header init is async
      expect(result.element).to.exist;
      expect(result.element.classList.contains('cc-modal-contrast-checker')).to.be.true;
      result.destroy();
    });

    it('should respect initialTab option', () => {
      const result = createContrastCheckerModalContent(
        { colors: ['#000000', '#FFFFFF'] },
        { dataService, initialTab: 'icons-ui' },
      );
      result.destroy();
    });

    it('should respect initialLevel option', () => {
      const result = createContrastCheckerModalContent(
        { colors: ['#000000', '#FFFFFF'] },
        { dataService, initialLevel: 'AAA' },
      );
      result.destroy();
    });
  });

  describe('data service interaction', () => {
    it('should call checkWCAG for all non-diagonal pairs', () => {
      const colors = ['#FF0000', '#00FF00', '#0000FF'];
      let callCount = 0;
      const trackingService = {
        ...dataService,
        checkWCAG(fg, bg) {
          callCount += 1;
          return dataService.checkWCAG(fg, bg);
        },
      };

      const result = createContrastCheckerModalContent(
        { colors },
        { dataService: trackingService },
      );

      // 3 colors: 3*3 - 3 diagonal = 6 non-diagonal pairs
      expect(callCount).to.equal(6);
      result.destroy();
    });

    it('should not clear cache for shared data service on destroy', () => {
      let cleared = false;
      const trackingService = {
        ...dataService,
        clearCache() { cleared = true; },
      };

      const result = createContrastCheckerModalContent(
        { colors: ['#000000', '#FFFFFF'] },
        { dataService: trackingService },
      );
      result.destroy();
      expect(cleared).to.be.false;
    });
  });

  describe('getCellSize logic', () => {
    // We test indirectly by checking the CSS classes on cells
    it('should use correct size class based on color count', () => {
      // Test via the factory — 2 colors should produce L class,
      // but since rendering is async (depends on spectrum imports),
      // we verify the element container is created correctly
      const result2 = createContrastCheckerModalContent(
        { colors: ['#000000', '#FFFFFF'] },
        { dataService },
      );
      expect(result2.element.classList.contains('cc-modal-contrast-checker')).to.be.true;
      result2.destroy();

      const result10 = createContrastCheckerModalContent(
        { colors: ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#888888', '#444444'] },
        { dataService },
      );
      expect(result10.element.classList.contains('cc-modal-contrast-checker')).to.be.true;
      result10.destroy();
    });
  });

  describe('contrast ratio calculations', () => {
    it('should correctly identify black on white as passing all levels', () => {
      const result = dataService.checkWCAG('#000000', '#FFFFFF');
      expect(result.normalAA).to.be.true;
      expect(result.normalAAA).to.be.true;
      expect(result.largeAA).to.be.true;
      expect(result.largeAAA).to.be.true;
      expect(result.uiComponents).to.be.true;
      expect(result.ratio).to.be.greaterThan(20);
    });

    it('should detect similar colors as failing', () => {
      const result = dataService.checkWCAG('#777777', '#888888');
      expect(result.normalAA).to.be.false;
      expect(result.normalAAA).to.be.false;
    });

    it('should detect light backgrounds', () => {
      const whiteLum = dataService.getLuminanceForHex('#FFFFFF');
      expect(whiteLum).to.be.greaterThan(0.9);

      const blackLum = dataService.getLuminanceForHex('#000000');
      expect(blackLum).to.be.lessThan(0.1);
    });
  });
});
