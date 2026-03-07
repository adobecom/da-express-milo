/* eslint-disable import/prefer-default-export */
import { css } from '../../../deps/lit-all.min.js';

export const style = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
    font-family: var(--body-font-family, 'Adobe Clean', sans-serif);
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

  /* Figma: vertical stack – 5 full-width rows, 2px gap between strips, square corners. Rail fills container height. */
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
  }

  .swatch-rail[data-orientation="stacked"] .swatch-column:first-child {
    border-radius: 8px 8px 0 0;
  }

  .swatch-rail[data-orientation="stacked"] .swatch-column:last-child {
    border-radius: 0 0 8px 8px;
  }

  .swatch-rail[data-orientation="stacked"] .swatch-column--empty {
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }

  /* Stacked: HEX left, all icons right */
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
  }

  /* Add slot positions set via JS (_measureAddSlots) from measured column widths */

  /* Stacked: horizontal center, top set via JS */
  .swatch-rail[data-orientation="stacked"] .add-slots-overlay .add-slot {
    left: 50%;
    transform: translate(-50%, -50%);
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

  .swatch-column--empty .icon-button--add {
    cursor: pointer;
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

  .swatch-column.base-color {
    outline: 2px solid var(--S2A-Color-border-focus-indicator, #4b75ff);
    outline-offset: 2px;
  }

  .swatch-column--draggable {
    cursor: grab;
  }

  .swatch-column--draggable:active {
    cursor: grabbing;
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
