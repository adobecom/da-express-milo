/**
 * STUB — replace with real 56-style data from Google Sheet:
 * https://docs.google.com/spreadsheets/d/1by_d2y4A1yFY6CbnX5OX5TLvzNt_64oa40w2xqyLsrU
 *
 * Each entry: { name, category, transform }
 * category must be one of: popular | cool | fancy | glitch | symbol
 * transform(str) must return a Unicode-transformed string.
 */

// --- helpers ---

function shift(char, upperBase, lowerBase) {
  const c = char.charCodeAt(0);
  if (c >= 65 && c <= 90) return String.fromCodePoint(upperBase + c - 65);
  if (c >= 97 && c <= 122) return String.fromCodePoint(lowerBase + c - 97);
  return char;
}

function map(text, upperBase, lowerBase) {
  return [...text].map((ch) => shift(ch, upperBase, lowerBase)).join('');
}

// --- font styles ---

const FONTS = [
  // popular
  {
    name: 'Bold',
    category: 'popular',
    transform: (t) => map(t, 0x1d400, 0x1d41a),
  },
  {
    name: 'Italic',
    category: 'popular',
    transform: (t) => map(t, 0x1d434, 0x1d44e),
  },
  {
    name: 'Bold Italic',
    category: 'popular',
    transform: (t) => map(t, 0x1d468, 0x1d482),
  },
  {
    name: 'Sans Bold',
    category: 'popular',
    transform: (t) => map(t, 0x1d5d4, 0x1d5ee),
  },
  {
    name: 'Sans Bold Italic',
    category: 'popular',
    transform: (t) => map(t, 0x1d63c, 0x1d656),
  },

  // cool
  {
    name: 'Double Struck',
    category: 'cool',
    transform: (t) => map(t, 0x1d538, 0x1d552),
  },
  {
    name: 'Monospace',
    category: 'cool',
    transform: (t) => map(t, 0x1d670, 0x1d68a),
  },
  {
    name: 'Sans Serif',
    category: 'cool',
    transform: (t) => map(t, 0x1d5a0, 0x1d5ba),
  },
  {
    name: 'Sans Italic',
    category: 'cool',
    transform: (t) => map(t, 0x1d608, 0x1d622),
  },
  {
    name: 'Full Width',
    category: 'cool',
    transform: (t) => [...t].map((ch) => {
      const c = ch.charCodeAt(0);
      if (c >= 33 && c <= 126) return String.fromCodePoint(0xff01 + c - 33);
      return ch;
    }).join(''),
  },

  // fancy
  {
    name: 'Script',
    category: 'fancy',
    transform: (t) => map(t, 0x1d49c, 0x1d4b6),
  },
  {
    name: 'Bold Script',
    category: 'fancy',
    transform: (t) => map(t, 0x1d4d0, 0x1d4ea),
  },
  {
    name: 'Fraktur',
    category: 'fancy',
    transform: (t) => map(t, 0x1d504, 0x1d51e),
  },
  {
    name: 'Bold Fraktur',
    category: 'fancy',
    transform: (t) => map(t, 0x1d56c, 0x1d586),
  },

  // glitch
  {
    name: 'Strikethrough',
    category: 'glitch',
    transform: (t) => [...t].map((ch) => (ch !== ' ' ? `${ch}̶` : ch)).join(''),
  },
  {
    name: 'Underline',
    category: 'glitch',
    transform: (t) => [...t].map((ch) => (ch !== ' ' ? `${ch}̲` : ch)).join(''),
  },
  {
    name: 'Double Underline',
    category: 'glitch',
    transform: (t) => [...t].map((ch) => (ch !== ' ' ? `${ch}̳` : ch)).join(''),
  },
  {
    name: 'Wavy',
    category: 'glitch',
    transform: (t) => [...t].map((ch) => (ch !== ' ' ? `${ch}̰` : ch)).join(''),
  },

  // symbol
  {
    name: 'Circled',
    category: 'symbol',
    transform: (t) => [...t].map((ch) => {
      const c = ch.charCodeAt(0);
      if (c >= 65 && c <= 90) return String.fromCodePoint(0x24b6 + c - 65);
      if (c >= 97 && c <= 122) return String.fromCodePoint(0x24d0 + c - 97);
      return ch;
    }).join(''),
  },
  {
    name: 'Negative Circled',
    category: 'symbol',
    transform: (t) => [...t].map((ch) => {
      const c = ch.charCodeAt(0);
      if (c >= 65 && c <= 90) return String.fromCodePoint(0x1f150 + c - 65);
      return ch;
    }).join(''),
  },
  {
    name: 'Squared',
    category: 'symbol',
    transform: (t) => [...t].map((ch) => {
      const c = ch.charCodeAt(0);
      if (c >= 65 && c <= 90) return String.fromCodePoint(0x1f130 + c - 65);
      return ch;
    }).join(''),
  },
];

export default FONTS;
