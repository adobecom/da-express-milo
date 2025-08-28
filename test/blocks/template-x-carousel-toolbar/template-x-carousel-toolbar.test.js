import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { mockRes } from '../test-utilities.js';

const imports = await Promise.all([import('../../../express/code/scripts/utils.js'), import('../../../express/code/scripts/scripts.js')]);
const { getLibs } = imports[0];
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  const conf = {};
  mod.setConfig(conf);
});
const [{ default: decorate }] = await Promise.all([import('../../../express/code/blocks/template-x-carousel-toolbar/template-x-carousel-toolbar.js')]);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });
const mockAPIResposne = JSON.parse(await readFile({ path: './mocks/template-utils.json' }));

describe('template-x-carousel-toolbar', () => {
  let block;
  let oldFetch;
  before(async () => {
    oldFetch = window.fetch;
    sinon.stub(window, 'fetch').callsFake(async (url) => {
      if (url.includes('/express-search-api')) return mockRes({ payload: mockAPIResposne });
      return {};
    });
    block = document.querySelector('.template-x-carousel-toolbar');
    await decorate(block);
  });
  after(() => {
    window.fetch = oldFetch;
  });
  it('has correct block structures', async () => {
    expect(block.querySelector('.heading')).to.exist;
    expect(block.querySelector('.toolbar')).to.exist;
    expect(block.querySelector('.toolbar .controls-container')).to.exist;
    expect(block.querySelector('.templates-container.gallery')).to.exist;
    const templates = [...block.querySelectorAll('.template')];
    expect(templates.length).to.equal(10);
    expect(block.querySelector('.from-scratch-container')).to.exist;
  });

  it('handles dropdown clicks', async () => {
    const controlsContainer = block.querySelector('.toolbar .controls-container');
    const select = controlsContainer.querySelector('.select');
    expect(select.getAttribute('aria-expanded')).to.equal('false');
    select.click();
    expect(select.getAttribute('aria-expanded')).to.equal('true');
    const options = select.querySelectorAll('.options:not(.sizing-proxy) .option');
    expect(options.length).to.equal(2);
    expect(options[0].getAttribute('aria-selected') === 'true').to.be.false;
    expect(options[1].getAttribute('aria-selected') === 'true').to.be.true;
    options[0].click();
    expect(options[0].getAttribute('aria-selected') === 'true').to.be.true;
    expect(options[1].getAttribute('aria-selected') === 'true').to.be.false;
    block.click();
    expect(select.getAttribute('aria-expanded')).to.equal('false');
  });

  it('handles dropdown keyboard events', async () => {
    const controlsContainer = block.querySelector('.toolbar .controls-container');
    const select = controlsContainer.querySelector('.select');
    expect(select.getAttribute('aria-expanded')).to.equal('false');
    select.focus();
    select.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(select.getAttribute('aria-expanded')).to.equal('true');
    const options = select.querySelectorAll('.options:not(.sizing-proxy) .option');
    options[0].click();
    select.click();
    expect(options[0].classList.contains('hovered')).to.be.true;
    expect(options[1].classList.contains('hovered')).to.be.false;
    select.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(options[0].classList.contains('hovered')).to.be.false;
    expect(options[1].classList.contains('hovered')).to.be.true;
    select.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(options[0].classList.contains('hovered')).to.be.true;
    expect(options[1].classList.contains('hovered')).to.be.false;
    select.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(select.getAttribute('aria-expanded')).to.equal('false');
  });
});
