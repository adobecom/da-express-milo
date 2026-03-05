
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
    flex-direction: column;
    gap: 2px;
    width: 100%;
    height: 100%;
  }

  .swatch-row {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    position: relative;
    cursor: pointer;
    outline: none;
    min-height: 0;
    transition: opacity 0.15s ease;
  }

  .swatch-row:first-child {
    border-radius: 8px 8px 0 0;
  }

  .swatch-row:last-child {
    border-radius: 0 0 8px 8px;
  }

  .swatch-row:first-child:last-child {
    border-radius: 8px;
  }

  .swatch-row:hover {
    opacity: 0.92;
  }

  .swatch-row:focus-visible {
    box-shadow: inset 0 0 0 2px rgba(75, 117, 255, 0.7);
  }

  .swatch-row.is-active {
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.6);
  }

  .swatch-row.is-active:focus-visible {
    box-shadow: inset 0 0 0 2px rgba(75, 117, 255, 0.7);
  }

  .row-left {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .hex-code {
    font-size: 14px;
    font-weight: 500;
    text-transform: uppercase;
    cursor: text;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 7px 12px;
    border-radius: 8px;
    line-height: 18px;
    background: transparent;
    border: none;
    transition: background-color 0.15s ease;
  }

  .hex-code:hover {
    background: rgba(0, 0, 0, 0.06);
  }

  .swatch-row.is-dark .hex-code:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  .hex-input {
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    text-transform: uppercase;
    background: transparent;
    border: none;
    border-bottom: 2px solid currentColor;
    outline: none;
    padding: 7px 12px;
    width: 90px;
    min-width: 0;
    line-height: 18px;
  }

  .row-right {
    display: flex;
    align-items: center;
    gap: 0;
    flex-shrink: 0;
    position: relative;
  }

  .icon-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background-color 0.15s ease;
  }

  .icon-button:hover {
    background-color: rgba(0, 0, 0, 0.08);
  }

  .swatch-row.is-dark .icon-button:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  .icon-button:focus-visible {
    outline: 2px solid #4b75ff;
    outline-offset: 1px;
  }

  .copy-btn.is-copied {
    color: #0a8a0a;
  }

  .copy-toast {
    position: absolute;
    bottom: calc(100% + 6px);
    right: 4px;
    background: #131313;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 6px;
    white-space: nowrap;
    pointer-events: none;
    animation: toast-in 0.15s ease forwards;
    z-index: 5;
  }

  @keyframes toast-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .icon {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }
`;
