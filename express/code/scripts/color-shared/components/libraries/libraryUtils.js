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
