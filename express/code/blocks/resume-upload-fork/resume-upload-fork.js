// Shared verbatim with da-dc: no host-specific code.
import { setLibs } from '../../scripts/utils.js';

export const SELECT_EVENT = 'resume-upload-fork:select';
export const ACTIONS = { continue: 'continue-fork', cancel: 'cancel-fork' };
export const CHOICES = ['sharpen', 'refresh'];
export const DISMISS = {
  cancel: 'cancel',
  close: 'close',
  escape: 'escape',
  outside: 'outside',
  swipe: 'swipe',
  other: 'other',
};

const MODAL_CLASS = 'resume-upload-fork-modal';
const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6';
const MOBILE_QUERY = '(width < 600px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const SWIPE_CLOSE_THRESHOLD_PX = 120;
const SWIPE_MAX_DRAG_PX = 400;
const EXIT_ANIMATION_MS = 300;

let idCounter = 0;
const uniqueId = (prefix) => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};

const matches = (query) => window.matchMedia(query).matches;

export function getAction(href = '') {
  if (href.includes(`#_${ACTIONS.continue}`)) return ACTIONS.continue;
  if (href.includes(`#_${ACTIONS.cancel}`)) return ACTIONS.cancel;
  return null;
}

function waitForAnimationEnd(target, timeoutMs) {
  return new Promise((resolve) => {
    let timer;
    const onEnd = (e) => {
      if (e && e.target !== target) return;
      clearTimeout(timer);
      target.removeEventListener('animationend', onEnd);
      resolve();
    };
    timer = setTimeout(onEnd, timeoutMs);
    target.addEventListener('animationend', onEnd);
  });
}

function addSwipeToClose(dialog, scroller, onClose) {
  let startY = 0;
  let dragY = 0;

  dialog.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    dragY = 0;
  }, { passive: true });

  dialog.addEventListener('touchmove', (e) => {
    if (!matches(MOBILE_QUERY) || scroller.scrollTop > 2) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY <= 0) return;
    dragY = Math.min(deltaY, SWIPE_MAX_DRAG_PX);
    dialog.classList.add('is-dragging');
    dialog.style.setProperty('--drawer-drag-y', `${dragY}px`);
  }, { passive: true });

  const onEnd = () => {
    if (!matches(MOBILE_QUERY)) return;
    dialog.classList.remove('is-dragging');
    if (dragY > SWIPE_CLOSE_THRESHOLD_PX) onClose();
    else dialog.style.removeProperty('--drawer-drag-y');
    dragY = 0;
  };
  dialog.addEventListener('touchend', onEnd, { passive: true });
  dialog.addEventListener('touchcancel', onEnd, { passive: true });
}

// Milo focuses the first focusable before dispatching milo:modal:loaded; refocus the container.
function focusContainerOnOpen(dialog, getFirstFocusable) {
  dialog.tabIndex = -1;
  const onLoaded = (e) => {
    if (e.detail?.id !== dialog.id) return;
    window.removeEventListener('milo:modal:loaded', onLoaded);
    dialog.focus({ preventScroll: true });
  };
  window.addEventListener('milo:modal:loaded', onLoaded);

  dialog.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || e.target !== dialog) return;
    const next = e.shiftKey ? dialog.querySelector('.dialog-close') : getFirstFocusable();
    if (!next) return;
    e.preventDefault();
    next.focus();
  });
}

// Each listener runs before Milo's handler, which closes the modal synchronously.
function trackDismissMethod(dialog) {
  let method;
  const set = (value) => { method ||= value; };
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') set(DISMISS.escape);
  });
  dialog.addEventListener('click', (e) => {
    if (e.target.closest('.dialog-close')) set(DISMISS.close);
  }, true);
  const onLoaded = (e) => {
    if (e.detail?.id !== dialog.id) return;
    window.removeEventListener('milo:modal:loaded', onLoaded);
    const curtain = dialog.nextElementSibling;
    if (!curtain?.classList.contains('modal-curtain')) return;
    curtain.addEventListener('click', (ev) => {
      if (ev.target === curtain) set(DISMISS.outside);
    }, true);
  };
  window.addEventListener('milo:modal:loaded', onLoaded);
  return { set, get: () => method || DISMISS.other };
}

function decorateModal(dialog, closeModal, { getFirstFocusable, onDismiss }) {
  dialog.classList.add(MODAL_CLASS);
  focusContainerOnOpen(dialog, getFirstFocusable);
  const dismissal = trackDismissMethod(dialog);
  dialog.closeCallback = async () => {
    onDismiss(dismissal.get());
    if (matches(REDUCED_MOTION_QUERY)) return;
    dialog.classList.add('is-closing');
    const curtain = dialog.nextElementSibling;
    if (curtain?.classList.contains('modal-curtain')) curtain.classList.add('is-closing');
    await waitForAnimationEnd(dialog, EXIT_ANIMATION_MS);
  };
  const scroller = dialog.querySelector(':scope > .fragment') || dialog;
  addSwipeToClose(dialog, scroller, () => {
    dismissal.set(DISMISS.swipe);
    const close = dialog.querySelector('.dialog-close');
    if (!close) return closeModal(dialog);
    // Mirrors Milo's Escape handling so click tracking records the exit method.
    close.setAttribute('daa-ll', (close.getAttribute('daa-ll') || '').replace(/[^:]*$/, 'swipeClose'));
    return close.click();
  });
}

