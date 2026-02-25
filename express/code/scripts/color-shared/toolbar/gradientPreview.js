/* ── Gradient Preview for Floating Toolbar (isolated – delete to revert) ── */
/* global globalThis */

import { serviceManager } from '../../../libs/services/index.js';
import { createTag } from '../../utils.js';

const FALLBACK_GRADIENTS = [
  { angle: 135, stops: ['#667eea', '#764ba2'], name: 'Twilight Haze' },
  { angle: 90, stops: ['#f093fb', '#f5576c'], name: 'Pink Burst' },
  { angle: 120, stops: ['#4facfe', '#00f2fe'], name: 'Ocean Breeze' },
  { angle: 45, stops: ['#43e97b', '#38f9d7'], name: 'Mint Fresh' },
  { angle: 160, stops: ['#fa709a', '#fee140'], name: 'Sunset Glow' },
  { angle: 180, stops: ['#a18cd1', '#fbc2eb'], name: 'Lavender Dream' },
  { angle: 135, stops: ['#ffecd2', '#fcb69f'], name: 'Warm Sand' },
  { angle: 90, stops: ['#ff9a9e', '#fecfef'], name: 'Rose Petal' },
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildGradientCSS({ angle, stops }) {
  return `linear-gradient(${angle}deg, ${stops.join(', ')})`;
}

function normalizeSwatchHex(s) {
  if (typeof s === 'string') return s.startsWith('#') ? s : `#${s}`;
  if (s.hex) return s.hex.startsWith('#') ? s.hex : `#${s.hex}`;
  if (s.values && s.values.length >= 3) {
    const [r, g, b] = s.values.map((v) => Math.round(Number.parseFloat(v) * 255));
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  }
  return '#000000';
}

export async function fetchRandomGradient() {
  try {
    const provider = await serviceManager.getProvider('kuler');
    if (!provider) return pickRandom(FALLBACK_GRADIENTS);

    const raw = await provider.exploreThemes({
      filter: 'gradient',
      sort: 'random',
      time: 'all',
      page: 1,
    });

    const themes = raw?.themes ?? [];
    if (!themes.length) return pickRandom(FALLBACK_GRADIENTS);

    const theme = pickRandom(themes);
    const swatches = (theme.swatches ?? []).map(normalizeSwatchHex);

    return {
      angle: 135,
      stops: swatches.length >= 2 ? swatches : pickRandom(FALLBACK_GRADIENTS).stops,
      name: theme.name ?? 'Random Gradient',
      id: theme.id,
    };
  } catch (err) {
    globalThis.lana?.log(`Gradient preview fetch failed: ${err.message}`, {
      tags: 'color-floating-toolbar,gradient-preview',
    });
    return pickRandom(FALLBACK_GRADIENTS);
  }
}

export function applyGradientPreview(rootElement, gradient) {
  const oldStrip = rootElement.querySelector('.ax-swatch-strip');
  if (!oldStrip) return;

  const strip = createTag('div', {
    class: 'ax-swatch-strip ax-gradient-strip',
    style: `background: ${buildGradientCSS(gradient)}`,
    'aria-label': `Gradient: ${gradient.stops.join(' → ')}`,
  });

  oldStrip.replaceWith(strip);

  if (gradient.name) {
    const nameInput = rootElement.querySelector('#ax-palette-name-input');
    if (nameInput) nameInput.value = gradient.name;
  }
}
