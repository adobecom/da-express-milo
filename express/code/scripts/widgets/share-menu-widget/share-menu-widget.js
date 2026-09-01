import { getLibs } from '../../utils.js';
import { showExpressToast } from '../../color-shared/spectrum/components/express-toast.js';
import loadShareMenuPlaceholders, { SHARE_MENU_PLACEHOLDERS } from './placeholders.js';

let instanceCount = 0;

function buildDescriptors(heading, actions, feedback) {
  const descriptors = {
    heading,
    copied: feedback?.copied || SHARE_MENU_PLACEHOLDERS.copied,
    failed: feedback?.failed || SHARE_MENU_PLACEHOLDERS.failed,
  };
  actions.forEach((action) => {
    descriptors[`action:${action.value}`] = action.label;
    if (action.success) descriptors[`success:${action.value}`] = action.success;
    if (action.failure) descriptors[`failure:${action.value}`] = action.failure;
  });
  return descriptors;
}

function getClipboardItems(clipboard) {
  if (clipboard?.items?.length) return clipboard.items;
  if (!clipboard?.files?.length || !window.ClipboardItem) return null;
  return clipboard.files.map((file) => new window.ClipboardItem({
    [file.type || 'application/octet-stream']: file,
  }));
}

async function copyContent(content) {
  const clipboard = content?.clipboard;
  const items = getClipboardItems(clipboard);
  if (items && navigator.clipboard?.write) {
    await navigator.clipboard.write(items);
    return;
  }
  if (typeof clipboard?.text === 'string' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(clipboard.text);
    return;
  }
  throw new Error('No supported clipboard content was provided');
}

async function shareContent(content) {
  const share = content?.share;
  if (!share || typeof navigator.share !== 'function') {
    throw new Error('Web Share API is unavailable');
  }
  if (share.files?.length && navigator.canShare && !navigator.canShare(share)) {
    throw new Error('This share payload is unsupported');
  }
  await navigator.share(share);
}

/**
 * Creates a localized popup share menu around an existing trigger.
 * Actions are `{ value, type, label, icon, onSelect, fallback, dismissOnSelect }`,
 * where type is `copy`, `native`, or `custom`. `getContent(action, strings)`
 * resolves fresh data for every selection and may return `{ share, clipboard, data }`.
 */
