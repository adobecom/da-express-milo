/**
 * Option defaults for the strip-container variant (one variant; these are config, not variants).
 * Orientation = horizontal | vertical is layout for that variant, not a separate variant.
 * Aligns with Figma "Properties for explore palettes page" and STRIP_CONTAINER_SPEC.md.
 */
/* eslint-disable import/prefer-default-export */
export const STRIP_CONTAINER_DEFAULTS = {
  // Layout / state / theme (options for this variant)
  orientation: 'vertical', // horizontal | vertical — strip-container defaults to vertical
  state: 'default',
  theme: 'light', // light | dark | all

  // Boolean — visibility / behavior
  showHoverState: false,
  superLight: false,
  locked: false,
  showColorBlindness: false,
  showDrag: false,
  showLock: false,
  showTrash: false,
  showCopyHex: true,
  showEditTint: false,
  showAddLeft: false,
  showAddRight: false,
  addEmptyColorStrip: false,
  baseColorSet: false,
  showBaseColor: false,
  showEditColor: true,

  // Text
  label: '#FF7500', // example / format
};
