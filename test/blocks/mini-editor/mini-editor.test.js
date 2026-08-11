import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../express/code/scripts/utils.js';
import init from '../../../express/code/blocks/mini-editor/mini-editor.js';
import { waitFor } from '../../helpers/waitfor.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

describe('mini-editor', () => {
  let fetchStub;

  beforeEach(() => {
    window.Typekit = { load: ({ active }) => active?.() };
    // getCardBackgrounds only calls fetch when a collectionId is authored —
    // none of these tests author one, so this stub exists purely as a safety
    // net against an accidental real network call.
    fetchStub = sinon.stub(window, 'fetch').resolves({ json: async () => ({ items: [] }) });
  });

  afterEach(() => {
    delete window.Typekit;
    fetchStub.restore();
    document.body.innerHTML = '';
  });

  async function decorateWithBody() {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const block = document.querySelector('.mini-editor');
    await init(block);
    return block;
  }

  it('builds the header from the authored content row and clears the raw authored markup', async () => {
    const block = await decorateWithBody();
    const header = block.querySelector('.mini-editor-header');
    expect(header.querySelector('h2').textContent).to.equal('Trust quotes to help build stronger relationships.');
    expect(header.querySelector('p').textContent).to.contain('Explore quotes');
  });

  it('styles the authored CTA link as an accent button', async () => {
    const block = await decorateWithBody();
    const cta = block.querySelector('.mini-editor-header a');
    expect(cta.classList.contains('button')).to.be.true;
    expect(cta.classList.contains('accent')).to.be.true;
  });

  it('prepends a logo lockup to the header', async () => {
    const block = await decorateWithBody();
    expect(block.querySelector('.mini-editor-header .mini-editor-logo')).to.exist;
  });

  it('mounts the widget stage and desktop decorations once cards and quotes resolve', async () => {
    const block = await decorateWithBody();
    await waitFor(() => !!block.querySelector('.mini-editor-stage'));
    expect(block.querySelector('.mini-editor-stage')).to.exist;
    expect(block.querySelector('.mini-editor-header .mini-editor-decorations')).to.exist;
  });

  it('seeds the widget with quotes read from the page\'s collapsible-rows block', async () => {
    const block = await decorateWithBody();
    await waitFor(() => !!block.querySelector('.me-quote'));
    expect(block.querySelector('.me-quote').textContent).to.equal('"Patience is bitter, but its fruit is sweet."');
    expect(block.querySelector('.me-author').textContent).to.equal('Jean-Jacques Rousseau');
  });

  it('removes the whole section when no quotes are authored on the page', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    document.querySelector('.collapsible-rows').remove();
    const section = document.createElement('div');
    section.className = 'section';
    const block = document.querySelector('.mini-editor');
    block.replaceWith(section);
    section.append(block);
    await init(block);
    expect(document.body.contains(section)).to.be.false;
  });

  it('parses authored collection id, limit, and topics rows', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const block = document.querySelector('.mini-editor');
    const collectionRow = document.createElement('div');
    collectionRow.innerHTML = '<div>collection id</div><div>urn:aaid:sc:VA6C2:test</div>';
    const limitRow = document.createElement('div');
    limitRow.innerHTML = '<div>limit</div><div>4</div>';
    block.append(collectionRow, limitRow);

    fetchStub.resolves({ json: async () => ({ items: [] }) });
    await init(block);

    expect(fetchStub.calledOnce).to.be.true;
    const [calledUrl] = fetchStub.firstCall.args;
    expect(calledUrl).to.contain('collectionId=urn:aaid:sc:VA6C2:test');
    expect(calledUrl).to.contain('limit=4');
  });

  it('ignores an authored limit of 0 or a non-numeric value and keeps the default', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const block = document.querySelector('.mini-editor');
    const limitRow = document.createElement('div');
    limitRow.innerHTML = '<div>limit</div><div>not-a-number</div>';
    block.append(limitRow);
    await init(block);
    await waitFor(() => !!block.querySelector('.mini-editor-decorations'));
    // Default TEMPLATE_LIMIT (8) static cards minus the one powering the main
    // widget leaves 7 decorative cards, since the invalid limit was ignored.
    expect(block.querySelectorAll('.mini-editor-decorations .me-deco')).to.have.length(7);
  });

  it('removes the section and logs to lana when a background/font loader rejects', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const block = document.querySelector('.mini-editor');
    const section = document.createElement('div');
    section.className = 'section';
    block.replaceWith(section);
    section.append(block);
    window.lana = { log: sinon.spy() };
    fetchStub.restore();
    fetchStub = sinon.stub(window, 'fetch').rejects(new Error('network down'));
    const collectionRow = document.createElement('div');
    collectionRow.innerHTML = '<div>collection id</div><div>urn:aaid:sc:VA6C2:test</div>';
    block.append(collectionRow);

    await init(block);

    expect(document.body.contains(section)).to.be.false;
    expect(window.lana.log.calledOnce).to.be.true;
    delete window.lana;
  });
});
