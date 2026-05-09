// Unicode style definitions. Each entry has a transform(text) → string function.
// Dummy data — engineer: replace with full 56-style list from the project Google Sheet.

const addCombining = (combChar) => (text) => [...text].map((c) => (c === ' ' ? c : c + combChar)).join('');

const mapRange = (text, ranges) => [...text].map((c) => {
  const code = c.charCodeAt(0);
  for (const [from, to, offset] of ranges) {
    if (code >= from && code <= to) return String.fromCodePoint(code + offset);
  }
  return c;
}).join('');

const FULLWIDTH_OFFSET = 0xFEE0; // U+0021–U+007E → U+FF01–U+FF5E

const BOLD_LOWER_BASE = 0x1D41A;
const BOLD_UPPER_BASE = 0x1D400;
const BOLD_DIGIT_BASE = 0x1D7CE;

const ITALIC_LOWER_BASE = 0x1D44E; // 'h' is special: U+210E
const ITALIC_UPPER_BASE = 0x1D434;

const SCRIPT_LOWER_BASE = 0x1D4EA;
const SCRIPT_UPPER_BASE = 0x1D4D0;

const FRAKTUR_LOWER_BASE = 0x1D51E;
const FRAKTUR_UPPER_BASE = 0x1D504;

const CIRCLED_LOWER_BASE = 0x24D0; // ⓐ–ⓩ
const CIRCLED_UPPER_BASE = 0x24B6; // Ⓐ–Ⓩ

const DOUBLE_STRUCK_LOWER_BASE = 0x1D552;
const DOUBLE_STRUCK_UPPER_BASE = 0x1D538;

const mathTransform = (lowerBase, upperBase, digitBase = null) => (text) => [...text].map((c) => {
  const code = c.charCodeAt(0);
  if (code >= 97 && code <= 122) return String.fromCodePoint(lowerBase + (code - 97));
  if (code >= 65 && code <= 90) return String.fromCodePoint(upperBase + (code - 65));
  if (digitBase && code >= 48 && code <= 57) return String.fromCodePoint(digitBase + (code - 48));
  return c;
});

const circledTransform = (text) => [...text].map((c) => {
  const code = c.charCodeAt(0);
  if (code >= 97 && code <= 122) return String.fromCodePoint(CIRCLED_LOWER_BASE + (code - 97));
  if (code >= 65 && code <= 90) return String.fromCodePoint(CIRCLED_UPPER_BASE + (code - 65));
  return c;
}).join('');

const fullwidthTransform = (text) => [...text].map((c) => {
  const code = c.charCodeAt(0);
  if (c === ' ') return '　';
  if (code >= 0x21 && code <= 0x7E) return String.fromCodePoint(code + FULLWIDTH_OFFSET);
  return c;
}).join('');

export const UNICODE_STYLES = [
  // ─── Popular ───────────────────────────────────────────────────────────────
  {
    id: 'bold',
    name: 'Bold',
    category: 'popular',
    transform: mathTransform(BOLD_LOWER_BASE, BOLD_UPPER_BASE, BOLD_DIGIT_BASE),
  },
  {
    id: 'italic',
    name: 'Italic',
    category: 'popular',
    transform: mathTransform(ITALIC_LOWER_BASE, ITALIC_UPPER_BASE),
  },
  {
    id: 'strikethrough',
    name: 'Strikethrough',
    category: 'popular',
    transform: addCombining('̶'),
  },
  {
    id: 'fullwidth',
    name: 'Full Width',
    category: 'popular',
    transform: fullwidthTransform,
  },
  {
    id: 'light-bubble',
    name: 'Light Text Bubble',
    category: 'popular',
    transform: circledTransform,
  },
  // ─── Cool ──────────────────────────────────────────────────────────────────
  {
    id: 'double-struck',
    name: 'Double Struck',
    category: 'cool',
    transform: mathTransform(DOUBLE_STRUCK_LOWER_BASE, DOUBLE_STRUCK_UPPER_BASE),
  },
  {
    id: 'underline-dashes',
    name: 'Underline with Dashes',
    category: 'cool',
    transform: addCombining('̲'),
  },
  {
    id: 'dark-bubble',
    name: 'Dark Text Bubble',
    category: 'cool',
    // Placeholder — replace with correct codepoint range from Google Sheet
    transform: (text) => [...text].map((c) => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1F150 + (code - 65));
      return c;
    }).join(''),
  },
  // ─── Fancy ─────────────────────────────────────────────────────────────────
  {
    id: 'script',
    name: 'Script',
    category: 'fancy',
    transform: mathTransform(SCRIPT_LOWER_BASE, SCRIPT_UPPER_BASE),
  },
  {
    id: 'acute-accents',
    name: 'Acute Accents',
    category: 'fancy',
    transform: addCombining('́'),
  },
  // ─── Glitch ────────────────────────────────────────────────────────────────
  {
    id: 'metal-umlauts',
    name: 'Metal Umlauts',
    category: 'glitch',
    transform: addCombining('̈'),
  },
  {
    id: 'diagonal-strikes',
    name: 'Diagonal Strikes',
    category: 'glitch',
    transform: addCombining('̸'),
  },
  // ─── Symbol ────────────────────────────────────────────────────────────────
  {
    id: 'fraktur',
    name: 'Fraktur',
    category: 'symbol',
    transform: mathTransform(FRAKTUR_LOWER_BASE, FRAKTUR_UPPER_BASE),
  },
];

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'popular', label: 'Popular' },
  { id: 'cool', label: 'Cool' },
  { id: 'fancy', label: 'Fancy' },
  { id: 'glitch', label: 'Glitch' },
  { id: 'symbol', label: 'Symbol' },
];
