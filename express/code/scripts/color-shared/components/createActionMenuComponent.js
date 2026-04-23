/* eslint-disable import/prefer-default-export */
import { createTag, getLibs } from '../../utils.js';
import loadMiloStyle from '../utils/loadMiloStyle.js';
import { createExpressButton, createExpressTooltip } from '../spectrum/index.js';
import { createActionMenuState } from './createActionMenuState.js';
import { attachRovingTabIndex } from '../spectrum/utils/a11y.js';
import { createColorPaletteParamApi, decorateAnalyticsAttributes } from '../utils/utilities.js';
import {
  COLOR_ICON,
  ACCESSIBILITY_ICON,
  VISIBILITY_ICON,
  UNDO_ICON,
  REDO_ICON,
  SHUFFLE_ICON,
  MAXIMIZE_ICON,
  MINIMIZE_ICON,
} from './actionMenuIcons.js';

const TYPES = ['full', 'nav-only', 'controls-only'];
const ICON_MAP = {
  palette: COLOR_ICON,
  contrast: ACCESSIBILITY_ICON,
  'color-blindness': VISIBILITY_ICON,
  undo: UNDO_ICON,
  redo: REDO_ICON,
  'generate-random': SHUFFLE_ICON,
  expand: {
    maximize: MAXIMIZE_ICON,
    minimize: MINIMIZE_ICON,
  },
};
const LANA_TAGS = 'color,color-action-menu';

function isValidActionMenuItem(item, requiredField) {
  const hasId = item?.id && Object.keys(ICON_MAP).includes(item.id);
  const hasRequired = typeof item?.[requiredField] === 'string' && item[requiredField].length > 0;
  if (hasId && hasRequired) return true;
  window.lana?.log(`Action menu item skipped. Missing ${item?.id} ${requiredField}.`, {
    tags: LANA_TAGS,
    severity: 'error',
  });
  return false;
}

export async function loadStyles() {
  try {
    await loadMiloStyle('scripts/color-shared/action-menu.css');
  } catch {
    window.lana?.log('Failed to load action menu styles', { tags: LANA_TAGS, severity: 'error' });
  }
}

async function createNav(navLinks, activeId, getColors, getName) {
  const list = Array.isArray(navLinks) ? navLinks : [];
  const nav = createTag('nav', { class: 'action-menu-nav', 'aria-label': 'Color palette tools' });
  const ul = createTag('ul');
  const linkElements = [];
  let activeIndex = -1;
  const paletteApi = createColorPaletteParamApi();

  for (let index = 0; index < list.length; index += 1) {
    const link = list[index];
    // eslint-disable-next-line no-continue
    if (!isValidActionMenuItem(link, 'href')) continue;
    const isActive = link.id === activeId;
    if (isActive) activeIndex = linkElements.length;
    const li = createTag('li');
    const linkEl = createTag(
      isActive ? 'span' : 'a',
      {
        ...(isActive ? {} : { href: link.href }),
        class: `action-menu-link ${link.id}-link color-action-button ${isActive ? 'active' : ''}`,
      },
    );
    if (!isActive) {
      linkEl.addEventListener('click', (e) => {
        const colors = typeof getColors === 'function' ? getColors() : null;
        if (!colors?.length) return;
        e.preventDefault();
        try {
          const url = new URL(linkEl.href, window.location.href);
          const name = typeof getName === 'function' ? getName() : undefined;
          paletteApi.setOnUrl(url, colors, { name });
          window.location.href = url.toString();
        } catch {
          window.location.href = linkEl.href;
        }
      });
    }
    const iconSvg = ICON_MAP[link.id];
    if (iconSvg) linkEl.append(createTag('span', null, iconSvg));
    let labelEl = null;
    if (isActive) {
      labelEl = createTag('span', { id: `${link.id}-label`, class: 'active-label' }, link.label);
      linkEl.setAttribute('aria-labelledby', `${link.id}-label`);
      linkEl.setAttribute('aria-current', 'page');
    } else {
      linkEl.setAttribute('aria-label', link.label);
    }
    li.append(linkEl);
    if (labelEl) li.append(labelEl);
    ul.append(li);
    if (link.id === 'palette') {
      const dividerEl = createTag('li', { role: 'separator', 'aria-hidden': true, class: 'palette-divider' });
      ul.append(dividerEl);
    }
    decorateAnalyticsAttributes(linkEl, { linkLabel: link.label });
    linkElements.push(linkEl);
    await createExpressTooltip({
      targetEl: linkEl,
      content: link.label,
      placement: 'top',
      disableAria: true,
    });
  }

  attachRovingTabIndex(ul, linkElements, activeIndex >= 0 ? activeIndex : 0);
  nav.append(ul);
  return nav;
}

