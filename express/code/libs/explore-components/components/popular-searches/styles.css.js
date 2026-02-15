import { css } from '../../../deps/lit.js';

export const style = css`
  :host {
    display: block;
    width: 100%;
  }

  .explore-popular-searches {
    inline-size: 100%;
    max-inline-size: var(--explore-content-max-width, 1200px);
    margin: 0 auto;
  }

  .tags-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--explore-spacing-md, var(--spectrum-spacing-300, 16px));
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .search-tag {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding-inline: var(--explore-tag-padding-inline, 16px);
    padding-block: var(--explore-tag-padding-block, 8px);
    block-size: var(--explore-tag-block-size, 20px);
    background-color: var(--explore-color-bg-primary, #fff);
    border: var(--explore-tag-border-width, 2px) solid var(--explore-tag-border-color, rgba(0, 0, 0, 0.15));
    border-radius: var(--explore-tag-radius, 8px);
    font-size: var(--explore-tag-font-size, 16px);
    font-weight: var(--explore-tag-font-weight, 700);
    line-height: var(--explore-tag-line-height, 130%);
    color: var(--explore-tag-color, #292929);
    text-decoration: none;
    white-space: nowrap;
    flex: none;
    flex-grow: 0;
    cursor: pointer;
    transition: background-color var(--explore-transition-fast, 150ms) ease, border-color var(--explore-transition-fast, 150ms) ease;
    box-sizing: content-box;
  }

  .search-tag:hover {
    background-color: var(--explore-color-bg-hover, var(--spectrum-gray-100, #f8f8f8));
    border-color: var(--explore-color-border-hover, var(--spectrum-gray-400, #b1b1b1));
  }

  .search-tag:focus-visible {
    outline: var(--explore-focus-width, 2px) solid var(--explore-focus-color, var(--spectrum-blue-900, #147af3));
    outline-offset: var(--explore-focus-offset, 2px);
  }

  .search-tag:active {
    background-color: var(--explore-color-bg-active, var(--spectrum-gray-200, #e6e6e6));
    border-color: var(--spectrum-gray-500, #8e8e8e);
  }

  @media (min-width: 600px) and (max-width: 1023px) {
    .tags-container {
      flex-wrap: nowrap;
      justify-content: flex-start;
      overflow-x: auto;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      padding-bottom: var(--explore-spacing-xs, var(--spectrum-spacing-100, 8px));
      gap: var(--explore-spacing-sm, var(--spectrum-spacing-200, 12px));
      mask-image: linear-gradient(to right, black 0%, black 85%, transparent 100%);
      -webkit-mask-image: linear-gradient(to right, black 0%, black 85%, transparent 100%);
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    .tags-container::-webkit-scrollbar {
      display: none;
    }

    .search-tag {
      --explore-tag-padding-inline: var(--spectrum-spacing-200, 12px);
      flex-shrink: 0;
    }
  }

  @media (max-width: 599px) {
    .tags-container {
      flex-wrap: nowrap;
      justify-content: flex-start;
      overflow-x: auto;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      gap: var(--explore-spacing-xs, var(--spectrum-spacing-100, 8px));
      mask-image: linear-gradient(to right, black 0%, black 80%, transparent 100%);
      -webkit-mask-image: linear-gradient(to right, black 0%, black 80%, transparent 100%);
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    .tags-container::-webkit-scrollbar {
      display: none;
    }

    .search-tag {
      --explore-tag-padding-inline: var(--spectrum-spacing-200, 12px);
      --explore-tag-font-size: var(--spectrum-font-size-100, 14px);
      flex-shrink: 0;
    }
  }
`;
