import { css } from '../../../../libs/deps/lit-all.min.js';

export const style = css`
    :host {
        display: block;
        font-family: var(--body-font-family);
    }

    .cc-container {
        background: var(--color-gray-100);
        padding: var(--spacing-300);
        border-radius: var(--Corner-radius-corner-radius-100);
        display: flex;
        gap: var(--spacing-100);
        align-items: center;
    }

    .cc-label-wrap {
        display: inline-flex;
        align-items: center;
    }

    /* Tooltip uses Express token from express/code/styles/styles.css (#292929) */
    sp-tooltip {
        --mod-tooltip-background-color-default: var(--color-gray-800-variant);
    }

    .cc-label {
        font-size: var(--body-font-size-s);
        font-weight: 500;
        line-height: var(--ax-heading-xs-lh);
        color: var(--color-gray-950);
        text-decoration: underline dotted;
        text-underline-offset: 12%;
        white-space: nowrap;
    }

    :host([mobile]) .cc-container {
        justify-content: center;
        width: 320px;
    }
`;
