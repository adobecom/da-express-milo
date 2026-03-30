export function convertsRGBToLinearRGB({ r, g, b }) {
  const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return { r: toLinear(r), g: toLinear(g), b: toLinear(b) };
}

export function convertLinearRGBToXYZ({ r, g, b }) {
  return {
    x: 0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
    y: 0.2126729 * r + 0.7151522 * g + 0.072175 * b,
    z: 0.0193339 * r + 0.119192 * g + 0.9503041 * b,
  };
}

export function convertXYZtoxyY({ x, y, z }) {
  const sum = x + y + z;
  if (sum === 0) return { x: 0, y: 0, Y: 0 };
  return { x: x / sum, y: y / sum, Y: y };
}

export function convertxyYtoXYZ({ x, y, Y }) {
  if (y === 0) return { x: 0, y: 0, z: 0 };
  return {
    x: (x * Y) / y,
    y: Y,
    z: ((1 - x - y) * Y) / y,
  };
}

export function convertXYZtoLinearRGB({ x, y, z }) {
  return {
    r: 3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
    g: -0.969266 * x + 1.8760108 * y + 0.041556 * z,
    b: 0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
  };
}

export function convertLinearToSRGB({ r, g, b }) {
  const toSRGB = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * (c ** (1 / 2.4)) - 0.055);
  return { r: toSRGB(r), g: toSRGB(g), b: toSRGB(b) };
}

export function convertsRGBtoxyY({ r, g, b }) {
  const linear = convertsRGBToLinearRGB({ r, g, b });
  const xyz = convertLinearRGBToXYZ(linear);
  return convertXYZtoxyY(xyz);
}

export function convertxyYtosRGB({ x, y, Y }) {
  const xyz = convertxyYtoXYZ({ x, y, Y });
  const linear = convertXYZtoLinearRGB(xyz);
  return convertLinearToSRGB(linear);
}

export function deNormalizeRGB({ r, g, b }) {
  const clampAndRound = (c) => Math.round(Math.min(255, Math.max(0, c * 255)));
  return { r: clampAndRound(r), g: clampAndRound(g), b: clampAndRound(b) };
}

const EPSILON = 0.001;

export function isInRGBGamut({ r, g, b }) {
  return r >= -EPSILON && r <= 1 + EPSILON
    && g >= -EPSILON && g <= 1 + EPSILON
    && b >= -EPSILON && b <= 1 + EPSILON;
}
