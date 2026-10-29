// Shared with da-dc: keep this block free of host-specific code so it can be copied verbatim.
// Both repos export setLibs from scripts/utils.js.
import { setLibs } from '../../scripts/utils.js';

export const SELECT_EVENT = 'resume-upload-fork:select';
export const ACTIONS = { continue: 'continue-fork', cancel: 'cancel-fork' };
// Choice values follow authoring order: card 1 is "sharpen", card 2 is "refine".
export const CHOICES = ['sharpen', 'refine'];

const MODAL_CLASS = 'resume-upload-fork-modal';
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

// Ported from express/code/scripts/color-shared/utils/utilities.js (addSwipeToClose),
// which is Express-only.
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

function decorateModal(dialog, closeModal) {
  dialog.classList.add(MODAL_CLASS);
  dialog.closeCallback = async () => {
    if (matches(REDUCED_MOTION_QUERY)) return;
    dialog.classList.add('is-closing');
    const curtain = dialog.nextElementSibling;
    if (curtain?.classList.contains('modal-curtain')) curtain.classList.add('is-closing');
    await waitForAnimationEnd(dialog, EXIT_ANIMATION_MS);
  };
  const scroller = dialog.querySelector(':scope > .fragment') || dialog;
  addSwipeToClose(dialog, scroller, () => closeModal(dialog));
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
  const title = content.querySelector('h1, h2, h3, h4, h5, h6');
  const description = content.querySelector('p');

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

// Authored links only carry an action hash; render them as buttons so they never navigate.
function buildActions(row, createTag) {
  const actions = createTag('div', { class: 'resume-upload-fork-actions' });
  row.querySelectorAll('a').forEach((link) => {
    const action = getAction(link.getAttribute('href'));
    if (!action) return;
    const button = createTag('button', { type: 'button', class: link.className, 'data-action': action });
    button.classList.add('con-button');
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
  const heading = header.querySelector('h1, h2, h3, h4, h5, h6');
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

  const dialog = el.closest('.dialog-modal');
  if (dialog) decorateModal(dialog, closeModal);

  actions.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    const { action } = button.dataset;
    const detail = action === ACTIONS.continue
      ? { action, choice: getSelected()?.dataset.choice }
      : { action };
    // TODO: fork click analytics (MWPW-211614; requirements pending).
    el.dispatchEvent(new CustomEvent(SELECT_EVENT, { bubbles: true, composed: true, detail }));
    const openDialog = el.closest('.dialog-modal');
    if (openDialog) closeModal(openDialog);
  });
}
