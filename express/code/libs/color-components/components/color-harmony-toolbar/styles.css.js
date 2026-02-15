import { css } from '../../../deps/lit-all.min.js';

export const style = css`
  :host {
    display: block;
    margin-bottom: 20px;
  }

  .harmony-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .label {
    font-family: var(--body-font-family, 'Adobe Clean', sans-serif);
    font-size: 14px;
    font-weight: 700;
    color: #2c2c2c;
    margin-right: auto;
  }

  .harmony-options {
    display: flex;
    gap: 8px;
    background: #f5f5f5;
    padding: 4px;
    border-radius: 8px;
  }

  .harmony-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #505050;
    transition: all 0.2s ease;
  }

  .harmony-btn:hover {
    background: rgba(0,0,0,0.05);
    color: #2c2c2c;
  }

  .harmony-btn.active {
    background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    color: #2d2dd4;
  }

  .icon {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }
`;
