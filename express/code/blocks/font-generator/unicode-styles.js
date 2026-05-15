// Unicode style data — stub with representative samples across all 6 categories.
// Full 56-style list to be provided via Google Sheet before launch.
// Schema: { name: string, category: string, transform: (char: string) => string }

function alpha(char, upperBase, lowerBase) {
  const code = char.charCodeAt(0);
  if (code >= 0x41 && code <= 0x5a) return String.fromCodePoint(upperBase + code - 0x41);
  if (code >= 0x61 && code <= 0x7a) return String.fromCodePoint(lowerBase + code - 0x61);
  return char;
}

function combining(char, combiner) {
  if (char.trim() === '') return char;
  return char + combiner;
}

const SMALL_CAPS = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ';

export default [
  // ── Popular ──────────────────────────────────────────────────────────────
  {
    name: 'Bold',
    category: 'Popular',
    transform: (c) => alpha(c, 0x1d400, 0x1d41a),
  },
  {
    name: 'Italic',
    category: 'Popular',
    transform: (c) => alpha(c, 0x1d434, 0x1d44e),
  },
  {
    name: 'Bold Italic',
    category: 'Popular',
    transform: (c) => alpha(c, 0x1d468, 0x1d482),
  },
  {
    name: 'Script',
    category: 'Popular',
    transform: (c) => alpha(c, 0x1d49c, 0x1d4b6),
  },
  {
    name: 'Double-Struck',
    category: 'Popular',
    transform: (c) => alpha(c, 0x1d538, 0x1d552),
  },

  // ── Cool ─────────────────────────────────────────────────────────────────
  {
    name: 'Monospace',
    category: 'Cool',
    transform: (c) => alpha(c, 0x1d670, 0x1d68a),
  },
  {
    name: 'Small Caps',
    category: 'Cool',
    transform: (c) => {
      const code = c.charCodeAt(0);
      if (code >= 0x61 && code <= 0x7a) return SMALL_CAPS[code - 0x61];
      return c;
    },
  },
  {
    name: 'Fullwidth',
    category: 'Cool',
    transform: (c) => {
      const code = c.charCodeAt(0);
      if (code >= 0x21 && code <= 0x7e) return String.fromCodePoint(0xff01 + code - 0x21);
      return c;
    },
  },

  // ── Fancy ─────────────────────────────────────────────────────────────────
  {
    name: 'Fraktur',
    category: 'Fancy',
    transform: (c) => alpha(c, 0x1d504, 0x1d51e),
  },
  {
    name: 'Bold Script',
    category: 'Fancy',
    transform: (c) => alpha(c, 0x1d4d0, 0x1d4ea),
  },
  {
    name: 'Sans-Serif Bold',
    category: 'Fancy',
    transform: (c) => alpha(c, 0x1d5d4, 0x1d5ee),
  },

  // ── Glitch ───────────────────────────────────────────────────────────────
  {
    name: 'Strikethrough',
    category: 'Glitch',
    transform: (c) => combining(c, '̶'),
  },
  {
    name: 'Underline',
    category: 'Glitch',
    transform: (c) => combining(c, '̲'),
  },
  {
    name: 'Double Underline',
    category: 'Glitch',
    transform: (c) => combining(c, '̳'),
  },

  // ── Symbol ───────────────────────────────────────────────────────────────
  {
    name: 'Circled',
    category: 'Symbol',
    transform: (c) => {
      const code = c.charCodeAt(0);
      if (code >= 0x41 && code <= 0x5a) return String.fromCodePoint(0x24b6 + code - 0x41);
      if (code >= 0x61 && code <= 0x7a) return String.fromCodePoint(0x24d0 + code - 0x61);
      return c;
    },
  },
  {
    name: 'Squared',
    category: 'Symbol',
    transform: (c) => {
      const code = c.charCodeAt(0);
      if (code >= 0x41 && code <= 0x5a) return String.fromCodePoint(0x1f130 + code - 0x41);
      return c.toUpperCase();
    },
  },
];
