function normalizeHex(hex) {
  return typeof hex === 'string' ? hex.trim().toUpperCase() : '';
}

function findColorIndex(colors, target, usedIndexes = new Set()) {
  const normalizedTarget = normalizeHex(target);
  if (!normalizedTarget) return -1;

  return colors.findIndex((color, index) => (
    !usedIndexes.has(index) && normalizeHex(color) === normalizedTarget
  ));
}

export default function syncPaletteSelections(
  colors,
  previousForeground,
  previousBackground,
  nextForeground,
  nextBackground,
) {
  const nextColors = Array.isArray(colors) ? [...colors] : [];
  const usedIndexes = new Set();

  const applySelection = (previousColor, nextColor, fallbackIndex) => {
    if (!nextColor) return;

    let targetIndex = findColorIndex(nextColors, previousColor, usedIndexes);

    if (
      targetIndex === -1
      && Number.isInteger(fallbackIndex)
      && fallbackIndex >= 0
      && fallbackIndex < nextColors.length
      && !usedIndexes.has(fallbackIndex)
    ) {
      targetIndex = fallbackIndex;
    }

    if (targetIndex === -1 && nextColors.length === 0) {
      nextColors.push(nextColor);
      targetIndex = 0;
    }

    if (targetIndex === -1 && nextColors.length > 0) {
      targetIndex = nextColors.findIndex((_, index) => !usedIndexes.has(index));
      if (targetIndex === -1) targetIndex = nextColors.length - 1;
    }

    if (targetIndex === -1) return;

    nextColors[targetIndex] = nextColor;
    usedIndexes.add(targetIndex);
  };

  applySelection(previousForeground, nextForeground, 0);
  applySelection(previousBackground, nextBackground, nextColors.length > 1 ? 1 : 0);

  return nextColors;
}
