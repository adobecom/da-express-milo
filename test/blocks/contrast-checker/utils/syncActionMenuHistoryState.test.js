import { expect } from '@esm-bundle/chai';
import createHistoryService from '../../../../express/code/blocks/contrast-checker/services/createHistoryService.js';
import { DEFAULT_ACTION_MENU_CONFIG } from '../../../../express/code/blocks/contrast-checker/utils/contrastConstants.js';
import syncActionMenuHistoryState, {
  getActionMenuHistoryDetail,
} from '../../../../express/code/blocks/contrast-checker/utils/syncActionMenuHistoryState.js';

describe('syncActionMenuHistoryState', () => {
  let history;

  beforeEach(() => {
    history = createHistoryService();
  });

  it('disables separate action menu state for the contrast checker', () => {
    expect(DEFAULT_ACTION_MENU_CONFIG.enableState).to.equal(false);
  });

  it('returns empty history details before any state is pushed', () => {
    expect(getActionMenuHistoryDetail(history)).to.deep.equal({
      historyIndex: 0,
      historyLength: 0,
    });
  });

  it('returns the correct index and length after push, undo, and redo', () => {
    history.push({ fg: '#111111', bg: '#ffffff' });
    history.push({ fg: '#222222', bg: '#ffffff' });

    expect(getActionMenuHistoryDetail(history)).to.deep.equal({
      historyIndex: 1,
      historyLength: 2,
    });

    history.undo();
    expect(getActionMenuHistoryDetail(history)).to.deep.equal({
      historyIndex: 0,
      historyLength: 2,
    });

    history.redo();
    expect(getActionMenuHistoryDetail(history)).to.deep.equal({
      historyIndex: 1,
      historyLength: 2,
    });
  });

  it('dispatches history-index-changed events for each menu id', () => {
    history.push({ fg: '#111111', bg: '#ffffff' });
    history.push({ fg: '#222222', bg: '#ffffff' });

    const received = [];
    const handleTopbar = (event) => received.push(['topbar', event.detail]);
    const handleMobile = (event) => received.push(['mobile', event.detail]);

    document.addEventListener('contrast-checker-menu:history-index-changed', handleTopbar);
    document.addEventListener('contrast-checker-controls-only:history-index-changed', handleMobile);

    syncActionMenuHistoryState(['contrast-checker-menu', 'contrast-checker-controls-only'], history);

    document.removeEventListener('contrast-checker-menu:history-index-changed', handleTopbar);
    document.removeEventListener('contrast-checker-controls-only:history-index-changed', handleMobile);

    expect(received).to.deep.equal([
      ['topbar', { historyIndex: 1, historyLength: 2 }],
      ['mobile', { historyIndex: 1, historyLength: 2 }],
    ]);
  });
});
