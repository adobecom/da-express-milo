import { expect } from '@esm-bundle/chai';
import syncActionMenuHistoryState, {
  getActionMenuHistoryDetail,
} from '../../../../express/code/blocks/color-contrast-checker/utils/syncActionMenuHistoryState.js';
import createTestHistoryService from '../helpers/createTestHistoryService.js';

describe('syncActionMenuHistoryState', () => {
  let history;

  beforeEach(() => {
    history = createTestHistoryService();
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

    document.addEventListener('color-contrast-checker-menu:history-index-changed', handleTopbar);
    document.addEventListener('color-contrast-checker-controls-only:history-index-changed', handleMobile);

    syncActionMenuHistoryState(['color-contrast-checker-menu', 'color-contrast-checker-controls-only'], history);

    document.removeEventListener('color-contrast-checker-menu:history-index-changed', handleTopbar);
    document.removeEventListener('color-contrast-checker-controls-only:history-index-changed', handleMobile);

    expect(received).to.deep.equal([
      ['topbar', { historyIndex: 1, historyLength: 2 }],
      ['mobile', { historyIndex: 1, historyLength: 2 }],
    ]);
  });
});
