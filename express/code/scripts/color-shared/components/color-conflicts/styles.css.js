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
        width: fit-content;
    }
    
    .cc-container sp-theme {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-100);
        align-items: center;
    }

    .cc-label-wrap {
        display: inline-flex;
        align-items: center;
    }

    sp-badge {
        height: 24px;
        border: none;
    }

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

    .cc-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    @media (max-width: 899px) {
        .cc-container {
            justify-content: center;
            width: 100%;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        sp-badge,
        sp-tooltip {
            transition: none;
        }
    }
`;
