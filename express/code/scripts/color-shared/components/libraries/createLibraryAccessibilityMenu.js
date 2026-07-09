import { navigateToColorTool } from '../../utils/utilities.js';
import { createLibraryCardActionMenu } from './createLibraryCardActionMenu.js';

/**
 * Accessibility action menu for a library theme card.
 *
 * @param {Object} options
 * @param {Object} options.item - theme item with colors, name, tags
 * @param {Object} options.strings - resolved placeholders
 * @param {Object} options.toolHrefs - { contrast, colorBlindness, colorWheel }
 */
export function createLibraryAccessibilityMenu({
  item,
  strings = {},
  toolHrefs = {},
} = {}) {
  const triggerLabel = strings.librariesAccessibilityTools;

  const menuItems = [
    {
      value: 'contrast',
      label: strings.librariesCheckColorContrast,
      href: toolHrefs.contrast,
    },
    {
      value: 'color-blindness',
      label: strings.librariesCheckColorBlindness,
      href: toolHrefs.colorBlindness,
    },
  ].filter((entry) => entry.href && entry.label);

  const menu = createLibraryCardActionMenu({
    triggerIcon: 'sp-icon-accessibility',
    triggerLabel,
    items: menuItems,
    onSelect(value) {
      const entry = menuItems.find((itemEntry) => itemEntry.value === value);
      if (!entry?.href || !item?.colors?.length) return;

      navigateToColorTool(entry.href, {
        colors: item.colors,
        name: item.name,
        tags: item.tags,
      });
    },
  });

  return menu;
}
