import { createTag } from '../../utils.js';

function interpolate(tpl, vars) {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), tpl);
}

function createSwatchStrip(colors, type, t) {
  const safeColors = colors ?? [];
  const count = Math.min(safeColors.length, 10);
  const swatches = safeColors.slice(0, 10).map((hex, i) => createTag('div', {
    class: 'ax-swatch',
    style: `background-color:${hex}`,
    'aria-label': interpolate(t.swatchLabel, { index: i + 1, hex }),
  }));
  return createTag('div', {
    class: 'ax-swatch-strip',
    'aria-label': interpolate(t.swatchStripLabel, { count, type }),
  }, swatches);
}

function createGradientStrip(colors, angle, t) {
  const stops = colors ?? [];
  const deg = angle ?? 135;
  const css = `linear-gradient(${deg}deg, ${stops.join(', ')})`;
  return createTag('div', {
    class: 'ax-swatch-strip ax-gradient-strip',
    style: `background: ${css}`,
    'aria-label': interpolate(t.gradientLabel, { stops: stops.join(' → ') }),
  });
}

/** Condensed multi-swatch/gradient strip — the "Palette summary" component
 * from Figma. Shared by the toolbar footer (createToolbarComponent.js) and
 * the mobile/tablet palette-summary bar mounted above the swatch rail
 * (createPaletteModalContent.js / createLibraryThemeModalContent.js). */
// eslint-disable-next-line import/prefer-default-export
export function createColorStrip(colors, type, angle, t) {
  return type === 'gradient'
    ? createGradientStrip(colors, angle, t)
    : createSwatchStrip(colors, type, t);
}
