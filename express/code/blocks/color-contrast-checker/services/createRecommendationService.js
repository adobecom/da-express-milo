import createContrastDataService from './createContrastDataService.js';
import {
  convertsRGBtoxyY,
  convertxyYtosRGB,
  deNormalizeRGB,
  isInRGBGamut,
} from './contrastConversions.js';
import { MAX_RECOMMENDATION } from '../utils/contrastConstants.js';
import { rgbToHex } from '../utils/contrastUtils.js';

const RATIO_EPSILON = 0.05;
const D65_X = 0.3127;
const D65_Y = 0.329;
const Y_STEP = 0.01;
const CHROMA_STEP = 0.005;
const MAX_ITERATIONS = 1000;
const WCAG_SUGGESTION_TARGETS = Object.freeze([3, 4.5, 7]);

export function getSuggestionTargets(currentRatio) {
  return WCAG_SUGGESTION_TARGETS
    .filter((targetRatio) => targetRatio > currentRatio)
    .slice(0, MAX_RECOMMENDATION);
}

export default function createRecommendationService() {
  const dataService = createContrastDataService();

  function hexToSRGB(hex) {
    const { r, g, b } = dataService.hexToRGB(hex);
    return { r: r / 255, g: g / 255, b: b / 255 };
  }

  function solveContrastRatio(bgHex, fgHex, desiredRatio) {
    const fgSRGB = hexToSRGB(fgHex);
    const fgXyY = convertsRGBtoxyY(fgSRGB);

    const bgLum = dataService.getRelativeLuminance(dataService.hexToRGB(bgHex));
    const fgLum = dataService.getRelativeLuminance(dataService.hexToRGB(fgHex));

    let targetLum;
    if (fgLum >= bgLum) {
      targetLum = (desiredRatio + RATIO_EPSILON) * (bgLum + 0.05) - 0.05;
    } else {
      targetLum = (bgLum + 0.05) / (desiredRatio + RATIO_EPSILON) - 0.05;
    }

    const adjusted = { x: fgXyY.x, y: fgXyY.y, Y: targetLum };
    const srgb = convertxyYtosRGB(adjusted);

    if (isInRGBGamut(srgb)) {
      return { outsRGB: deNormalizeRGB(srgb), valid: true };
    }
    return { outsRGB: { r: 0, g: 0, b: 0 }, valid: false };
  }

  function testCandidate(fgXyY, newY, sDelta, bgHex, desiredRatio) {
    const newX = fgXyY.x + (D65_X - fgXyY.x) * sDelta;
    const newYChrom = fgXyY.y + (D65_Y - fgXyY.y) * sDelta;

    const candidate = convertxyYtosRGB({ x: newX, y: newYChrom, Y: newY });
    if (!isInRGBGamut(candidate)) return null;

    const rgb = deNormalizeRGB(candidate);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const ratio = dataService.calculateRatio(hex, bgHex);

    return ratio >= desiredRatio ? { outsRGB: rgb, valid: true } : null;
  }

  function sweepChroma(fgXyY, newY, bgHex, desiredRatio, state) {
    for (let sDelta = 0; sDelta <= 0.5; sDelta += CHROMA_STEP) {
      state.iterations += 1;
      if (state.iterations > MAX_ITERATIONS) return state.invalidResult;

      const match = testCandidate(fgXyY, newY, sDelta, bgHex, desiredRatio);
      if (match) return match;
    }
    return null;
  }

  function findContrastRatioWithinGamut(bgHex, fgHex, desiredRatio) {
    const fgSRGB = hexToSRGB(fgHex);
    const fgXyY = convertsRGBtoxyY(fgSRGB);
    const state = {
      iterations: 0,
      invalidResult: { outsRGB: { r: 0, g: 0, b: 0 }, valid: false },
    };

    for (let yDelta = 0; yDelta <= 1; yDelta += Y_STEP) {
      for (const ySign of [1, -1]) {
        const newY = fgXyY.Y + (yDelta * ySign);
        if (newY >= 0 && newY <= 1) {
          const result = sweepChroma(fgXyY, newY, bgHex, desiredRatio, state);
          if (result) return result;
        }
      }
    }

    return state.invalidResult;
  }

  function findContrastingColor(fgHex, bgHex, targetRatio) {
    const direct = solveContrastRatio(bgHex, fgHex, targetRatio);
    if (direct.valid) return direct;
    return findContrastRatioWithinGamut(bgHex, fgHex, targetRatio);
  }

  function getSuggestedColors(currentRatio, bgHex, fgHex) {
    const suggestions = [];
    const targetRatios = getSuggestionTargets(currentRatio);

    for (const targetRatio of targetRatios) {
      if (suggestions.length >= MAX_RECOMMENDATION) break;

      const fgResult = findContrastingColor(fgHex, bgHex, targetRatio);
      if (fgResult.valid) {
        const { r, g, b } = fgResult.outsRGB;
        const newFg = rgbToHex(r, g, b);
        const ratio = dataService.calculateRatio(newFg, bgHex);
        if (ratio >= targetRatio) {
          suggestions.push({ fg: newFg, bg: bgHex, ratio });
        }
      }

      if (suggestions.length >= MAX_RECOMMENDATION) break;

      const colorToAdjust = bgHex;
      const referenceColor = fgHex;
      const bgResult = findContrastingColor(colorToAdjust, referenceColor, targetRatio);
      if (bgResult.valid) {
        const { r, g, b } = bgResult.outsRGB;
        const newBg = rgbToHex(r, g, b);
        const ratio = dataService.calculateRatio(fgHex, newBg);
        if (ratio >= targetRatio) {
          suggestions.push({ fg: fgHex, bg: newBg, ratio });
        }
      }
    }

    return suggestions.slice(0, MAX_RECOMMENDATION);
  }

  return {
    solveContrastRatio,
    findContrastRatioWithinGamut,
    findContrastingColor,
    getSuggestedColors,
  };
}