export default async function createShareMenuWidget({
  trigger,
  heading,
  actions = [],
  feedback,
  getContent,
  notify,
  onActionSelect,
} = {}) {
  if (!trigger || !heading || !actions.length || typeof getContent !== 'function') {
    throw new Error('Share menu requires a trigger, heading, actions, and getContent');
  }

  const [{ createTag, getConfig, loadStyle }, strings] = await Promise.all([
    import(`${getLibs()}/utils/utils.js`),
    loadShareMenuPlaceholders(buildDescriptors(heading, actions, feedback)),
    import('../spectrum/dist/icon.js'),
    import('../spectrum/dist/menu.js'),
    import('../spectrum/dist/menu-group.js'),
    import('../spectrum/dist/icons-workflow.js'),
  ]);
  loadStyle(`${getConfig().codeRoot}/scripts/widgets/share-menu-widget/share-menu-widget.css`);

  instanceCount += 1;
  const menuId = `share-menu-${instanceCount}`;
  const wrapper = createTag('div', { class: 'share-menu-widget' });
  const popover = createTag('div', { class: 'share-menu-popover', hidden: '' });
  const menu = createTag('sp-menu', {
    id: menuId,
    class: 'share-menu-list',
    size: 'm',
    role: 'menu',
    label: strings.heading,
  });
  const group = createTag('sp-menu-group', { class: 'share-menu-group' });
  const sectionHeader = createTag('span', { slot: 'header' });
  sectionHeader.textContent = strings.heading;
  group.append(sectionHeader);

  actions.forEach((action) => {
    const label = strings[`action:${action.value}`];
    const item = createTag('sp-menu-item', {
      value: action.value,
      'aria-label': label,
    });
    if (action.icon) {
      const icon = action.icon();
      icon.classList.add('share-menu-icon');
      icon.setAttribute('slot', 'icon');
      icon.setAttribute('aria-hidden', 'true');
      item.append(icon);
    }
    item.append(label);
    group.append(item);
  });

  menu.append(group);
  popover.append(menu);
  wrapper.append(trigger, popover);
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-controls', menuId);
  trigger.setAttribute('aria-expanded', 'false');

  let pending = false;

  const sendNotification = async ({ message, variant, action, error }) => {
    if (!message) return;
    if (notify) {
      await notify({ message, variant, action, error });
      return;
    }
    await showExpressToast({ message, variant });
  };

  const close = ({ restoreFocus = false } = {}) => {
    if (popover.hidden) return;
    popover.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus();
  };

  const open = ({ focusMenu = false } = {}) => {
    if (!popover.hidden) return;
    popover.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    if (focusMenu) {
      requestAnimationFrame(() => group.querySelector('sp-menu-item')?.focus());
    }
  };

  const runAction = async (action, content) => {
    if (action.type === 'copy') await copyContent(content);
    else if (action.type === 'native') await shareContent(content);
    else if (action.type === 'custom' && action.onSelect) {
      await action.onSelect(content, { action, strings });
    } else throw new Error(`Unsupported share action: ${action.type}`);

    const success = strings[`success:${action.value}`]
      || (action.type === 'copy' ? strings.copied : '');
    await sendNotification({ message: success, variant: 'positive', action });
  };

  const selectAction = async (action) => {
    if (pending) return;
    pending = true;
    trigger.setAttribute('aria-busy', 'true');
    try {
      const content = await getContent(action, strings);
      try {
        await runAction(action, content);
      } catch (error) {
        if (error?.name === 'AbortError') return;
        const fallback = actions.find(({ value }) => value === action.fallback);
        if (!fallback) throw error;
        await runAction(fallback, content);
      }
    } catch (error) {
      const message = strings[`failure:${action.value}`] || strings.failed;
      window.lana?.log(`Share menu action failed: ${error?.message || error}`, {
        tags: 'share-menu',
        severity: 'error',
      });
      await sendNotification({ message, variant: 'negative', action, error });
    } finally {
      pending = false;
      trigger.removeAttribute('aria-busy');
    }
  };

  const onTriggerClick = (event) => {
    event.stopPropagation();
    if (popover.hidden) open({ focusMenu: event.detail === 0 });
    else close({ restoreFocus: true });
  };
  const onMenuClick = (event) => {
    const item = event.target.closest('sp-menu-item');
    if (!item) return;
    const action = actions.find(({ value }) => value === item.getAttribute('value'));
    if (!action) return;
    event.stopPropagation();
    onActionSelect?.({ action, event });
    const dismissOnSelect = typeof action.dismissOnSelect === 'function'
      ? action.dismissOnSelect()
      : action.dismissOnSelect !== false;
    if (dismissOnSelect) close({ restoreFocus: true });
    selectAction(action);
  };
  const onDocumentClick = (event) => {
    if (!wrapper.contains(event.target)) close();
  };
  const onDocumentKeydown = (event) => {
    if (event.key === 'Escape') close({ restoreFocus: true });
  };
  const onFocusOut = (event) => {
    if (!wrapper.contains(event.relatedTarget)) close();
  };

  trigger.addEventListener('click', onTriggerClick);
  menu.addEventListener('click', onMenuClick);
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onDocumentKeydown);
  wrapper.addEventListener('focusout', onFocusOut);

  return {
    element: wrapper,
    open,
    close,
    destroy() {
      trigger.removeEventListener('click', onTriggerClick);
      menu.removeEventListener('click', onMenuClick);
      document.removeEventListener('click', onDocumentClick);
      document.removeEventListener('keydown', onDocumentKeydown);
      wrapper.removeEventListener('focusout', onFocusOut);
    },
  };
}
