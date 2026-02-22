import { hsvToHsl } from '../../utils/ColorConversions.js';

// eslint-disable-next-line max-params
export const mapRange = (x, a, b, c, d) => c + (x - a) * ((d - c) / (b - a));
export const scientificToArtisticSmooth = (angle) => {
  if (angle < 35.0) {
    // Map [0,35] to [0,60]
    return angle * (60.0 / 35.0);
  } if (angle < 60.0) {
    // Map [35,60] to [60,122]
    return mapRange(angle, 35, 60, 60, 122);
  } if (angle < 120.0) {
    // Map [60,120] to [122,165]
    return mapRange(angle, 60, 120, 122, 165);
  } if (angle < 180.0) {
    // Map [120,180] to [165,218]
    return mapRange(angle, 120, 180, 165, 218);
  } if (angle < 240.0) {
    // Map [180,240] to [218,275]
    return mapRange(angle, 180, 240, 218, 275);
  } if (angle < 300.0) {
    // Map [240,300] to [275,330]
    return mapRange(angle, 240, 300, 275, 330);
  }
  // Map [300,360] to [330,360]
  return mapRange(angle, 300, 360, 330, 360);
};
export const rgbHueOf = (rybHue, wheel) => {
  let x0; let y0; let x1; let
    y1;

  for (let i = 0; i < wheel.length - 2; i += 2) {
    x0 = wheel[i];
    y0 = wheel[i + 1];
    x1 = wheel[i + 2];
    y1 = wheel[i + 3];
    if (rybHue <= x1 && rybHue >= x0) {
      return y0 + (y1 - y0) * (rybHue - x0) / (x1 - x0);
    }
  }
};
export const drawColorwheel = (v, radius, context) => {
  const x = radius;
  const y = radius;
  const hsl0 = hsvToHsl(0, 0, v);
  const hsl1 = hsvToHsl(0, 1, v);
  const s0 = Math.round(hsl0.s * 100);
  const l0 = Math.round(hsl0.l * 100);
  const s1 = Math.round(hsl1.s * 100);
  const l1 = Math.round(hsl1.l * 100);
  const wheel = [
    0, 0,
    15, 8,
    30, 17,
    45, 26,
    60, 34,
    75, 41,
    90, 48,
    105, 54,
    120, 60,
    135, 81,
    150, 103,
    165, 123,
    180, 138,
    195, 155,
    210, 171,
    225, 187,
    240, 204,
    255, 219,
    270, 234,
    285, 251,
    300, 267,
    315, 282,
    330, 298,
    345, 329,
    360, 360,
  ];

  let startAngle; let endAngle; let gradient; let
    rgbHue;

  for (let angle = 0; angle <= 360; angle += 1) {
    rgbHue = rgbHueOf(angle, wheel);
    startAngle = (360 - angle + 1) * Math.PI / 180;
    endAngle = (360 - angle - 1) * Math.PI / 180;
    context.beginPath();
    context.moveTo(x, y);
    // Wheel becomes black due to some floating error in calculating the pixels to be painted
    // So we draw extra pixel to avoid that.
    context.arc(x, y, radius + 1, endAngle, startAngle, false);
    context.closePath();
    gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `hsl(${rgbHue}, ${s0}%,${l0}%)`);
    gradient.addColorStop(1, `hsl(${rgbHue}, ${s1}%,${l1}%)`);
    context.fillStyle = gradient;
    context.fill();
  }
};
