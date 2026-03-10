/**
 * Color blindness simulation and conflict detection.
 * Based on demo: dev/tickets/MWPW-186754/demo/index.html
 * Figma: 7500-496585 (Failing > show warnings and icons)
 */

export const TYPE_ORDER = ['deutan', 'protan', 'tritan'];
export const TYPE_LABELS = { deutan: 'Deuteranopia', protan: 'Protanopia', tritan: 'Tritanopia' };
export const DEFECT_DEFINITIONS = {
  protan: 'Protanopia: Red-blind. Inability to distinguish red and green; reds appear dim.',
  deutan: 'Deuteranopia: Green-blind. Inability to distinguish red and green; greens appear dim.',
  tritan: 'Tritanopia: Blue-blind. Inability to distinguish blue and yellow.',
};

/** DeltaE ≤ this = conflict (colors too similar under simulation). */
export const CONFLICT_THRESHOLD_DELTA_E = 5;

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToLab(r, g, b) {
  const srgbToLinear = (c) => {
    const x = c / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  let rl = srgbToLinear(r);
  let gl = srgbToLinear(g);
  let bl = srgbToLinear(b);
  let x = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
  let y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl;
  let z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl;
  const e = 1 / 3;
  x = x > 0.008856 ? x ** e : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? y ** e : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? z ** e : 7.787 * z + 16 / 116;
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

/**
 * Simulate color for a color-blindness type.
 * @param {number} r - Red 0–255
 * @param {number} g - Green 0–255
 * @param {number} b - Blue 0–255
 * @param {'protan'|'deutan'|'tritan'} type
 * @returns {[number,number,number]} RGB 0–255
 */
export function simulate(r, g, b, type) {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  let r2; let g2; let b2;
  if (type === 'protan' || type === 'deutan') {
    r2 = (R + G) / 2;
    g2 = (R + G) / 2;
    b2 = B;
  } else {
    r2 = R;
    g2 = G;
    b2 = (G + B) / 2;
  }
  return [
    Math.max(0, Math.min(1, r2)) * 255,
    Math.max(0, Math.min(1, g2)) * 255,
    Math.max(0, Math.min(1, b2)) * 255,
  ];
}

/**
 * DeltaE 2000 between two Lab colors.
 */
function deltaE2000(L1, a1, b1, L2, a2, b2) {
  const rad = (x) => x * (Math.PI / 180);
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 6103515625)));
  const ap1 = a1 * (1 + G);
  const ap2 = a2 * (1 + G);
  const Cp1 = Math.sqrt(ap1 * ap1 + b1 * b1);
  const Cp2 = Math.sqrt(ap2 * ap2 + b2 * b2);
  const hp1 = Math.atan2(b1, ap1);
  const hp2 = Math.atan2(b2, ap2);
  let dhp = hp2 - hp1;
  if (dhp > Math.PI) dhp -= 2 * Math.PI;
  else if (dhp < -Math.PI) dhp += 2 * Math.PI;
  const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin(dhp / 2);
  const Lp = (L1 + L2) / 2;
  const Cp = (Cp1 + Cp2) / 2;
  let Hp = hp1 + hp2;
  if (Math.abs(hp1 - hp2) > Math.PI) Hp += Math.PI;
  const T = 1 - 0.17 * Math.cos(Hp - rad(30)) + 0.24 * Math.cos(2 * Hp) + 0.32 * Math.cos(3 * Hp + rad(6)) - 0.2 * Math.cos(4 * Hp - rad(63));
  const dTheta = rad(30) * Math.exp(-(((Hp - rad(275)) / rad(25)) ** 2));
  const Rc = 2 * Math.sqrt(Cp ** 7 / (Cp ** 7 + 6103515625));
  const Sl = 1 + (0.015 * (Lp - 50) ** 2) / Math.sqrt(20 + (Lp - 50) ** 2);
  const Sc = 1 + 0.045 * Cp;
  const Sh = 1 + 0.015 * Cp * T;
  const Rt = Math.sin(2 * dTheta) * Rc;
  const dL = L2 - L1;
  const dC = Cp2 - Cp1;
  return Math.sqrt((dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh));
}

/**
 * Get conflicting color pairs for a simulation type.
 * @param {string[]} colors - Hex strings
 * @param {'protan'|'deutan'|'tritan'} type
 * @param {number} [threshold] - DeltaE threshold (default CONFLICT_THRESHOLD_DELTA_E)
 * @returns {[number,number][]} Pairs of indices
 */
export function getConflictPairs(colors, type, threshold = CONFLICT_THRESHOLD_DELTA_E) {
  const labSims = colors.map((hex) => {
    const [r, g, b] = hexToRgb(hex);
    const [r2, g2, b2] = simulate(r, g, b, type);
    return rgbToLab(Math.round(r2), Math.round(g2), Math.round(b2));
  });
  const pairs = [];
  for (let i = 0; i < colors.length; i += 1) {
    for (let j = i + 1; j < colors.length; j += 1) {
      const d = deltaE2000(labSims[i][0], labSims[i][1], labSims[i][2], labSims[j][0], labSims[j][1], labSims[j][2]);
      if (d <= threshold) pairs.push([i, j]);
    }
  }
  return pairs;
}

/**
 * Get set of indices that are in any conflict pair.
 */
export function getConflictingIndices(pairs) {
  const set = new Set();
  pairs.forEach(([a, b]) => {
    set.add(a);
    set.add(b);
  });
  return set;
}

/**
 * Simulate hex color for a type; return hex string.
 */
export function simulateHex(hex, type) {
  const [r, g, b] = hexToRgb(hex);
  const [r2, g2, b2] = simulate(r, g, b, type);
  return `#${[r2, g2, b2].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('')}`;
}
