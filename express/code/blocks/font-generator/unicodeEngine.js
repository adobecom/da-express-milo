// Builds char→glyph lookup from consecutive Unicode code-point ranges.
// `exceptions` overrides specific chars where the range has gaps (e.g. script E, fraktur C).
function buildMap(upperStart, lowerStart, digitStart = null, exceptions = {}) {
  const map = {};
  for (let i = 0; i < 26; i++) {
    const upper = String.fromCharCode(65 + i);
    const lower = String.fromCharCode(97 + i);
    map[upper] = exceptions[upper] ?? String.fromCodePoint(upperStart + i);
    map[lower] = exceptions[lower] ?? String.fromCodePoint(lowerStart + i);
  }
  if (digitStart !== null) {
    for (let i = 0; i < 10; i++) {
      const digit = String(i);
      map[digit] = exceptions[digit] ?? String.fromCodePoint(digitStart + i);
    }
  }
  return map;
}

// All fonts available to the font generator.
// Fonts with no 1:1 code-point mapping use a `transform` function instead of `map`.
export const allFonts = [
  {
    id: 'bold',
    name: 'Bold',
    category: 'serif',
    map: buildMap(0x1D400, 0x1D41A, 0x1D7CE),
  },
  {
    id: 'italic',
    name: 'Italic',
    category: 'serif',
    // h has no italic variant in the math block; U+210E is the script italic h
    map: buildMap(0x1D434, 0x1D44E, null, { h: '\u{210E}' }),
  },
  {
    id: 'bold-italic',
    name: 'Bold Italic',
    category: 'serif',
    map: buildMap(0x1D468, 0x1D482),
  },
  {
    id: 'script',
    name: 'Script',
    category: 'script',
    // Several script capitals and lowercase letters have dedicated Unicode points
    // outside the main math-script block (Unicode Standard §22.1)
    map: buildMap(0x1D49C, 0x1D4B6, null, {
      B: '\u{212C}', E: '\u{2130}', F: '\u{2131}', H: '\u{210B}',
      I: '\u{2110}', L: '\u{2112}', M: '\u{2133}', R: '\u{211B}',
      e: '\u{212F}', g: '\u{210A}', o: '\u{2134}',
    }),
  },
  {
    id: 'bold-script',
    name: 'Bold Script',
    category: 'script',
    map: buildMap(0x1D4D0, 0x1D4EA),
  },
  {
    id: 'fraktur',
    name: 'Fraktur',
    category: 'gothic',
    map: buildMap(0x1D504, 0x1D51E, null, {
      C: '\u{212D}', H: '\u{210C}', I: '\u{2111}', R: '\u{211C}', Z: '\u{2128}',
    }),
  },
  {
    id: 'double-struck',
    name: 'Double-struck',
    category: 'gothic',
    map: buildMap(0x1D538, 0x1D552, 0x1D7D8, {
      C: '\u{2102}', H: '\u{210D}', N: '\u{2115}', P: '\u{2119}',
      Q: '\u{211A}', R: '\u{211D}', Z: '\u{2124}',
    }),
  },
  {
    id: 'sans',
    name: 'Sans-serif',
    category: 'sans',
    map: buildMap(0x1D5A0, 0x1D5BA, 0x1D7E2),
  },
  {
    id: 'sans-bold',
    name: 'Sans Bold',
    category: 'sans',
    map: buildMap(0x1D5D4, 0x1D5EE, 0x1D7EC),
  },
  {
    id: 'sans-italic',
    name: 'Sans Italic',
    category: 'sans',
    map: buildMap(0x1D608, 0x1D622),
  },
  {
    id: 'sans-bold-italic',
    name: 'Sans Bold Italic',
    category: 'sans',
    map: buildMap(0x1D63C, 0x1D656),
  },
  {
    id: 'monospace',
    name: 'Monospace',
    category: 'mono',
    map: buildMap(0x1D670, 0x1D68A, 0x1D7F6),
  },
  {
    id: 'circled',
    name: 'Circled',
    category: 'effect',
    // Circled digits start at U+2460 (①) for 1; ⓪ (U+24EA) is 0
    map: buildMap(0x24B6, 0x24D0, null, {
      0: '\u{24EA}', 1: '\u{2460}', 2: '\u{2461}', 3: '\u{2462}',
      4: '\u{2463}', 5: '\u{2464}', 6: '\u{2465}', 7: '\u{2466}',
      8: '\u{2467}', 9: '\u{2468}',
    }),
  },
  {
    id: 'fullwidth',
    name: 'Fullwidth',
    category: 'effect',
    map: buildMap(0xFF21, 0xFF41, 0xFF10),
  },
  {
    id: 'strikethrough',
    name: 'Strikethrough',
    category: 'effect',
    // Combining long stroke overlay (U+0336) applied to every non-space character
    transform: (char) => (char === ' ' ? char : `${char}̶`),
  },
  {
    id: 'underline',
    name: 'Underline',
    category: 'effect',
    // Combining low line (U+0332)
    transform: (char) => (char === ' ' ? char : `${char}̲`),
  },
];

/**
 * Returns text transformed into the given font style.
 * Characters with no mapping (punctuation, emoji, etc.) pass through unchanged.
 */
export function transformText(text, fontDef) {
  if (fontDef.transform) {
    return [...text].map(fontDef.transform).join('');
  }
  const { map } = fontDef;
  return [...text].map((char) => map[char] ?? char).join('');
}
