import { createTag, getLibs } from '../../../scripts/utils.js';
import { createExpressTooltip } from '../../../scripts/color-shared/spectrum/components/express-tooltip.js';
import { UNDO_ICON, REDO_ICON } from '../../../scripts/color-shared/components/actionMenuIcons.js';
import { decorateAnalyticsAttributes } from '../../../scripts/color-shared/utils/utilities.js';

/* S2 icons from Figma — Extract-toolbar (node 3582:110610) */
const ICON_EYEDROPPER = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="eyedropper-mask" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20"><path d="M18.2705 2.16211C17.709 1.49316 16.9385 1.10449 16.1016 1.06738C15.2002 1.05468 14.2881 1.40234 13.5976 2.09277L12.2988 3.38379C11.3457 2.88281 10.1357 3.03223 9.33495 3.83301L8.95018 4.21778C8.03099 5.13599 7.9807 6.58668 8.77635 7.57728L4.91405 11.4404C3.24803 13.1055 1.78026 14.5732 1.75487 14.5996C0.74999 15.6045 0.74999 17.2402 1.75487 18.2451C2.2578 18.7481 2.91796 18.999 3.57714 18.999C4.2373 18.999 4.89745 18.7481 5.40038 18.2451L12.4206 11.2256C12.8847 11.6072 13.4482 11.8096 14.0176 11.8096C14.664 11.8096 15.3115 11.5635 15.8037 11.0713L16.1885 10.6865C16.9873 9.8877 17.1387 8.68262 16.6416 7.73048L17.8496 6.54298L17.8545 6.5381C19.1435 5.24904 19.3184 3.40821 18.2705 2.16211ZM4.33985 17.1846C3.9209 17.6035 3.23633 17.6055 2.81544 17.1846C2.39552 16.7647 2.39552 16.0801 2.81935 15.6572C2.86818 15.6065 4.32423 14.1514 5.97462 12.501L9.81739 8.65723L11.3428 10.1826L4.33985 17.1846ZM16.7969 5.47461L15.1328 7.10938C14.9902 7.25 14.9092 7.44141 14.9082 7.64161C14.9072 7.84083 14.9863 8.03321 15.1279 8.17481C15.5283 8.5752 15.5283 9.22559 15.1279 9.62598L14.7432 10.0107C14.3428 10.4111 13.6924 10.4111 13.292 10.0107L10.0107 6.7295C9.61036 6.32911 9.61036 5.67872 10.0107 5.27833L10.3955 4.89356C10.5957 4.69336 10.8584 4.59376 11.1211 4.59376C11.3838 4.59376 11.6465 4.69337 11.8467 4.89356C12.1387 5.18653 12.6133 5.18653 12.9053 4.89551L14.6563 3.15528C15.0508 2.75977 15.5449 2.54493 16.0361 2.56641C16.4541 2.58496 16.8291 2.77832 17.1221 3.12696C17.7559 3.88087 17.3975 4.87109 16.7969 5.47461Z" fill="#292929"/><path d="M4.2 6.3C4.2 6.6866 3.8866 7 3.5 7C3.1134 7 2.8 6.6866 2.8 6.3V0.7C2.8 0.313401 3.1134 0 3.5 0C3.8866 0 4.2 0.313401 4.2 0.7V6.3Z" fill="black"/><path d="M0.7 4.2C0.313401 4.2 0 3.8866 0 3.5C0 3.1134 0.313401 2.8 0.7 2.8L6.3 2.8C6.6866 2.8 7 3.1134 7 3.5C7 3.8866 6.6866 4.2 6.3 4.2L0.7 4.2Z" fill="black"/></mask><g mask="url(#eyedropper-mask)"><rect width="20" height="20" fill="#292929"/></g></svg>';
const ICON_REVERT = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 15.5H3C2.58594 15.5 2.25 15.1641 2.25 14.75C2.25 14.3359 2.58594 14 3 14H18C18.4141 14 18.75 14.3359 18.75 14.75C18.75 15.1641 18.4141 15.5 18 15.5ZM11 3.25C7.22339 3.25 4.07367 6.06616 3.3913 9.77832L2.53272 8.33838C2.32129 7.98242 1.86036 7.86719 1.5044 8.07861C1.14893 8.29052 1.03223 8.75097 1.24463 9.10693L3.04004 12.1186C3.14356 12.2925 3.31348 12.417 3.51025 12.4639C3.56787 12.4775 3.62597 12.4844 3.68408 12.4844C3.82519 12.4844 3.96484 12.4443 4.08594 12.3677L7.00537 10.5151C7.35498 10.293 7.45849 9.82958 7.23682 9.47997C7.01465 9.12987 6.55078 9.02685 6.20166 9.24852L4.85779 10.1014C5.39227 7.06188 7.94049 4.74999 11 4.74999C14.4463 4.74999 17.25 7.68114 17.25 11.2842C17.25 11.6982 17.5859 12.0342 18 12.0342C18.4141 12.0342 18.75 11.6982 18.75 11.2842C18.75 6.85399 15.2734 3.25 11 3.25Z" fill="#292929"/></svg>';
const ICON_REPLACE = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.75 9H4.25C3.00977 9 2 7.99023 2 6.75V4.25C2 3.00977 3.00977 2 4.25 2H6.75C7.99023 2 9 3.00977 9 4.25V6.75C9 7.99023 7.99023 9 6.75 9ZM4.25 3.5C3.83691 3.5 3.5 3.83691 3.5 4.25V6.75C3.5 7.16309 3.83691 7.5 4.25 7.5H6.75C7.16309 7.5 7.5 7.16309 7.5 6.75V4.25C7.5 3.83691 7.16309 3.5 6.75 3.5H4.25Z" fill="#292929"/><path d="M17.2803 5.72168C16.9873 5.42871 16.5127 5.42871 16.2197 5.72168L15.7368 6.20459C15.6661 4.01514 13.8733 2.25195 11.667 2.25195C11.2529 2.25195 10.917 2.58789 10.917 3.00195C10.917 3.41601 11.2529 3.75195 11.667 3.75195C13.0361 3.75195 14.1494 4.8269 14.2339 6.17529L13.7803 5.72168C13.4873 5.42871 13.0127 5.42871 12.7197 5.72168C12.4267 6.01465 12.4267 6.48926 12.7197 6.78223L14.4697 8.53223C14.5388 8.60132 14.6216 8.65577 14.7131 8.69385C14.8047 8.73193 14.9021 8.75196 15 8.75196C15.0979 8.75196 15.1953 8.73194 15.2869 8.69385C15.3784 8.65576 15.4612 8.60132 15.5303 8.53223L17.2803 6.78223C17.5732 6.48926 17.5732 6.01465 17.2803 5.72168Z" fill="#292929"/><path d="M15.75 18H13.25C12.0098 18 11 16.9902 11 15.75V13.25C11 12.0098 12.0098 11 13.25 11H15.75C16.9902 11 18 12.0098 18 13.25V15.75C18 16.9902 16.9902 18 15.75 18ZM13.25 12.5C12.8369 12.5 12.5 12.8369 12.5 13.25V15.75C12.5 16.1631 12.8369 16.5 13.25 16.5H15.75C16.1631 16.5 16.5 16.1631 16.5 15.75V13.25C16.5 12.8369 16.1631 12.5 15.75 12.5H13.25Z" fill="#292929"/><path d="M8.33301 16.2519C6.96387 16.2519 5.85059 15.177 5.76612 13.8286L6.21973 14.2822C6.36621 14.4287 6.55762 14.502 6.75 14.502C6.94238 14.502 7.13379 14.4287 7.28027 14.2822C7.57324 13.9892 7.57324 13.5146 7.28027 13.2217L5.53027 11.4717C5.46118 11.4026 5.37829 11.3479 5.28662 11.3098C5.10327 11.2339 4.89673 11.2339 4.71338 11.3098C4.62183 11.3479 4.53882 11.4026 4.46973 11.4717L2.71973 13.2217C2.42676 13.5146 2.42676 13.9892 2.71973 14.2822C3.0127 14.5752 3.48731 14.5752 3.78028 14.2822L4.26319 13.7993C4.33387 15.9888 6.12672 17.7519 8.33301 17.7519C8.74707 17.7519 9.08301 17.416 9.08301 17.0019C9.08301 16.5879 8.74707 16.2519 8.33301 16.2519Z" fill="#292929"/></svg>';