function buildCard(row, index, createTag) {
  const cells = [...row.children];
  const contentCell = cells.pop();
  const [desktopPic, mobilePic] = cells.flatMap((cell) => [...cell.querySelectorAll('picture')]);

  const media = createTag('div', { class: 'resume-upload-fork-card-media' });
  if (desktopPic) {
    desktopPic.classList.add('resume-upload-fork-image-desktop');
    media.append(desktopPic);
  }
  if (mobilePic) {
    mobilePic.classList.add('resume-upload-fork-image-mobile');
    media.append(mobilePic);
    media.classList.add('has-mobile-image');
  }

  const content = createTag('div', { class: 'resume-upload-fork-card-content' });
  content.append(...contentCell.childNodes);
  const elements = [...content.children];
  const title = content.querySelector(HEADING_SELECTOR) || elements[0];
  const description = elements.find((elem) => elem !== title && elem.tagName === 'P');

  const card = createTag('div', {
    class: 'resume-upload-fork-card',
    role: 'radio',
    'aria-checked': 'false',
    tabindex: '-1',
    'data-choice': CHOICES[index] || `option-${index + 1}`,
  });
  if (title) {
    title.id ||= uniqueId('resume-upload-fork-title');
    title.classList.add('resume-upload-fork-card-title');
    card.setAttribute('aria-labelledby', title.id);
  }
  if (description) {
    description.id ||= uniqueId('resume-upload-fork-desc');
    description.classList.add('resume-upload-fork-card-description');
    card.setAttribute('aria-describedby', description.id);
  }
  card.append(media, content);
  return card;
}

function initRadioGroup(group, cards) {
  const select = (card, focus = false) => {
    cards.forEach((c) => {
      const isSelected = c === card;
      c.setAttribute('aria-checked', String(isSelected));
      c.classList.toggle('is-selected', isSelected);
      c.tabIndex = isSelected ? 0 : -1;
    });
    if (focus) card.focus();
  };

  cards.forEach((card) => card.addEventListener('click', () => select(card)));

  group.addEventListener('keydown', (e) => {
    const current = cards.indexOf(e.target);
    if (current === -1) return;
    const isRtl = getComputedStyle(group).direction === 'rtl';
    const forward = isRtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = isRtl ? 'ArrowRight' : 'ArrowLeft';
    let next;
    if (e.key === forward || e.key === 'ArrowDown') next = (current + 1) % cards.length;
    else if (e.key === backward || e.key === 'ArrowUp') next = (current - 1 + cards.length) % cards.length;
    else if (e.key === ' ') next = current;
    else return;
    e.preventDefault();
    select(cards[next], true);
  });

  select(cards[0]);
  return () => cards.find((c) => c.getAttribute('aria-checked') === 'true');
}

// decorateButtons() is only used to parse #_button-fill; the block owns button styling.
function buildActions(row, createTag) {
  const actions = createTag('div', { class: 'resume-upload-fork-actions' });
  row.querySelectorAll('a').forEach((link) => {
    const action = getAction(link.getAttribute('href'));
    if (!action) return;
    const button = createTag('button', {
      type: 'button',
      class: 'resume-upload-fork-button',
      'data-action': action,
    });
    if (link.classList.contains('fill')) button.classList.add('resume-upload-fork-button-fill');
    button.append(...link.childNodes);
    actions.append(button);
  });
  return actions;
}

export default async function decorate(el) {
  const miloLibs = setLibs('/libs');
  const [{ createTag }, { decorateButtons }, { closeModal }] = await Promise.all([
    import(`${miloLibs}/utils/utils.js`),
    import(`${miloLibs}/utils/decorate.js`),
    import(`${miloLibs}/blocks/modal/modal.js`),
  ]);

  const rows = [...el.children];
  const actionRow = rows.find((row) => [...row.querySelectorAll('a')]
    .some((a) => getAction(a.getAttribute('href'))));
  const cardRows = rows.filter((row) => row !== actionRow && row.querySelector('picture'));
  const headerRow = rows.find((row) => row !== actionRow && !cardRows.includes(row));

  const header = createTag('div', { class: 'resume-upload-fork-header' });
  const headerCell = headerRow?.querySelector(':scope > div');
  if (headerCell) header.append(...headerCell.childNodes);
  const heading = header.querySelector(HEADING_SELECTOR);
  if (heading) heading.id ||= uniqueId('resume-upload-fork-heading');

  const group = createTag('div', { class: 'resume-upload-fork-cards', role: 'radiogroup' });
  if (heading) group.setAttribute('aria-labelledby', heading.id);
  const cards = cardRows.map((row, i) => buildCard(row, i, createTag));
  group.append(...cards);
  const getSelected = cards.length ? initRadioGroup(group, cards) : () => null;

  if (actionRow) decorateButtons(actionRow);
  const actions = actionRow
    ? buildActions(actionRow, createTag)
    : createTag('div', { class: 'resume-upload-fork-actions' });

  const body = createTag('div', { class: 'resume-upload-fork-body' }, [header, group]);
  el.replaceChildren(body, actions);

  const dispatch = (detail) => {
    el.dispatchEvent(new CustomEvent(SELECT_EVENT, { bubbles: true, composed: true, detail }));
  };
  let chosen = false;

  const dialog = el.closest('.dialog-modal');
  if (dialog) {
    decorateModal(dialog, closeModal, {
      getFirstFocusable: () => getSelected() || actions.querySelector('button'),
      onDismiss: (dismiss) => {
        if (!chosen) dispatch({ action: ACTIONS.cancel, dismiss });
      },
    });
  }

  actions.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    const { action } = button.dataset;
    chosen = true;
    dispatch(action === ACTIONS.continue
      ? { action, choice: getSelected()?.dataset.choice }
      : { action, dismiss: DISMISS.cancel });
    const openDialog = el.closest('.dialog-modal');
    if (openDialog) closeModal(openDialog);
  });
}
