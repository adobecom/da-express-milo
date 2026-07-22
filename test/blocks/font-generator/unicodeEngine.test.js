import { expect } from '@esm-bundle/chai';

import { transformText } from '../../../express/code/blocks/font-generator/unicodeEngine.js';

const fontSheetResponse = await fetch('/express/code/blocks/font-generator/font-sheets/font-styles.json');
const fontSheet = await fontSheetResponse.json();
const fontByName = Object.fromEntries(fontSheet.fonts.map((font) => [font.styleName, font]));
const INSPECTION_SOURCE = 'ABC!!é🚀 09';
const MAX_INPUT_LENGTH = 200;
const PERFORMANCE_BUDGET_MS = 50;

function getFont(styleName) {
  const font = fontByName[styleName];
  expect(font, `${styleName} font`).to.exist;
  return font;
}

function streamRuntimeOutputs(testName, cases) {
  cases.forEach(({ styleName, source, actual, expected }) => {
    // Intentional inspection output for reviewing runtime transforms in the browser console.
    // eslint-disable-next-line no-console
    console.log('[font-engine-transform]', JSON.stringify({
      testName,
      styleName,
      source,
      actual,
      expected,
    }));
  });
}

function streamRuntimeSummary(testName, summary) {
  // Intentional inspection output for reviewing runtime transforms in the browser console.
  // eslint-disable-next-line no-console
  console.log('[font-engine-transform-summary]', JSON.stringify({ testName, ...summary }));
}