async function createHistoryButton(
  control,
  onClick,
  buttonRefs,
  controlContainer,
  historyContainer,
) {
  const btn = createTag(
    'button',
    {
      class: `${control.id}-btn color-action-button`,
      'aria-label': control.label,
      'aria-disabled': 'true',
      tabindex: '0',
    },
    ICON_MAP[control.id],
  );
  historyContainer.append(btn);
  if (!historyContainer.parentNode) controlContainer.append(historyContainer);
  btn.addEventListener('click', () => {
    if (btn.getAttribute('aria-disabled') === 'true' || btn.disabled) return;
    onClick();
  });
  decorateAnalyticsAttributes(btn, { linkLabel: control.label });
  buttonRefs[control.id] = btn;
  await createExpressTooltip({
    targetEl: btn,
    content: control.label,
    placement: 'top',
    disableAria: true,
  });
  return btn;
}

async function createControls(
  controls,
  handleUndo,
  handleRedo,
  handleGenerateRandom,
  onExpand,
  buttonRefs,
  type,
) {
  const controlContainer = createTag('div', {
    class: 'action-menu-controls',
    'aria-label': 'Color palette controls',
  });
  const controlElements = [];
  const historyContainer = createTag('div', { class: 'action-menu-history' });
  const list = Array.isArray(controls) ? controls : [];

  for (let index = 0; index < list.length; index += 1) {
    const control = list[index];
    // eslint-disable-next-line no-continue
    if (!isValidActionMenuItem(control, 'label')) continue;
    let btn = null;
    switch (control.id) {
      case 'undo':
        if (typeof handleUndo !== 'function') break;
        btn = await createHistoryButton(
          control,
          handleUndo,
          buttonRefs,
          controlContainer,
          historyContainer,
        );
        break;
      case 'redo':
        if (typeof handleRedo !== 'function') break;
        btn = await createHistoryButton(
          control,
          handleRedo,
          buttonRefs,
          controlContainer,
          historyContainer,
        );
        break;
      case 'generate-random': {
        if (typeof handleGenerateRandom !== 'function') break;
        if (type === 'full') {
          const spBtn = await createExpressButton({
            label: control.label,
            variant: 'quiet',
            onClick: handleGenerateRandom,
            size: 'l',
            iconSlotHtml: SHUFFLE_ICON,
          });
          btn = spBtn.element;
        } else {
          btn = createTag(
            'button',
            {
              class: `${control.id}-btn color-action-button`,
              'aria-label': control.label,
              tabindex: '0',
            },
            ICON_MAP[control.id],
          );
          btn.addEventListener('click', handleGenerateRandom);
          await createExpressTooltip({
            targetEl: btn,
            content: control.label,
            placement: 'top',
            disableAria: true,
          });
        }
        decorateAnalyticsAttributes(btn, { linkLabel: control.label });
        controlContainer.append(btn);
        break;
      }
      case 'expand':
        if (typeof onExpand !== 'function') break;
        btn = createTag(
          'button',
          {
            class: `${control.id}-btn color-action-button`,
            'aria-label': control.label,
            'aria-pressed': false,
            tabindex: '0',
          },
          ICON_MAP[control.id].maximize,
        );
        decorateAnalyticsAttributes(btn, { linkLabel: control.label });
        controlContainer.append(btn);
        btn.addEventListener('click', () => {
          const oldIsPressed = btn.getAttribute('aria-pressed') === 'true';
          const isPressed = !oldIsPressed;
          onExpand(isPressed);
          btn.setAttribute('aria-pressed', isPressed);
          if (type === 'full') {
            const containerEl = btn.closest('.action-menu-full');
            containerEl?.classList.toggle('expanded', isPressed);
          }
          btn.innerHTML = ICON_MAP[control.id][isPressed ? 'minimize' : 'maximize'];
        });
        await createExpressTooltip({
          targetEl: btn,
          content: control.label,
          placement: 'top',
          disableAria: true,
        });
        break;
      default:
        break;
    }

    if (btn) {
      const focusable = (control.id === 'generate-random' && type === 'full')
        ? btn.querySelector('sp-button')
        : btn;
      controlElements.push(focusable);
    }
  }
  attachRovingTabIndex(controlContainer, controlElements);
  return controlContainer;
}

