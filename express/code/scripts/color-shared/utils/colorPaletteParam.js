import { pickRandomPalette } from './colorPaletteDefaults.js';

export const PARAM_NAME = 'color-palette';

const HEX_3 = /^[0-9a-f]{3}$/i;
const HEX_6 = /^[0-9a-f]{6}$/i;

export function normalizeHex(segment) {
  if (segment == null) return null;
  const trimmed = String(segment).trim().replace(/^#/, '');
  if (HEX_6.test(trimmed)) return `#${trimmed.toUpperCase()}`;
  if (HEX_3.test(trimmed)) {
    const [r, g, b] = trimmed;
    return `#${(r + r + g + g + b + b).toUpperCase()}`;
  }
  return null;
}

export function createColorPaletteParamApi() {
  function getResolvedPalette(urlOrString) {
    let url;
    try {
      url = new URL(urlOrString || window.location.href);
    } catch {
      return pickRandomPalette().colors;
    }

    const raw = url.searchParams.get(PARAM_NAME);
    if (!raw || !raw.trim()) return pickRandomPalette().colors;

    const segments = raw.split(',');
    const normalized = [];
    for (const seg of segments) {
      const hex = normalizeHex(seg);
      if (!hex) return pickRandomPalette().colors;
      normalized.push(hex);
    }
    return normalized;
  }

  function setOnUrl(url, colors, { merge = 'replace' } = {}) {
    const normalized = colors
      .map((c) => normalizeHex(c))
      .filter(Boolean)
      .map((hex) => hex.slice(1));

    if (!normalized.length) return;

    if (merge === 'append') {
      const existing = url.searchParams.get(PARAM_NAME);
      if (existing) {
        url.searchParams.set(PARAM_NAME, `${existing},${normalized.join(',')}`);
        return;
      }
    }

    url.searchParams.set(PARAM_NAME, normalized.join(','));
  }

  return {
    getResolvedPalette,
    setOnUrl,
    PARAM_NAME,
  };
}
