import { createTag } from '../../../scripts/utils.js';
import BlockMediator from '../../../scripts/block-mediator.min.js';

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
    try {
      if (eventListeners[event]) {
        eventListeners[event].forEach((callback) => {
          try {
            callback(detail);
          } catch (callbackError) {
            if (window.lana) {
              window.lana.log(`BaseRenderer event callback error: ${callbackError.message}`, {
                tags: 'color-explore,base-renderer',
              });
            }
          }
        });
      }

      const customEvent = new CustomEvent(`color-explore:${event}`, {
        detail,
        bubbles: true,
        composed: true,
      });
      document.dispatchEvent(customEvent);
    } catch (error) {
      if (window.lana) {
        window.lana.log(`BaseRenderer emit error: ${error.message}`, {
          tags: 'color-explore,base-renderer',
        });
      }
    }
  }

  function getData() {
    return currentData;
  }

  function setData(newData) {
    try {
      if (!Array.isArray(newData)) {
        throw new Error('setData expects an array');
      }
      currentData = newData;

      const state = BlockMediator.get(stateKey);
      BlockMediator.set(stateKey, {
        ...state,
        data: newData,
      });
    } catch (error) {
      if (window.lana) {
        window.lana.log(`BaseRenderer setData error: ${error.message}`, {
          tags: 'color-explore,base-renderer',
        });
      }
    }
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
    const loader = createTag('div', { class: 'color-explore-loading' });
    loader.innerHTML = '<div class="spinner"></div><p>Loading colors...</p>';
    return loader;
  }

  function createError(message = 'Failed to load colors') {
    const error = createTag('div', { class: 'color-explore-error' });
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