async function applyNavLinkParamOverrides(navLinks) {
  const { getConfig } = await import(`${getLibs()}/utils/utils.js`);
  const { env } = getConfig();
  if (env.name === 'prod') return navLinks;
  const params = new URLSearchParams(window.location.search);
  return navLinks.map((link) => {
    const override = params.get(`${link.id}-link`);
    return override ? { ...link, href: override } : link;
  });
}

export async function createActionMenuComponent(options = {}) {
  const {
    id = 'action-menu',
    type = 'full',
    activeId = '',
    navLinks = [],
    controls = [],
    onExpand,
    onUndo,
    onRedo,
    onGenerateRandom,
    transformPalette,
    getName,
    enableState = true,
    daaLh = null,
  } = options;

  if (!TYPES.includes(type)) {
    window.lana?.log(`Invalid action menu type: ${type}`, { tags: LANA_TAGS, severity: 'error' });
    return null;
  }

  await loadStyles();

  const stateKey = id;
  let handleUndoState = null;
  let handleRedoState = null;
  let handleGenerateRandomState = null;
  let pushStateFn = null;
  let getCurrentPaletteFn = null;
  if (enableState) {
    const state = createActionMenuState(stateKey, { transformPalette });
    handleUndoState = state.onUndo;
    handleRedoState = state.onRedo;
    handleGenerateRandomState = state.onGenerateRandom;
    pushStateFn = state.addOnePaletteToHistory;
    getCurrentPaletteFn = state.getCurrentPalette;
    state.init();
  }

  function handleUndo() {
    onUndo?.();
    handleUndoState?.();
  }
  function handleRedo() {
    onRedo?.();
    handleRedoState?.();
  }
  function handleGenerateRandom() {
    onGenerateRandom?.();
    handleGenerateRandomState?.();
  }

  const container = createTag('div', { class: `action-menu-${type}` });
  if (daaLh) container.setAttribute('daa-lh', daaLh);
  const buttonRefs = {};
  const sections = [];

  if (type !== 'controls-only') {
    const processedLinks = await applyNavLinkParamOverrides(navLinks);
    sections.push(await createNav(processedLinks, activeId, getCurrentPaletteFn, getName));
  }
  if (type !== 'nav-only') {
    sections.push(await createControls(
      controls,
      handleUndo,
      handleRedo,
      handleGenerateRandom,
      onExpand,
      buttonRefs,
      type,
    ));
  }
  container.append(...sections);

  function handleHistoryIndexChanged(event) {
    const { historyIndex, historyLength } = event.detail;
    if (buttonRefs.undo) {
      const isDisabled = historyIndex === 0;
      buttonRefs.undo.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
    }
    if (buttonRefs.redo) {
      const isDisabled = historyIndex === historyLength - 1;
      buttonRefs.redo.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
    }
  }

  const eventName = `${id}:history-index-changed`;
  document.addEventListener(eventName, handleHistoryIndexChanged);

  return {
    element: container,
    pushState: pushStateFn,
    getCurrentPalette: getCurrentPaletteFn,
    undo: handleUndoState,
    redo: handleRedoState,
    destroy() {
      document.removeEventListener(eventName, handleHistoryIndexChanged);
      container.remove();
    },
  };
}
