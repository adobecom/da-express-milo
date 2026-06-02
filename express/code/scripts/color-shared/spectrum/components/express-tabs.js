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
import { createTag } from '../../../utils.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/tabs.css';

const TABBABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFirstTabbable(root) {
  return root.querySelector?.(TABBABLE_SELECTOR) || null;
}

function getTabbableAdjacentTo(el, reverse = false) {
  const all = [...document.querySelectorAll(TABBABLE_SELECTOR)].filter(
    (node) => !el.contains(node) && node.offsetParent !== null,
  );
  if (reverse) {
    return [...all].reverse().find(
      (node) => el.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING,
    );
  }
  return all.find(
    (node) => el.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
}

/**
 * Create an Express tabs component.
 *
 * @param {Object} config
 * @param {string} [config.selected] — initially selected tab value
 * @param {'s'|'m'|'l'|'xl'} [config.size='m']
 * @param {boolean} [config.quiet=false]
 * @param {'auto'|'compact'} [config.direction='auto']
 * @param {Array<{label: string, value: string, disabled?: boolean, spIcon?: string, iconSlotHtml?: string}>} [config.tabs=[]]
 * @param {Function} [config.onSelectionChange] — ({ selected }) when tab changes
 * @param {boolean|string[]} [config.enterPanelOnTab=false] — move forward Tab from
 * selected tabs into the panel
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
    enterPanelOnTab = false,
  } = config;

  await loadTabs();
  await loadOverrideStyles('tabs', STYLES_PATH);

  const theme = createThemeWrapper();

  const tabsEl = createTag('sp-tabs', {
    size,
    ...(selected ? { selected } : {}),
    ...(quiet ? { quiet: '' } : {}),
    ...(direction !== 'auto' ? { direction } : {}),
  });

  tabConfigs.forEach(({ label, value, disabled, spIcon, iconSlotHtml }) => {
    const tab = createTag('sp-tab', {
      label,
      value,
      ...(disabled ? { disabled: '' } : {}),
    });
    if (spIcon?.startsWith('sp-icon-')) {
      const iconEl = createTag(spIcon, { 'slot': 'icon' });
      tab.appendChild(iconEl);
    }
    if (iconSlotHtml) {
      const iconWrapper = createTag('span', { 'slot': 'icon', class: 'ax-custom-icon' }, iconSlotHtml);
      tab.prepend(iconWrapper);
    }
    tabsEl.appendChild(tab);
  });

  theme.appendChild(tabsEl);

  const panelEntryFocusMap = new Map();

  function shouldEnterPanelOnTab(selectedValue) {
    if (enterPanelOnTab === true) return true;
    return Array.isArray(enterPanelOnTab) && enterPanelOnTab.includes(selectedValue);
  }

  function focusSelectedPanelEntry() {
    const { selected: selectedValue } = tabsEl;
    const customFn = panelEntryFocusMap.get(selectedValue);
    if (customFn) {
      customFn();
      return;
    }
    const panel = tabsEl.querySelector(`sp-tab-panel[value="${selectedValue}"]`);
    getFirstTabbable(panel)?.focus();
  }

  const controller = new AbortController();
  const { signal } = controller;

  if (onSelectionChange) {
    tabsEl.addEventListener('change', (e) => {
      onSelectionChange({ selected: e.target.selected });
    }, { signal });
  }

  // Tab skips the panel by default; selected tabs can opt into panel entry.
  theme.addEventListener('keydown', (e) => {
    const path = e.composedPath();
    const isOnTab = path.some((node) => node.tagName === 'SP-TAB');
    const isInPanel = path.some((node) => node.tagName === 'SP-TAB-PANEL');
    if (!isOnTab || isInPanel) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      if (!e.shiftKey && shouldEnterPanelOnTab(tabsEl.selected)) {
        requestAnimationFrame(focusSelectedPanelEntry);
        return;
      }
      getTabbableAdjacentTo(theme, e.shiftKey)?.focus();
    } else if (e.key === 'Enter') {
      requestAnimationFrame(focusSelectedPanelEntry);
    }
  }, { capture: true, signal });

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
      const panel = createTag('sp-tab-panel', { value });
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

    /**
     * Register a custom focus function for a tab panel.
     * Called instead of the default first-tabbable search when Enter is pressed on that tab.
     * @param {string} value — the tab's value
     * @param {Function} fn — called with no arguments to move focus into the panel
     */
    setPanelEntryFocus(value, fn) {
      panelEntryFocusMap.set(value, fn);
    },

    destroy() {
      controller.abort();
      theme.remove();
    },
  };
}
