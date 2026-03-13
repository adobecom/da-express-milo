/**
 * Express Tabs — Wrapper for Spectrum Web Components <sp-tabs>
 *
 * Creates a themed tabs component with Express styling overrides.
 *
 * Usage:
 *   import { createExpressTabs } from '../spectrum/components/express-tabs.js';
 *
 *   const tabs = await createExpressTabs({
 *     selected: 'summary',
 *     size: 'm',
 *     quiet: true,
 *     tabs: [
 *       { label: 'Summary', value: 'summary' },
 *       { label: 'Details', value: 'details' },
 *     ],
 *     onSelectionChange: ({ selected }) => console.log(selected),
 *   });
 *   container.appendChild(tabs.element);
 */

import { loadTabs } from '../load-spectrum.js';
import { createThemeWrapper } from '../utils/theme.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/tabs.css';

/**
 * Create an Express tabs component.
 *
 * @param {Object} config
 * @param {string} [config.selected] — initially selected tab value
 * @param {'s'|'m'|'l'|'xl'} [config.size='m']
 * @param {boolean} [config.quiet=false]
 * @param {'auto'|'compact'} [config.direction='auto']
 * @param {Array<{label: string, value: string, disabled?: boolean}>} [config.tabs=[]]
 * @param {Function} [config.onSelectionChange] — ({ selected }) when tab changes
 * @returns {Promise<{
 *   element: HTMLElement,
 *   tabsEl: HTMLElement,
 *   getSelected: ()=>string,
 *   setSelected: (value:string)=>void,
 *   addPanel: (value:string, content:HTMLElement)=>HTMLElement,
 *   getPanel: (value:string)=>HTMLElement|null,
 *   destroy: ()=>void
 * }>}
 */
// eslint-disable-next-line import/prefer-default-export
export async function createExpressTabs(config = {}) {
  const {
    selected,
    size = 'm',
    quiet = false,
    direction = 'auto',
    tabs: tabConfigs = [],
    onSelectionChange,
  } = config;

  await loadTabs();
  await loadOverrideStyles('tabs', STYLES_PATH);

  const theme = createThemeWrapper();
  const tabsEl = document.createElement('sp-tabs');

  tabsEl.setAttribute('size', size);
  if (selected) tabsEl.setAttribute('selected', selected);
  if (quiet) tabsEl.setAttribute('quiet', '');
  if (direction !== 'auto') tabsEl.setAttribute('direction', direction);

  tabConfigs.forEach(({ label, value, disabled }) => {
    const tab = document.createElement('sp-tab');
    tab.setAttribute('label', label);
    tab.setAttribute('value', value);
    if (disabled) tab.setAttribute('disabled', '');
    tabsEl.appendChild(tab);
  });

  theme.appendChild(tabsEl);

  const controller = new AbortController();
  const { signal } = controller;

  if (onSelectionChange) {
    tabsEl.addEventListener('change', (e) => {
      onSelectionChange({ selected: e.target.selected });
    }, { signal });
  }

  return {
    element: theme,
    tabsEl,

    getSelected() {
      return tabsEl.selected;
    },

    setSelected(value) {
      tabsEl.setAttribute('selected', value);
    },

    /**
     * Add a tab panel for a given tab value.
     * @param {string} value — matches the tab's value attribute
     * @param {HTMLElement} content — content to place inside the panel
     * @returns {HTMLElement} — the created sp-tab-panel
     */
    addPanel(value, content) {
      const panel = document.createElement('sp-tab-panel');
      panel.setAttribute('value', value);
      if (content) panel.appendChild(content);
      tabsEl.appendChild(panel);
      return panel;
    },

    /**
     * Get an existing panel by value.
     * @param {string} value
     * @returns {HTMLElement|null}
     */
    getPanel(value) {
      return tabsEl.querySelector(`sp-tab-panel[value="${value}"]`);
    },

    destroy() {
      controller.abort();
      theme.remove();
    },
  };
}
