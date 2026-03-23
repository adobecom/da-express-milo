export const PALETTE_PRESETS = [
  { colors: ['#811B0E', '#D29500', '#FFEBE8', '#D7F7E1', '#1D3ECF'] },
  { colors: ['#D73220', '#F4DACB', '#1286CD', '#68150A', '#1F0062'] },
  { colors: ['#AF7400', '#FFF197', '#FF9D91', '#0E1843', '#120B00'] },
  { colors: ['#FF4885', '#CBE2FE', '#EDC4AC', '#10288C', '#4B0090'] },
  { colors: ['#2A0081', '#B7E7FC', '#FFD3F0', '#F5C700', '#BA1650'] },
  { colors: ['#ADEEC5', '#B72818', '#E86A00', '#3B63FB', '#480058'] },
  { colors: ['#1C3A16', '#04953D', '#482E0A', '#D0F1B7', '#FCFAFA', '#607F5D', '#1C221B'] },
  { colors: ['#911400', '#F7E7CB', '#3B0014', '#9AB6FF', '#00291B', '#F2B9A9'] },
  { colors: ['#2086F9', '#00428D', '#F1EDE5', '#FEFFB2', '#F04517', '#181B1E'] },
  { colors: ['#2B2D42', '#9DD8FF', '#B20D30', '#999CC0', '#FFB997', '#1D7874'] },
  { colors: ['#F1EEE1', '#1A1717', '#627E2E', '#D2AF9A', '#602222', '#B6DAF0'] },
];

export function pickRandomPalette() {
  const index = Math.floor(Math.random() * PALETTE_PRESETS.length);
  return PALETTE_PRESETS[index];
}
