export function getColorClassName(name) {
  const slug = String(name || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'color';
}

function buildCssSnippet(name, hexColors) {
  const cls = getColorClassName(name);
  return hexColors.map((hex, i) => `.${cls}-${i + 1} { color: ${hex}; }`).join('\n');
}

function buildSassSnippet(name, hexColors) {
  const cls = getColorClassName(name);
  return hexColors.map((hex, i) => `$${cls}-${i + 1}: ${hex};`).join('\n');
}

function buildLessSnippet(name, hexColors) {
  const cls = getColorClassName(name);
  return hexColors.map((hex, i) => `@${cls}-${i + 1}: ${hex};`).join('\n');
}

function buildXmlSnippet(name, hexColors) {
  const cls = getColorClassName(name);
  const rows = hexColors
    .map((hex, i) => `  <color name='${cls}-${i + 1}' hex='${hex.replace('#', '')}' />`)
    .join('\n');
  return `<palette>\n${rows}\n</palette>`;
}

const FORMAT_BUILDERS = {
  CSS: buildCssSnippet,
  SASS: buildSassSnippet,
  LESS: buildLessSnippet,
  XML: buildXmlSnippet,
};

export const COLOR_CODE_FORMATS = Object.keys(FORMAT_BUILDERS);

export function buildColorCodeSnippet(format, name, hexColors) {
  const builder = FORMAT_BUILDERS[format];
  return builder ? builder(name, hexColors) : '';
}
