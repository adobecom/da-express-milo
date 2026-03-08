/* eslint-disable import/prefer-default-export */
import { css } from '../../../deps/lit-all.min.js';

export const style = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
    font-family: var(--body-font-family, 'Adobe Clean', sans-serif);
  }
  :host([orientation="stacked"]) {
    overflow: visible;
  }

  /* 2px gap between strips (vertical and horizontal) – Figma Spacing-50 */
  .swatch-rail {
    position: relative;
    display: flex;
    flex-direction: row;
    gap: var(--Spacing-Spacing-50, 2px);
    width: 100%;
    height: 100%;
    border-radius: 16px;
    overflow: hidden;
  }
  /* Column hover add (+): allow overflow so first col left / last col right aren't cut off */
  .swatch-rail:has(.add-slot--column-left),
  .swatch-rail:has(.add-slot--column-right) {
    overflow: visible;
  }

  .swatch-column {
    flex: var(--swatch-column-flex, 0 0 165px);
    width: var(--swatch-column-width, 165px);
    min-width: var(--swatch-column-min-width, 0);
    align-self: stretch;
    display: flex;
    flex-direction: column;
    padding: var(--Spacing-Spacing-200, 12px);
    position: relative;
    transition: flex-grow 0.2s ease;
    box-sizing: border-box;
  }

  .swatch-column:first-child {
    border-radius: var(--swatch-column-first-radius, 16px 0 0 16px);
  }

  .swatch-column:nth-child(5) {
    border-radius: var(--swatch-column-5-radius, 0);
  }

  .swatch-column:last-child {
    border-radius: var(--swatch-column-last-radius, 0 16px 16px 0);
  }

  /* Figma 6215-355725 horizontal: 48px height, padding 8 12, 2px gap between strips, radius 8px 8px 0 0 */
  .swatch-rail[data-orientation="horizontal"] {
    height: 48px;
    padding: 8px 12px;
    gap: var(--Spacing-Spacing-50, 2px);
    border-radius: 8px 8px 0 0;
  }

  .swatch-rail[data-orientation="horizontal"] .swatch-column {
    flex: 1 1 0;
    width: auto;
    min-width: 0;
    padding: 0;
  }

  .swatch-rail[data-orientation="horizontal"] .swatch-column:first-child {
    border-radius: var(--swatch-column-first-radius, 8px 0 0 8px);
  }

  .swatch-rail[data-orientation="horizontal"] .swatch-column:last-child {
    border-radius: var(--swatch-column-last-radius, 0 8px 8px 0);
  }

  /* Vertical single row: max 6 columns; --rail-columns = slot count so 2 cards take max width */
  .swatch-rail[data-orientation="vertical"] {
    display: grid;
    grid-template-columns: repeat(var(--rail-columns, 6), 1fr);
    grid-auto-rows: 1fr;
    flex-direction: unset;
    gap: var(--Spacing-Spacing-50, 2px);
  }

  .swatch-rail[data-orientation="vertical"] .swatch-column {
    min-width: 0;
    width: auto;
  }

  /* Vertical two rows: single 5-column grid so all columns same width */
  .swatch-rail[data-orientation="vertical"].vertical--two-rows {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: 1fr 1fr;
    gap: var(--Spacing-Spacing-50, 2px);
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
  }

  /* Vertical two-row: four outer corners by position (1=top-left, 5=top-right, 6=bottom-left, last=bottom-right) */
  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column {
    border-radius: 0;
  }
  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column:nth-child(1) {
    border-radius: var(--Corner-radius-corner-radius-200, 16px) 0 0 0;
  }
  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column:nth-child(5) {
    border-radius: 0 var(--Corner-radius-corner-radius-200, 16px) 0 0;
  }
  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column:nth-child(6) {
    border-radius: 0 0 0 var(--Corner-radius-corner-radius-200, 16px);
  }
  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column:last-child {
    border-radius: 0 0 var(--Corner-radius-corner-radius-200, 16px) 0;
  }

  .swatch-rail[data-orientation="vertical"] .bottom-info {
    gap: 0;
    padding: 0;
  }

  /* Two-rows: single component, 2 rows × 6 columns, connected grid (Figma 7457-569724) */
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
    flex: 0 0 16.666%;
    width: 16.666%;
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
  /* Border radius: outer corners of connected grid (suppressed when embedded in extended container) */
  :host(:not([embedded])) .swatch-rail[data-orientation="two-rows"] .swatch-rail__row[data-row-index="0"] .swatch-column:first-child {
    border-radius: var(--Corner-radius-corner-radius-200, 16px) 0 0 0;
  }
  :host(:not([embedded])) .swatch-rail[data-orientation="two-rows"] .swatch-rail__row[data-row-index="0"] .swatch-column:last-child {
    border-radius: 0 var(--Corner-radius-corner-radius-200, 16px) 0 0;
  }
  :host(:not([embedded])) .swatch-rail[data-orientation="two-rows"] .swatch-rail__row[data-row-index="1"] .swatch-column:first-child {
    border-radius: 0 0 0 var(--Corner-radius-corner-radius-200, 16px);
  }
  :host(:not([embedded])) .swatch-rail[data-orientation="two-rows"] .swatch-rail__row[data-row-index="1"] .swatch-column:last-child {
    border-radius: 0 0 var(--Corner-radius-corner-radius-200, 16px) 0;
  }
  :host([embedded]) .swatch-rail,
  :host([embedded]) .swatch-rail .swatch-column {
    border-radius: 0;
  }
  /* Stacked first/last corner radius is the component contract; keep it even when embedded (e.g. strip Interactive Demo). */
  :host([embedded]) .swatch-rail[data-orientation="stacked"] .swatch-column:first-child {
    border-radius: 8px 8px 0 0;
  }
  :host([embedded]) .swatch-rail[data-orientation="stacked"] .swatch-column:last-child {
    border-radius: 0 0 8px 8px;
  }
  :host([embedded]) .swatch-rail[data-orientation="stacked"] .swatch-column:not(:first-child):not(:last-child) {
    border-radius: 0;
  }

  /* Horizontal: hex left, circle + copy right (full width row) */
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

  /* Figma: vertical stack – 5 full-width rows, 2px gap, first/last row only get corner radius (contract). */
  /* Stacked is self-contained: do not use --swatch-column-* for radius; only first/last get 8px. */
  .swatch-rail[data-orientation="stacked"] {
    flex-direction: column;
    height: 100%;
    min-height: 0;
    gap: var(--Spacing-Spacing-50, 2px);
    padding: 0;
    border-radius: 0;
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

  /* Only first and last: literal 8px so no vertical/base variable leak */
  .swatch-rail[data-orientation="stacked"] .swatch-column:first-child {
    border-radius: 8px 8px 0 0;
  }
  .swatch-rail[data-orientation="stacked"] .swatch-column:last-child {
    border-radius: 0 0 8px 8px;
  }
  /* When last child is empty strip, give bottom radius to last color (nth-last-child(2)), not empty */
  .swatch-rail[data-orientation="stacked"]:has(.swatch-column--empty:last-child) .swatch-column:nth-last-child(2) {
    border-radius: 0 0 8px 8px;
  }
  .swatch-rail[data-orientation="stacked"] .swatch-column:last-child.swatch-column--empty {
    border-radius: 0;
  }
  /* Force all other columns to 0 so vertical/nth-child/base rules cannot leak */
  .swatch-rail[data-orientation="stacked"] .swatch-column:not(:first-child):not(:last-child) {
    border-radius: 0;
  }

  .swatch-rail[data-orientation="stacked"] .swatch-column--empty {
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }

  /* Stacked: HEX left, all icons right (single row per strip) */
  .swatch-rail[data-orientation="stacked"] .stacked-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 8px;
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

  .swatch-rail[data-orientation="stacked"] .stacked-row__icons .color-blindness-badge [class^="sp-icon-"] {
    width: 20px !important;
    height: 20px !important;
  }

  .swatch-column:hover {
    /* subtle hover effect if needed */
  }

  /* Focus ring only for keyboard (focus-visible); avoid showing on first column when focused by default on load */
  .swatch-column:focus {
    outline: none;
  }
  .swatch-column:focus-visible {
    outline: 2px solid var(--S2A-Color-border-focus-indicator, #4b75ff);
    outline-offset: 2px;
  }

  /* Figma 6215-342871: vertical = base left, rest right column */
  .top-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    position: absolute;
    top: 8px;
    left: 8px;
  }

  .top-actions--right {
    left: auto;
    right: 8px;
    flex-direction: column;
  }

  .top-actions--right .color-blindness-badge {
    position: static;
  }

  .swatch-rail:not([data-orientation="stacked"]) .base-color-badge {
    right: auto;
    left: 8px;
  }

  /* Add slots: out of flow overlay, centered in gaps between strips */
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

  /* Left/right add slots: default horizontal position before JS sets .style.left */
  .add-slots-overlay .add-slot--left {
    left: 0;
  }
  /* Right slot: no right:0 so it doesn't stretch and block the empty column; JS sets .style.left */
  .add-slots-overlay .add-slot--right {
    left: auto;
  }

  /* Overlay plus: Figma Add 3088-200109 – 32px button, 6px padding, 20px icon, accent border, focus ring 36px */
  .add-slots-overlay .add-slot .icon-button--add {
    width: 32px;
    height: 32px;
    padding: 6px;
    border-radius: 50%;
    border: 1px solid var(--S2A-Color-border-accent-default, #3b63fb);
    background: var(--Palette-gray-0, #ffffff);
    color: var(--S2A-Color-border-accent-default, #3b63fb);
  }
  .add-slots-overlay .add-slot .icon-button--add:hover {
    background: var(--Palette-gray-200, #e1e1e1);
    border-color: var(--S2A-Color-border-accent-default, #3b63fb);
  }
  .add-slots-overlay .add-slot .icon-button--add:active {
    background: var(--Palette-gray-200, #e1e1e1);
    border-color: var(--S2A-Color-border-accent-default, #3b63fb);
  }
  .add-slots-overlay .add-slot .icon-button--add:focus-visible {
    outline: 2px solid var(--S2A-Color-border-focus-indicator, #4b75ff);
    outline-offset: 2px;
  }
  .add-slots-overlay .add-slot .icon-button--add [class^="sp-icon-"] {
    width: 20px;
    height: 20px;
  }

  /* Add slot positions set via JS (_measureAddSlots) from measured column widths */

  /* Stacked: left → top, right → bottom (same logic as vertical left/right) */
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

  /* Add left/right as column hover: one or both per column, config-driven (vertical/horizontal only) */
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
  /* Vertical/horizontal: center vertically, place left/right */
  .swatch-column .add-slot--column-left,
  .swatch-column .add-slot--column-right {
    top: 50%;
    transform: translateY(-50%);
  }
  .swatch-column .add-slot--column-left {
    left: -18px;
  }
  .swatch-column .add-slot--column-right {
    right: -18px;
  }
  /* Stacked: left→top, right→bottom; position 0, transform centers icon on edge */
  .swatch-rail[data-orientation="stacked"] .swatch-column .add-slot--column-top {
    top: 0px;
    bottom: auto;
    left: 50%;
    right: auto;
    transform: translate(-50%, -50%);
  }
  .swatch-rail[data-orientation="stacked"] .swatch-column .add-slot--column-bottom {
    top: auto;
    bottom: 0px;
    left: 50%;
    right: auto;
    transform: translate(-50%, 50%);
  }
  .swatch-column:hover .add-slot--column {
    opacity: 1;
    pointer-events: auto;
  }
  .swatch-column .add-slot--column .icon-button--add {
    width: 32px;
    height: 32px;
    padding: 6px;
    border-radius: 50%;
    border: 1px solid var(--S2A-Color-border-accent-default, #3b63fb);
    background: var(--Palette-gray-0, #ffffff);
    color: var(--S2A-Color-border-accent-default, #3b63fb);
  }
  .swatch-column .add-slot--column .icon-button--add:hover {
    background: var(--Palette-gray-200, #e1e1e1);
    border-color: var(--S2A-Color-border-accent-default, #3b63fb);
  }
  .swatch-column .add-slot--column .icon-button--add:active {
    background: var(--Palette-gray-200, #e1e1e1);
    border-color: var(--S2A-Color-border-accent-default, #3b63fb);
  }
  .swatch-column .add-slot--column .icon-button--add:focus-visible {
    outline: 2px solid var(--S2A-Color-border-focus-indicator, #4b75ff);
    outline-offset: 2px;
  }
  .swatch-column .add-slot--column .icon-button--add [class^="sp-icon-"] {
    width: 20px;
    height: 20px;
  }

  /* Same dimensions as regular swatch column; add button matches add-left/add-right (part="add-button") */
  .swatch-column--empty {
    flex: var(--swatch-column-flex, 0 0 165px);
    width: var(--swatch-column-width, 165px);
    min-width: var(--swatch-column-min-width, 0);
    max-width: 100%;
    flex-shrink: 1;
    background: var(--Palette-gray-0, #ffffff) !important;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  /* Plus on empty strip / empty column: same styles and sizes as overlay/column (Figma Add 32px, accent border, focus ring) */
  .swatch-column--empty .icon-button--add {
    cursor: pointer;
    width: 32px;
    height: 32px;
    padding: 6px;
    border-radius: 50%;
    border: 1px solid var(--S2A-Color-border-accent-default, #3b63fb);
    background: var(--Palette-gray-0, #ffffff);
    color: var(--S2A-Color-border-accent-default, #3b63fb);
  }
  .swatch-column--empty .icon-button--add:hover {
    background: var(--Palette-gray-200, #e1e1e1);
    border-color: var(--S2A-Color-border-accent-default, #3b63fb);
  }
  .swatch-column--empty .icon-button--add:active {
    background: var(--Palette-gray-200, #e1e1e1);
    border-color: var(--S2A-Color-border-accent-default, #3b63fb);
  }
  .swatch-column--empty .icon-button--add:focus-visible {
    outline: 2px solid var(--S2A-Color-border-focus-indicator, #4b75ff);
    outline-offset: 2px;
  }
  .swatch-column--empty .icon-button--add [class^="sp-icon-"] {
    width: 20px;
    height: 20px;
  }

  .base-color-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--swatch-text-color, #fff);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .base-color-badge--hover-only {
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .swatch-column:hover .base-color-badge--hover-only,
  .base-color-badge--hover-only:focus-visible {
    opacity: 1;
  }

  .base-color-badge [class^="sp-icon-"] {
    width: 20px;
    height: 20px;
  }

  .base-color-badge:focus-visible,
  .color-blindness-badge:focus-visible {
    outline: 2px solid var(--S2A-Color-border-focus-indicator, #4b75ff);
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
    width: 20px !important;
    height: 20px !important;
  }

  /* Placeholder DOM for color-blindness slot (no icon from Figma yet) */
  .color-blindness-placeholder {
    font-size: 10px;
    font-weight: 600;
    color: var(--Alias-content-typography-secondary, #6b6b6b);
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  /* Base color: no focus ring; badge icon indicates selection */
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
    outline: 2px dashed var(--S2A-Color-border-focus-indicator, #4b75ff);
    outline-offset: 2px;
  }

  /* Hex aligned left, circle + copy aligned right */
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
  }

  .bottom-info__actions {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: 0;
  }

  /* Hex on swatch color; contrast text (black/white) per swatch via --swatch-text-color */
  .hex-code {
    font-size: 16px;
    font-weight: 700;
    color: var(--swatch-text-color, #fff);
    text-transform: uppercase;
    text-shadow: var(--swatch-text-shadow, 0 0 2px rgba(0, 0, 0, 0.5));
  }
  button.hex-code {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    text-align: left;
  }
  button.hex-code:focus-visible {
    outline: 2px solid var(--S2A-Color-border-focus-indicator, #4b75ff);
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

  /* Figma 6567-192257 Color Strip Button (M): 32×32, border-radius 8px, states Default/Hover/Active/Clicked */
  .icon-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px;
    width: 32px;
    height: 32px;
    border-radius: var(--Corner-radius-corner-radius-100, 8px);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--swatch-text-color, var(--Icon-primary-gray-default, #292929));
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  /* Default: transparent (already set) */

  /* Hover — Figma state */
  .icon-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  /* Active / Clicked — Figma pressed state */
  .icon-button:active {
    background-color: rgba(255, 255, 255, 0.35);
  }

  /* Focus — keyboard focus; same ring as base-color/drag-over for consistency */
  .icon-button:focus-visible {
    outline: 2px solid var(--S2A-Color-border-focus-indicator, #4b75ff);
    outline-offset: 2px;
  }

  /* Disabled (e.g. trash when locked) */
  .icon-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* Spectrum icons inherit color from .icon-button (--swatch-text-color) */
  .icon-button [class^="sp-icon-"] {
    width: 20px;
    height: 20px;
  }

  /* Figma 6082-526066 S2_Icon_Tint_20_N: Express way — img + filter for swatch contrast */
  .icon-button .icon-tint {
    display: inline-block;
    width: 20px;
    height: 20px;
    filter: var(--swatch-icon-filter);
  }

  /* Drag handle: Spectrum sp-icon-drag-handle; filter for swatch contrast */
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
`;
