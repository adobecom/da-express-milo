"use strict";
const focusables = [
  "button",
  "[focusable]",
  "[href]",
  "input",
  "label",
  "select",
  "textarea",
  "[tabindex]"
];
const userFocuable = ':not([tabindex="-1"])';
export const userFocusableSelector = focusables.join(`${userFocuable}, `) + userFocuable;
export const focusableSelector = focusables.join(", ");
//# sourceMappingURL=focusable-selectors.dev.js.map
