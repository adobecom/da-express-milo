// @import { FontDef, FontType } from './types.js'

const MAX_INPUT_LENGTH = 500;

const VALID_FONT_TYPES = /** @type {Set<FontType>} */ (
  new Set(['direct-map', 'pattern-map', 'literal-map'])
);

// ─── Validation ───────────────────────────────────────────────────────────────

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Structural type guard — checks shape, not every character entry.
 * Call once per font load, not on every transform.
 *
 * @param {unknown} fontDef
 * @returns {fontDef is FontDef}
 */
export function isValidFontDef(fontDef) {
  if (!isPlainObject(fontDef)) return false;
  const f = /** @type {Record<string, unknown>} */ (fontDef);
  if (typeof f.id !== 'string' || f.id.length === 0) return false;
  if (!VALID_FONT_TYPES.has(/** @type {FontType} */ (f.type))) return false;
  if (!isPlainObject(f.characters)) return false;
  const c = /** @type {Record<string, unknown>} */ (f.characters);
  return isPlainObject(c.letters)
    && isPlainObject(c.numbers)
    && isPlainObject(c.specialCharacters);
}

// ─── Lookup map ───────────────────────────────────────────────────────────────

/**
 * Merges the three character category maps into a single null-prototype object.
 * Null prototype prevents prototype-chain pollution (no __proto__, toString, etc.).
 *
 * @param {FontDef} fontDef
 * @returns {Record<string, string>}
 */
function buildLookupMap(fontDef) {
  const map = /** @type {Record<string, string>} */ (Object.create(null));
  const { letters, numbers, specialCharacters } = fontDef.characters;
  const sources = [letters, numbers, specialCharacters];
  for (const source of sources) {
    for (const key of Object.keys(source)) {
      const value = source[key];
      if (typeof key === 'string' && typeof value === 'string') {
        map[key] = value;
      }
    }
  }
  return map;
}

// ─── Pattern fallback ─────────────────────────────────────────────────────────

/**
 * Determines which character-map category an unmapped character belongs to
 * so we can apply the right decoration as a fallback.
 *
 * Regex tests only the single resolved character — user input is never used
 * as a pattern.
 *
 * @param {string} char - a single character (may be multi-code-unit for emoji)
 * @returns {'letters' | 'numbers' | 'specialCharacters'}
 */
function resolveCategory(char) {
  if (/^\p{N}$/u.test(char)) return 'numbers';
  if (/^\p{L}$/u.test(char)) return 'letters';
  return 'specialCharacters';
}

/**
 * Extracts the combining decoration from a known source→output pair so it can
 * be applied to arbitrary unmapped characters of the same category.
 *
 * Works by locating the source character within its mapped output, then
 * slicing out whatever comes after it. Returns null when the mapped value
 * is a full substitution (direct-map), since no decoration can be derived.
 *
 * @param {string} sourceChar
 * @param {string} mappedValue
 * @returns {{ prefix: string; suffix: string } | null}
 */
function deriveDecoration(sourceChar, mappedValue) {
  const idx = mappedValue.indexOf(sourceChar);
  if (idx === -1) return null;
  return {
    prefix: mappedValue.slice(0, idx),
    suffix: mappedValue.slice(idx + sourceChar.length),
  };
}

/**
 * Returns the decoration to apply to an unmapped character by sampling the
 * first entry of the relevant category map. Returns null when no coherent
 * decoration can be derived (direct-map fonts, or empty category).
 *
 * @param {FontDef} fontDef
 * @param {'letters' | 'numbers' | 'specialCharacters'} category
 * @returns {{ prefix: string; suffix: string } | null}
 */
function getCategoryDecoration(fontDef, category) {
  const categoryMap = fontDef.characters[category];
  const entries = Object.entries(categoryMap);
  if (entries.length === 0) return null;
  const [sourceChar, mappedValue] = entries[0];
  return deriveDecoration(sourceChar, mappedValue);
}

/**
 * Applies a category's decoration to an arbitrary character.
 * Returns the original character unchanged when no decoration is available.
 *
 * @param {string} char
 * @param {FontDef} fontDef
 * @returns {string}
 */
