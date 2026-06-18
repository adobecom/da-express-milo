import { libraryGradientToModalGradient } from './libraryDownloadUtils.js';

function interpolate(template, vars = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => (vars[key] != null ? vars[key] : ''));
}

export function formatSavedCount(count, strings = {}) {
  const total = Number.isFinite(count) ? count : 0;
  const template = total === 1
    ? strings.librariesSavedLibrary
    : strings.librariesSavedLibraries;
  return interpolate(template, { count: total });
}

export function formatLibraryCounts(library, strings = {}) {
  const themes = library.themeCount ?? library.themes ?? 0;
  const gradients = library.gradientCount ?? library.gradients ?? 0;
  const themeTpl = themes === 1
    ? strings.librariesCountTheme : strings.librariesCountThemes;
  const gradientTpl = gradients === 1
    ? strings.librariesCountGradient : strings.librariesCountGradients;
  const themeLabel = interpolate(themeTpl, { count: themes });
  const gradientLabel = interpolate(gradientTpl, { count: gradients });
  return `${themeLabel}, ${gradientLabel}`;
}

export function getSizeClass(size) {
  if (size === 'm' || size === 's') return 'm-s';
  return 'l';
}

/**
 * Build a CSS linear-gradient for library card / strip previews.
 * @param {Object} item - library gradient item with CC Library colorStops
 */
export function libraryGradientToBackgroundImage(item) {
  const { angle, colorStops, gradient } = libraryGradientToModalGradient(item);
  if (gradient && typeof gradient === 'string') {
    return gradient.replace(
      /linear-gradient\(\s*\d+deg/,
      `linear-gradient(${angle ?? 90}deg`,
    );
  }
  if (colorStops.length) {
    const stops = colorStops
      .map((stop) => `${stop.color} ${Math.round((stop.position ?? 0) * 100)}%`)
      .join(', ');
    return `linear-gradient(${angle ?? 90}deg, ${stops})`;
  }
  return 'linear-gradient(90deg, #ccc, #999)';
}
