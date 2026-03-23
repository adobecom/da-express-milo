import { updateClearButtonVisibility } from './dom.js';

export function initSearchHandlers(elements, state, callbacks, actions) {
  const { container, input, clearBtn, form } = elements;
  const { hideSuggestions } = actions;
  const cleanupFns = [];

  clearBtn.style.display = 'none';

  const keyupHandler = () => {
    updateClearButtonVisibility(clearBtn, Boolean(input.value));
  };
  input.addEventListener('keyup', keyupHandler, { passive: true });
  cleanupFns.push(() => input.removeEventListener('keyup', keyupHandler));

  const inputHandler = (e) => {
    state.query = e.target.value;
    callbacks.onInput?.({ value: state.query, event: e });
  };
  input.addEventListener('input', inputHandler);
  cleanupFns.push(() => input.removeEventListener('input', inputHandler));

  const keydownHandler = (e) => {
    if ((e.key === 'Enter' || e.keyCode === 13) && !state.showSuggestions) {
      e.preventDefault();
      if (state.query.trim()) {
        callbacks.onSubmit?.({ query: state.query.trim() });
        hideSuggestions();
      }
    }
  };
  input.addEventListener('keydown', keydownHandler);
  cleanupFns.push(() => input.removeEventListener('keydown', keydownHandler));

  const outsideClickHandler = (e) => {
    if (!container.contains(e.target)) {
      hideSuggestions();
    }
  };
  document.addEventListener('click', outsideClickHandler, { passive: true });
  cleanupFns.push(() => document.removeEventListener('click', outsideClickHandler));

  const clearHandler = () => {
    state.query = '';
    input.value = '';
    updateClearButtonVisibility(clearBtn, false);
    hideSuggestions();
    input.focus();
    callbacks.onClear?.();
  };
  clearBtn.addEventListener('click', clearHandler, { passive: true });
  cleanupFns.push(() => clearBtn.removeEventListener('click', clearHandler));

  const submitHandler = (e) => {
    e.preventDefault();
    if (state.query.trim()) {
      callbacks.onSubmit?.({ query: state.query.trim() });
      hideSuggestions();
    }
  };
  form.addEventListener('submit', submitHandler);
  cleanupFns.push(() => form.removeEventListener('submit', submitHandler));

  return () => cleanupFns.forEach((fn) => fn());
}

export default initSearchHandlers;
