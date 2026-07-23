function getFocusables(card) {
  return [...card.querySelectorAll('.font-card-copy-btn, .font-card-cta')];
}

/**
 * Wires the "enter cell" keyboard model for a single card. The grid (see
 * fontCardGrid.js) owns roving tabindex across cards — this only handles
 * what happens once a card has focus:
 *  - Enter on the cell wrapper moves focus into its first interactive child.
 *  - Tab past the last child (or Shift+Tab before the first) exits back to
 *    the wrapper instead of leaving the grid.
 *  - Escape exits back to the wrapper from anywhere inside.
 * A focusin listener keeps each child's tabindex in sync with whichever
 * element actually has focus, so this also self-corrects if focus lands on
 * a child directly (e.g. a mouse click) rather than via Enter.
 *
 * @param {HTMLElement} card
 */
export default function initCellKeyboardNav(card) {
  card.addEventListener('focusin', (event) => {
    const focusables = getFocusables(card);
    if (event.target === card) {
      // Claim the tab stop explicitly — the grid's own focusin listener
      // only demotes whichever card *lost* focus, it doesn't promote this
      // one, so this card must assert it here.
      card.tabIndex = 0;
      focusables.forEach((el) => { el.tabIndex = -1; });
    } else if (focusables.includes(event.target)) {
      card.tabIndex = -1;
      focusables.forEach((el) => { el.tabIndex = 0; });
    }
  });

  // Below, tabindex bookkeeping is done synchronously before each .focus()
  // call — not left to the focusin listener above — since these are all
  // moves *this module* initiates. (The listener above stays as the only
  // path for a focus change it didn't initiate, e.g. a direct click.)
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target === card) {
      const focusables = getFocusables(card);
      if (!focusables.length) return;
      event.preventDefault();
      card.tabIndex = -1;
      focusables.forEach((el) => { el.tabIndex = 0; });
      focusables[0].focus();
      return;
    }

    if (event.key === 'Escape' && getFocusables(card).includes(event.target)) {
      event.preventDefault();
      getFocusables(card).forEach((el) => { el.tabIndex = -1; });
      card.tabIndex = 0;
      card.focus();
      return;
    }

    if (event.key === 'Tab') {
      const focusables = getFocusables(card);
      const index = focusables.indexOf(event.target);
      if (index === -1) return;
      const exiting = (!event.shiftKey && index === focusables.length - 1)
        || (event.shiftKey && index === 0);
      if (exiting) {
        event.preventDefault();
        focusables.forEach((el) => { el.tabIndex = -1; });
        card.tabIndex = 0;
        card.focus();
      }
    }
  });
}
