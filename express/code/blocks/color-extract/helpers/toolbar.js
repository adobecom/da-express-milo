import { createTag } from '../../../scripts/utils.js';

const ICON_EYEDROPPER = `<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false"><path d="M17.3,4.1l-1.4-1.4a2,2,0,0,0-2.8,0L11.7,4.1,10.3,2.7,8.9,4.1l2.1,2.1L4.4,12.8a1,1,0,0,0-.3.5L3,17l3.7-1.1a1,1,0,0,0,.5-.3L13.8,9l2.1,2.1,1.4-1.4L15.9,8.3l1.4-1.4A2,2,0,0,0,17.3,4.1Z" fill="currentColor"/></svg>`;
const ICON_REVERT = `<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false"><path d="M4.5,7H12a4,4,0,0,1,0,8H8v1.5h4A5.5,5.5,0,0,0,12,5.5H4.5L7.1,2.9,6,1.8,1.4,6.4,6,11l1.1-1.1Z" fill="currentColor"/></svg>`;
const ICON_REPLACE = `<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false"><path d="M17,7.5H14.5V3a1,1,0,0,0-1-1h-7a1,1,0,0,0-1,1V7.5H3a.5.5,0,0,0-.35.85l7,7a.5.5,0,0,0,.7,0l7-7A.5.5,0,0,0,17,7.5Z" fill="currentColor"/></svg>`;
const ICON_UNDO = `<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false"><path d="M5.5,8H13a4,4,0,0,1,0,8H9.5V17.5H13A5.5,5.5,0,0,0,13,6.5H5.5L8.1,3.9,7,2.8,2.4,7.4,7,12l1.1-1.1Z" fill="currentColor"/></svg>`;
const ICON_REDO = `<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false"><path d="M14.5,8H7A4,4,0,0,0,7,16h3.5V17.5H7A5.5,5.5,0,0,1,7,6.5h7.5L11.9,3.9,13,2.8l4.6,4.6L13,12l-1.1-1.1Z" fill="currentColor"/></svg>`;

function createIconButton(iconHtml, label, onClick) {
  const btn = createTag('button', {
    class: 'color-extract-toolbar-btn',
    type: 'button',
    'aria-label': label,
    title: label,
  });
  btn.innerHTML = iconHtml;
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}

/**
 * Build the extract toolbar with mood dropdown, action icons, and undo/redo.
 *
 * @param {object} options
 * @param {HTMLElement} options.moodElement - The mood selector DOM element
 * @param {Function} options.onAddColor - Eyedropper / add color callback
 * @param {Function} options.onReset - Reset extraction callback
 * @param {Function} options.onReplace - Replace image callback
 * @param {Function} options.onUndo - Undo callback
 * @param {Function} options.onRedo - Redo callback
 * @returns {{ element: HTMLElement, setUndoEnabled: Function, setRedoEnabled: Function }}
 */
export function createToolbar(options = {}) {
  const toolbar = createTag('div', {
    class: 'color-extract-toolbar',
    role: 'toolbar',
    'aria-label': 'Color extraction tools',
  });

  const leftGroup = createTag('div', { class: 'color-extract-toolbar-left' });
  const rightGroup = createTag('div', { class: 'color-extract-toolbar-right' });

  if (options.moodElement) {
    leftGroup.append(options.moodElement);
  }

  const actionsGroup = createTag('div', { class: 'color-extract-toolbar-actions' });

  const addColorBtn = createIconButton(ICON_EYEDROPPER, 'Add color', options.onAddColor);
  const resetBtn = createIconButton(ICON_REVERT, 'Reset colors', options.onReset);
  const replaceBtn = createIconButton(ICON_REPLACE, 'Replace image', options.onReplace);
  actionsGroup.append(addColorBtn, resetBtn, replaceBtn);

  leftGroup.append(actionsGroup);

  const undoBtn = createIconButton(ICON_UNDO, 'Undo', options.onUndo);
  const redoBtn = createIconButton(ICON_REDO, 'Redo', options.onRedo);
  undoBtn.disabled = true;
  redoBtn.disabled = true;
  rightGroup.append(undoBtn, redoBtn);

  toolbar.append(leftGroup, rightGroup);

  return {
    element: toolbar,
    setUndoEnabled(enabled) {
      undoBtn.disabled = !enabled;
    },
    setRedoEnabled(enabled) {
      redoBtn.disabled = !enabled;
    },
  };
}