describe('unicode engine', () => {
  it('transforms direct unicode character maps', () => {
    const source = 'Az09!';
    const cases = [
      {
        styleName: 'Light text bubble',
        source,
        actual: transformText(source, getFont('Light text bubble')),
        expected: 'Ⓐⓩ⓪⑨!',
      },
      {
        styleName: 'Full width',
        source,
        actual: transformText(source, getFont('Full width')),
        expected: 'Ａｚ０９!',
      },
    ];

    streamRuntimeOutputs('direct unicode character maps', cases);

    cases.forEach(({ actual, expected }) => {
      expect(actual).to.equal(expected);
    });
  });

  it('transforms baked combining-mark character maps without whole-text wrapping', () => {
    const source = 'Az09!';
    const cases = [
      {
        styleName: 'Diagonal strikes',
        source,
        actual: transformText(source, getFont('Diagonal strikes')),
        expected: 'A̷̷z̷̷0̷̷9̷!',
      },
      {
        styleName: 'Hot',
        source,
        actual: transformText(source, getFont('Hot')),
        expected: 'A̾̾z̾0̾̾9̾!',
      },
    ];

    streamRuntimeOutputs('baked combining-mark character maps', cases);

    cases.forEach(({ actual, expected }) => {
      expect(actual).to.equal(expected);
    });
  });

  it('applies fallback combining decorations to unmapped characters', () => {
    const source = 'é!';
    const cases = [
      {
        styleName: 'Diagonal strikes',
        source,
        actual: transformText(source, getFont('Diagonal strikes')),
        expected: 'é̷̷!',
      },
      {
        styleName: 'Strikethrough',
        source,
        actual: transformText(source, getFont('Strikethrough')),
        expected: 'é̶̶!',
      },
    ];

    streamRuntimeOutputs('fallback combining decorations', cases);

    cases.forEach(({ actual, expected }) => {
      expect(actual).to.equal(expected);
    });
  });

  it('applies start and end patterns from generated metadata', () => {
    const source = 'Az09!';
    const cases = [
      {
        styleName: 'Sparkles',
        source,
        actual: transformText(source, getFont('Sparkles')),
        expected: '(¯`·._.··¸.-~*´¨¯¨`*·~-.Az09!.-~*´¨¯¨`*·~-.¸··._.·´¯)',
      },
      {
        styleName: 'Fading effect',
        source,
        actual: transformText(source, getFont('Fading effect')),
        expected: '█▓▒▒░░░Az09!░░░▒▒▓█',
      },
    ];

    streamRuntimeOutputs('start and end patterns', cases);

    cases.forEach(({ actual, expected }) => {
      expect(actual).to.equal(expected);
    });
  });

  it('applies repeating middle patterns from generated metadata', () => {
    const source = 'ABC!!';
    const cases = [
      {
        styleName: 'Arrows',
        source,
        actual: transformText(source, getFont('Arrows')),
        expected: '»»»A»»B»»C»»!»»!»»»',
      },
      {
        styleName: 'Cupido',
        source,
        actual: transformText(source, getFont('Cupido')),
        expected: '»»ᅳAᅳᅳBᅳᅳCᅳᅳ!ᅳᅳ!~►',
      },
      {
        styleName: 'Strikethrough',
        source,
        actual: transformText(source, getFont('Strikethrough')),
        expected: 'A̶̶B̶̶C̶̶!!',
      },
    ];

    streamRuntimeOutputs('repeating middle patterns', cases);

    cases.forEach(({ actual, expected }) => {
      expect(actual).to.equal(expected);
    });
  });

  it('does not render pattern-only output for empty text', () => {
    const source = '';
    const cases = fontSheet.fonts.map((font) => ({
      styleName: font.styleName,
      source,
      actual: transformText(source, font),
      expected: '',
    }));

    streamRuntimeSummary('empty text for every runtime style', {
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

  it('runs runtime transforms for every generated style', () => {
    const cases = fontSheet.fonts.map((font) => {
      const actual = transformText(INSPECTION_SOURCE, font);
      return {
        styleName: font.styleName,
        source: INSPECTION_SOURCE,
        actual,
        expected: actual,
      };
    });

    streamRuntimeOutputs('every generated runtime style', cases);

    expect(cases.length).to.equal(fontSheet.fonts.length);
    cases.forEach(({ actual, expected }) => {
      expect(actual).to.equal(expected);
    });
  });

  it('passes through invalid font definitions and non-string input safely', () => {
    const source = 'ABC!!';
    const cases = [
      {
        styleName: 'invalid font',
        source,
        actual: transformText(source, null),
        expected: source,
      },
      {
        styleName: 'non-string input',
        source: String(123),
        actual: transformText(123, getFont('Cupido')),
        expected: '',
      },
    ];

    streamRuntimeOutputs('invalid input safety', cases);

    cases.forEach(({ actual, expected }) => {
      expect(actual).to.equal(expected);
    });
  });

  it('caps very long input before applying runtime patterns', () => {
    const source = 'A'.repeat(MAX_INPUT_LENGTH + 1);
    const expectedBody = 'A'.repeat(MAX_INPUT_LENGTH);
    const cases = [
      {
        styleName: 'Light text bubble',
        source: `${source.length} characters`,
        actual: transformText(source, getFont('Light text bubble')).length,
        expected: MAX_INPUT_LENGTH,
      },
      {
        styleName: 'Sparkles',
        source: `${source.length} characters`,
        actual: transformText(source, getFont('Sparkles')),
        expected: `(¯\`·._.··¸.-~*´¨¯¨\`*·~-.${expectedBody}.-~*´¨¯¨\`*·~-.¸··._.·´¯)`,
      },
    ];

    streamRuntimeOutputs('length cap before patterns', cases);

    cases.forEach(({ actual, expected }) => {
      expect(actual).to.equal(expected);
    });
  });

  it('caps input by Unicode code points without splitting emoji', () => {
    const source = `${'A'.repeat(MAX_INPUT_LENGTH - 1)}🚀`;
    const actual = transformText(source, getFont('Light text bubble'));

    expect([...actual]).to.have.length(MAX_INPUT_LENGTH);
    expect(actual).to.equal(`${'Ⓐ'.repeat(MAX_INPUT_LENGTH - 1)}🚀`);
  });

  it('transforms 200-character input across every style within the performance budget', () => {
    const source = 'ABCxyz123!'.repeat(20);
    const start = performance.now();
    const outputs = fontSheet.fonts.map((font) => transformText(source, font));
    const elapsedMs = performance.now() - start;

    streamRuntimeSummary('performance budget for every runtime style', {
      source: `${source.length} characters`,
      styleCount: fontSheet.fonts.length,
      elapsedMs,
      budgetMs: PERFORMANCE_BUDGET_MS,
    });

    expect(source.length).to.equal(MAX_INPUT_LENGTH);
    expect(outputs.length).to.equal(fontSheet.fonts.length);
    outputs.forEach((output) => {
      expect(output).to.be.a('string');
    });
    expect(elapsedMs).to.be.below(PERFORMANCE_BUDGET_MS);
  });
});
