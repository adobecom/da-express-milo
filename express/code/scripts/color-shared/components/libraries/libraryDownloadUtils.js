import { hexToNormalizedRGB, paletteToThemeData } from '../../../../libs/services/providers/transforms.js';

function channelToHex(value) {
  const int = Math.min(255, Math.max(0, Math.round(Number(value))));
  return Number.isNaN(int) ? '00' : int.toString(16).padStart(2, '0');
}

function rgbObjectToHex(rgb) {
  if (!rgb || rgb.r == null || rgb.g == null || rgb.b == null) return null;
  return `#${channelToHex(rgb.r)}${channelToHex(rgb.g)}${channelToHex(rgb.b)}`;
}

function stopColorToHex(stopColor) {
  if (!stopColor) return null;
  if (typeof stopColor === 'string') return stopColor.startsWith('#') ? stopColor : `#${stopColor}`;

  const entry = Array.isArray(stopColor) ? stopColor[0] : stopColor;
  if (entry?.value) return rgbObjectToHex(entry.value);
  if (typeof entry?.hex === 'string') return entry.hex.startsWith('#') ? entry.hex : `#${entry.hex}`;
  if (typeof stopColor.hex === 'string') return stopColor.hex.startsWith('#') ? stopColor.hex : `#${stopColor.hex}`;

  return null;
}

/**
 * Map a CC Libraries gradient stop to DownloadProvider swatch shape.
 * @param {Object} stop
 * @param {number} index
 * @param {number} total
 */
export function libraryGradientStopToSwatch(stop, index, total) {
  const hex = stopColorToHex(stop?.color);
  const fallbackOffset = total > 1 ? index / (total - 1) : 0;
  const offset = Number.isFinite(Number(stop?.offset)) ? Number(stop.offset) : fallbackOffset;

  return {
    rgb: hexToNormalizedRGB(hex || '#000000'),
    offset,
    midpoint: stop?.midpoint ?? 0.5,
  };
}

/**
 * @param {Object} item - library gradient item with colorStops
 */
export function libraryGradientToDownloadData(item) {
  const stops = Array.isArray(item?.colorStops) ? item.colorStops : [];
  return {
    name: item?.name || 'Untitled gradient',
    assetType: 'gradient',
    swatches: stops.map((stop, index) => libraryGradientStopToSwatch(stop, index, stops.length)),
  };
}

/**
 * Map a CC Libraries gradient item to createGradientModalContent shape.
 * @param {Object} item - library gradient item
 */
export function libraryGradientToModalGradient(item) {
  const stops = Array.isArray(item?.colorStops) ? item.colorStops : [];
  const colorStops = stops.map((stop, index) => {
    const fallbackPosition = stops.length > 1 ? index / (stops.length - 1) : 0;
    const position = Number.isFinite(Number(stop?.offset)) ? Number(stop.offset) : fallbackPosition;
    return {
      color: stopColorToHex(stop?.color) || '#000000',
      position,
    };
  });

  return {
    id: item?.id,
    name: item?.name || 'Untitled gradient',
    angle: item?.angle ?? 90,
    gradient: item?.gradient,
    colorStops,
    tags: item?.tags,
  };
}

/**
 * @param {Object} item - library theme item with colors
 */
export function libraryThemeToDownloadData(item) {
  return paletteToThemeData({
    name: item?.name,
    colors: item?.colors || [],
  });
}

/**
 * @param {Object} item - library theme or gradient item
 */
export function libraryItemToDownloadData(item) {
  if (item?.type === 'gradient') return libraryGradientToDownloadData(item);
  return libraryThemeToDownloadData(item);
}
