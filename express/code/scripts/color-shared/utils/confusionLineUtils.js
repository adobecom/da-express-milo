/* eslint-disable */
import { scientificToArtisticSmooth } from '../../../libs/color-components/components/color-wheel/ColorWheelUtils.js';
import { degToRad, polarToXy } from '../../../libs/color-components/utils/ColorConversions.js';

// ---------------------------------------------------------------------------
// Wheel coordinate helpers
// ---------------------------------------------------------------------------

export function hsvToWheelXY(h, s, wheelRadius) {
  const smoothH = scientificToArtisticSmooth(h);
  const radius = (wheelRadius * s) / 100;
  const phi = degToRad(180 - smoothH);
  const [dx, dy] = polarToXy(radius, phi);
  return [dx + wheelRadius, dy + wheelRadius];
}

function euclideanDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ---------------------------------------------------------------------------
// Color-space conversions (inlined from worker)
// ---------------------------------------------------------------------------

const COPUNCTUAL_POINTS = {
  protan: [0.7465, 0.2535],
  deutan: [1.4, -0.4],
  tritan: [0.1748, 0.0],
};

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(c) {
  return c > 0.0031308 ? 1.055 * (c ** (1 / 2.4)) - 0.055 : 12.92 * c;
}

function rgbToXyz(r, g, b) {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);
  return {
    X: 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl,
    Y: 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl,
    Z: 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl,
  };
}

function xyzToRgb(X, Y, Z) {
  return {
    r: linearToSrgb(3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z),
    g: linearToSrgb(-0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z),
    b: linearToSrgb(0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z),
  };
}

function xyzToXyY(X, Y, Z) {
  const sum = X + Y + Z;
  if (sum === 0) return { x: 0, y: 0, lum: 0 };
  return { x: X / sum, y: Y / sum, lum: Y };
}

function xyYToXyz(x, y, lum) {
  if (y === 0) return { X: 0, Y: 0, Z: 0 };
  return {
    X: (x * lum) / y,
    Y: lum,
    Z: ((1 - x - y) * lum) / y,
  };
}

function hsvToRgb(h, s, v) {
  const H = ((h % 360) + 360) % 360;
  const S = s / 100;
  const V = v / 100;
  const C = V * S;
  const X = C * (1 - Math.abs(((H / 60) % 2) - 1));
  const m = V - C;
  let r, g, b;
  if (H < 60) { r = C; g = X; b = 0; }
  else if (H < 120) { r = X; g = C; b = 0; }
  else if (H < 180) { r = 0; g = C; b = X; }
  else if (H < 240) { r = 0; g = X; b = C; }
  else if (H < 300) { r = X; g = 0; b = C; }
  else { r = C; g = 0; b = X; }
  return { r: r + m, g: g + m, b: b + m };
}

function rgbToHsv(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;
  return { h, s, v };
}

function normaliseForConfusion(h, s) {
  const rgb = hsvToRgb(h, s, 0.00015);
  const { X, Y, Z } = rgbToXyz(rgb.r, rgb.g, rgb.b);
  return xyzToXyY(X, Y, Z);
}

// ---------------------------------------------------------------------------
// Confusion-line computation (synchronous, main-thread)
// ---------------------------------------------------------------------------

const TYPES = Object.keys(COPUNCTUAL_POINTS);
const STEPS = 100;
const STEP = 1 / STEPS;

export function computeConfusionLinePoints(hsv, brightness) {
  const [h, s] = hsv;

  const swatchXyY = normaliseForConfusion(h, s);

  const rgb01 = hsvToRgb(0, 0, brightness);
  const { Y: lumRef } = rgbToXyz(rgb01.r, rgb01.g, rgb01.b);
  const lum = swatchXyY.lum || lumRef || 0.0000001;

  const result = {};

  for (let t = 0; t < TYPES.length; t++) {
    const type = TYPES[t];
    const [cpX, cpY] = COPUNCTUAL_POINTS[type];
    const m = (swatchXyY.y - cpY) / (swatchXyY.x - cpX);
    const b = cpY - m * cpX;
    const points = [];

    for (let cx = 0; cx < 1; cx += STEP) {
      const cy = m * cx + b;
      if (cy < 0 || cy > 1) continue;

      const { X, Y, Z } = xyYToXyz(cx, cy, lum);
      const rgb = xyzToRgb(X, Y, Z);

      if (rgb.r < -0.01 || rgb.r > 1.01
        || rgb.g < -0.01 || rgb.g > 1.01
        || rgb.b < -0.01 || rgb.b > 1.01) continue;

      const hsvPt = rgbToHsv(
        Math.max(0, Math.min(1, rgb.r)),
        Math.max(0, Math.min(1, rgb.g)),
        Math.max(0, Math.min(1, rgb.b)),
      );
      points.push([hsvPt.h, hsvPt.s, hsvPt.v]);
    }

    result[type] = points;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Canvas drawing functions
// ---------------------------------------------------------------------------

export function drawConfusionLinesCurve(ctx, linePoints, opts) {
  if (!linePoints || !linePoints.length) return;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = opts.lineWidth || 4;

  for (let i = 0; i <= linePoints.length; i++) {
    const [x, y] = linePoints[i % linePoints.length];

    if (i === 0) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      continue;
    }

    const [prevX, prevY] = linePoints[i - 1];
    const dist = euclideanDistance(prevX, prevY, x, y);

    if (dist > opts.wheelRadius / 2) {
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.quadraticCurveTo(prevX, prevY, x, y);
    }
  }
  ctx.stroke();
}

export function drawConflictLinesOnCanvas(ctx, swatches, conflictPairs, wheelRadius) {
  if (!conflictPairs || !conflictPairs.length || !swatches.length) return;

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 5;

  conflictPairs.forEach(([i, j]) => {
    const swatchA = swatches[i];
    const swatchB = swatches[j];
    if (!swatchA?.hsv || !swatchB?.hsv) return;

    const [x1, y1] = hsvToWheelXY(swatchA.hsv.h, swatchA.hsv.s, wheelRadius);
    const [x2, y2] = hsvToWheelXY(swatchB.hsv.h, swatchB.hsv.s, wheelRadius);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
}
