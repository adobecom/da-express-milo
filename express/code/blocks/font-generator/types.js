/**
 * Font Generator — Module Contract
 *
 * All public interfaces for the font-generator block. Import these typedefs
 * with @import to get IDE completions across every module in this folder.
 *
 * @example
 * // @import { FontDef, State } from './types.js'
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const INITIAL_VISIBLE_COUNT = 12;
export const LOAD_MORE_STEP = 12;
export const DEFAULT_LAYOUT = /** @type {'grid'} */ ('grid');
export const DEFAULT_FONT_SIZE = 40;
export const DEFAULT_FONT_SIZE_MOBILE = 28;
export const FONT_SIZE_MOBILE_BREAKPOINT = 600;
export const FONT_SIZE_MIN = 8;
export const FONT_SIZE_MAX = 100;

// ─── Font data (font-styles.json) ─────────────────────────────────────────────

/**
 * Single-char → unicode-string replacement map.
 * Keys are ASCII source characters; values are one or more unicode codepoints.
 *
 * @typedef {{ [sourceChar: string]: string }} CharacterMap
 */

/**
 * @typedef {'none'
 *   | 'start'
 *   | 'end'
 *   | 'start+end'
 *   | 'repeating-middle+end'
 *   | 'start+repeating-middle+end'} PlacementType
 */

/**
 * Decoration strings that surround each character in a pattern-map font.
 * The `placement` field encodes which of the three positions are non-empty.
 *
 * @typedef {{
 *   placement: PlacementType;
 *   hasStartPattern: boolean;
 *   hasRepeatingMiddlePattern: boolean;
 *   hasEndPattern: boolean;
 *   startPattern: string;
 *   repeatingMiddlePattern: string;
 *   endPattern: string;
 * }} PatternDescriptor
 */

/**
 * Top-level pattern for a font, extended with per-category overrides.
 * `byCategory` is populated only for pattern-map fonts; empty for direct-map.
 *
 * @typedef {PatternDescriptor & {
 *   byCategory: {
 *     letters?: PatternDescriptor;
 *     numbers?: PatternDescriptor;
 *     specialCharacters?: PatternDescriptor;
 *   };
 * }} FontPattern
 */

/**
 * How the font was classified during CSV transformation.
 *
 * - `direct-map`   — each source char maps to a single replacement unicode char
 * - `pattern-map`  — each char has surrounding decoration strings (prefix/suffix/both)
 * - `literal-map`  — source chars appear verbatim inside a patterned style string
 *
 * @typedef {'direct-map' | 'pattern-map' | 'literal-map'} FontType
 */

/**
 * A single font definition. This is the unit consumed by unicodeEngine and FontCard.
 * Every font in font-styles.json has fully-populated `characters` maps for all three
 * categories — `missingCharacters` tracks gaps for informational use only.
 *
 * @typedef {{
 *   id: string;
 *   category: string;
 *   styleName: string;
 *   fontSupported: string;
 *   type: FontType;
 *   pattern: FontPattern;
 *   characters: {
 *     letters: CharacterMap;
 *     numbers: CharacterMap;
 *     specialCharacters: CharacterMap;
 *   };
 *   missingCharacters: {
 *     letters: string[];
 *     numbers: string[];
 *     specialCharacters: string[];
 *   };
 * }} FontDef
 */

/**
 * Root shape of font-styles.json, generated from font-styles.csv by
 * scripts/font-generator/transform.js.
 *
 * @typedef {{
 *   sourceCharacters: {
 *     letters: { uppercase: string; lowercase: string; all: string };
 *     numbers: string;
 *     specialCharacters: string;
 *     all: string;
 *   };
 *   fonts: FontDef[];
 * }} FontSheet
 */

// ─── Application state ────────────────────────────────────────────────────────

/**
 * URL param keys that are persisted across page loads.
 * Values are encoded/decoded by state.js initFromUrl / setState.
 *
 * @typedef {'text' | 'filters' | 'view' | 'size'} UrlParamKey
 */

/**
 * Complete application state. Managed exclusively by state.js.
 * Never construct or mutate this object outside the store.
 *
 * The full font catalog is held privately in state.js (set via initFonts) and
 * exposed for the category taxonomy through getCategories(); it is not part of
 * this snapshot. `activeFonts` is derived — the filter-narrowed subset that
 * drives the toolbar count and grid — and must never be passed to setState.
 * `visibleCount` resets to INITIAL_VISIBLE_COUNT whenever activeFilters changes.
 *
 * @typedef {{
 *   previewText: string;
 *   activeFilters: string[];
 *   layout: 'grid' | 'list';
 *   fontSize: number;
 *   activeFonts: FontDef[];
 *   visibleCount: number;
 * }} State
 */

/**
 * Partial state update passed to setState.
 * `activeFonts` is excluded — it is always derived by the store.
 *
 * @typedef {Partial<Omit<State, 'activeFonts'>>} StateUpdate
 */

/**
 * @callback StateListener
 * @param {State} state - Full state snapshot after the update.
 * @returns {void}
 */

/**
 * @callback Unsubscribe
 * @returns {void}
 */

// ─── store.js public API ──────────────────────────────────────────────────────

/**
 * @typedef {{
 *   getState: () => State;
 *   setState: (update: StateUpdate) => void;
 *   subscribe: (listener: StateListener) => Unsubscribe;
 *   initFromUrl: () => void;
 * }} Store
 */

// ─── unicodeEngine.js public API ──────────────────────────────────────────────

/**
 * Transform a string using a font's character map.
 * Falls back to the original character for any unmapped input.
 *
 * @callback TransformText
 * @param {string} text
 * @param {FontDef} fontDef
 * @returns {string}
 */

// ─── Component API ────────────────────────────────────────────────────────────

/**
 * Standard component initializer. Wires event listeners and store subscriptions.
 * Called once per element by font-generator.js (the block entry point).
 * Returns nothing — cleanup is handled via store unsubscribe internally.
 *
 * @callback ComponentInit
 * @param {HTMLElement} el
 * @returns {void}
 */

/**
 * Filters is a single component mounted in up to two places: the desktop-
 * inline sidebar instance and the mobile/tablet drawer instance inside
 * panel.js. Both are initialized by passing an array/NodeList of host
 * elements; each subscribes to the store independently and stays in sync.
 *
 * @callback FiltersInit
 * @param {NodeListOf<HTMLElement> | HTMLElement[]} elements
 * @returns {void}
 */

/**
 * FontCard is purely presentational — no store subscription, no side effects.
 * FontCardGrid is the only caller; it passes current state slices directly.
 *
 * @callback CreateFontCard
 * @param {FontDef} fontDef
 * @param {string} previewText
 * @param {number} fontSize
 * @returns {HTMLElement}
 */
