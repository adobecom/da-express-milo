import { css } from '../../../deps/lit.js';

export const style = css`
  :host {
    display: block;
    width: 100%;
    position: relative;
  }

  .search-suggestions-dropdown {
    inline-size: 100%;
    position: absolute;
    inset-block-start: 100%;
    background: var(--explore-color-bg-primary, var(--spectrum-gray-50, #fff));
    border: 1px solid var(--explore-color-bg-active, var(--spectrum-gray-200, #e6e6e6));
    border-radius: var(--spectrum-corner-radius-200, 16px);
    box-shadow: var(--spectrum-drop-shadow-emphasis, 0 8px 16px rgba(0, 0, 0, 0.15));
    overflow: hidden;
    margin-block-start: var(--explore-spacing-xs, var(--spectrum-spacing-100, 4px));
    z-index: 10;
  }

  .search-suggestions-dropdown.hidden {
    display: none;
  }

  .suggestions-header {
    padding-block: var(--explore-spacing-md, 16px);
    padding-inline: var(--explore-spacing-lg, 24px);
    font-size: var(--spectrum-font-size-100, 14px);
    font-weight: 700;
    color: var(--explore-color-text-primary, var(--spectrum-gray-900, #1d1d1d));
  }

  .suggestions-list {
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .suggestion-item {
    display: flex;
    align-items: center;
    gap: var(--explore-spacing-md, var(--spectrum-spacing-300, 16px));
    padding-block: var(--explore-spacing-md, 16px);
    padding-inline: var(--explore-spacing-lg, 24px);
    cursor: pointer;
    transition: background-color var(--explore-transition-fast, 130ms) ease;
  }

  .suggestion-item:hover,
  .suggestion-item.is-selected {
    background-color: var(--explore-color-bg-hover, var(--spectrum-gray-100, #f5f5f5));
  }

  .suggestion-item:focus {
    outline: none;
    background-color: var(--explore-color-bg-hover, var(--spectrum-gray-100, #f5f5f5));
  }

  .suggestion-item:focus-visible {
    outline: var(--explore-focus-width, 2px) solid var(--explore-focus-color, #0265dc);
    outline-offset: calc(-1 * var(--explore-focus-width, 2px));
  }

  .suggestion-item:last-child {
    border-end-start-radius: var(--spectrum-corner-radius-200, 16px);
    border-end-end-radius: var(--spectrum-corner-radius-200, 16px);
  }

  .suggestion-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    inline-size: var(--spectrum-icon-size-200, 20px);
    block-size: var(--spectrum-icon-size-200, 20px);
    color: var(--explore-color-text-secondary, var(--spectrum-gray-700, #505050));
  }

  .suggestion-icon svg {
    inline-size: 100%;
    block-size: 100%;
  }

  .suggestion-text {
    display: flex;
    flex-direction: column;
    gap: var(--explore-spacing-xxs, var(--spectrum-spacing-50, 2px));
    min-inline-size: 0;
  }

  .suggestion-label {
    font-size: var(--spectrum-font-size-200, 16px);
    font-weight: 400;
    line-height: 1.3;
    color: var(--explore-color-text-primary, var(--spectrum-gray-900, #1d1d1d));
  }

  .suggestion-type {
    font-size: var(--spectrum-font-size-75, 12px);
    font-weight: 400;
    line-height: 1.3;
    color: var(--explore-color-text-tertiary, var(--spectrum-gray-600, #6d6d6d));
  }

  @media (max-width: 599px) {
    .suggestions-header {
      padding-block: var(--explore-spacing-sm, 12px);
      padding-inline: var(--explore-spacing-md, 16px);
    }

    .suggestion-item {
      padding-block: var(--explore-spacing-sm, 12px);
      padding-inline: var(--explore-spacing-md, 16px);
      gap: var(--explore-spacing-sm, var(--spectrum-spacing-200, 12px));
    }
  }

  :host-context(.is-sticky-clone) .search-suggestions-dropdown {
    inset-block-start: auto;
    inset-block-end: 100%;
    margin-block-start: 0;
    margin-block-end: var(--explore-spacing-xs, var(--spectrum-spacing-100, 4px));
  }
`;
