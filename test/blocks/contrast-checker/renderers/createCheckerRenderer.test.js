import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { createCheckerRenderer } from '../../../../express/code/blocks/contrast-checker/renderers/createCheckerRenderer.js';
import createContrastDataService from '../../../../express/code/blocks/contrast-checker/services/createContrastDataService.js';
import createHistoryService from '../../../../express/code/blocks/contrast-checker/services/createHistoryService.js';
import createRecommendationService from '../../../../express/code/blocks/contrast-checker/services/createRecommendationService.js';

function createFakeActionMenu(target, { id }) {
  const element = document.createElement('div');
  const undoBtn = document.createElement('button');
  const redoBtn = document.createElement('button');
  undoBtn.className = 'undo-btn';
  redoBtn.className = 'redo-btn';
  undoBtn.setAttribute('aria-disabled', 'true');
  redoBtn.setAttribute('aria-disabled', 'true');
  element.append(undoBtn, redoBtn);

  function handleHistoryIndexChanged(event) {
    const { historyIndex, historyLength } = event.detail;
    undoBtn.setAttribute('aria-disabled', historyIndex === 0 ? 'true' : 'false');
    redoBtn.setAttribute('aria-disabled', historyIndex === historyLength - 1 ? 'true' : 'false');
  }

  document.addEventListener(`${id}:history-index-changed`, handleHistoryIndexChanged);
  target.appendChild(element);

  return {
    element,
    destroy() {
      document.removeEventListener(`${id}:history-index-changed`, handleHistoryIndexChanged);
      element.remove();
    },
  };
}

describe('createCheckerRenderer', () => {
  let renderer;

  beforeEach(() => {
    sinon.stub(window, 'matchMedia').callsFake((query) => ({
      matches: query === '(max-width: 599px)',
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }));
    sinon.stub(window, 'fetch').resolves({
      ok: true,
      text: async () => '<svg></svg>',
    });
  });

  afterEach(() => {
    renderer?.destroy();
    renderer = null;
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('syncs the mobile undo and redo controls when history already exists before render', async () => {
    const history = createHistoryService();
    history.push({ fg: '#111111', bg: '#FFFFFF' });
    history.push({ fg: '#222222', bg: '#FFFFFF' });

    const container = document.createElement('div');
    document.body.appendChild(container);

    let mobileActionMenu = null;
    renderer = createCheckerRenderer({
      container,
      dataService: createContrastDataService(),
      config: {
        initialForeground: '#222222',
        initialBackground: '#FFFFFF',
      },
      services: {
        history,
        recommendation: createRecommendationService(),
      },
      actionMenu: async (target, options) => {
        mobileActionMenu = createFakeActionMenu(target, options);
        return mobileActionMenu;
      },
    });

    await renderer.render();

    const undoBtn = mobileActionMenu.element.querySelector('.undo-btn');
    const redoBtn = mobileActionMenu.element.querySelector('.redo-btn');

    expect(undoBtn.getAttribute('aria-disabled')).to.equal('false');
    expect(redoBtn.getAttribute('aria-disabled')).to.equal('true');
  });
});
