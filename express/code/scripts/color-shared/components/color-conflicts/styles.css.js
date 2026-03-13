import { css } from '../../../../libs/deps/lit-all.min.js';

export const style = css`
    :host {
        display: block;
        font-family: var(--body-font-family);
    }

    .cc-container {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-100);
        align-items: center;
        justify-content: center;
        background: var(--color-gray-100);
        padding: var(--spacing-300);
        border-radius: var(--spectrum-corner-radius-100);
        width: 100%;
    }

    .cc-label-wrap {
        display: inline-flex;
        align-items: center;
    }

    sp-badge {
        height: var(--spectrum-component-height-75);
        border: none;
    }

    .cc-label {
        font-size: var(--body-font-size-s);
        font-weight: var(--spectrum-medium-font-weight);
        line-height: var(--spectrum-line-height-75);
        color: var(--color-gray-950);
        text-decoration: underline dotted;
        text-underline-offset: 12%;
        white-space: nowrap;
    }

    @media (min-width: 900px) {
        .cc-container {
            width: fit-content;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        sp-badge {
            transition: none;
        }
    }
`;
