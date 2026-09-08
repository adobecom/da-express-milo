export const MINI_EDITOR_EXPORT_WIDTH = 1084;
export const MINI_EDITOR_EXPORT_HEIGHT = 700;

export const QUOTE_MAX_WIDTH = 624;
export const QUOTE_FONT_SIZE = 40;
export const QUOTE_LINE_HEIGHT = 52;
export const AUTHOR_FONT_SIZE = 32;
export const AUTHOR_BOTTOM = 24;
// Author design line-height (Label-L, 22px) doubled to export space, like QUOTE_LINE_HEIGHT. Used
// to place the author on hz, whose auto-height text frame is line-height (not font-size) tall.
export const AUTHOR_LINE_HEIGHT = 44;

const EXPORT_TEXT_COLORS = {
  light: {
    quote: '#131313',
    author: '#505050',
  },
  dark: {
    quote: '#ffffff',
    author: 'rgba(255, 255, 255, 0.8)',
  },
};

export function calculateCoverCrop(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = targetWidth / scale;
  const height = targetHeight / scale;
  return {
    sourceX: (sourceWidth - width) / 2,
    sourceY: (sourceHeight - height) / 2,
    sourceWidth: width,
    sourceHeight: height,
  };
}

function splitLongWord(context, word, maxWidth) {
  const parts = [];
  let part = '';
  Array.from(word).forEach((character) => {
    const candidate = `${part}${character}`;
    if (part && context.measureText(candidate).width > maxWidth) {
      parts.push(part);
      part = character;
    } else {
      part = candidate;
    }
  });
  if (part) parts.push(part);
  return parts;
}

export function wrapCanvasText(context, text, maxWidth) {
  const lines = [];
  let currentLine = '';
  text.trim().split(/\s+/).filter(Boolean).forEach((word) => {
    const parts = context.measureText(word).width > maxWidth
      ? splitLongWord(context, word, maxWidth)
      : [word];
    parts.forEach((part) => {
      const candidate = currentLine ? `${currentLine} ${part}` : part;
      if (currentLine && context.measureText(candidate).width > maxWidth) {
        lines.push(currentLine);
        currentLine = part;
      } else {
        currentLine = candidate;
      }
    });
  });
  if (currentLine) lines.push(currentLine);
  return lines;
}

function getImageDimensions(image) {
  return {
    width: image.naturalWidth || image.videoWidth || image.width,
    height: image.naturalHeight || image.videoHeight || image.height,
  };
}

export function drawCoverImage(
  context,
  image,
  width = MINI_EDITOR_EXPORT_WIDTH,
  height = MINI_EDITOR_EXPORT_HEIGHT,
) {
  const source = getImageDimensions(image);
  const crop = calculateCoverCrop(source.width, source.height, width, height);
  context.drawImage(
    image,
    crop.sourceX,
    crop.sourceY,
    crop.sourceWidth,
    crop.sourceHeight,
    0,
    0,
    width,
    height,
  );
}

function buildCanvasFont(font, size) {
  return `${font.style || 'normal'} ${font.weight || 'normal'} ${size}px ${font.family}`;
}

export function drawMiniEditorText(
  context,
  model,
  width = MINI_EDITOR_EXPORT_WIDTH,
  height = MINI_EDITOR_EXPORT_HEIGHT,
) {
  // Text scales uniformly with the canvas height (the constants are the 1084x700 design basis), so
  // font size and the bottom margin stay proportional as the canvas grows to the full-res image.
  const scale = height / MINI_EDITOR_EXPORT_HEIGHT;
  const quoteLineHeight = QUOTE_LINE_HEIGHT * scale;
  const mode = model.backgroundMode === 'light' ? 'light' : 'dark';
  const colors = EXPORT_TEXT_COLORS[mode];
  context.save();
  context.fillStyle = colors.quote;
  context.font = buildCanvasFont(model.font, QUOTE_FONT_SIZE * scale);
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  // Column width measured from the live card, pre-scaled to this canvas by the caller (see
  // mini-editor-quote-width.js); QUOTE_MAX_WIDTH * scale is the fallback.
  const lines = wrapCanvasText(context, model.quote, model.quoteWidth || QUOTE_MAX_WIDTH * scale);
  const firstLineY = (height / 2) - (((lines.length - 1) * quoteLineHeight) / 2);
  lines.forEach((line, index) => {
    context.fillText(line, width / 2, firstLineY + (index * quoteLineHeight));
  });

  if (model.author) {
    context.fillStyle = colors.author;
    context.font = buildCanvasFont(model.font, AUTHOR_FONT_SIZE * scale);
    context.textBaseline = 'bottom';
    context.fillText(model.author, width / 2, height - AUTHOR_BOTTOM * scale);
  }
  context.restore();
}

export function drawMiniEditorCard(
  context,
  background,
  model,
  width = MINI_EDITOR_EXPORT_WIDTH,
  height = MINI_EDITOR_EXPORT_HEIGHT,
) {
  context.clearRect(0, 0, width, height);
  drawCoverImage(context, background, width, height);
  drawMiniEditorText(context, model, width, height);
}
