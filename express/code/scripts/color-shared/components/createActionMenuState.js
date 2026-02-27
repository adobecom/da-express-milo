import BlockMediator from '../../block-mediator.min.js';
import { announceToScreenReader } from '../spectrum/utils/a11y.js';

export function createActionMenuState(stateKey = 'action-menu') {
  const eventNamespace = stateKey;

  function emit(event, detail) {
    const customEvent = new CustomEvent(`${eventNamespace}:${event}`, {
      detail,
      bubbles: true,
      composed: true,
    });
    document.dispatchEvent(customEvent);
  }

  function getState() {
    return BlockMediator.get(stateKey);
  }

  function getHistory() {
    return getState()?.history || [];
  }

  function getHistoryIndex() {
    return getState()?.historyIndex || 0;
  }

  function setHistory(history) {
    BlockMediator.set(stateKey, {
      ...getState(),
      history,
    });
  }

  function setHistoryIndex(index) {
    BlockMediator.set(stateKey, {
      ...getState(),
      historyIndex: index,
    });

    const history = getHistory();
    emit('history-index-changed', {
      historyIndex: index,
      historyLength: history.length,
    });
  }

  function getHistoryAtIndex(index) {
    const history = getHistory();
    return history[index];
  }

  function addOnePaletteToHistory(palette) {
    const history = getHistory();
    const index = getHistoryIndex();
    const newHistory = [...history.slice(0, index + 1), palette];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }

  function getCurrentPalette() {
    const index = getHistoryIndex();
    return getHistoryAtIndex(index);
  }

  function onUndo() {
    const index = getHistoryIndex();
    if (index === 0) return;
    setHistoryIndex(index - 1);
  }

  function onRedo() {
    const index = getHistoryIndex();
    if (index === getHistory().length - 1) return;
    setHistoryIndex(index + 1);
  }

  function generateRandomHexCodes(num = 10) {
    const hexCodes = Array.from({ length: num }, () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`);
    return hexCodes;
  }

  function onGenerateRandom() {
    const paletteLength = getCurrentPalette()?.length || 5;
    const hexCodes = generateRandomHexCodes(paletteLength);
    addOnePaletteToHistory(hexCodes);
    announceToScreenReader('New random palette generated');
    return hexCodes;
  }

  function init() {
    setHistory([]);
    setHistoryIndex(0);
  }

  function reset() {
    setHistory([]);
    setHistoryIndex(0);
  }

  return {
    init,
    reset,
    onUndo,
    onRedo,
    onGenerateRandom,
  };
}

export default createActionMenuState;