async function loadActionMenuStyles() {
  try {
    const { loadStyle, getConfig } = await import(`${getLibs()}/utils/utils.js`);
    const codeRoot = getConfig?.()?.codeRoot || '/express/code';
    await loadStyle(`${codeRoot}/scripts/color-shared/action-menu.css`);
  } catch { /* styles load best-effort */ }
}

async function createIconButton(iconHtml, label, onClick) {
  const btn = createTag(
    'button',
    {
      class: 'color-action-button',
      type: 'button',
      'aria-label': label,
      tabindex: '0',
    },
    iconHtml,
  );
  if (onClick) {
    btn.addEventListener('click', () => {
      if (btn.getAttribute('aria-disabled') === 'true') return;
      onClick();
    });
  }
  try {
    await createExpressTooltip({
      targetEl: btn,
      content: label,
      placement: 'top',
      disableAria: true,
    });
  } catch { /* tooltip is enhancement, not critical */ }
  return btn;
}

function attachRovingTabIndex(container, elements) {
  if (!elements.length) return;
  elements.forEach((el, i) => {
    el.setAttribute('tabindex', i === 0 ? '0' : '-1');
    el.setAttribute('data-roving-index', i.toString());
  });
  container.addEventListener('keydown', (e) => {
    const target = e.target.closest('[data-roving-index]');
    if (!target || !elements.includes(target)) return;
    const idx = parseInt(target.getAttribute('data-roving-index'), 10);
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      next = (idx + 1) % elements.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      next = (idx - 1 + elements.length) % elements.length;
    }
    if (next !== -1 && next !== idx) {
      elements[idx].setAttribute('tabindex', '-1');
      elements[next].setAttribute('tabindex', '0');
      elements[next].focus();
    }
  });
}

