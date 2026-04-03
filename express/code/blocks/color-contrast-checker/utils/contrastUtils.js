export function hexToRgb(hex) {
  const cleaned = hex.replace(/^#/, '');
  const int = Number.parseInt(cleaned, 16);
  /* eslint-disable no-bitwise */
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
  /* eslint-enable no-bitwise */
}

export function rgbToHex(r, g, b) {
  const toHex = (c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function rgbToHsv(r, g, b) {
  const rP = r / 255;
  const gP = g / 255;
  const bP = b / 255;

  const cMax = Math.max(rP, gP, bP);
  const cMin = Math.min(rP, gP, bP);
  const delta = cMax - cMin;

  let h = 0;
  if (delta !== 0) {
    if (cMax === rP) {
      h = 60 * (((gP - bP) / delta) % 6);
    } else if (cMax === gP) {
      h = 60 * ((bP - rP) / delta + 2);
    } else {
      h = 60 * ((rP - gP) / delta + 4);
    }
  }
  if (h < 0) h += 360;

  const s = cMax === 0 ? 0 : delta / cMax;
  const v = cMax;

  return { h, s, v };
}

export function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let rP;
  let gP;
  let bP;

  if (h < 60) {
    [rP, gP, bP] = [c, x, 0];
  } else if (h < 120) {
    [rP, gP, bP] = [x, c, 0];
  } else if (h < 180) {
    [rP, gP, bP] = [0, c, x];
  } else if (h < 240) {
    [rP, gP, bP] = [0, x, c];
  } else if (h < 300) {
    [rP, gP, bP] = [x, 0, c];
  } else {
    [rP, gP, bP] = [c, 0, x];
  }

  return {
    r: (rP + m) * 255,
    g: (gP + m) * 255,
    b: (bP + m) * 255,
  };
}

export function generateTints(hex, count = 20) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s } = rgbToHsv(r, g, b);

  const tints = [];
  for (let i = 0; i < count; i += 1) {
    const v = (i + 1) / count;
    const rgb = hsvToRgb(h, s, v);
    tints.push(rgbToHex(rgb.r, rgb.g, rgb.b));
  }

  return tints;
}
