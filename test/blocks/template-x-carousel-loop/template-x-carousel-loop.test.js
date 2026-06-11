import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { mockRes } from '../test-utilities.js';

const imports = await Promise.all([import('../../../express/code/scripts/utils.js'), import('../../../express/code/scripts/scripts.js')]);
const { getLibs } = imports[0];
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({});
});
const [{ default: decorate }] = await Promise.all([import('../../../express/code/blocks/template-x-carousel-loop/template-x-carousel-loop.js')]);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });
// Reuse the carousel-toolbar fixture — same search API shape.
const mockAPIResponse = JSON.parse(await readFile({ path: '../template-x-carousel-toolbar/mocks/template-utils.json' }));

describe('template-x-carousel-loop', () => {
  let block;
  let oldFetch;
  before(async () => {
    oldFetch = window.fetch;
    sinon.stub(window, 'fetch').callsFake(async (url) => {
      if (url.includes('/express-search-api')) return mockRes({ payload: mockAPIResponse });
      return {};
    });
    block = document.querySelector('.template-x-carousel-loop');
    await decorate(block);
  });
  after(() => {
    window.fetch = oldFetch;
  });

  it('renders the heading and toolbar', () => {
    expect(block.querySelector('.heading')).to.exist;
    expect(block.querySelector('.toolbar')).to.exist;
    expect(block.querySelector('.toolbar .controls-container')).to.exist;
  });

  it('builds the loop gallery structure', () => {
    const container = block.querySelector('.templates-container');
    expect(container).to.exist;
    expect(container.classList.contains('gallery-loop')).to.be.true;
    const viewport = container.querySelector('.gallery-loop-viewport');
    expect(viewport).to.exist;
    expect(viewport.getAttribute('aria-roledescription')).to.equal('carousel');
    const track = viewport.querySelector('.gallery-loop-track');
    expect(track).to.exist;
    expect(track.querySelectorAll('.gallery-loop-item').length).to.be.greaterThan(0);
  });

  it('renders localized prev/next controls', () => {
    const control = block.querySelector('.gallery-control');
    expect(control).to.exist;
    const prev = control.querySelector('button.prev');
    const next = control.querySelector('button.next');
    expect(prev).to.exist;
    expect(next).to.exist;
    expect(prev.getAttribute('aria-label')).to.be.a('string').and.not.empty;
    expect(next.getAttribute('aria-label')).to.be.a('string').and.not.empty;
  });
});
