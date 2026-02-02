import { css } from '../../../deps/lit.js';

export const style = css`
  :host {
    display: block;
    width: 100%;
  }

  .explore-hero-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--explore-spacing-xs, var(--spectrum-spacing-100, 8px));
    inline-size: 100%;
  }

  .explore-hero-header .headline {
    font-weight: 900;
    font-size: var(--spectrum-font-size-900, 45px);
    line-height: 104%;
    color: var(--explore-color-text-primary, var(--spectrum-gray-900, #131313));
    margin: 0;
  }

  .explore-hero-header .subcopy {
    font-size: var(--explore-body-size-l, var(--body-font-size-m, 18px));
    font-weight: 400;
    line-height: 1.5;
    color: var(--explore-color-text-secondary, var(--spectrum-gray-700, #464646));
    margin: 0;
    max-inline-size: 640px;
  }

  @media (min-width: 600px) and (max-width: 1023px) {
    .explore-hero-header .headline {
      font-size: var(--explore-headline-tablet, 40px);
    }
  }

  @media (max-width: 599px) {
    .explore-hero-header .headline {
      font-size: var(--explore-headline-mobile, 32px);
    }

    .explore-hero-header .subcopy {
      font-size: var(--explore-body-size-m, var(--body-font-size-s, 16px));
    }
  }
`;
