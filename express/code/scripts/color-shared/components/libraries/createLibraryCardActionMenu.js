import { createTag } from '../../../utils.js';
import { decorateAnalyticsAttributes } from '../../utils/utilities.js';

let actionMenuIdCounter = 0;

function createSpIconButton(iconName) {
  const icon = document.createElement(iconName);
  icon.setAttribute('size', 'm');
  icon.setAttribute('aria-hidden', 'true');
  const wrap = createTag('span', { class: 'action-icon' });
  wrap.appendChild(icon);
  return wrap;
}

/**
 * Coordinates library card action menus so only one popover is open at a time.
 */
export function createLibraryCardActionMenuCoordinator() {
  const menus = new Set();

  return {
    register(menu) {
      menus.add(menu);
    },
    unregister(menu) {
      menus.delete(menu);
    },
    closeOthers(current) {
      menus.forEach((menu) => {
        if (menu !== current) menu.closePopover?.();
      });
    },
  };
}

let libraryCardActionMenuCoordinator;

export function getLibraryCardActionMenuCoordinator() {
  if (!libraryCardActionMenuCoordinator) {
    libraryCardActionMenuCoordinator = createLibraryCardActionMenuCoordinator();
  }
  return libraryCardActionMenuCoordinator;
}

/**
 * Shared action-only sp-menu popover for library card icon buttons.
 *
 * @param {Object} options
 * @param {string} options.triggerIcon - Spectrum icon element name
 * @param {string} options.triggerLabel - aria-label / tooltip for trigger
 * @param {string} [options.menuLabel] - sp-menu label (defaults to triggerLabel)
 * @param {Array<{ value: string, label: string }>} options.items
 * @param {Function} [options.onSelect] - (value) => void
 * @param {ReturnType<typeof createLibraryCardActionMenuCoordinator>} [options.coordinator]
 */
export function createLibraryCardActionMenu({
  triggerIcon,
  triggerLabel,
  menuLabel,
  items = [],
  onSelect = () => {},
  coordinator,
} = {}) {
  const menuCoordinator = coordinator ?? getLibraryCardActionMenuCoordinator();
  let popoverOpen = false;
  let detachDocumentHandlers = null;

  const wrapper = createTag('div', { class: 'ax-lib-card__action-menu' });
  const label = menuLabel || triggerLabel;

  actionMenuIdCounter += 1;
  const menuId = `ax-lib-action-menu-${actionMenuIdCounter}`;

  const trigger = createTag('button', {
    type: 'button',
    class: 'ax-lib-card__action',
    'aria-label': triggerLabel,
    'aria-haspopup': 'menu',
    'aria-expanded': 'false',
    'aria-controls': menuId,
    'data-tooltip-content': triggerLabel,
  });
  trigger.appendChild(createSpIconButton(triggerIcon));
  decorateAnalyticsAttributes(trigger, { linkLabel: triggerLabel });

  const popover = createTag('div', {
    class: 'ax-lib-card__action-menu-popover',
    hidden: '',
  });

  const menu = createTag('sp-menu', {
    id: menuId,
    class: 'ax-lib-card__action-menu-list',
    size: 'm',
    role: 'menu',
    label,
  });

  items.forEach((entry) => {
    if (!entry?.value || !entry?.label) return;
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
    menuCoordinator.closeOthers(menuApi);
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
    if (!value) {
      closePopover({ focusTrigger: true });
      return;
    }

    onSelect(value, { closePopover });
  }

  // Close when focus leaves the menu entirely. This lets Tab from the open menu
  // move to the next focusable card action (per the Figma a11y note) while the
  // dropdown collapses instead of staying open behind the moved focus.
  function onFocusOut(event) {
    if (popoverOpen && !wrapper.contains(event.relatedTarget)) closePopover();
  }

  trigger.addEventListener('click', onTriggerClick);
  menu.addEventListener('click', onMenuClick);
  wrapper.addEventListener('focusout', onFocusOut);

  const menuApi = {
    element: wrapper,
    closePopover,
    destroy() {
      menuCoordinator.unregister(menuApi);
      closePopover();
      trigger.removeEventListener('click', onTriggerClick);
      menu.removeEventListener('click', onMenuClick);
      wrapper.removeEventListener('focusout', onFocusOut);
      wrapper.remove();
    },
  };

  menuCoordinator.register(menuApi);
  return menuApi;
}
