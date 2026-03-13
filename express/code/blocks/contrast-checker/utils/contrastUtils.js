export function hexToRgb(hex) {
  const cleaned = hex.replace(/^#/, '');
  const int = Number.parseInt(cleaned, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

export function rgbToHex(r, g, b) {
  const toHex = (c) => Math.round(c).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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

  if (h < 60) { rP = c; gP = x; bP = 0; }
  else if (h < 120) { rP = x; gP = c; bP = 0; }
  else if (h < 180) { rP = 0; gP = c; bP = x; }
  else if (h < 240) { rP = 0; gP = x; bP = c; }
  else if (h < 300) { rP = x; gP = 0; bP = c; }
  else { rP = c; gP = 0; bP = x; }

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
  for (let i = 0; i < count; i++) {
    const v = (i + 1) / count;
    const rgb = hsvToRgb(h, s, v);
    tints.push(rgbToHex(rgb.r, rgb.g, rgb.b));
  }

  return tints;
}
