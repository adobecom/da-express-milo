import { createTag } from '../../utils.js';
import BlockMediator from '../../block-mediator.min.js';

export function createBaseRenderer(options) {
  const { data = [], config = {}, stateKey = 'color-explore' } = options;

  let currentData = data;
  const eventListeners = {};

  function on(event, callback) {
    if (!eventListeners[event]) {
      eventListeners[event] = [];
    }
    eventListeners[event].push(callback);
  }

  function emit(event, detail) {
    if (eventListeners[event]) {
      eventListeners[event].forEach(callback => callback(detail));
    }

    const customEvent = new CustomEvent(`color-explorer:${event}`, {
      detail,
      bubbles: true,
      composed: true,
    });
    document.dispatchEvent(customEvent);
  }

  function getData() {
    return currentData;
  }

  function setData(newData) {
    currentData = newData;
    
    const state = BlockMediator.get(stateKey);
    BlockMediator.set(stateKey, {
      ...state,
      data: newData,
    });
  }

  function getState() {
    return BlockMediator.get(stateKey);
  }

  function updateState(updates) {
    const state = getState();
    BlockMediator.set(stateKey, {
      ...state,
      ...updates,
    });
  }

  function createGrid() {
    const grid = createTag('div', { class: 'color-grid' });
    return grid;
  }

  function createCard(item) {
    const card = createTag('div', { class: 'color-card' });
    card.textContent = `Card: ${item.name || item.id}`;
    return card;
  }

  function createLoader() {
    const loader = createTag('div', { class: 'color-explorer-loading' });
    loader.innerHTML = '<div class="spinner"></div><p>Loading colors...</p>';
    return loader;
  }

  function createError(message = 'Failed to load colors') {
    const error = createTag('div', { class: 'color-explorer-error' });
    error.innerHTML = `<p>${message}</p>`;
    return error;
  }

  return {
    on,
    emit,
    getData,
    setData,
    getState,
    updateState,
    createGrid,
    createCard,
    createLoader,
    createError,
    config,
    stateKey,
  };
}
