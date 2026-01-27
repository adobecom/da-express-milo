/** ***********************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
* Copyright 2019 Adobe
* All Rights Reserved.
*
* NOTICE: All information contained herein is, and remains
* the property of Adobe and its suppliers, if any. The intellectual
* and technical concepts contained herein are proprietary to Adobe
* and its suppliers and are protected by all applicable intellectual
* property laws, including trade secret and copyright laws.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe.
************************************************************************* */

export const hexToString = (value) => {
  let hex = value.toString(16);

  hex = '000000'.substr(0, 6 - hex.length) + hex;
  return hex;
};
export const rgbToHsv = (rgb) => {
  let h = 0;

  const { r } = rgb;
  const { g } = rgb;
  const { b } = rgb;
  // Faster version of Math.min(r, g, b);
  /* eslint-disable no-extra-parens */
  const min = (r < g && r < b) ? r : (g < b) ? g : b;
  const v = (r > g && r > b) ? r : (g > b) ? g : b;
  // Faster version of Math.max(r, g, b)
  const s = (v === 0) ? 0 : (v - min) / v;
  const delta = (s === 0) ? 0.00001 : v - min;
  /* eslint-enable no-extra-parens */

  switch (v) {
    case r: {
      h = (g - b) / delta;
      break;
    }
    case g: {
      h = 2 + (b - r) / delta;
      break;
    }
    case b: {
      h = 4 + (r - g) / delta;
      break;
    }
    default: {
      break;
    }
  }
  return {
    h: (1000 + h / 6) % 1,
    s,
    v,
  };
};
export const hsvToRgb = (hsv) => {
  let { h } = hsv;
  let r = 0;
  let g = 0;
  let b = 0;

  const { s } = hsv;
  const { v } = hsv;
  // Keep in positive 0-1 range.
  const i = h * 6 >> 0;
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - s * f);
  const t = v * (1 - s * (1 - f));

  h = (h + 1000) % 1;

  switch (i) {
    case 0: {
      r = v;
      g = t;
      b = p;
      break;
    }
    case 1: {
      r = q;
      g = v;
      b = p;
      break;
    }
    case 2: {
      r = p;
      g = v;
      b = t;
      break;
    }
    case 3: {
      r = p;
      g = q;
      b = v;
      break;
    }
    case 4: {
      r = t;
      g = p;
      b = v;
      break;
    }
    case 5: {
      r = v;
      g = p;
      b = q;
      break;
    }
    default: {
      break;
    }
  }
  return { r, g, b };
};
export const rgbToCmyk = (rgb) => {
  let c = 1 - rgb.r;
  let m = 1 - rgb.g;
  let y = 1 - rgb.b;
  // Faster version of Math.min(c, m, y);
  /* eslint-disable no-extra-parens */
  const k = (c < m && c < y) ? c : (m < y) ? m : y;
  /* eslint-enable no-extra-parens */

  if (k === 1) {
    /* eslint-disable no-multi-assign */
    c = m = y = 0;
    /* eslint-enable no-multi-assign */
  } else {
    c = (c - k) / (1 - k);
    m = (m - k) / (1 - k);
    y = (y - k) / (1 - k);
  }
  return { c, m, y, k };
};
export const cmykToRgb = (cmyk) => {
  const { k } = cmyk;

  return {
    r: 1 - (cmyk.c * (1 - k) + k),
    g: 1 - (cmyk.m * (1 - k) + k),
    b: 1 - (cmyk.y * (1 - k) + k),
  };
};
export const rgbToXyz = (rgb) => {
  let { r } = rgb;
  let { g } = rgb;
  let { b } = rgb;

  r = r > 0.04045 ? ((r + 0.055) / 1.055) ** 2.4 : r / 12.92;
  g = g > 0.04045 ? ((g + 0.055) / 1.055) ** 2.4 : g / 12.92;
  b = b > 0.04045 ? ((b + 0.055) / 1.055) ** 2.4 : b / 12.92;
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) * 100 / 95.047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) * 100 / 108.883;

  return { x, y, z };
};
export const xyzToRgb = (xyz) => {
  let { x } = xyz;
  let { z } = xyz;

  const { y } = xyz;

  // Multiply by white point, 2 degree D65
  x *= 95.047 / 100;
  z *= 108.883 / 100;

  let r = 3.24063 * x - 1.53721 * y - 0.498629 * z;
  let g = -0.968931 * x + 1.87576 * y + 0.0415175 * z;
  let b = 0.0557101 * x - 0.204021 * y + 1.057 * z;

  r = r > 0.0031308 ? 1.055 * r ** 0.4167 - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * g ** 0.4167 - 0.055 : 12.92 * g;
  b = b > 0.0031308 ? 1.055 * b ** 0.4167 - 0.055 : 12.92 * b;

  /* eslint-disable arrow-body-style */
  const limit01 = (val) => {
    return val < 0 ? 0 : val > 1 ? 1 : val;
  };
  /* eslint-enable arrow-body-style */

  r = limit01(r);
  g = limit01(g);
  b = limit01(b);

  return { r, g, b };
};
export const rgbToLab = (rgb) => {
  const xyz = rgbToXyz(rgb);
  const { x } = xyz;
  const { y } = xyz;
  const { z } = xyz;
  const fx = x > 0.008856 ? x ** (1 / 3) : 7.787 * x + 0.1379;
  const fy = y > 0.008856 ? y ** (1 / 3) : 7.787 * y + 0.1379;
  const fz = z > 0.008856 ? z ** (1 / 3) : 7.787 * z + 0.1379;

  return {
    l: (116 * fy - 16) / 100.00,
    a: (500 * (fx - fy) + 0x80) / 0xFF,
    b: (200 * (fy - fz) + 0x80) / 0xFF,
  };
};
export const labToRgb = (lab) => {
  const y = (lab.l * 100 + 16) / 116;
  const x = y + (lab.a * 0xFF - 0x80) / 500;
  const z = y - (lab.b * 0xFF - 0x80) / 200;

  return xyzToRgb({
    x: x > 0.2069 ? x * x * x : 0.1284 * (x - 0.1379),
    y: y > 0.2069 ? y * y * y : 0.1284 * (y - 0.1379),
    z: z > 0.2069 ? z * z * z : 0.1284 * (z - 0.1379),
  });
};
export const labToLABInverse = (lab) => {
  const op = [];

  op[0] = lab[0] / 100;
  op[1] = (lab[1] + 0x80) / 0xFF;
  op[2] = (lab[2] + 0x80) / 0xFF;
  return op;
};
export const valuesToRgb = (mode, values) => {
  let rgb; let lab; let cmyk; let
    hsv;

  switch (mode) {
    case 'lab': {
      lab = {
        l: values[0],
        a: values[1],
        b: values[2],
      };
      rgb = labToRgb(lab);
      break;
    }
    case 'rgb': {
      rgb = {
        r: values[0],
        g: values[1],
        b: values[2],
      };
      break;
    }
    case 'cmyk': {
      cmyk = {
        c: values[0],
        m: values[1],
        y: values[2],
        k: values[3],
      };
      rgb = cmykToRgb(cmyk);
      break;
    }
    case 'hsv': {
      hsv = {
        h: values[0],
        s: values[1],
        v: values[2],
      };
      rgb = hsvToRgb(hsv);
      break;
    }
    default: {
      rgb = {
        r: 0,
        g: 0,
        b: 0,
      };
      break;
    }
  }
  /* eslint-disable arrow-body-style */
  const limit01 = (val) => {
    return val < 0 ? 0 : val > 1 ? 1 : val;
  };
  /* eslint-enable arrow-body-style */

  rgb = {
    r: limit01(rgb.r),
    g: limit01(rgb.g),
    b: limit01(rgb.b),
  };

  return rgb;
};
export const valuesToHex = (mode, values) => {
  const rgb = valuesToRgb(mode, values);

  /* eslint-disable no-bitwise */
  return hexToString((Math.round(rgb.r * 255) << 16 | Math.round(rgb
    .g * 255) << 8 | Math.round(rgb.b * 255)) >>> 0).toUpperCase();
  /* eslint-enable no-bitwise */
};
export const saturate = (colors) => {
  let { cmyk, hex, hsv, lab, rgb } = colors;

  cmyk = {
    c: Math.round(cmyk.c * 100),
    m: Math.round(cmyk.m * 100),
    y: Math.round(cmyk.y * 100),
    k: Math.round(cmyk.k * 100),
  };
  rgb = {
    r: Math.round(rgb.r * 255),
    g: Math.round(rgb.g * 255),
    b: Math.round(rgb.b * 255),
  };
  hsv = {
    h: Math.round(hsv.h * 360),
    s: Math.round(hsv.s * 100),
    v: Math.round(hsv.v * 100),
  };
  lab = {
    l: Math.round(lab.l * 100),
    a: Math.round(lab.a * 0xFF - 0x80),
    b: Math.round(lab.b * 0xFF - 0x80),
  };

  return { cmyk, hex, hsv, lab, rgb };
};
export const valuesToAllSpaces = (mode, values) => {
  let cmyk; let hex; let hsv; let lab; let
    rgb;

  switch (mode) {
    case 'rgb': {
      hex = valuesToHex(mode, values);
      rgb = {
        r: values[0],
        g: values[1],
        b: values[2],
      };
      cmyk = rgbToCmyk(rgb);
      lab = rgbToLab(rgb);
      hsv = rgbToHsv(rgb);
      break;
    }
    case 'hsv': {
      hsv = {
        h: values[0],
        s: values[1],
        v: values[2],
      };
      rgb = hsvToRgb(hsv);
      hex = valuesToHex('rgb', [rgb.r, rgb.g, rgb.b]);
      cmyk = rgbToCmyk(rgb);
      lab = rgbToLab(rgb);
      break;
    }
    case 'cmyk': {
      cmyk = {
        c: values[0],
        m: values[1],
        y: values[2],
        k: values[3],
      };
      rgb = cmykToRgb(cmyk);
      hex = valuesToHex('rgb', [rgb.r, rgb.g, rgb.b]);
      lab = rgbToLab(rgb);
      hsv = rgbToHsv(rgb);
      break;
    }
    case 'lab': {
      lab = {
        l: values[0],
        a: values[1],
        b: values[2],
      };
      rgb = labToRgb(lab);
      hex = valuesToHex('rgb', [rgb.r, rgb.g, rgb.b]);
      cmyk = rgbToCmyk(rgb);
      hsv = rgbToHsv(rgb);
      break;
    }
    default: {
      hex = '';
      rgb = { r: 0, g: 0, b: 0 };
      cmyk = { c: 0, m: 0, y: 0, k: 0 };
      lab = { l: 0, a: 0, b: 0 };
      hsv = { h: 0, s: 0, v: 0 };
      break;
    }
  }

  return { hex, rgb, cmyk, lab, hsv };
};
export const denormalizedValuesToAllSpaces = (colors) => saturate(colors);
export const normalizeRGB = (color) => Array.from(color).map((x) => x / 255);
export const normalizeHSV = (color) => [color[0] / 360, color[1] / 100, color[2] / 100];
export const normalizeLAB = (color) => labToLABInverse(Array.from(color));
export const hsvToAllSpacesDenormalized = (values) => denormalizedValuesToAllSpaces(valuesToAllSpaces('hsv', normalizeHSV(values)));
export const rgbToAllSpacesDenormalized = (values) => denormalizedValuesToAllSpaces(valuesToAllSpaces('rgb', normalizeRGB(values)));
