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

  /* Figma CCEX vertical: 165px per column (12+141+12), padding Spacing-200 = 12px, content 141×376 */
  .swatch-column {
    flex: 0 0 165px;
    width: 165px;
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
  }

  .swatch-column:hover {
    /* subtle hover effect if needed */
  }

  /* Figma: no lock – hidden to match spec */
  .top-actions {
    display: none;
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

  /* Hex on swatch color; white text for readability on dark swatches */
  .hex-code {
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    cursor: pointer;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  }

  .icon-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }

  .icon-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  /* Icons (SVG placeholders) */
  .icon {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }

  .icon--picker {
    width: 20px;
    height: 20px;
  }

  .picker-native {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }
`;
