import { transformText } from '../font-generator/unicodeEngine.js';

const DEFAULT_PREVIEW_TEXT = 'ABC!!é🚀 09';
const FONT_SHEET_URL = new URL('../font-generator/font-sheets/v1/v1.json', import.meta.url);
const PREVIEW_CHARACTERS = ['A', 'a', '0', '!'];

function createElement(tagName, className = '', text = '') {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function createCell(text, className = '') {
  const cell = createElement('td', className);
  cell.textContent = text;
  return cell;
}

function getMappedCharacter(font, character) {
  return font.characters.letters[character]
    ?? font.characters.numbers[character]
    ?? font.characters.specialCharacters[character]
    ?? character;
}

function getPatternSummary(font) {
  const pattern = font.pattern || {};
  if (!pattern.placement || pattern.placement === 'none') return 'none';

  return [
    `placement: ${pattern.placement}`,
    pattern.startPattern ? `start: ${pattern.startPattern}` : null,
    pattern.repeatingMiddlePattern ? `middle: ${pattern.repeatingMiddlePattern}` : null,
    pattern.endPattern ? `end: ${pattern.endPattern}` : null,
  ].filter(Boolean).join(' | ');
}

function getMapPreview(font) {
  return PREVIEW_CHARACTERS
    .map((character) => `${character}->${getMappedCharacter(font, character)}`)
    .join(' | ');
}

function getMissingSummary(font) {
  const { letters, numbers, specialCharacters } = font.missingCharacters;
  const total = letters.length + numbers.length + specialCharacters.length;
  if (total === 0) return 'none';
  return `letters: ${letters.length}, numbers: ${numbers.length}, special: ${specialCharacters.length}`;
}

function createHeaderRow() {
  const row = document.createElement('tr');
  [
    'Grouping',
    'Style name',
    'Supported font',
    'Type',
    'Pattern metadata',
    'Map preview',
    'Missing',
    'Transformed output',
  ].forEach((headingText) => {
    const heading = createElement('th', '', headingText);
    heading.scope = 'col';
    row.append(heading);
  });
  return row;
}

function createFontRow(font, previewText) {
  const row = document.createElement('tr');
  const outputCell = createCell(transformText(previewText, font), 'font-generator-visualizer-output');
  row.dataset.fontId = font.id;

  row.append(
    createCell(font.grouping),
    createCell(font.styleName, 'font-generator-visualizer-style-name'),
    createCell(font.fontSupported),
    createCell(font.type),
    createCell(getPatternSummary(font), 'font-generator-visualizer-pattern'),
    createCell(getMapPreview(font), 'font-generator-visualizer-map'),
    createCell(getMissingSummary(font)),
    outputCell,
  );

  return { row, outputCell };
}

function updateOutputs(rows, previewText) {
  rows.forEach(({ font, outputCell }) => {
    outputCell.textContent = transformText(previewText, font);
  });
}

async function loadFontSheet() {
  const response = await fetch(FONT_SHEET_URL);
  if (!response.ok) {
    throw new Error(`Unable to load font sheet: ${response.status}`);
  }
  return response.json();
}

export default async function decorate(block) {
  block.textContent = '';
  block.classList.add('font-generator-visualizer');

  const intro = createElement(
    'p',
    'font-generator-visualizer-intro',
    'Development visualizer for generated font-sheet metadata and runtime text transforms.',
  );
  const label = createElement('label', 'font-generator-visualizer-label', 'Preview text');
  const input = createElement('input', 'font-generator-visualizer-input');
  const status = createElement('p', 'font-generator-visualizer-status', 'Loading font sheet...');
  const tableWrapper = createElement('div', 'font-generator-visualizer-table-wrapper');
  const table = createElement('table', 'font-generator-visualizer-table');
  const caption = createElement(
    'caption',
    '',
    'Generated font sheet rows from v1.json with live unicodeEngine output',
  );
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  input.type = 'text';
  input.value = DEFAULT_PREVIEW_TEXT;
  label.append(input);
  thead.append(createHeaderRow());
  table.append(caption, thead, tbody);
  tableWrapper.append(table);
  block.append(intro, label, status, tableWrapper);

  try {
    const fontSheet = await loadFontSheet();
    const rows = fontSheet.fonts.map((font) => {
      const rendered = createFontRow(font, input.value);
      tbody.append(rendered.row);
      return { font, outputCell: rendered.outputCell };
    });

    status.textContent = `${fontSheet.fonts.length} styles loaded from ${fontSheet.version}.`;
    input.addEventListener('input', () => updateOutputs(rows, input.value));
  } catch (error) {
    status.textContent = error.message;
    tableWrapper.hidden = true;
  }
}
