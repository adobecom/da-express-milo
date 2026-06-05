import { expect } from '@esm-bundle/chai';

import { transformText } from '../../../express/code/blocks/font-generator/unicodeEngine.js';

const fontSheetResponse = await fetch('/express/code/blocks/font-generator/font-sheets/v1/v1.json');
const fontSheet = await fontSheetResponse.json();
const fontByName = Object.fromEntries(fontSheet.fonts.map((font) => [font.styleName, font]));

function getFont(styleName) {
  const font = fontByName[styleName];
  expect(font, `${styleName} font`).to.exist;
  return font;
}

describe('unicode engine', () => {
  it('transforms direct unicode character maps', () => {
    expect(transformText('Az09!', getFont('Light text bubble'))).to.equal('Ⓐⓩ⓪⑨!');
    expect(transformText('Az09!', getFont('Full width'))).to.equal('Ａｚ０９!');
  });

  it('transforms baked combining-mark character maps without whole-text wrapping', () => {
    expect(transformText('Az09!', getFont('Diagonal strikes'))).to.equal('A̷̷z̷̷0̷̷9̷!');
    expect(transformText('Az09!', getFont('Hot'))).to.equal('A̾̾z̾0̾̾9̾!');
  });

  it('applies fallback combining decorations to unmapped characters', () => {
    expect(transformText('é!', getFont('Diagonal strikes'))).to.equal('é̷̷!');
  });

  it('applies start and end patterns from generated metadata', () => {
    expect(transformText('Az09!', getFont('Sparkles'))).to.equal(
      '(¯`·._.··¸.-~*´¨¯¨`*·~-.Az09!.-~*´¨¯¨`*·~-.¸··._.·´¯)',
    );
  });

  it('applies repeating middle patterns from generated metadata', () => {
    expect(transformText('Az09!', getFont('Arrows'))).to.equal('»»»»A»»z»»0»»9»»!»»»');
    expect(transformText('Az09!', getFont('Cupido'))).to.equal('»»ᅳAᅳᅳzᅳᅳ0ᅳᅳ9ᅳᅳ!►');
    expect(transformText('ABC!!', getFont('Strikethrough'))).to.equal('̶A̶̶B̶̶C̶̶!̶̶!̶');
  });

  it('does not render pattern-only output for empty text', () => {
    expect(transformText('', getFont('Sparkles'))).to.equal('');
    expect(transformText('', getFont('Cupido'))).to.equal('');
  });
});
