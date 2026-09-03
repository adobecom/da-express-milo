import { expect } from '@esm-bundle/chai';
import {
  calculateCoverCrop,
  drawMiniEditorText,
  drawMiniEditorCard,
  MINI_EDITOR_EXPORT_HEIGHT,
  MINI_EDITOR_EXPORT_WIDTH,
  wrapCanvasText,
} from '../../../express/code/scripts/utils/mini-editor-card-renderer.js';

const model = {
  quote: 'A short quote',
  author: '',
  font: { family: 'sans-serif', style: 'normal', weight: 'normal' },
};

describe('mini-editor card renderer', () => {
  it('calculates a centered cover crop', () => {
    expect(calculateCoverCrop(200, 100, 100, 100)).to.deep.equal({
      sourceX: 50,
      sourceY: 0,
      sourceWidth: 100,
      sourceHeight: 100,
    });
  });

  it('wraps text and splits words wider than the available line', () => {
    const context = { measureText: (text) => ({ width: text.length * 10 }) };
    expect(wrapCanvasText(context, 'one two three', 70)).to.deep.equal(['one two', 'three']);
    expect(wrapCanvasText(context, 'abcdefgh', 30)).to.deep.equal(['abc', 'def', 'gh']);
  });

  it('renders an opaque fixed-size rectangle with square corners', () => {
    const background = document.createElement('canvas');
    background.width = 20;
    background.height = 20;
    const backgroundContext = background.getContext('2d');
    backgroundContext.fillStyle = '#ff0000';
    backgroundContext.fillRect(0, 0, 20, 20);

    const canvas = document.createElement('canvas');
    canvas.width = MINI_EDITOR_EXPORT_WIDTH;
    canvas.height = MINI_EDITOR_EXPORT_HEIGHT;
    const context = canvas.getContext('2d');
    drawMiniEditorCard(context, background, model);

    expect(canvas.width).to.equal(1084);
    expect(canvas.height).to.equal(700);
    expect(Array.from(context.getImageData(0, 0, 1, 1).data)).to.deep.equal([255, 0, 0, 255]);
    expect(Array.from(context.getImageData(1083, 699, 1, 1).data)).to.deep.equal([255, 0, 0, 255]);
  });

  it('uses light text on dark backgrounds and dark text on light backgrounds', () => {
    const fillStyleChanges = [];
    const context = {
      save: () => {},
      restore: () => {},
      measureText: () => ({ width: 100 }),
      fillText: () => {},
      set fillStyle(value) {
        fillStyleChanges.push(value);
      },
      get fillStyle() {
        return fillStyleChanges[fillStyleChanges.length - 1];
      },
      font: '',
      textAlign: 'left',
      textBaseline: 'alphabetic',
    };

    drawMiniEditorText(context, {
      quote: 'Dark bg quote',
      author: 'Author',
      backgroundMode: 'dark',
      font: { family: 'sans-serif', style: 'normal', weight: 'normal' },
    });
    expect(fillStyleChanges).to.include('#ffffff');
    expect(fillStyleChanges).to.include('rgba(255, 255, 255, 0.8)');

    fillStyleChanges.length = 0;
    drawMiniEditorText(context, {
      quote: 'Light bg quote',
      author: 'Author',
      backgroundMode: 'light',
      font: { family: 'sans-serif', style: 'normal', weight: 'normal' },
    });
    expect(fillStyleChanges).to.include('#131313');
    expect(fillStyleChanges).to.include('#505050');
  });

  it('wraps the quote at model.quoteWidth, falling back to QUOTE_MAX_WIDTH', () => {
    const linesFor = (quoteWidth) => {
      const drawn = [];
      const context = {
        save() {},
        restore() {},
        measureText: (t) => ({ width: t.length * 10 }),
        fillText: (text) => { drawn.push(text); },
        fillStyle: '',
        font: '',
        textAlign: 'left',
        textBaseline: 'alphabetic',
      };
      drawMiniEditorText(context, {
        quote: 'one two three four five',
        backgroundMode: 'light',
        font: { family: 'sans-serif', style: 'normal', weight: 'normal' },
        ...(quoteWidth ? { quoteWidth } : {}),
      });
      return drawn;
    };
    // Narrow measured column (7 chars/line) forces several lines.
    expect(linesFor(70)).to.deep.equal(['one two', 'three', 'four', 'five']);
    // No measurement -> QUOTE_MAX_WIDTH (624 -> 62 chars) keeps it on one line.
    expect(linesFor(undefined)).to.deep.equal(['one two three four five']);
  });
});
