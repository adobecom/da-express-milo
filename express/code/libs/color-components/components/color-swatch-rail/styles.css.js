
import { css } from '../../../deps/lit-all.min.js';

export const style = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
    font-family: var(--body-font-family);
  }
  :host([orientation="stacked"]) {
    overflow: visible;
  }

  
  .swatch-rail {
    --icon-button-size: 32px;
    --top-actions-gap: 6px;

    position: relative;
    display: flex;
    flex-direction: row;
    gap: var(--swatch-rail-gap, var(--spacing-50));
    width: 100%;
    height: 100%;
    border-radius: var(--figma-strip-radius);
    overflow: hidden;
  }
  
  .swatch-rail:has(.add-slot--column-left),
  .swatch-rail:has(.add-slot--column-right),
  .swatch-rail[data-orientation="vertical"].vertical--two-rows:has(.add-slot--column-left),
  .swatch-rail[data-orientation="vertical"].vertical--two-rows:has(.add-slot--column-right) {
    overflow: visible;
  }

  .swatch-column {
    --swatch-column-padding: var(--spacing-200);

    flex: var(--swatch-column-flex);
    width: var(--swatch-column-width);
    min-width: var(--swatch-column-min-width);
    align-self: stretch;
    display: flex;
    flex-direction: column;
    padding: var(--swatch-column-padding);
    position: relative;
    isolation: isolate;
    transition: flex-grow 0.2s ease;
    box-sizing: border-box;
    container-type: inline-size;
  }

  .swatch-column:hover,
  .swatch-column:focus-within {
    z-index: 1;
  }

  .swatch-column--super-light {
    box-shadow: inset 0 0 0 1px var(--color-gray-300-variant);
  }

  .swatch-column--tint-mode {
    --swatch-base-color: #808080;
    --swatch-tint-overlay: rgba(0, 0, 0, 0.18);
  }

  .swatch-column--tint-mode[data-contrast="dark"] {
    --swatch-tint-overlay: rgba(255, 255, 255, 0.24);
  }

  .swatch-column--tint-selected {
    background-image: linear-gradient(var(--swatch-tint-overlay), var(--swatch-tint-overlay));
    box-shadow: inset 0 0 0 2px var(--Palette-gray-1000), inset 0 0 0 4px var(--Palette-gray-25);
  }

  @supports (background: color-mix(in srgb, black, white)) {
    .swatch-column--tint-selected {
      background-image: linear-gradient(
        to bottom,
        color-mix(in srgb, var(--swatch-base-color) 20%, white) 0%,
        color-mix(in srgb, var(--swatch-base-color) 20%, white) 14.29%,
        color-mix(in srgb, var(--swatch-base-color) 40%, white) 14.29%,
        color-mix(in srgb, var(--swatch-base-color) 40%, white) 28.57%,
        color-mix(in srgb, var(--swatch-base-color) 70%, white) 28.57%,
        color-mix(in srgb, var(--swatch-base-color) 70%, white) 42.86%,
        var(--swatch-base-color) 42.86%,
        var(--swatch-base-color) 57.14%,
        color-mix(in srgb, var(--swatch-base-color) 75%, black) 57.14%,
        color-mix(in srgb, var(--swatch-base-color) 75%, black) 71.43%,
        color-mix(in srgb, var(--swatch-base-color) 55%, black) 71.43%,
        color-mix(in srgb, var(--swatch-base-color) 55%, black) 85.71%,
        color-mix(in srgb, var(--swatch-base-color) 35%, black) 85.71%,
        color-mix(in srgb, var(--swatch-base-color) 35%, black) 100%
      );
    }
  }

  .swatch-column--tint-selected .icon-button--edit-tint {
    background-color: rgba(255, 255, 255, 0.28);
  }

  .swatch-column--tint-selected[data-contrast="dark"] .icon-button--edit-tint {
    background-color: rgba(0, 0, 0, 0.25);
  }

  .tint-bands {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    z-index: 5;
    overflow: hidden;
    pointer-events: none;
  }

  .tint-band-btn {
    flex: 1 1 0;
    min-height: 0;
    border: 0;
    padding: 0;
    margin: 0;
    width: 100%;
    background-color: var(--tint-band-color);
    cursor: pointer;
    pointer-events: auto;
  }

  .tint-band-btn:focus {
    outline: 2px solid var(--Palette-gray-1000);
    outline-offset: -2px;
    position: relative;
    z-index: 1;
    box-shadow: inset 0 0 0 4px rgba(255, 255, 255);
  }

  .swatch-rail[data-orientation="stacked"] .tint-bands {
    flex-direction: row;
    border-radius: inherit;
  }

  .swatch-rail[data-orientation="stacked"] .tint-band-btn {
    width: auto;
    height: 100%;
  }

  .swatch-rail[data-orientation="stacked"] .swatch-column:first-child .tint-band-btn:first-child {
    border-radius: var(--figma-strip-radius) 0 0;
  }

  .swatch-rail[data-orientation="stacked"] .swatch-column:first-child .tint-band-btn:last-child {
    border-radius: 0 var(--figma-strip-radius) 0 0;
  }

  .swatch-column:first-child {
    border-radius: var(--swatch-column-first-radius);
  }

  .swatch-column:nth-child(5) {
    border-radius: var(--swatch-column-5-radius);
  }

  .swatch-column:last-child {
    border-radius: var(--swatch-column-last-radius);
  }

  [role="row"]:only-child .swatch-column:first-child .tint-band-btn:first-child {
    border-radius: var(--figma-strip-radius) 0 0;
  }

  [role="row"]:only-child .swatch-column:first-child .tint-band-btn:last-child {
    border-radius: 0 0 0 var(--figma-strip-radius);
  }

  [role="row"]:only-child .swatch-column:last-child .tint-band-btn:first-child {
    border-radius: 0 var(--figma-strip-radius) 0 0;
  }

  [role="row"]:only-child .swatch-column:last-child .tint-band-btn:last-child {
    border-radius: 0 0 var(--figma-strip-radius) 0;
  }

  
  .swatch-rail[data-orientation="horizontal"] {
    height: 48px;
    padding: 8px 12px;
    gap: var(--swatch-rail-gap, var(--spacing-50));
    border-radius: var(--figma-strip-radius) var(--figma-strip-radius) 0 0;
  }

  .swatch-rail[data-orientation="horizontal"] .swatch-column {
    flex: 1 1 0;
    width: auto;
    min-width: 0;
    padding: 0;
  }

  .swatch-rail[data-orientation="horizontal"] .swatch-column:first-child {
    border-radius: var(--swatch-column-first-radius);
  }

  .swatch-rail[data-orientation="horizontal"] .swatch-column:last-child {
    border-radius: var(--swatch-column-last-radius);
  }

  
  .swatch-rail[data-orientation="vertical"] {
    display: grid;
    grid-template-columns: repeat(var(--rail-columns), 1fr);
    grid-auto-rows: 1fr;
    flex-direction: unset;
    gap: var(--swatch-rail-gap, var(--spacing-50));
  }

  .swatch-rail[data-orientation="vertical"] .swatch-column {
    min-width: 0;
    width: auto;
  }

  
  .swatch-rail[data-orientation="vertical"].vertical--four-rows {
    display: grid;
    grid-template-columns: repeat(var(--four-rows-cols, 5), 1fr);
    grid-template-rows: repeat(4, 1fr);
    gap: var(--swatch-rail-gap, var(--spacing-50));
    border-radius: var(--Corner-radius-corner-radius-200);
    overflow: hidden;
  }
  
  :host([hex-copy-first-row-only]) .swatch-rail[data-orientation="vertical"].vertical--four-rows {
    grid-template-rows: 1fr 90px 90px 90px;
  }

  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column {
    min-width: 0;
    min-height: 0;
  }

  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column::before {
    content: '';
    flex: 1 1 0;
    min-height: 0;
    order: 1;
  }

  .swatch-rail[data-orientation="vertical"].vertical--four-rows .bottom-info {
    order: 2;
    flex-shrink: 0;
  }

  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column--empty::before {
    content: none;
  }

  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column--empty {
    justify-content: center;
    align-items: center;
  }

  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column {
    border-radius: 0;
  }

  
  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column--simulated {
    position: relative;
    padding: 0;
    min-height: 0;
  }
  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column--simulated .strip-color-blindness-swatch__conflict-icon {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: default;
    pointer-events: auto;
    color: var(--swatch-icon-color);
  }
  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column--simulated .strip-color-blindness-swatch__conflict-icon sp-icon-alert {
    display: block;
    width: 100%;
    height: 100%;
    color: var(--swatch-icon-color);
  }
  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column--simulated .strip-color-blindness-swatch__conflict-icon .icon-fallback {
    display: block;
    width: 100%;
    height: 100%;
    fill: currentColor;
  }

  
  .swatch-rail[data-orientation="vertical"].vertical--two-rows {
    display: grid;
    grid-template-columns: repeat(var(--vertical-max-per-row, 5), 1fr);
    grid-template-rows: 1fr 1fr;
    gap: var(--swatch-rail-gap, var(--spacing-50));
    border-radius: var(--Corner-radius-corner-radius-200);
    overflow: hidden;
  }

  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column {
    min-width: 0;
    min-height: 0;
  }

  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column::before {
    content: '';
    flex: 1 1 0;
    min-height: 0;
    order: 1;
  }

  .swatch-rail[data-orientation="vertical"].vertical--two-rows .bottom-info {
    order: 2;
    flex-shrink: 0;
  }

  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column--empty::before {
    content: none;
  }

  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column--empty {
    justify-content: center;
    align-items: center;
    border: 1px solid var(--color-gray-250);
  }

  
  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column {
    border-radius: 0;
  }

  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column:first-child {
    border-radius: var(--Corner-radius-corner-radius-200) 0 0 0;
  }
  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column:last-child {
    border-radius: 0 0 var(--Corner-radius-corner-radius-200) 0;
  }

  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column.corner-top-right {
    border-radius: 0 var(--Corner-radius-corner-radius-200) 0 0;
  }
  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column.corner-bottom-left {
    border-radius: 0 0 0 var(--Corner-radius-corner-radius-200);
  }

  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column.corner-top-left .tint-band-btn:first-child {
    border-radius: var(--figma-strip-radius) 0 0;
  }

  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column.corner-top-right .tint-band-btn:first-child {
    border-radius: 0 var(--figma-strip-radius) 0 0;
  }

  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column.corner-bottom-left .tint-band-btn:last-child {
    border-radius: 0 0 0 var(--figma-strip-radius);
  }

  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column.corner-bottom-right .tint-band-btn:last-child {
    border-radius: 0 0 var(--figma-strip-radius) 0;
  }

  .swatch-rail[data-orientation="vertical"] .bottom-info {
    gap: 0;
    padding: 0;
  }

  .swatch-rail[data-orientation="vertical"] .swatch-column--draggable {
    cursor: auto;
  }

  
  .swatch-rail[data-orientation="two-rows"] {
    flex-direction: column;
    gap: 2px;
    height: 100%;
    min-height: 0;
    padding: 0;
    overflow: hidden;
  }
  .swatch-rail[data-orientation="two-rows"] .swatch-rail__row {
    display: flex;
    flex-direction: row;
    flex: 1 1 0;
    min-height: 0;
    gap: 2px;
    width: 100%;
  }
  .swatch-rail[data-orientation="two-rows"] .swatch-rail__row .swatch-column {
    flex: 0 0 20%;
    width: 20%;
    min-width: 0;
    min-height: 0;
    height: 100%;
  }
  .swatch-rail[data-orientation="two-rows"] .swatch-rail__row .swatch-column::before {
    content: '';
    flex: 1 1 0;
    min-height: 0;
    order: 1;
  }
  .swatch-rail[data-orientation="two-rows"] .swatch-rail__row .bottom-info {
    order: 2;
    flex-shrink: 0;
  }
  .swatch-rail[data-orientation="two-rows"] .swatch-rail__row .swatch-column--empty::before {
    content: none;
  }
  .swatch-rail[data-orientation="two-rows"] .swatch-rail__row .swatch-column--empty {
    justify-content: center;
    align-items: center;
  }
  
  :host(:not([embedded])) .swatch-rail[data-orientation="two-rows"] .swatch-rail__row[data-row-index="0"] .swatch-column:first-child {
    border-radius: var(--Corner-radius-corner-radius-200) 0 0 0;
  }
  :host(:not([embedded])) .swatch-rail[data-orientation="two-rows"] .swatch-rail__row[data-row-index="0"] .swatch-column:last-child {
    border-radius: 0 var(--Corner-radius-corner-radius-200) 0 0;
  }
  :host(:not([embedded])) .swatch-rail[data-orientation="two-rows"] .swatch-rail__row[data-row-index="1"] .swatch-column:first-child {
    border-radius: 0 0 0 var(--Corner-radius-corner-radius-200);
  }
  :host(:not([embedded])) .swatch-rail[data-orientation="two-rows"] .swatch-rail__row[data-row-index="1"] .swatch-column:last-child {
    border-radius: 0 0 var(--Corner-radius-corner-radius-200) 0;
  }
  :host([embedded]) .swatch-rail,
  :host([embedded]) .swatch-rail .swatch-column {
    border-radius: 0;
  }
  
  :host([embedded]) .swatch-rail[data-orientation="stacked"] .swatch-column:first-child {
    border-radius: var(--figma-strip-radius) var(--figma-strip-radius) 0 0;
  }
  :host([embedded]) .swatch-rail[data-orientation="stacked"] .swatch-column:last-child {
    border-radius: 0 0 var(--figma-strip-radius) var(--figma-strip-radius);
  }
  :host([embedded]) .swatch-rail[data-orientation="stacked"] .swatch-column:not(:first-child):not(:last-child) {
    border-radius: 0;
  }

  
  .swatch-rail[data-orientation="horizontal"] .bottom-info {
    width: 100%;
    justify-content: space-between;
    flex-direction: row;
    padding: 0 8px;
  }

  .swatch-rail[data-orientation="horizontal"] .hex-code {
    flex-shrink: 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .swatch-rail[data-orientation="horizontal"] .bottom-info__actions {
    flex-shrink: 0;
    margin-left: 0;
  }

  
  
  .swatch-rail[data-orientation="stacked"] {
    flex-direction: column;
    height: 100%;
    min-height: 0;
    gap: var(--swatch-rail-gap, var(--spacing-50));
    padding: 0;
    border-radius: var(--figma-strip-radius);
    overflow: visible;
  }

  .swatch-rail[data-orientation="stacked"] .swatch-column {
    flex: 1 0 auto;
    min-height: 48px;
    width: 100%;
    min-width: 0;
    padding: 0 12px;
    border-radius: 0;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    overflow: visible;
    position: relative;
  }

  
  .swatch-rail[data-orientation="stacked"] .swatch-column:first-child {
    border-radius: var(--figma-strip-radius) var(--figma-strip-radius) 0 0;
  }
  .swatch-rail[data-orientation="stacked"] .swatch-column:last-child {
    border-radius: 0 0 var(--figma-strip-radius) var(--figma-strip-radius);
  }
  
  .swatch-rail[data-orientation="stacked"] .swatch-column:last-child.swatch-column--empty {
    border: 1px solid var(--color-gray-250);
  }
  
  .swatch-rail[data-orientation="stacked"] .swatch-column:not(:first-child):not(:last-child) {
    border-radius: 0;
  }

  .swatch-rail[data-orientation="stacked"] .swatch-column--empty {
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }

  
  .swatch-rail[data-orientation="stacked"] .stacked-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 8px;
    position: relative;
    z-index: 2;
  }

  .swatch-rail[data-orientation="stacked"] .bottom-info--stacked {
    margin-top: 0;
    flex-direction: row;
    flex: 1 1 0;
    min-width: 0;
    justify-content: flex-start;
  }

  .swatch-rail[data-orientation="stacked"] .hex-code {
    flex-shrink: 0;
  }

  .swatch-rail[data-orientation="stacked"] .stacked-row__icons {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .swatch-rail[data-orientation="stacked"] .stacked-row__icons .base-color-badge,
  .swatch-rail[data-orientation="stacked"] .stacked-row__icons .color-blindness-badge {
    position: static;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
  }

  .swatch-column:hover {
    
  }

  
  .swatch-column:focus {
    outline: none;
  }
  .swatch-column:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--color-blue-800);
  }

  
  .top-actions-row {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    pointer-events: none;
    z-index: 3;
  }

  .top-actions {
    display: flex;
    align-items: center;
    gap: var(--top-actions-gap);
    position: static;
    pointer-events: auto;
  }

  .top-actions--left {
    justify-content: flex-start;
  }

  .top-actions--right {
    flex-direction: column;
    align-items: flex-end;
  }

  .top-actions--right .color-blindness-badge {
    position: static;
  }

  .swatch-column--right-actions-hover-only .top-actions--right {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
  }

  .swatch-column--right-actions-hover-only:hover .top-actions--right,
  .swatch-column--right-actions-hover-only:focus-visible .top-actions--right,
  .swatch-column--right-actions-hover-only:has(.swatch-column-focusable:focus-visible) .top-actions--right {
    opacity: 1;
    pointer-events: auto;
  }

  /* When locked, always show the container so the lock icon is visible */
  .swatch-column--right-actions-hover-only.locked .top-actions--right {
    opacity: 1;
    pointer-events: auto;
  }
  /* Non-lock icons fade in on hover/focus; hidden otherwise */
  .swatch-column--right-actions-hover-only.locked .top-actions--right > :not(.icon-button--lock) {
    transition: opacity 0.15s ease;
  }
  .swatch-column--right-actions-hover-only.locked:not(:hover):not(:focus-visible):not(:has(.swatch-column-focusable:focus-visible)) .top-actions--right > :not(.icon-button--lock) {
    opacity: 0;
    pointer-events: none;
  }


  .add-slots-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .add-slots-overlay .add-slot {
    pointer-events: auto;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    width: 36px;
    height: 36px;
  }

  
  .add-slots-overlay .add-slot--left {
    left: 0;
  }
  
  .add-slots-overlay .add-slot--right {
    left: auto;
  }

  
  .add-slots-overlay .add-slot .icon-button--add {
    width: 32px;
    height: 32px;
    padding: 6px;
    border-radius: 50%;
    border: 1px solid var(--color-blue-800);
    background: var(--color-white);
    color: var(--color-blue-800);
  }
  .add-slots-overlay .add-slot .icon-button--add:hover {
    background: var(--color-light-gray);
    border-color: var(--color-blue-800);
  }
  .add-slots-overlay .add-slot .icon-button--add:active {
    background: var(--color-light-gray);
    border-color: var(--color-blue-800);
  }
  .add-slots-overlay .add-slot .icon-button--add:focus-visible {
    outline: 2px solid var(--color-blue-800);
    outline-offset: 2px;
  }
  .add-slots-overlay .add-slot .icon-button--add [class^="sp-icon-"] {
    width: 20px;
    height: 20px;
  }

  

  
  .swatch-rail[data-orientation="stacked"] .add-slots-overlay .add-slot--left {
    left: 50%;
    right: auto;
    transform: translate(-50%, -50%);
  }
  .swatch-rail[data-orientation="stacked"] .add-slots-overlay .add-slot--right {
    left: 50%;
    right: auto;
    transform: translate(-50%, 50%);
  }

  
  .swatch-column .add-slot--column {
    position: absolute;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
    z-index: 2;
  }
  
  .swatch-column .add-slot--column-left,
  .swatch-column .add-slot--column-right {
    top: 0;
    height: 100%;
    width: 24px;
    pointer-events: auto;
  }
  .swatch-column .add-slot--column-left {
    left: 0;
  }
  .swatch-column .add-slot--column-right {
    right: 0;
  }
  .swatch-column .add-slot--column-left:hover,
  .swatch-column .add-slot--column-right:hover {
    opacity: 1;
  }
  .swatch-column .add-slot--column-left .icon-button {
    position: absolute;
    left: -17px;
  }
  .swatch-column .add-slot--column-right .icon-button {
    position: absolute;
    right: -17px;
  }

  /* With 4+ top-right action icons stacking vertically, push both add buttons down
     so there is 16px of space below the last action icon. */
  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column:has(.top-actions--right > :nth-child(4))
    .add-slot--column .icon-button {
    top: calc(var(--swatch-column-padding) + 4 * var(--icon-button-size) + 3 * var(--top-actions-gap) + 16px);
  }

  .swatch-column:focus-visible .add-slot--column,
  .swatch-column:has(.swatch-column-focusable:focus-visible) .add-slot--column {
    opacity: 1;
    pointer-events: auto;
  }
  .swatch-column--tint-selected .add-slot--column,
  .swatch-column--tint-selected .add-slot--column-left:hover,
  .swatch-column--tint-selected .add-slot--column-right:hover,
  .swatch-column--tint-selected:focus-visible .add-slot--column,
  .swatch-column--tint-selected:has(.swatch-column-focusable:focus-visible) .add-slot--column {
    opacity: 0;
    pointer-events: none;
  }
  .swatch-column .add-slot--column .icon-button--add {
    width: 32px;
    height: 32px;
    padding: 6px;
    border-radius: 50%;
    border: 1px solid var(--color-blue-800);
    background: var(--color-white);
    color: var(--color-blue-800);
  }
  .swatch-column .add-slot--column .icon-button--add.icon-button:hover {
    background: var(--color-white);
    border-color: var(--color-blue-800);
  }
  .swatch-column .add-slot--column .icon-button--add:active {
    background: var(--color-light-gray);
    border-color: var(--color-blue-800);
  }
  .swatch-column .add-slot--column .icon-button--add:focus-visible {
    outline: 2px solid var(--color-blue-800);
    outline-offset: 2px;
  }
  .swatch-column .add-slot--column .icon-button--add [class^="sp-icon-"] {
    width: 20px;
    height: 20px;
  }

  
  .swatch-column--empty {
    flex: var(--swatch-column-flex);
    width: var(--swatch-column-width);
    min-width: var(--swatch-column-min-width);
    max-width: 100%;
    flex-shrink: 1;
    background: var(--color-white) !important;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  
  .swatch-column--empty .icon-button--add {
    cursor: pointer;
    width: 32px;
    height: 32px;
    padding: 6px;
    border-radius: 50%;
    border: 1px solid var(--color-blue-800);
    background: var(--color-white);
    color: var(--color-blue-800);
  }
  .swatch-column--empty .icon-button--add:hover {
    background: var(--color-light-gray);
    border-color: var(--color-blue-800);
  }
  .swatch-column--empty .icon-button--add:active {
    background: var(--color-light-gray);
    border-color: var(--color-blue-800);
  }
  .swatch-column--empty .icon-button--add:focus-visible {
    outline: 2px solid var(--color-blue-800);
    outline-offset: 2px;
  }
  .swatch-column--empty .icon-button--add [class^="sp-icon-"] {
    width: 20px;
    height: 20px;
  }

  .base-color-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: var(--swatch-text-color);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .base-color-badge--readonly {
    cursor: default;
  }

  .base-color-badge--hover-only {
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .swatch-rail[data-orientation="stacked"] .base-color-badge--hover-only,
  .swatch-column:hover .base-color-badge--hover-only,
  .base-color-badge--hover-only:focus-visible {
    opacity: 1;
  }

  .base-color-badge [class^="sp-icon-"] {
    width: 20px;
    height: 20px;
  }
  .base-color-icon--target {
    display: inline-flex;
  }
  .base-color-icon--circle {
    display: none;
  }
  .swatch-column.base-color:hover .base-color-badge--active .base-color-icon--circle {
    display: inline-flex;
  }

  .base-color-badge .icon-fallback {
    width: 20px;
    height: 20px;
    display: inline-block;
    fill: currentColor;
    stroke: currentColor;
  }

  .base-color-badge:focus-visible,
  .color-blindness-badge:focus-visible {
    outline: 2px solid var(--color-blue-800);
    outline-offset: 2px;
  }

  .color-blindness-badge {
    position: absolute;
    bottom: 8px;
    left: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    opacity: 0.8;
    border: 0;
    background: transparent;
    padding: 0;
    cursor: pointer;
  }

  .color-blindness-badge [class^="sp-icon-"] {
    width: 20px;
    height: 20px;
  }

  .color-blindness-placeholder {
    font-size: 10px;
    font-weight: 600;
    color: var(--Alias-content-typography-secondary);
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  
  .swatch-column.base-color {
    outline: none;
  }

  .swatch-column--draggable {
    cursor: grab;
    touch-action: none;
  }

  .swatch-column--draggable:active {
    cursor: grabbing;
  }

  .icon-button--drag {
    touch-action: none;
  }

  .swatch-column--dragging {
    opacity: 0.6;
  }

  .swatch-column--drag-over {
    outline: 2px dashed var(--color-blue-800);
    outline-offset: 2px;
  }

  
  .bottom-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    background: none !important;
    box-shadow: none;
    backdrop-filter: none;
    padding: 4px 8px;
    gap: 8px;
    position: relative;
    z-index: 2;
  }

  .bottom-info__actions {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: 0;
  }

  @container (max-width: 89px) {
    .bottom-info {
      flex-direction: column;
    }

    .bottom-info .hex-code {
      align-self: flex-end;
    }

    .bottom-info .bottom-info__actions {
      align-self: flex-start;
    }
  }


  .hex-code {
    font-size: 16px;
    font-weight: 700;
    color: var(--swatch-text-color);
    text-transform: uppercase;
    text-shadow: var(--swatch-text-shadow);
  }
  button.hex-code {
    background: none;
    border: none;
    padding: 7px 12px;
    font: inherit;
    text-align: center;
    min-width: 75px;
    height: 32px;
    border-radius: var(--Corner-radius-corner-radius-100);
  }
  .swatch-column[data-contrast="dark"] button.hex-code:hover {
    background-color: rgba(255, 255, 255, 0.12);
  }
  .swatch-column[data-contrast="light"] button.hex-code:hover {
    background-color: rgba(0, 0, 0, 0.12);
  }
  .swatch-column[data-contrast="light"] button.hex-code.hex-code--editor-open {
    border-radius: 5px;
    border: 1px solid var(--color-gray-950);
    background: transparent;
  }
  .swatch-column[data-contrast="dark"] button.hex-code.hex-code--editor-open {
    border-radius: 5px;
    border: 1px solid var(--color-gray-400-variant);
    background: transparent;
  }
  button.hex-code:focus-visible {
    outline: 2px solid var(--color-blue-800);
    outline-offset: 2px;
  }
  .hex-code--editable {
    padding: 7px 12px;
    cursor: pointer;
  }
  .hex-code--copyable {
    cursor: pointer;
  }
  .hex-code--static {
    cursor: default;
  }

  
  .icon-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px;
    width: var(--icon-button-size);
    height: var(--icon-button-size);
    border-radius: var(--Corner-radius-corner-radius-100);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--swatch-text-color);
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  

  
  .swatch-column[data-contrast="dark"] .icon-button:hover {
    background-color: rgba(255, 255, 255, 0.12);
  }
  .swatch-column[data-contrast="light"] .icon-button:hover {
    background-color: rgba(0, 0, 0, 0.12);
  }

  
  .icon-button:active {
    background-color: rgba(255, 255, 255, 0.35);
  }

  
  .icon-button:focus-visible {
    outline: 2px solid var(--color-blue-800);
    outline-offset: 2px;
  }

  
  .icon-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  
  .icon-button [class^="sp-icon-"] {
    width: 20px;
    height: 20px;
  }
  .icon-button .icon-fallback {
    width: 20px;
    height: 20px;
    display: inline-block;
    fill: currentColor;
  }

  
  .icon-button .icon-asset,
  .icon-button .icon-tint {
    display: inline-block;
    filter: var(--swatch-icon-filter);
  }

  
  .icon-button sp-icon-drag-handle,
  .icon-button .icon-drag {
    display: inline-block;
    width: 20px;
    height: 20px;
    filter: var(--swatch-icon-filter);
  }

  .edit-input-native {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  
  sp-tooltip,
  sp-tooltip * {
    text-transform: none !important;
  }

  .swatch-rail[data-orientation="stacked"] .swatch-column--empty {
    flex: 0;
  }

  @media (max-width: 899px) {
    .swatch-column--super-light {
      box-shadow: none;
    }
  }
`;
