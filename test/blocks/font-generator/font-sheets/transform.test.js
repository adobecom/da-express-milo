import { expect } from '@esm-bundle/chai';

import {
  splitTabSeparatedRows,
  transformRows,
} from '../../../../express/code/blocks/font-generator/font-sheets/transform.js';

const csvResponse = await fetch('/express/code/blocks/font-generator/font-sheets/v1/v1.csv');
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
  return `${font.pattern.startPattern}${transformWithCharacterMaps(font, value)}${font.pattern.endPattern}`;
}

function getInspectionSummary(styleNames) {
  return styleNames.map((styleName) => {
    const font = fontByName[styleName];
    return {
      styleName,
      type: font.type,
      placement: font.pattern.placement,
      byCategory: {
        letters: font.pattern.byCategory?.letters?.placement,
        numbers: font.pattern.byCategory?.numbers?.placement,
        specialCharacters: font.pattern.byCategory?.specialCharacters?.placement,
      },
      samples: {
        A: font.characters.letters.A,
        a: font.characters.letters.a,
        0: font.characters.numbers['0'],
        9: font.characters.numbers['9'],
        '!': font.characters.specialCharacters['!'],
      },
      pattern: {
        start: font.pattern.startPattern,
        repeatingMiddle: font.pattern.repeatingMiddlePattern,
        end: font.pattern.endPattern,
      },
      missingCharacters: font.missingCharacters,
    };
  });
}

describe('font sheet transform', () => {
  it('parses every CSV row into a font mapping', () => {
    const counts = output.fonts.reduce((acc, font) => {
      acc[font.type] = (acc[font.type] || 0) + 1;
      return acc;
    }, {});

    // Intentional inspection output for reviewing generated mappings in the browser console.
    // eslint-disable-next-line no-console
    console.log('[font-sheet-transform] summary', JSON.stringify({
      rows: rows.length,
      fonts: output.fonts.length,
      counts,
      sourceCharacters: output.sourceCharacters,
    }, null, 2));

    expect(rows.length).to.equal(33);
    expect(output.fonts.length).to.equal(33);
    expect(counts['direct-map']).to.equal(6);
    expect(counts['pattern-map']).to.equal(27);
  });

  it('maps direct one-to-one unicode styles by category', () => {
    const lightTextBubble = fontByName['Light text bubble'];
    const fullWidth = fontByName['Full width'];

    // eslint-disable-next-line no-console
    console.log('[font-sheet-transform] direct-map samples', JSON.stringify(
      getInspectionSummary(['Light text bubble', 'Full width']),
      null,
      2,
    ));

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

    // eslint-disable-next-line no-console
    console.log('[font-sheet-transform] combining-pattern samples', JSON.stringify(
      getInspectionSummary(['Diagonal strikes', 'Weird text']),
      null,
      2,
    ));

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

    // eslint-disable-next-line no-console
    console.log('[font-sheet-transform] symbol-pattern samples', JSON.stringify(
      getInspectionSummary(['Sparkles', 'Arrows', 'Cupido']),
      null,
      2,
    ));

    expect(sparkles.pattern.placement).to.equal('start+end');
    expect(sparkles.pattern.startPattern).to.equal('(¯`·._.··¸.-~*´¨¯¨`*·~-.');
    expect(sparkles.pattern.endPattern).to.equal('.-~*´¨¯¨`*·~-.¸··._.·´¯)');
    expect(sparkles.pattern.byCategory.specialCharacters.placement).to.equal('end');

    expect(arrows.pattern.placement).to.equal('start+repeating-middle+end');
    expect(arrows.pattern.startPattern).to.equal('»»»»');
    expect(arrows.pattern.repeatingMiddlePattern).to.equal('»»');
    expect(arrows.pattern.endPattern).to.equal('»»»');
    expect(arrows.characters.letters.A).to.equal('A»»');
    expect(arrows.characters.numbers['9']).to.equal('9»»');

    expect(cupido.pattern.placement).to.equal('start+repeating-middle+end');
    expect(cupido.pattern.startPattern).to.equal('»»ᅳ');
    expect(cupido.pattern.repeatingMiddlePattern).to.equal('ᅳᅳ');
    expect(cupido.pattern.endPattern).to.equal('►');
  });

  it('tracks missing source characters', () => {
    const fadingEffect = fontByName['Fading effect'];
    const [syntheticMissingNumberFont] = transformRows([{
      Grouping: 'Synthetic',
      Style_name: 'Missing Number',
      Style: `${output.sourceCharacters.letters.all}012345678${output.sourceCharacters.specialCharacters}`,
      'Font Supported': 'Noto Sans',
    }]).fonts;

    // eslint-disable-next-line no-console
    console.log('[font-sheet-transform] missing-character sample', JSON.stringify({
      styleName: fadingEffect.styleName,
      missingCharacters: fadingEffect.missingCharacters,
      syntheticMissingNumber: syntheticMissingNumberFont.missingCharacters,
    }, null, 2));

    expect(fadingEffect.missingCharacters.letters).to.deep.equal([]);
    expect(fadingEffect.missingCharacters.numbers).to.deep.equal([]);
    expect(fadingEffect.characters.numbers['9']).to.equal('9');
    expect(syntheticMissingNumberFont.missingCharacters.numbers).to.deep.equal(['9']);
    expect(syntheticMissingNumberFont.characters.numbers).to.not.have.property('9');
  });

  it('transforms sample strings with direct character maps', () => {
    const lightTextBubble = fontByName['Light text bubble'];
    const fullWidth = fontByName['Full width'];
    const source = 'Az09!';
    const cases = [
      {
        styleName: lightTextBubble.styleName,
        actual: transformWithCharacterMaps(lightTextBubble, source),
        expected: 'Ⓐⓩ⓪⑨!',
      },
      {
        styleName: fullWidth.styleName,
        actual: transformWithCharacterMaps(fullWidth, source),
        expected: 'Ａｚ０９!',
      },
    ];

    // eslint-disable-next-line no-console
    console.log('[font-sheet-transform] direct string transforms', JSON.stringify({
      source,
      cases,
    }, null, 2));

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
        actual: transformWithCharacterMaps(diagonalStrikes, source),
        expected: 'A̷̷z̷̷0̷̷9̷!',
      },
      {
        styleName: hot.styleName,
        actual: transformWithCharacterMaps(hot, source),
        expected: 'A̾̾z̾0̾̾9̾!',
      },
    ];

    // eslint-disable-next-line no-console
    console.log('[font-sheet-transform] combining string transforms', JSON.stringify({
      source,
      cases,
    }, null, 2));

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
        actual: transformWithEnvelopePattern(sparkles, source),
        expected: '(¯`·._.··¸.-~*´¨¯¨`*·~-.Az09!.-~*´¨¯¨`*·~-.¸··._.·´¯)',
      },
      {
        styleName: arrows.styleName,
        actual: transformWithEnvelopePattern(arrows, source),
        expected: '»»»»A»»z»»0»»9»»!»»»',
      },
      {
        styleName: cupido.styleName,
        actual: transformWithEnvelopePattern(cupido, source),
        expected: '»»ᅳAᅳᅳzᅳᅳ0ᅳᅳ9ᅳ!►',
      },
    ];

    // eslint-disable-next-line no-console
    console.log('[font-sheet-transform] envelope string transforms', JSON.stringify({
      source,
      cases,
    }, null, 2));

    cases.forEach(({ actual, expected }) => {
      expect(actual).to.equal(expected);
    });
  });
});
