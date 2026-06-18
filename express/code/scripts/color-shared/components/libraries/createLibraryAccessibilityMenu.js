import { createTag } from '../../../utils.js';
import { decorateAnalyticsAttributes, navigateToColorTool } from '../../utils/utilities.js';

function interpolate(template, vars = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => (vars[key] != null ? vars[key] : ''));
}

function createSpIconButton(iconName) {
  const icon = document.createElement(iconName);
  icon.setAttribute('size', 'm');
  icon.setAttribute('aria-hidden', 'true');
  const wrap = createTag('span', { class: 'action-icon' });
  wrap.appendChild(icon);
  return wrap;
}

/**
 * Accessibility action menu for a library theme card.
 * Opens an action-only sp-menu (no selection) with contrast and color-blindness links.
 *
 * @param {Object} options
 * @param {Object} options.item - theme item with colors, name, tags
 * @param {Object} options.strings - resolved placeholders
 * @param {Object} options.toolHrefs - { contrast, colorBlindness }
 */
export function createLibraryAccessibilityMenu({
  item,
  strings = {},
  toolHrefs = {},
} = {}) {
  const name = item?.name || strings.librariesDefaultName || '';
  let popoverOpen = false;
  let detachDocumentHandlers = null;

  const wrapper = createTag('div', { class: 'ax-lib-card__access-menu' });

  const triggerLabel = interpolate(strings.librariesAccessibilityAria, { name });
  const trigger = createTag('button', {
    type: 'button',
    class: 'ax-lib-card__action',
    'aria-label': triggerLabel,
    'aria-haspopup': 'menu',
    'aria-expanded': 'false',
    'data-tooltip-content': triggerLabel,
  });
  trigger.appendChild(createSpIconButton('sp-icon-accessibility'));
  decorateAnalyticsAttributes(trigger, { linkLabel: triggerLabel });

  const popover = createTag('div', {
    class: 'ax-lib-card__access-menu-popover',
    hidden: '',
  });

  const menu = createTag('sp-menu', {
    class: 'ax-lib-card__access-menu-list',
    size: 'm',
    role: 'menu',
    label: triggerLabel,
  });

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

  menuItems.forEach((entry) => {
    const menuItem = createTag('sp-menu-item', { value: entry.value });
    menuItem.textContent = entry.label;
    decorateAnalyticsAttributes(menuItem, { linkLabel: entry.label });
    menu.appendChild(menuItem);
  });

  popover.appendChild(menu);
  wrapper.append(trigger, popover);

  function setExpanded(expanded) {
    trigger.setAttribute('aria-expanded', String(expanded));
  }

  function closePopover({ focusTrigger = false } = {}) {
    if (!popoverOpen) return;
    popoverOpen = false;
    popover.setAttribute('hidden', '');
    setExpanded(false);
    if (detachDocumentHandlers) {
      detachDocumentHandlers();
      detachDocumentHandlers = null;
    }
    if (focusTrigger) trigger.focus?.();
  }

  function openPopover({ focusMenu = false } = {}) {
    if (popoverOpen) return;
    popoverOpen = true;
    popover.removeAttribute('hidden');
    setExpanded(true);

    const onDocumentClick = (event) => {
      if (!wrapper.contains(event.target)) closePopover();
    };
    const onDocumentKeydown = (event) => {
      if (event.key === 'Escape') closePopover({ focusTrigger: true });
    };

    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeydown);
    detachDocumentHandlers = () => {
      document.removeEventListener('click', onDocumentClick);
      document.removeEventListener('keydown', onDocumentKeydown);
    };

    if (focusMenu) {
      window.requestAnimationFrame(() => {
        const firstItem = menu.querySelector('sp-menu-item');
        (firstItem || menu)?.focus?.();
      });
    }
  }

  function togglePopover({ focusMenu = false } = {}) {
    if (popoverOpen) closePopover({ focusTrigger: true });
    else openPopover({ focusMenu });
  }

  function onTriggerClick(event) {
    event.stopPropagation();
    togglePopover({ focusMenu: event.detail === 0 });
  }

  function onMenuClick(event) {
    const menuItem = event.target?.closest?.('sp-menu-item');
    if (!menuItem) return;
    event.stopPropagation();

    const value = menuItem.getAttribute('value');
    const entry = menuItems.find((itemEntry) => itemEntry.value === value);
    if (!entry?.href || !item?.colors?.length) {
      closePopover({ focusTrigger: true });
      return;
    }

    navigateToColorTool(entry.href, {
      colors: item.colors,
      name: item.name,
      tags: item.tags,
    });
  }

  trigger.addEventListener('click', onTriggerClick);
  menu.addEventListener('click', onMenuClick);

  return {
    element: wrapper,
    destroy() {
      closePopover();
      trigger.removeEventListener('click', onTriggerClick);
      menu.removeEventListener('click', onMenuClick);
      wrapper.remove();
    },
  };
}
