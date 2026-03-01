#!/usr/bin/env node
/**
 * Fetch design variables from Figma REST API and output CSS custom properties.
 * Spec: Final Color Expansion CCEX-221263
 *   https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/
 *     Final-Color-Expansion-CCEX-221263?node-id=6215-344297
 *   https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/
 *     Final-Color-Expansion-CCEX-221263?node-id=6215-344299 (strip container)
 *
 * Usage:
 *   FIGMA_ACCESS_TOKEN=your_token node tools/figma-variables-to-css.js
 *   FIGMA_ACCESS_TOKEN=your_token node tools/figma-variables-to-css.js \
 *     > express/code/scripts/color-shared/components/strips/color-strip-figma.css
 *
 * Requires: file_variables:read scope for GET /v1/files/:file_key/variables/local
 * Docs: https://developers.figma.com/docs/rest-api/variables-endpoints/
 */

const FIGMA_FILE_KEY = 'mcJuQTxJdWsL0dMmqaecpn';
const FIGMA_API_BASE = 'https://api.figma.com';

function cssCustomPropertyName(name) {
  if (!name || typeof name !== 'string') return null;
  return `--figma-${name.replace(/\s+/g, '-').replace(/\//g, '-').toLowerCase().replace(/[^a-z0-9-]/gi, '')}`;
}

function valueToCss(value, resolvedType) {
  if (value == null) return null;
  if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') return null;
  if (resolvedType === 'COLOR') {
    const c = value;
    const r = typeof c.r === 'number' ? Math.round(c.r * 255) : 0;
    const g = typeof c.g === 'number' ? Math.round(c.g * 255) : 0;
    const b = typeof c.b === 'number' ? Math.round(c.b * 255) : 0;
    const a = typeof c.a === 'number' ? c.a : 1;
    if (a < 1) return `rgba(${r}, ${g}, ${b}, ${a})`;
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  if (resolvedType === 'FLOAT') {
    const n = Number(value);
    return Number.isFinite(n) ? `${n}px` : String(value);
  }
  if (resolvedType === 'STRING') {
    const s = String(value).trim();
    if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return s;
    if (/^\d+(\.\d+)?$/.test(s)) return `${s}px`;
    return s;
  }
  if (resolvedType === 'BOOLEAN') return value ? '1' : '0';
  return String(value);
}

async function fetchLocalVariables(fileKey, token) {
  const url = `${FIGMA_API_BASE}/v1/files/${fileKey}/variables/local`;
  const res = await fetch(url, {
    headers: { 'X-Figma-Token': token },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Figma API ${res.status}: ${text}`);
  }
  return res.json();
}

function variablesToCss(apiResponse) {
  const lines = [
    '/* Generated from Figma REST API - do not edit by hand */',
    '/* GET /v1/files/:file_key/variables/local */',
    '/* Spec: Final Color Expansion CCEX-221263 node-id=6215-344297 */',
    '',
    ':root {',
  ];
  const vars = apiResponse?.meta?.variables;
  const collections = apiResponse?.meta?.variableCollections || {};
  if (!vars || typeof vars !== 'object') return `${lines.join('\n')}\n}\n`;

  for (const [id, variable] of Object.entries(vars)) {
    const name = variable.name || variable.key || id;
    const cssName = variable.codeSyntax?.WEB || cssCustomPropertyName(name);
    const prop = cssName.startsWith('--')
      ? cssName
      : `--figma-${cssName}`;
    const resolvedType = variable.resolvedType || 'STRING';
    const valuesByMode = variable.valuesByMode || {};
    const collection = variable.variableCollectionId
      ? collections[variable.variableCollectionId]
      : null;
    const defaultModeId = collection?.defaultModeId;
    const modeIds = Object.keys(valuesByMode);
    const value = valuesByMode[defaultModeId] ?? valuesByMode[modeIds[0]];
    const cssValue = valueToCss(value, resolvedType);
    if (cssValue != null) lines.push(`  ${prop}: ${cssValue};`);
  }
  lines.push('}');
  return lines.join('\n');
}

async function main() {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    // eslint-disable-next-line no-console
    console.error('Set FIGMA_ACCESS_TOKEN to run this script.');
    process.exit(1);
  }
  try {
    const data = await fetchLocalVariables(FIGMA_FILE_KEY, token);
    const css = variablesToCss(data);
    // eslint-disable-next-line no-console
    console.log(css);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e.message);
    process.exit(1);
  }
}

main();
