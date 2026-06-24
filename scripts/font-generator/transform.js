export const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
export const LETTERS = `${UPPERCASE}${LOWERCASE}`;
export const NUMBERS = '0123456789';
export const SPECIAL_CHARACTERS = "!@#$%^&*()-_=+[]{}<>?.,:;'\"`~";
export const SOURCE_CHARACTERS = `${LETTERS}${NUMBERS}${SPECIAL_CHARACTERS}`;
const ALPHANUMERIC = `${LETTERS}${NUMBERS}`;

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Authors write human-readable names ("Gothic A1") but the Adobe Fonts kit
// exposes families as lowercase-hyphenated slugs ("gothic-a1"). Normalize so the
// generated font-family value matches what the kit registers. Idempotent for
// values already in slug form.
function toFontFamily(value) {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function createCharacterMap(source, mappedCharacters) {
  return [...source].reduce((map, sourceCharacter, index) => {
    if (mappedCharacters[index] !== undefined) {
      map[sourceCharacter] = mappedCharacters[index];
    }
    return map;
  }, {});
}

export function splitTabSeparatedRows(csv) {
  const [headerLine, ...lines] = csv.trim().split(/\r\n|\n|\r/);
  const headers = headerLine.split('\t');

  return lines
    .filter(Boolean)
    .map((line) => {
      const columns = line.split('\t');
      return headers.reduce((row, header, index) => {
        row[header] = columns[index] ?? '';
        return row;
      }, {});
    });
}

function findOrderedSourcePositions(style, source) {
  const positions = [];
  let cursor = 0;

  for (const character of source) {
    const position = style.indexOf(character, cursor);
    if (position < 0) {
      positions.push(null);
    } else {
      positions.push(position);
      cursor = position + character.length;
    }
  }

  return positions;
}

function getDefinedPositionEntries(source, positions) {
  return [...source]
    .map((character, index) => ({ character, index, position: positions[index] }))
    .filter(({ position }) => position !== null);
}

function extractSpecialCharacters(style, specialStart) {
  if (specialStart < 0) return [];
  return [...SPECIAL_CHARACTERS].map((character, index) => (
    style.slice(specialStart + index, specialStart + index + character.length)
  ));
}

// v2 takes the whole-text wrapper straight from the Start/Middle/End columns
// rather than inferring it from the Style cell. Inference is what let a leading
// decoration character in Style masquerade as a start pattern; reading explicit
// columns removes that class of bug entirely.
function buildPatternFromColumns(row) {
  const startPattern = row.Start ?? '';
  const repeatingMiddlePattern = row.Middle ?? '';
  const endPattern = row.End ?? '';
  const hasStartPattern = startPattern !== '';
  const hasRepeatingMiddlePattern = repeatingMiddlePattern !== '';
  const hasEndPattern = endPattern !== '';

  return {
    placement: [
      hasStartPattern ? 'start' : null,
      hasRepeatingMiddlePattern ? 'repeating-middle' : null,
      hasEndPattern ? 'end' : null,
    ].filter(Boolean).join('+') || 'none',
    hasStartPattern,
    hasRepeatingMiddlePattern,
    hasEndPattern,
    startPattern,
    repeatingMiddlePattern,
    endPattern,
  };
}

function createLiteralCharacterMap(
  style,
  entries,
  endBoundary = style.length,
  patternMetadata = null,
) {
  if (patternMetadata?.hasRepeatingMiddlePattern) {
    return entries.reduce((map, entry) => {
      map[entry.character] = entry.character;
      return map;
    }, {});
  }

  return entries.reduce((map, entry, index) => {
    const next = entries[index + 1];
    const end = next?.position ?? endBoundary;
    map[entry.character] = style.slice(entry.position, end);
    return map;
  }, {});
}

function createNoPatternMetadata() {
  return {
    placement: 'none',
    hasStartPattern: false,
    hasRepeatingMiddlePattern: false,
    hasEndPattern: false,
    startPattern: '',
    repeatingMiddlePattern: '',
    endPattern: '',
  };
}

function splitDirectMappings(style, specialStart) {
  const mappedBody = specialStart >= 0 ? style.slice(0, specialStart) : style;
  const mappedCharacters = [...mappedBody];

  return {
    letters: mappedCharacters.slice(0, LETTERS.length),
    numbers: mappedCharacters.slice(LETTERS.length, LETTERS.length + NUMBERS.length),
    specialCharacters: specialStart >= 0
      ? extractSpecialCharacters(style, specialStart)
      : mappedCharacters.slice(LETTERS.length + NUMBERS.length),
  };
}

export function detectStyle(row) {
  const style = row.Style;
  const specialStart = style.indexOf(SPECIAL_CHARACTERS);
  const sourcePositions = findOrderedSourcePositions(style, ALPHANUMERIC);
  const literalEntries = getDefinedPositionEntries(ALPHANUMERIC, sourcePositions);
  const hasLiteralAlphabet = literalEntries.length >= LETTERS.length;

  if (!hasLiteralAlphabet) {
    const mappings = splitDirectMappings(style, specialStart);
    return {
      type: 'direct-map',
      pattern: {
        ...createNoPatternMetadata(),
        byCategory: {},
      },
      characters: {
        letters: createCharacterMap(LETTERS, mappings.letters),
        numbers: createCharacterMap(NUMBERS, mappings.numbers),
        specialCharacters: createCharacterMap(SPECIAL_CHARACTERS, mappings.specialCharacters),
      },
      missingCharacters: {
        letters: [...LETTERS].filter((character, index) => mappings.letters[index] === undefined),
        numbers: [...NUMBERS].filter((character, index) => mappings.numbers[index] === undefined),
        specialCharacters: [...SPECIAL_CHARACTERS].filter(
          (character, index) => mappings.specialCharacters[index] === undefined,
        ),
      },
    };
  }

  const lettersEntries = literalEntries.filter(({ index }) => index < LETTERS.length);
  const numbersEntries = literalEntries.filter(({ index }) => index >= LETTERS.length);
  const specialCharacters = extractSpecialCharacters(style, specialStart);
  const alphanumericEndBoundary = specialStart >= 0 ? specialStart : style.length;
  const lettersEndBoundary = numbersEntries[0]?.position ?? alphanumericEndBoundary;

  // Whole-text wrapper from the explicit columns; the Style cell only feeds the
  // per-character maps below. Block styles wrap an identity alphabet, while
  // combining/zalgo styles bake their decoration into each character's map and
  // carry no wrapper (placement: 'none').
  const pattern = buildPatternFromColumns(row);
  const letters = createLiteralCharacterMap(style, lettersEntries, lettersEndBoundary, pattern);
  const numbers = createLiteralCharacterMap(
    style,
    numbersEntries,
    alphanumericEndBoundary,
    pattern,
  );

  // A style is a pattern-map (vs a plain literal substitution) when it wraps
  // text or bakes decoration into its character map; that flag drives the
  // engine's wrapper application and per-character fallback decoration.
  const mapAddsDecoration = Object.entries(letters).some(([source, mapped]) => mapped !== source)
    || Object.entries(numbers).some(([source, mapped]) => mapped !== source);

  return {
    type: pattern.placement !== 'none' || mapAddsDecoration ? 'pattern-map' : 'literal-map',
    pattern: {
      ...pattern,
      byCategory: {},
    },
    characters: {
      letters,
      numbers,
      specialCharacters: createCharacterMap(SPECIAL_CHARACTERS, specialCharacters),
    },
    missingCharacters: {
      letters: [...LETTERS].filter(
        (character) => !lettersEntries.some((entry) => entry.character === character),
      ),
      numbers: [...NUMBERS].filter(
        (character) => !numbersEntries.some((entry) => entry.character === character),
      ),
      specialCharacters: [...SPECIAL_CHARACTERS].filter(
        (character, index) => specialCharacters[index] === undefined,
      ),
    },
  };
}

export function transformRows(rows) {
  return {
    sourceCharacters: {
      letters: {
        uppercase: UPPERCASE,
        lowercase: LOWERCASE,
        all: LETTERS,
      },
      numbers: NUMBERS,
      specialCharacters: SPECIAL_CHARACTERS,
      all: SOURCE_CHARACTERS,
    },
    fonts: rows.map((row) => {
      const detected = detectStyle(row);
      return {
        id: slugify(row.Style_name),
        grouping: row.Grouping,
        styleName: row.Style_name,
        fontSupported: toFontFamily(row['Font Supported']),
        type: detected.type,
        pattern: detected.pattern,
        characters: detected.characters,
        missingCharacters: detected.missingCharacters,
      };
    }),
  };
}

export async function writeFontSheet() {
  const { readFileSync, writeFileSync, mkdirSync } = await import('node:fs');
  const csvUrl = new URL('./font-styles.csv', import.meta.url);
  const jsonUrl = new URL(
    '../../express/code/blocks/font-generator/font-sheets/font-styles.json',
    import.meta.url,
  );
  const csv = readFileSync(csvUrl, 'utf8');
  const rows = splitTabSeparatedRows(csv);
  const output = transformRows(rows);

  mkdirSync(new URL('.', jsonUrl), { recursive: true });
  writeFileSync(jsonUrl, `${JSON.stringify(output, null, 2)}\n`);
  return output;
}

if (
  typeof process !== 'undefined'
  && process.argv?.[1]
  && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href
) {
  await writeFontSheet();
}