function applyFallbackDecoration(char, fontDef) {
  if (fontDef.type !== 'pattern-map') return char;
  const category = resolveCategory(char);
  const decoration = getCategoryDecoration(fontDef, category);
  if (!decoration) return char;
  return `${decoration.prefix}${char}${decoration.suffix}`;
}

/**
 * Whole-string pattern fonts keep character maps as identity values and store
 * their decoration in `fontDef.pattern`. Combining-mark fonts keep decoration
 * baked into each mapped character and should not receive this envelope.
 *
 * @param {FontDef} fontDef
 * @returns {boolean}
 */
function usesWholeTextPattern(fontDef) {
  if (fontDef.type !== 'pattern-map' || !isPlainObject(fontDef.pattern)) return false;
  const {
    hasStartPattern,
    hasRepeatingMiddlePattern,
    hasEndPattern,
  } = /** @type {Record<string, unknown>} */ (fontDef.pattern);
  const hasPattern = Boolean(
    hasStartPattern
      || hasRepeatingMiddlePattern
      || hasEndPattern,
  );
  if (!hasPattern) return false;

  return Object.values(fontDef.characters).every((categoryMap) => (
    Object.entries(categoryMap).every(([sourceChar, mappedValue]) => mappedValue === sourceChar)
  ));
}

/**
 * @param {string[]} mappedCharacters
 * @param {FontDef} fontDef
 * @returns {string}
 */
function applyWholeTextPattern(mappedCharacters, fontDef) {
  if (mappedCharacters.length === 0) return '';
  const {
    hasRepeatingMiddlePattern,
    startPattern: maybeStartPattern,
    repeatingMiddlePattern: maybeMiddlePattern,
    endPattern: maybeEndPattern,
  } = /** @type {Record<string, unknown>} */ (fontDef.pattern);
  const startPattern = typeof maybeStartPattern === 'string' ? maybeStartPattern : '';
  const middlePattern = typeof maybeMiddlePattern === 'string'
    ? maybeMiddlePattern
    : '';
  const endPattern = typeof maybeEndPattern === 'string' ? maybeEndPattern : '';
  const mappedValue = hasRepeatingMiddlePattern
    ? mappedCharacters.join(middlePattern)
    : mappedCharacters.join('');
  return `${startPattern}${mappedValue}${endPattern}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Transforms a string using the given font definition.
 *
 * - Characters present in the font's map are substituted directly.
 * - Whole-string patterns apply start/end wrappers and repeating separators
 *   from the generated font metadata.
 * - For pattern-map fonts, unmapped characters receive the same combining
 *   decoration as their category peers (e.g. an accented letter gets the
 *   same strike-through as plain ASCII letters).
 * - For direct-map and literal-map fonts, unmapped characters pass through.
 * - Returns the original text on invalid input rather than throwing.
 *
 * Input is capped at MAX_INPUT_LENGTH (500 chars) before processing.
 * User input is never used as a regex pattern.
 *
 * @type {import('./types.js').TransformText}
 */
export function transformText(text, fontDef) {
  if (typeof text !== 'string') return '';
  if (!isValidFontDef(fontDef)) return typeof text === 'string' ? text : '';

  const safeText = text.length > MAX_INPUT_LENGTH ? text.slice(0, MAX_INPUT_LENGTH) : text;
  const map = buildLookupMap(fontDef);

  const mappedCharacters = [...safeText].map((char) => {
    if (Object.prototype.hasOwnProperty.call(map, char)) return map[char];
    return applyFallbackDecoration(char, fontDef);
  });

  if (usesWholeTextPattern(fontDef)) {
    return applyWholeTextPattern(mappedCharacters, fontDef);
  }

  return mappedCharacters.join('');
}

/**
 * Finds a font definition by its slugified ID.
 * Returns undefined rather than throwing on bad input.
 *
 * @param {FontDef[]} fonts
 * @param {string} id
 * @returns {FontDef | undefined}
 */
export function getFontById(fonts, id) {
  if (!Array.isArray(fonts) || typeof id !== 'string' || id.length === 0) return undefined;
  return fonts.find((f) => isValidFontDef(f) && f.id === id);
}
