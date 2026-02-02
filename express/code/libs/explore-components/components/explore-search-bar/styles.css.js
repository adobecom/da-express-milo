import { css } from '../../../deps/lit.js';

export const style = css`
  :host {
    display: block;
    width: 100%;
  }

  .explore-search-outer {
    display: flex;
    flex-direction: column;
    align-items: center;
    inline-size: var(--explore-search-max-width, 700px);
    max-inline-size: 100%;
    position: relative;
    margin: 0 auto;
  }

  .explore-search-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0;
    gap: var(--explore-spacing-sm, var(--spectrum-spacing-200, 10px));
    inline-size: 100%;
    max-inline-size: 100%;
    position: relative;
    z-index: 5;
  }

  .explore-search-wrapper {
    inline-size: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .explore-search-form {
    inline-size: 100%;
  }

  .search-input-wrapper {
    position: relative;
    inline-size: 100%;
    display: flex;
    align-items: center;
  }

  .explore-search-input {
    inline-size: 100%;
    block-size: var(--explore-search-height-desktop, var(--spectrum-component-height-200, 48px));
    border-radius: var(--explore-search-radius, var(--spectrum-corner-radius-200, 50px));
    border: 1px solid var(--explore-color-border, var(--spectrum-gray-300, #d5d5d5));
    padding-inline: var(--explore-spacing-xxl, var(--spectrum-spacing-600, 48px));
    font-family: 'Adobe Clean', adobe-clean, sans-serif;
    font-size: var(--spectrum-font-size-200, 16px);
    font-weight: 400;
    line-height: 1.3;
    color: var(--explore-color-text-primary, var(--spectrum-gray-900, #1d1d1d));
    background: var(--explore-color-bg-primary, var(--spectrum-gray-50, #fff));
    outline: none;
    transition:
      border-color var(--explore-transition-fast, 130ms) ease,
      box-shadow var(--explore-transition-fast, 130ms) ease;
  }

  .explore-search-input:hover {
    border-color: var(--explore-color-border-hover, var(--spectrum-gray-400, #b8b8b8));
  }

  .explore-search-input:focus,
  .explore-search-input:focus-visible {
    border-color: var(--spectrum-gray-800, #323232);
    box-shadow: 0 0 0 1px var(--spectrum-gray-800, #323232);
    outline: none;
  }

  .explore-search-input::placeholder {
    color: var(--explore-color-text-tertiary, var(--spectrum-gray-600, #6d6d6d));
  }

  .explore-search-input::-webkit-search-cancel-button,
  .explore-search-input::-webkit-search-decoration {
    -webkit-appearance: none;
    appearance: none;
  }

  .search-icon {
    position: absolute;
    inset-inline-start: var(--explore-spacing-md, var(--spectrum-spacing-300, 16px));
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    color: var(--explore-color-text-secondary, var(--spectrum-gray-700, #505050));
  }

  .search-icon svg {
    inline-size: var(--spectrum-icon-size-200, 20px);
    block-size: var(--spectrum-icon-size-200, 20px);
  }

  .search-clear-btn {
    position: absolute;
    inset-inline-end: var(--explore-spacing-sm, var(--spectrum-spacing-200, 12px));
    display: flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--spectrum-component-height-75, 32px);
    block-size: var(--spectrum-component-height-75, 32px);
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--explore-color-text-secondary, var(--spectrum-gray-700, #505050));
    border-radius: var(--spectrum-corner-radius-100, 4px);
    transition:
      background-color var(--explore-transition-fast, 130ms) ease,
      color var(--explore-transition-fast, 130ms) ease;
  }

  .search-clear-btn:hover {
    background-color: var(--explore-color-bg-active, var(--spectrum-gray-200, #e6e6e6));
    color: var(--explore-color-text-primary, var(--spectrum-gray-900, #1d1d1d));
  }

  .search-clear-btn:focus-visible {
    outline: var(--explore-focus-width, 2px) solid var(--explore-focus-color, #0265dc);
    outline-offset: var(--explore-focus-offset, 2px);
  }

  .search-clear-btn svg {
    inline-size: var(--spectrum-icon-size-200, 20px);
    block-size: var(--spectrum-icon-size-200, 20px);
  }

  .search-clear-btn.hidden {
    display: none;
  }

  .explore-search-container.is-fetching .explore-search-input {
    opacity: 0.7;
  }

  @media (min-width: 600px) and (max-width: 1023px) {
    .explore-search-outer {
      inline-size: 100%;
      max-inline-size: 600px;
    }
  }

  @media (max-width: 599px) {
    .explore-search-outer {
      inline-size: 100%;
      padding-inline: var(--explore-spacing-md, var(--spectrum-spacing-300, 16px));
    }

    .explore-search-input {
      block-size: var(--explore-search-height-mobile, var(--spectrum-component-height-100, 40px));
      padding-inline: var(--explore-spacing-xl, var(--spectrum-spacing-500, 40px));
      font-size: var(--spectrum-font-size-100, 14px);
    }
  }

  /* Sticky behavior styles */
  :host(.is-sticky-clone) .explore-search-outer {
    position: fixed;
    inset-block-end: 5%;
    inset-inline-start: 50%;
    transform: translateX(-50%);
    inline-size: var(--explore-search-max-width, 700px);
    max-inline-size: calc(100% - var(--explore-spacing-lg, 24px) * 2);
    z-index: var(--explore-z-index-sticky, 100);
    box-shadow: var(--spectrum-drop-shadow-emphasis, 0 8px 16px rgba(0, 0, 0, 0.15));
    background: var(--explore-color-bg-primary, var(--spectrum-gray-50, #fff));
    border-radius: var(--explore-search-radius, 50px);
    padding: var(--explore-spacing-xs, var(--spectrum-spacing-100, 8px));
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
  }

  :host(.is-sticky-clone.is-visible) .explore-search-outer {
    opacity: 1;
    pointer-events: auto;
    visibility: visible;
    animation: exploreSearchSlideUp var(--explore-transition-normal, 200ms) ease-out;
  }

  :host(.is-sticky-clone.is-leaving) .explore-search-outer {
    animation: exploreSearchSlideDown var(--explore-transition-normal, 200ms) ease-in forwards;
  }

  @keyframes exploreSearchSlideUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  @keyframes exploreSearchSlideDown {
    from {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    to {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
  }

  @media (max-width: 599px) {
    :host(.is-sticky-clone) .explore-search-outer {
      inset-inline-start: var(--explore-spacing-md, var(--spectrum-spacing-300, 16px));
      inset-inline-end: var(--explore-spacing-md, var(--spectrum-spacing-300, 16px));
      transform: none;
      inline-size: auto;
    }

    :host(.is-sticky-clone.is-visible) .explore-search-outer {
      animation: exploreSearchSlideUpMobile var(--explore-transition-normal, 200ms) ease-out;
    }

    :host(.is-sticky-clone.is-leaving) .explore-search-outer {
      animation: exploreSearchSlideDownMobile var(--explore-transition-normal, 200ms) ease-in forwards;
    }

    @keyframes exploreSearchSlideUpMobile {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes exploreSearchSlideDownMobile {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(20px);
      }
    }
  }
`;
