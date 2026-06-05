import { expect } from '@esm-bundle/chai';

import {
  splitTabSeparatedRows,
  transformRows,
} from '../../../../scripts/font-generator/transform.js';

const csvResponse = await fetch('/scripts/font-generator/v1/v1.csv');
const csv = await csvResponse.text();
const rows = splitTabSeparatedRows(csv);
const output = transformRows(rows);
const fontByName = Object.fromEntries(output.fonts.map((font) => [font.styleName, font]));

function getMappedCharacter(font, character) {
  return font.characters.letters[character]
    ?? font.characters.numbers[character]
    ?? font.characters.specialCharacters[character]
    ?? character;
}

function transformWithCharacterMaps(font, value) {
  return [...value].map((character) => getMappedCharacter(font, character)).join('');
}

function transformWithEnvelopePattern(font, value) {
  if (value.length === 0) return '';
  const mappedCharacters = [...value].map((character) => getMappedCharacter(font, character));
  const mappedValue = font.pattern.hasRepeatingMiddlePattern
    ? mappedCharacters.join(font.pattern.repeatingMiddlePattern)
    : mappedCharacters.join('');
  return `${font.pattern.startPattern}${mappedValue}${font.pattern.endPattern}`;
}

function transformFont(font, value) {
  if (font.pattern.hasStartPattern || font.pattern.hasEndPattern) {
    return transformWithEnvelopePattern(font, value);
  }
  return transformWithCharacterMaps(font, value);
}

function streamTransformOutputs(testName, cases) {
  cases.forEach(({ styleName, source, actual, expected }) => {
    // Intentional inspection output for reviewing generated transforms in the browser console.
    // eslint-disable-next-line no-console
    console.log('[font-sheet-transform]', JSON.stringify({
      testName,
      styleName,
      source,
      actual,
      expected,
    }));
  });
}

function streamTransformSummary(testName, summary) {
  // Intentional inspection output for reviewing generated transforms in the browser console.
  // eslint-disable-next-line no-console
  console.log('[font-sheet-transform-summary]', JSON.stringify({ testName, ...summary }));
}

