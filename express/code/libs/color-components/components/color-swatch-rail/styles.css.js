
import { css } from '../../../deps/lit-all.min.js';

 

export const style = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
    font-family: var(--body-font-family, 'Adobe Clean', sans-serif);
  }

  .swatch-rail {
    display: flex;
    width: 100%;
    height: 100%;
    border-radius: 16px;
    overflow: hidden;
  }

  .swatch-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 16px 12px;
    position: relative;
    transition: flex-grow 0.2s ease;
    min-width: 0;
  }

  .swatch-column:hover {
    /* subtle hover effect if needed */
  }

  .top-actions {
    display: flex;
    justify-content: flex-end;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .swatch-column:hover .top-actions,
  .swatch-column.locked .top-actions {
    opacity: 1;
  }

  .bottom-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    padding: 4px 8px;
    backdrop-filter: blur(4px);
  }

  .hex-code {
    font-size: 16px;
    font-weight: 700;
    color: #000;
    text-transform: uppercase;
    cursor: pointer;
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
    color: inherit;
  }

  .icon-button:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  /* Icons (SVG placeholders) */
  .icon {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }

  :host([layout="stacked"]) .swatch-rail {
    flex-direction: column;
  }

  :host([layout="stacked"]) .swatch-column {
    flex-direction: row;
    align-items: center;
    padding: 12px 16px;
  }

  :host([layout="stacked"]) .top-actions {
    opacity: 1;
  }

  :host([layout="stacked"]) .bottom-info {
    background: rgba(255, 255, 255, 0.9);
  }
`;

