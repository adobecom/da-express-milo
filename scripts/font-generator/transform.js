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

function allSeparatorsMatch(style, entries) {
  if (entries.length < 2) return null;

  const separators = [];
  for (let index = 0; index < entries.length - 1; index += 1) {
    const current = entries[index];
    const next = entries[index + 1];
    separators.push(style.slice(current.position + current.character.length, next.position));
  }

  const [first] = separators;
  return separators.every((separator) => separator === first) ? first : null;
}

function extractSpecialCharacters(style, specialStart) {
  if (specialStart < 0) return [];
  return [...SPECIAL_CHARACTERS].map((character, index) => (
    style.slice(specialStart + index, specialStart + index + character.length)
  ));
}

function getLiteralPatternMetadata(style, entries, options = {}) {
  if (!entries.length) return null;

  const {
    startBoundary = 0,
    endBoundary = style.length,
    endPatternOverride = null,
  } = options;
  const first = entries[0];
  const last = entries[entries.length - 1];
  const repeatingMiddlePattern = allSeparatorsMatch(style, entries);
  const endPattern = endPatternOverride
    ?? style.slice(last.position + last.character.length, endBoundary);
  const startPattern = style.slice(startBoundary, first.position);

  return {
    placement: [
      startPattern ? 'start' : null,
      repeatingMiddlePattern !== null && repeatingMiddlePattern !== '' ? 'repeating-middle' : null,
      endPattern ? 'end' : null,
    ].filter(Boolean).join('+') || 'none',
    hasStartPattern: Boolean(startPattern),
    hasRepeatingMiddlePattern: repeatingMiddlePattern !== null && repeatingMiddlePattern !== '',
    hasEndPattern: Boolean(endPattern),
    startPattern,
    repeatingMiddlePattern: repeatingMiddlePattern ?? '',
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
  const specialEnd = specialStart >= 0 ? specialStart + SPECIAL_CHARACTERS.length : -1;
  const trailingPattern = specialEnd >= 0 ? style.slice(specialEnd) : '';
  const lastLiteralEntry = literalEntries[literalEntries.length - 1];
  const alphanumericEndBoundary = specialStart >= 0 ? specialStart : style.length;
  const alphanumericEndPattern = style.slice(
    lastLiteralEntry.position + lastLiteralEntry.character.length,
    alphanumericEndBoundary,
  );
  const wholePattern = getLiteralPatternMetadata(style, literalEntries, {
    endBoundary: alphanumericEndBoundary,
    endPatternOverride: trailingPattern || alphanumericEndPattern,
  });
  const lettersEndBoundary = numbersEntries[0]?.position ?? alphanumericEndBoundary;
  const numbersStartBoundary = lettersEntries.length
    ? lettersEntries[lettersEntries.length - 1].position
      + lettersEntries[lettersEntries.length - 1].character.length
    : 0;
  const lettersPattern = getLiteralPatternMetadata(style, lettersEntries, {
    endBoundary: lettersEndBoundary,
  });
  const numbersPattern = getLiteralPatternMetadata(style, numbersEntries, {
    startBoundary: numbersStartBoundary,
    endBoundary: alphanumericEndBoundary,
  });
  const specialCharactersPattern = trailingPattern
    ? {
      ...createNoPatternMetadata(),
      placement: 'end',
      hasEndPattern: true,
      endPattern: trailingPattern,
    }
    : createNoPatternMetadata();
  const patternByCategory = wholePattern.hasRepeatingMiddlePattern
    ? {
      letters: wholePattern,
      numbers: wholePattern,
      specialCharacters: wholePattern,
    }
    : {
      letters: lettersPattern,
      numbers: numbersPattern,
      specialCharacters: specialCharactersPattern,
    };

  return {
    type: wholePattern?.placement === 'none' ? 'literal-map' : 'pattern-map',
    pattern: {
      ...wholePattern,
      byCategory: patternByCategory,
    },
    characters: {
      letters: createLiteralCharacterMap(
        style,
        lettersEntries,
        lettersEndBoundary,
        wholePattern,
      ),
      numbers: createLiteralCharacterMap(
        style,
        numbersEntries,
        alphanumericEndBoundary,
        wholePattern,
      ),
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
    version: 'v1',
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
        fontSupported: row['Font Supported'],
        type: detected.type,
        pattern: detected.pattern,
        characters: detected.characters,
        missingCharacters: detected.missingCharacters,
        rawStyle: row.Style,
      };
    }),
  };
}

export async function writeV1Json() {
  const { readFileSync, writeFileSync } = await import('node:fs');
  const csvUrl = new URL('./v1/v1.csv', import.meta.url);
  const jsonUrl = new URL(
    '../../express/code/blocks/font-generator/font-sheets/v1/v1.json',
    import.meta.url,
  );
  const csv = readFileSync(csvUrl, 'utf8');
  const rows = splitTabSeparatedRows(csv);
  const output = transformRows(rows);

  writeFileSync(jsonUrl, `${JSON.stringify(output, null, 2)}\n`);
  return output;
}

if (
  typeof process !== 'undefined'
  && process.argv?.[1]
  && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href
) {
  await writeV1Json();
}
