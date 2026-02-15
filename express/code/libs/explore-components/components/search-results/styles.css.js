import { css } from '../../../deps/lit.js';

export const style = css`
  :host {
    display: block;
    width: 100%;
  }

  .explore-search-results {
    inline-size: 100%;
    text-align: center;
    padding-block: var(--explore-spacing-md, var(--spectrum-spacing-300, 16px));
  }

  .explore-search-results.hidden {
    display: none;
  }

  .results-title {
    font-weight: 700;
    font-size: var(--heading-font-size-m, 24px);
    line-height: 1.3;
    color: var(--explore-color-text-primary, var(--spectrum-gray-900, #131313));
    margin: 0 0 var(--explore-spacing-xs, var(--spectrum-spacing-100, 8px));
  }

  .query-text {
    color: var(--explore-color-text-primary, var(--spectrum-gray-900, #131313));
  }

  .results-message {
    font-size: var(--explore-body-size-m, var(--body-font-size-m, 16px));
    line-height: 1.5;
    color: var(--explore-color-text-secondary, var(--spectrum-gray-700, #464646));
    margin: 0;
  }

  .results-message.hidden {
    display: none;
  }

  .results-message strong {
    font-weight: 600;
    color: var(--spectrum-gray-800, #222);
  }

  @media (max-width: 599px) {
    .results-title {
      font-size: var(--heading-font-size-s, 20px);
    }
  }
`;