describe('font sheet transform', () => {
  it('parses every CSV row into a font mapping', () => {
    const counts = output.fonts.reduce((acc, font) => {
      acc[font.type] = (acc[font.type] || 0) + 1;
      return acc;
    }, {});

    expect(rows.length).to.equal(33);
    expect(output.fonts.length).to.equal(33);
    expect(counts['direct-map']).to.equal(6);
    expect(counts['pattern-map']).to.equal(27);
  });

  it('maps direct one-to-one unicode styles by category', () => {
    const lightTextBubble = fontByName['Light text bubble'];
    const fullWidth = fontByName['Full width'];

    expect(lightTextBubble.type).to.equal('direct-map');
    expect(lightTextBubble.characters.letters.A).to.equal('Ⓐ');
    expect(lightTextBubble.characters.letters.a).to.equal('ⓐ');
    expect(lightTextBubble.characters.numbers['0']).to.equal('⓪');
    expect(lightTextBubble.characters.specialCharacters['!']).to.equal('!');

    expect(fullWidth.type).to.equal('direct-map');
    expect(fullWidth.characters.letters.A).to.equal('Ａ');
    expect(fullWidth.characters.letters.a).to.equal('ａ');
    expect(fullWidth.characters.numbers['9']).to.equal('９');
  });

  it('extracts combining-mark pattern styles without losing base characters', () => {
    const diagonalStrikes = fontByName['Diagonal strikes'];
    const weirdText = fontByName['Weird text'];

    expect(diagonalStrikes.type).to.equal('pattern-map');
    expect(diagonalStrikes.pattern.hasStartPattern).to.be.true;
    expect(diagonalStrikes.pattern.hasEndPattern).to.be.true;
    expect(diagonalStrikes.characters.letters.A.normalize('NFD').replace(/\p{M}/gu, '')).to.equal('A');
    expect(diagonalStrikes.characters.numbers['0'].normalize('NFD').replace(/\p{M}/gu, '')).to.equal('0');

    expect(weirdText.type).to.equal('pattern-map');
    expect(weirdText.characters.letters.A.normalize('NFD').replace(/\p{M}/gu, '')).to.equal('A');
    expect(weirdText.characters.letters.a.normalize('NFD').replace(/\p{M}/gu, '')).to.equal('a');
    expect(weirdText.characters.numbers['9'].normalize('NFD').replace(/\p{M}/gu, '')).to.equal('9');
  });

  it('records start, end, and repeating middle pattern metadata', () => {
    const sparkles = fontByName.Sparkles;
    const arrows = fontByName.Arrows;
    const cupido = fontByName.Cupido;

    expect(sparkles.pattern.placement).to.equal('start+end');
    expect(sparkles.pattern.startPattern).to.equal('(¯`·._.··¸.-~*´¨¯¨`*·~-.');
    expect(sparkles.pattern.endPattern).to.equal('.-~*´¨¯¨`*·~-.¸··._.·´¯)');
    expect(sparkles.pattern.byCategory.specialCharacters.placement).to.equal('end');

    expect(arrows.pattern.placement).to.equal('start+repeating-middle+end');
    expect(arrows.pattern.startPattern).to.equal('»»»»');
    expect(arrows.pattern.repeatingMiddlePattern).to.equal('»»');
    expect(arrows.pattern.endPattern).to.equal('»»»');
    expect(arrows.characters.letters.A).to.equal('A');
    expect(arrows.characters.numbers['9']).to.equal('9');
    expect(arrows.characters.specialCharacters['!']).to.equal('!');

    expect(cupido.pattern.placement).to.equal('start+repeating-middle+end');
    expect(cupido.pattern.startPattern).to.equal('»»ᅳ');
    expect(cupido.pattern.repeatingMiddlePattern).to.equal('ᅳᅳ');
    expect(cupido.pattern.endPattern).to.equal('~►');
    expect(cupido.pattern.byCategory.numbers.startPattern).to.equal('»»ᅳ');
    expect(cupido.pattern.byCategory.numbers.repeatingMiddlePattern).to.equal('ᅳᅳ');
    expect(cupido.pattern.byCategory.specialCharacters.startPattern).to.equal('»»ᅳ');
    expect(cupido.pattern.byCategory.specialCharacters.repeatingMiddlePattern).to.equal('ᅳᅳ');
  });

  it('tracks missing source characters', () => {
    const fadingEffect = fontByName['Fading effect'];
    const [syntheticMissingNumberFont] = transformRows([{
      Grouping: 'Synthetic',
      Style_name: 'Missing Number',
      Style: `${output.sourceCharacters.letters.all}012345678${output.sourceCharacters.specialCharacters}`,
      'Font Supported': 'Noto Sans',
    }]).fonts;

    expect(fadingEffect.missingCharacters.letters).to.deep.equal([]);
    expect(fadingEffect.missingCharacters.numbers).to.deep.equal([]);
    expect(fadingEffect.characters.numbers['9']).to.equal('9');
    expect(syntheticMissingNumberFont.missingCharacters.numbers).to.deep.equal(['9']);
    expect(syntheticMissingNumberFont.characters.numbers).to.not.have.property('9');
  });

  it('handles alternate row endings, blank lines, and empty columns', () => {
    const fixture = [
      'Grouping\tStyle_name\tStyle\tFont Supported',
      'Synthetic\tIdentity\tABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}<>?.,:;"`~\t',
      '',
    ].join('\r\n');
    const [row] = splitTabSeparatedRows(fixture);

    expect(row.Grouping).to.equal('Synthetic');
    expect(row.Style_name).to.equal('Identity');
    expect(row['Font Supported']).to.equal('');
  });

  it('transforms sample strings with direct character maps', () => {
    const lightTextBubble = fontByName['Light text bubble'];
    const fullWidth = fontByName['Full width'];
    const source = 'Az09!';
    const cases = [
      {
        styleName: lightTextBubble.styleName,
        source,
        actual: transformWithCharacterMaps(lightTextBubble, source),
        expected: 'Ⓐⓩ⓪⑨!',
      },
      {
        styleName: fullWidth.styleName,
        source,
        actual: transformWithCharacterMaps(fullWidth, source),
        expected: 'Ａｚ０９!',
      },
    ];

    streamTransformOutputs('direct character maps', cases);

    cases.forEach(({ actual, expected }) => {
      expect(actual).to.equal(expected);
    });
  });

  it('transforms sample strings with combining-mark character maps', () => {
    const diagonalStrikes = fontByName['Diagonal strikes'];
    const hot = fontByName.Hot;
    const source = 'Az09!';
    const cases = [
      {
        styleName: diagonalStrikes.styleName,
        source,
        actual: transformWithCharacterMaps(diagonalStrikes, source),
        expected: 'A̷̷z̷̷0̷̷9̷!',
      },
      {
        styleName: hot.styleName,
        source,
        actual: transformWithCharacterMaps(hot, source),
        expected: 'A̾̾z̾0̾̾9̾!',
      },
    ];

    streamTransformOutputs('combining-mark character maps', cases);

    cases.forEach(({ actual, expected }) => {
      expect(actual).to.equal(expected);
      expect(actual.normalize('NFD').replace(/\p{M}/gu, '')).to.equal(source);
    });
  });

  it('transforms sample strings with whole-string pattern envelopes', () => {
    const sparkles = fontByName.Sparkles;
    const arrows = fontByName.Arrows;
    const cupido = fontByName.Cupido;
    const source = 'Az09!';
    const cases = [
      {
        styleName: sparkles.styleName,
        source,
        actual: transformWithEnvelopePattern(sparkles, source),
        expected: '(¯`·._.··¸.-~*´¨¯¨`*·~-.Az09!.-~*´¨¯¨`*·~-.¸··._.·´¯)',
      },
      {
        styleName: arrows.styleName,
        source,
        actual: transformWithEnvelopePattern(arrows, source),
        expected: '»»»»A»»z»»0»»9»»!»»»',
      },
      {
        styleName: cupido.styleName,
        source,
        actual: transformWithEnvelopePattern(cupido, source),
        expected: '»»ᅳAᅳᅳzᅳᅳ0ᅳᅳ9ᅳᅳ!~►',
      },
    ];

    streamTransformOutputs('whole-string pattern envelopes', cases);

    cases.forEach(({ actual, expected }) => {
      expect(actual).to.equal(expected);
    });
  });

  it('applies repeating middle patterns through consecutive special characters', () => {
    const arrows = fontByName.Arrows;
    const source = 'ABC!!';
    const actual = transformWithEnvelopePattern(arrows, source);
    const expected = '»»»»A»»B»»C»»!»»!»»»';

    streamTransformOutputs('consecutive special characters', [{
      styleName: arrows.styleName,
      source,
      actual,
      expected,
    }]);

    expect(arrows.characters.letters.A).to.equal('A');
    expect(arrows.characters.specialCharacters['!']).to.equal('!');
    expect(actual).to.equal(expected);
  });

  it('transforms a sample string for every style in the CSV', () => {
    const source = 'ABC!!';
    const cases = output.fonts.map((font) => {
      const actual = transformFont(font, source);
      return {
        styleName: font.styleName,
        source,
        actual,
        expected: actual,
      };
    });

    streamTransformOutputs('every CSV style', cases);

    expect(cases.length).to.equal(rows.length);
    output.fonts.forEach((font, index) => {
      expect(font.styleName).to.equal(rows[index].Style_name);
      expect(cases[index].actual).to.equal(cases[index].expected);
    });
  });

  it('transforms empty strings without emitting standalone patterns', () => {
    const source = '';
    const cases = output.fonts.map((font) => {
      const actual = transformFont(font, source);
      return {
        styleName: font.styleName,
        source,
        actual,
        expected: '',
      };
    });

    streamTransformSummary('empty source for every CSV style', {
      source,
      styleCount: cases.length,
      nonEmptyStyles: cases
        .filter(({ actual }) => actual !== '')
        .map(({ styleName }) => styleName),
    });

    cases.forEach(({ actual, expected }) => {
      expect(actual).to.equal(expected);
    });
  });
});
