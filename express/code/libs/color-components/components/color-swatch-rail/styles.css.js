
import { css } from '../../../deps/lit-all.min.js';

export const style = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
    font-family: var(--body-font-family);
  }
  :host([orientation="stacked"]) {
    overflow: visible;
  }

  
  .swatch-rail {
    position: relative;
    display: flex;
    flex-direction: row;
    gap: var(--swatch-rail-gap, var(--spacing-50));
    width: 100%;
    height: 100%;
    border-radius: var(--figma-strip-radius);
    overflow: hidden;
  }
  
  .swatch-rail:has(.add-slot--column-left),
  .swatch-rail:has(.add-slot--column-right) {
    overflow: visible;
  }

  .swatch-column {
    flex: var(--swatch-column-flex);
    width: var(--swatch-column-width);
    min-width: var(--swatch-column-min-width);
    align-self: stretch;
    display: flex;
    flex-direction: column;
    padding: var(--spacing-200);
    position: relative;
    transition: flex-grow 0.2s ease;
    box-sizing: border-box;
  }

  .swatch-column:first-child {
    border-radius: var(--swatch-column-first-radius);
  }

  .swatch-column:nth-child(5) {
    border-radius: var(--swatch-column-5-radius);
  }

  .swatch-column:last-child {
    border-radius: var(--swatch-column-last-radius);
  }

  
  .swatch-rail[data-orientation="horizontal"] {
    height: var(--spacing-700);
    padding: var(--spacing-100) var(--spacing-200);
    gap: var(--swatch-rail-gap, var(--spacing-50));
    border-radius: var(--figma-strip-radius) var(--figma-strip-radius) 0 0;
  }

  .swatch-rail[data-orientation="horizontal"] .swatch-column {
    flex: 1 1 0;
    width: auto;
    min-width: 0;
    padding: 0;
  }

  .swatch-rail[data-orientation="horizontal"] .swatch-column:first-child {
    border-radius: var(--swatch-column-first-radius);
  }

  .swatch-rail[data-orientation="horizontal"] .swatch-column:last-child {
    border-radius: var(--swatch-column-last-radius);
  }

  
  .swatch-rail[data-orientation="vertical"] {
    display: grid;
    grid-template-columns: repeat(var(--rail-columns), 1fr);
    grid-auto-rows: 1fr;
    flex-direction: unset;
    gap: var(--swatch-rail-gap, var(--spacing-50));
  }

  .swatch-rail[data-orientation="vertical"] .swatch-column {
    min-width: 0;
    width: auto;
  }

  
  .swatch-rail[data-orientation="vertical"].vertical--four-rows {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(4, 1fr);
    gap: var(--swatch-rail-gap, var(--spacing-50));
  }
  
  :host([hex-copy-first-row-only]) .swatch-rail[data-orientation="vertical"].vertical--four-rows {
    grid-template-rows: 1fr 90px 90px 90px;
  }

  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column {
    min-width: 0;
    min-height: 0;
  }

  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column::before {
    content: '';
    flex: 1 1 0;
    min-height: 0;
    order: 1;
  }

  .swatch-rail[data-orientation="vertical"].vertical--four-rows .bottom-info {
    order: 2;
    flex-shrink: 0;
  }

  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column--empty::before {
    content: none;
  }

  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column--empty {
    justify-content: center;
    align-items: center;
  }

  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column {
    border-radius: 0;
  }
  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column:nth-child(1) {
    border-radius: var(--Corner-radius-corner-radius-200) 0 0 0;
  }
  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column:nth-child(5) {
    border-radius: 0 var(--Corner-radius-corner-radius-200) 0 0;
  }
  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column:nth-child(16) {
    border-radius: 0 0 0 var(--Corner-radius-corner-radius-200);
  }
  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column:last-child {
    border-radius: 0 0 var(--Corner-radius-corner-radius-200) 0;
  }

  
  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column--simulated {
    position: relative;
    padding: 0;
    min-height: 0;
  }
  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column--simulated .strip-color-blindness-swatch__conflict-icon {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: var(--spacing-350);
    height: var(--spacing-350);
    padding: 0;
    border: none;
    background: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: default;
    pointer-events: auto;
    color: var(--swatch-icon-color);
  }
  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column--simulated .strip-color-blindness-swatch__conflict-icon sp-icon-alert {
    display: block;
    width: 100%;
    height: 100%;
    color: var(--swatch-icon-color);
  }
  .swatch-rail[data-orientation="vertical"].vertical--four-rows .swatch-column--simulated .strip-color-blindness-swatch__conflict-icon .icon-fallback {
    display: block;
    width: 100%;
    height: 100%;
    fill: currentColor;
  }

  
  .swatch-rail[data-orientation="vertical"].vertical--two-rows {
    display: grid;
    grid-template-columns: repeat(var(--vertical-max-per-row, 5), 1fr);
    grid-template-rows: 1fr 1fr;
    gap: var(--swatch-rail-gap, var(--spacing-50));
    border-radius: var(--Corner-radius-corner-radius-200);
    overflow: hidden;
  }

  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column {
    min-width: 0;
    min-height: 0;
  }

  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column::before {
    content: '';
    flex: 1 1 0;
    min-height: 0;
    order: 1;
  }

  .swatch-rail[data-orientation="vertical"].vertical--two-rows .bottom-info {
    order: 2;
    flex-shrink: 0;
  }

  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column--empty::before {
    content: none;
  }

  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column--empty {
    justify-content: center;
    align-items: center;
  }

  
  .swatch-rail[data-orientation="vertical"].vertical--two-rows .swatch-column {
    border-radius: 0;
  }

  .swatch-rail[data-orientation="vertical"] .bottom-info {
    gap: 0;
    padding: 0;
  }

  
  .swatch-rail[data-orientation="two-rows"] {
    flex-direction: column;
    gap: var(--spacing-50);
    height: 100%;
    min-height: 0;
    padding: 0;
    overflow: hidden;
  }
  .swatch-rail[data-orientation="two-rows"] .swatch-rail__row {
    display: flex;
    flex-direction: row;
    flex: 1 1 0;
    min-height: 0;
    gap: var(--spacing-50);
    width: 100%;
  }
  .swatch-rail[data-orientation="two-rows"] .swatch-rail__row .swatch-column {
    flex: 0 0 20%;
    width: 20%;
    min-width: 0;
    min-height: 0;
    height: 100%;
  }
  .swatch-rail[data-orientation="two-rows"] .swatch-rail__row .swatch-column::before {
    content: '';
    flex: 1 1 0;
    min-height: 0;
    order: 1;
  }
  .swatch-rail[data-orientation="two-rows"] .swatch-rail__row .bottom-info {
    order: 2;
    flex-shrink: 0;
  }
  .swatch-rail[data-orientation="two-rows"] .swatch-rail__row .swatch-column--empty::before {
    content: none;
  }
  .swatch-rail[data-orientation="two-rows"] .swatch-rail__row .swatch-column--empty {
    justify-content: center;
    align-items: center;
  }
  
  :host(:not([embedded])) .swatch-rail[data-orientation="two-rows"] .swatch-rail__row[data-row-index="0"] .swatch-column:first-child {
    border-radius: var(--Corner-radius-corner-radius-200) 0 0 0;
  }
  :host(:not([embedded])) .swatch-rail[data-orientation="two-rows"] .swatch-rail__row[data-row-index="0"] .swatch-column:last-child {
    border-radius: 0 var(--Corner-radius-corner-radius-200) 0 0;
  }
  :host(:not([embedded])) .swatch-rail[data-orientation="two-rows"] .swatch-rail__row[data-row-index="1"] .swatch-column:first-child {
    border-radius: 0 0 0 var(--Corner-radius-corner-radius-200);
  }
  :host(:not([embedded])) .swatch-rail[data-orientation="two-rows"] .swatch-rail__row[data-row-index="1"] .swatch-column:last-child {
    border-radius: 0 0 var(--Corner-radius-corner-radius-200) 0;
  }
  :host([embedded]) .swatch-rail,
  :host([embedded]) .swatch-rail .swatch-column {
    border-radius: 0;
  }
  
  :host([embedded]) .swatch-rail[data-orientation="stacked"] .swatch-column:first-child {
    border-radius: var(--figma-strip-radius) var(--figma-strip-radius) 0 0;
  }
  :host([embedded]) .swatch-rail[data-orientation="stacked"] .swatch-column:last-child {
    border-radius: 0 0 var(--figma-strip-radius) var(--figma-strip-radius);
  }
  :host([embedded]) .swatch-rail[data-orientation="stacked"] .swatch-column:not(:first-child):not(:last-child) {
    border-radius: 0;
  }

  
  .swatch-rail[data-orientation="horizontal"] .bottom-info {
    width: 100%;
    justify-content: space-between;
    flex-direction: row;
    padding: 0 var(--spacing-100);
  }

  .swatch-rail[data-orientation="horizontal"] .hex-code {
    flex-shrink: 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .swatch-rail[data-orientation="horizontal"] .bottom-info__actions {
    flex-shrink: 0;
    margin-left: 0;
  }

  
  
  .swatch-rail[data-orientation="stacked"] {
    flex-direction: column;
    height: 100%;
    min-height: 0;
    gap: var(--swatch-rail-gap, var(--spacing-50));
    padding: 0;
    border-radius: var(--figma-strip-radius);
    overflow: visible;
  }

  .swatch-rail[data-orientation="stacked"] .swatch-column {
    flex: 1 0 auto;
    min-height: var(--spacing-700);
    width: 100%;
    min-width: 0;
    padding: 0 var(--spacing-200);
    border-radius: 0;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    overflow: visible;
    position: relative;
  }

  
  .swatch-rail[data-orientation="stacked"] .swatch-column:first-child {
    border-radius: var(--figma-strip-radius) var(--figma-strip-radius) 0 0;
  }
  .swatch-rail[data-orientation="stacked"] .swatch-column:last-child {
    border-radius: 0 0 var(--figma-strip-radius) var(--figma-strip-radius);
  }
  
  .swatch-rail[data-orientation="stacked"]:has(.swatch-column--empty:last-child) .swatch-column:nth-last-child(2) {
    border-radius: 0 0 var(--figma-strip-radius) var(--figma-strip-radius);
  }
  .swatch-rail[data-orientation="stacked"] .swatch-column:last-child.swatch-column--empty {
    border-radius: 0;
  }
  
  .swatch-rail[data-orientation="stacked"] .swatch-column:not(:first-child):not(:last-child) {
    border-radius: 0;
  }

  .swatch-rail[data-orientation="stacked"] .swatch-column--empty {
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }

  
  .swatch-rail[data-orientation="stacked"] .stacked-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: var(--spacing-100);
  }

  .swatch-rail[data-orientation="stacked"] .bottom-info--stacked {
    margin-top: 0;
    flex-direction: row;
    flex: 1 1 0;
    min-width: 0;
    justify-content: flex-start;
  }

  .swatch-rail[data-orientation="stacked"] .hex-code {
    flex-shrink: 0;
  }

  .swatch-rail[data-orientation="stacked"] .stacked-row__icons {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-80);
    flex-shrink: 0;
  }

  .swatch-rail[data-orientation="stacked"] .stacked-row__icons .base-color-badge,
  .swatch-rail[data-orientation="stacked"] .stacked-row__icons .color-blindness-badge {
    position: static;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--spacing-500);
    height: var(--spacing-500);
  }

  .swatch-rail[data-orientation="stacked"] .stacked-row__icons .color-blindness-badge [class^="sp-icon-"] {
    width: var(--spacing-350) !important;
    height: var(--spacing-350) !important;
  }

  .swatch-column:hover {
    
  }

  
  .swatch-column:focus {
    outline: none;
  }
  .swatch-column:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 var(--spacing-50) var(--color-blue-800);
  }

  
  .top-actions-row {
    position: absolute;
    top: var(--spacing-100);
    left: var(--spacing-100);
    right: var(--spacing-100);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    pointer-events: none;
  }

  .top-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-80);
    position: static;
    pointer-events: auto;
  }

  .top-actions--left {
    justify-content: flex-start;
  }

  .top-actions--right {
    flex-direction: column;
    align-items: flex-end;
  }

  .top-actions--right .color-blindness-badge {
    position: static;
  }

  
  .add-slots-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .add-slots-overlay .add-slot {
    pointer-events: auto;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    width: 36px;
    height: 36px;
  }

  
  .add-slots-overlay .add-slot--left {
    left: 0;
  }
  
  .add-slots-overlay .add-slot--right {
    left: auto;
  }

  
  .add-slots-overlay .add-slot .icon-button--add {
    width: var(--spacing-500);
    height: var(--spacing-500);
    padding: var(--spacing-80);
    border-radius: 50%;
    border: 1px solid var(--color-blue-800);
    background: var(--color-white);
    color: var(--color-blue-800);
  }
  .add-slots-overlay .add-slot .icon-button--add:hover {
    background: var(--color-light-gray);
    border-color: var(--color-blue-800);
  }
  .add-slots-overlay .add-slot .icon-button--add:active {
    background: var(--color-light-gray);
    border-color: var(--color-blue-800);
  }
  .add-slots-overlay .add-slot .icon-button--add:focus-visible {
    outline: var(--spacing-50) solid var(--color-blue-800);
    outline-offset: var(--spacing-50);
  }
  .add-slots-overlay .add-slot .icon-button--add [class^="sp-icon-"] {
    width: var(--spacing-350);
    height: var(--spacing-350);
  }

  

  
  .swatch-rail[data-orientation="stacked"] .add-slots-overlay .add-slot--left {
    left: 50%;
    right: auto;
    transform: translate(-50%, -50%);
  }
  .swatch-rail[data-orientation="stacked"] .add-slots-overlay .add-slot--right {
    left: 50%;
    right: auto;
    transform: translate(-50%, 50%);
  }

  
  .swatch-column .add-slot--column {
    position: absolute;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
    z-index: 2;
  }
  
  .swatch-column .add-slot--column-left,
  .swatch-column .add-slot--column-right {
    top: 50%;
    transform: translateY(-50%);
  }
  .swatch-column .add-slot--column-left {
    left: -18px;
  }
  .swatch-column .add-slot--column-right {
    right: -18px;
  }
  
  .swatch-rail[data-orientation="stacked"] .swatch-column .add-slot--column-top {
    top: 0px;
    bottom: auto;
    left: 50%;
    right: auto;
    transform: translate(-50%, -50%);
  }
  .swatch-rail[data-orientation="stacked"] .swatch-column .add-slot--column-bottom {
    top: auto;
    bottom: 0px;
    left: 50%;
    right: auto;
    transform: translate(-50%, 50%);
  }
  .swatch-column:hover .add-slot--column {
    opacity: 1;
    pointer-events: auto;
  }
  .swatch-column:focus-within .add-slot--column {
    opacity: 1;
    pointer-events: auto;
  }
  .swatch-column .add-slot--column .icon-button--add {
    width: var(--spacing-500);
    height: var(--spacing-500);
    padding: var(--spacing-80);
    border-radius: 50%;
    border: 1px solid var(--color-blue-800);
    background: var(--color-white);
    color: var(--color-blue-800);
  }
  .swatch-column .add-slot--column .icon-button--add:hover {
    background: var(--color-light-gray);
    border-color: var(--color-blue-800);
  }
  .swatch-column .add-slot--column .icon-button--add:active {
    background: var(--color-light-gray);
    border-color: var(--color-blue-800);
  }
  .swatch-column .add-slot--column .icon-button--add:focus-visible {
    outline: var(--spacing-50) solid var(--color-blue-800);
    outline-offset: var(--spacing-50);
  }
  .swatch-column .add-slot--column .icon-button--add [class^="sp-icon-"] {
    width: var(--spacing-350);
    height: var(--spacing-350);
  }

  
  .swatch-column--empty {
    flex: var(--swatch-column-flex);
    width: var(--swatch-column-width);
    min-width: var(--swatch-column-min-width);
    max-width: 100%;
    flex-shrink: 1;
    background: var(--color-white) !important;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  
  .swatch-column--empty .icon-button--add {
    cursor: pointer;
    width: var(--spacing-500);
    height: var(--spacing-500);
    padding: var(--spacing-80);
    border-radius: 50%;
    border: 1px solid var(--color-blue-800);
    background: var(--color-white);
    color: var(--color-blue-800);
  }
  .swatch-column--empty .icon-button--add:hover {
    background: var(--color-light-gray);
    border-color: var(--color-blue-800);
  }
  .swatch-column--empty .icon-button--add:active {
    background: var(--color-light-gray);
    border-color: var(--color-blue-800);
  }
  .swatch-column--empty .icon-button--add:focus-visible {
    outline: var(--spacing-50) solid var(--color-blue-800);
    outline-offset: var(--spacing-50);
  }
  .swatch-column--empty .icon-button--add [class^="sp-icon-"] {
    width: var(--spacing-350);
    height: var(--spacing-350);
  }

  .base-color-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--spacing-500);
    height: var(--spacing-500);
    color: var(--swatch-text-color);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .base-color-badge--hover-only {
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .swatch-column:hover .base-color-badge--hover-only,
  .base-color-badge--hover-only:focus-visible {
    opacity: 1;
  }

  .base-color-badge [class^="sp-icon-"] {
    width: var(--spacing-350);
    height: var(--spacing-350);
  }
  .base-color-icon--circle {
    display: none;
  }
  .swatch-column.base-color:hover .base-color-badge--active .base-color-icon--target {
    display: none;
  }
  .swatch-column.base-color:hover .base-color-badge--active .base-color-icon--circle {
    display: inline-flex;
  }

  .base-color-badge .icon-fallback {
    width: var(--spacing-350);
    height: var(--spacing-350);
    display: inline-block;
    fill: currentColor;
    stroke: currentColor;
  }

  .base-color-badge:focus-visible,
  .color-blindness-badge:focus-visible {
    outline: var(--spacing-50) solid var(--color-blue-800);
    outline-offset: var(--spacing-50);
  }

  .color-blindness-badge {
    position: absolute;
    bottom: var(--spacing-100);
    left: var(--spacing-100);
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--spacing-500);
    height: var(--spacing-500);
    opacity: 0.8;
    border: 0;
    background: transparent;
    padding: 0;
    cursor: pointer;
  }

  .color-blindness-badge [class^="sp-icon-"] {
    width: var(--spacing-350) !important;
    height: var(--spacing-350) !important;
  }

  
  .color-blindness-placeholder {
    font-size: 10px;
    font-weight: 600;
    color: var(--Alias-content-typography-secondary);
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  
  .swatch-column.base-color {
    outline: none;
  }

  .swatch-column--draggable {
    cursor: grab;
    touch-action: none;
  }

  .swatch-column--draggable:active {
    cursor: grabbing;
  }

  .icon-button--drag {
    touch-action: none;
  }

  .swatch-column--dragging {
    opacity: 0.6;
  }

  .swatch-column--drag-over {
    outline: var(--spacing-50) dashed var(--color-blue-800);
    outline-offset: var(--spacing-50);
  }

  
  .bottom-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    background: none !important;
    box-shadow: none;
    backdrop-filter: none;
    padding: var(--spacing-75) var(--spacing-100);
    gap: var(--spacing-100);
  }

  .bottom-info__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-80);
    margin-left: 0;
  }

  
  .hex-code {
    font-size: var(--spacing-300);
    font-weight: 700;
    color: var(--swatch-text-color);
    text-transform: uppercase;
    text-shadow: var(--swatch-text-shadow);
  }
  button.hex-code {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    text-align: left;
  }
  button.hex-code:focus-visible {
    outline: var(--spacing-50) solid var(--color-blue-800);
    outline-offset: var(--spacing-50);
  }
  .hex-code--editable {
    padding: 7px var(--spacing-200);
    cursor: pointer;
  }
  .hex-code--copyable {
    cursor: pointer;
  }
  .hex-code--static {
    cursor: default;
  }

  
  .icon-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--spacing-80);
    width: var(--spacing-500);
    height: var(--spacing-500);
    border-radius: var(--Corner-radius-corner-radius-100);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--swatch-text-color);
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  

  
  .icon-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  
  .icon-button:active {
    background-color: rgba(255, 255, 255, 0.35);
  }

  
  .icon-button:focus-visible {
    outline: var(--spacing-50) solid var(--color-blue-800);
    outline-offset: var(--spacing-50);
  }

  
  .icon-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  
  .icon-button [class^="sp-icon-"] {
    width: var(--spacing-350);
    height: var(--spacing-350);
  }
  .icon-button .icon-fallback {
    width: var(--spacing-350);
    height: var(--spacing-350);
    display: inline-block;
    fill: currentColor;
  }

  
  .icon-button .icon-asset,
  .icon-button .icon-tint {
    display: inline-block;
    width: var(--spacing-350);
    height: var(--spacing-350);
    filter: var(--swatch-icon-filter);
  }

  
  .icon-button sp-icon-drag-handle,
  .icon-button .icon-drag {
    display: inline-block;
    width: var(--spacing-350);
    height: var(--spacing-350);
    filter: var(--swatch-icon-filter);
  }

  .edit-input-native {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  
  sp-tooltip,
  sp-tooltip * {
    text-transform: none !important;
  }
`;
