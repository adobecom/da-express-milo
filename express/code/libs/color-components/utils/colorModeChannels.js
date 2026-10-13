import { rgbToAllSpacesDenormalized } from './harmony/ColorConversions.js';

function hexToRgbArray(hex) {
  const clean = String(hex || '').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(num)) return [0, 0, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]; // eslint-disable-line no-bitwise
}

/**
 * Channel table per color mode: [label, conversion space, key]. Values are
 * plain numbers with no unit suffix on any channel — this app's per-channel
 * breakdown (color-swatch-rail's rows, the gradient-editor handle's copy
 * value) is a raw at-a-glance/paste readout, not a formatted CSS value (that
 * case — e.g. lab()'s %-on-L convention — is handled separately by
 * formatSwatchInMode in helpers.js, used by the "Copy as CSS" export).
 */
const COLOR_MODE_CHANNELS = {
  RGB: [['R', 'rgb', 'r'], ['G', 'rgb', 'g'], ['B', 'rgb', 'b']],
  HSB: [['H', 'hsv', 'h'], ['S', 'hsv', 's'], ['B', 'hsv', 'v']],
  Lab: [['L', 'lab', 'l'], ['a', 'lab', 'a'], ['b', 'lab', 'b']],
};

/**
 * Per-channel {label, value} rows for a hex color in the given mode, shared
 * by every place in the app that shows or copies a per-channel breakdown
 * (color-swatch-rail's multi-row display, gradient-editor's handle copy) so
 * they can never drift into different formats for the same mode again.
 * Returns null for HEX or an unrecognized mode.
 * @param {string} hex
 * @param {'RGB'|'HSB'|'Lab'} mode
 * @returns {{label: string, value: string}[] | null}
 */
export function getColorModeChannels(hex, mode) {
  const channels = COLOR_MODE_CHANNELS[mode];
  if (!channels) return null;
  const spaces = rgbToAllSpacesDenormalized(hexToRgbArray(hex));
  return channels.map(([label, space, key]) => ({ label, value: String(spaces[space][key]) }));
}