/**
 * Build the extract toolbar.
 *
 * Palette variant: [Mood selector] | [Add color] [Reset] [Replace image] | [Undo] [Redo]
 * Gradient variant: [Reset] [Replace image] | [Undo] [Redo]
 */
export default async function createToolbar(options = {}) {
  await loadActionMenuStyles();

  const toolbar = createTag('div', {
    class: 'color-extract-toolbar',
    role: 'toolbar',
    'aria-label': 'Color extraction tools',
  });

  const leftGroup = createTag('div', {
    class: 'color-extract-toolbar-left',
  });

  if (options.moodElement) {
    leftGroup.append(options.moodElement);
  }

  const actionsGroup = createTag('div', {
    class: 'color-extract-toolbar-actions',
  });

  const focusableElements = [];

  if (options.onAddColor) {
    const addBtn = await createIconButton(ICON_EYEDROPPER, 'Add color', options.onAddColor);
    actionsGroup.append(addBtn);
    focusableElements.push(addBtn);
  }

  const resetBtn = await createIconButton(ICON_REVERT, 'Reset colors', options.onReset);
  actionsGroup.append(resetBtn);
  focusableElements.push(resetBtn);

  const replaceBtn = await createIconButton(ICON_REPLACE, 'Replace image', options.onReplace);
  actionsGroup.append(replaceBtn);
  focusableElements.push(replaceBtn);

  leftGroup.append(actionsGroup);

  const historyGroup = createTag('div', {
    class: 'action-menu-history',
  });

  const undoBtn = await createIconButton(UNDO_ICON, 'Undo', options.onUndo);
  const redoBtn = await createIconButton(REDO_ICON, 'Redo', options.onRedo);
  decorateAnalyticsAttributes(undoBtn, { linkLabel: 'Undo' });
  decorateAnalyticsAttributes(redoBtn, { linkLabel: 'Redo' });
  undoBtn.setAttribute('aria-disabled', 'true');
  redoBtn.setAttribute('aria-disabled', 'true');
  historyGroup.append(undoBtn, redoBtn);
  focusableElements.push(undoBtn, redoBtn);

  toolbar.append(leftGroup, historyGroup);

  attachRovingTabIndex(toolbar, focusableElements);

  return {
    element: toolbar,
    setUndoEnabled(enabled) {
      undoBtn.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    },
    setRedoEnabled(enabled) {
      redoBtn.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    },
    destroy() {
      toolbar.remove();
    },
  };
}
