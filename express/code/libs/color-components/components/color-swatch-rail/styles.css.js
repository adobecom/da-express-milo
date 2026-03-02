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
    display: flex;
    flex-direction: row;
    gap: var(--Spacing-Spacing-50, 2px);
    width: 100%;
    height: 100%;
    border-radius: 16px;
    overflow: hidden;
  }

  /* Figma CCEX vertical: default 165px; use --swatch-column-flex to make width dynamic (e.g. 1 1 0) */
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
    border-radius: 16px 0 0 16px;
  }

  .swatch-column:last-child {
    border-radius: 0 16px 16px 0;
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
    border-radius: 8px 0 0 8px;
  }

  .swatch-rail[data-orientation="horizontal"] .swatch-column:last-child {
    border-radius: 0 8px 8px 0;
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
    margin-left: auto;
  }

  /* Figma: vertical stack – 5 full-width rows, 2px gap between strips, square corners */
  .swatch-rail[data-orientation="stacked"] {
    flex-direction: column;
    height: auto;
    min-height: 0;
    gap: var(--Spacing-Spacing-50, 2px);
    padding: 0;
    border-radius: 0;
    overflow: visible;
  }

  .swatch-rail[data-orientation="stacked"] .swatch-column {
    flex: 0 0 48px;
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

  .swatch-rail[data-orientation="stacked"] .bottom-info {
    margin-top: 0;
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
  }

  .swatch-rail[data-orientation="stacked"] .hex-code {
    flex-shrink: 0;
  }

  /* Stacked: hex left, all icons right */
  .swatch-rail[data-orientation="stacked"] .bottom-info__actions--all {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    margin-left: auto;
  }

  .swatch-rail[data-orientation="stacked"] .bottom-info__actions--all .top-actions {
    position: static;
    display: flex;
    flex-direction: row;
    gap: 6px;
  }

  .swatch-rail[data-orientation="stacked"] .bottom-info__actions--all .base-color-badge,
  .swatch-rail[data-orientation="stacked"] .bottom-info__actions--all .color-blindness-badge {
    position: static;
  }

  .swatch-rail[data-orientation="stacked"] .bottom-info__actions--all .color-blindness-badge {
    width: 20px;
    height: 20px;
  }

  .swatch-column:hover {
    /* subtle hover effect if needed */
  }

  .top-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    position: absolute;
    top: 8px;
    left: 8px;
  }

  /* Padding for focus ring (2px) to show; swatch-rail overflow can clip */
  .add-slot {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    padding: 0 4px;
  }

  /* Add button styles live in variant CSS (color-strip.css) via ::part(add-button) */

  .add-slot--left,
  .add-slot--right {
    flex-shrink: 0;
  }

  /* Stacked demo: add-slot needs bottom padding */
  .swatch-rail[data-orientation="stacked"] .add-slot {
    padding-bottom: var(--Spacing-Spacing-150);
  }

  .swatch-column--empty {
    flex: var(--swatch-column-flex, 0 0 165px);
    width: var(--swatch-column-width, 165px);
    min-width: var(--swatch-column-min-width, 0);
    background: var(--Palette-gray-200, #e5e5e5) !important;
    cursor: pointer;
    justify-content: center;
    align-items: center;
  }

  .empty-strip-placeholder {
    font-size: 24px;
    font-weight: 700;
    color: var(--Icon-primary-gray-default, #292929);
  }

  .base-color-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--swatch-text-color, #fff);
  }

  .base-color-badge--hover-only {
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .swatch-column:hover .base-color-badge--hover-only {
    opacity: 1;
  }

  .base-color-badge [class^="sp-icon-"] {
    width: 20px;
    height: 20px;
  }

  .color-blindness-badge {
    position: absolute;
    bottom: 8px;
    left: 8px;
    width: 20px;
    height: 20px;
    opacity: 0.8;
  }

  .color-blindness-badge [class^="sp-icon-"] {
    width: 20px;
    height: 20px;
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
    margin-left: auto;
  }

  /* Hex on swatch color; contrast text (black/white) per swatch via --swatch-text-color */
  .hex-code {
    font-size: 16px;
    font-weight: 700;
    color: var(--swatch-text-color, #fff);
    text-transform: uppercase;
    text-shadow: var(--swatch-text-shadow, 0 0 2px rgba(0, 0, 0, 0.5));
  }
  .hex-code--editable,
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

  /* Focus — Figma keyboard focus */
  .icon-button:focus-visible {
    outline: 2px solid var(--S2A-Color-border-focus-indicator, #4b75ff);
    outline-offset: 0;
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

  /* Figma S2_Icon_Tint_20_N (6082-526066): mask so icon inherits --swatch-text-color */
  .icon-button .icon-tint {
    display: inline-block;
    width: 20px;
    height: 20px;
    background-color: currentColor;
    mask: var(--tint-icon) no-repeat center / contain;
    -webkit-mask: var(--tint-icon) no-repeat center / contain;
  }

  /* Figma S2_Icon_DragHandle_20_N (2492:145648): mask so icon inherits --swatch-text-color */
  .icon-button .icon-drag {
    display: inline-block;
    width: 20px;
    height: 20px;
    background-color: currentColor;
    mask: var(--drag-icon) no-repeat center / contain;
    -webkit-mask: var(--drag-icon) no-repeat center / contain;
  }

  .picker-native {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }
`;
