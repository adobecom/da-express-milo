import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../express/code/scripts/utils.js';
import init from '../../../express/code/blocks/mini-editor/mini-editor.js';
import MiniEditorCardExporter from '../../../express/code/scripts/utils/mini-editor-card-export.js';
import { waitFor } from '../../helpers/waitfor.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

function validTemplate(id) {
  return {
    id,
    status: 'approved',
    customLinks: { branchUrl: 'https://example.com' },
    behaviors: ['still'],
    pages: [{ rendition: { image: { thumbnail: { componentId: 'abc' } } } }],
    _links: {
      'http://ns.adobe.com/adobecloud/rel/rendition': { href: `https://cdn/rendition/${id}` },
      'http://ns.adobe.com/adobecloud/rel/component': { href: `https://cdn/component/${id}` },
    },
  };
}

// getCardBackgrounds always fetches (see mini-editor-background-loader.js) —
// this default response gives every test a non-empty card set to mount the
// widget with, unless a test overrides fetchStub for its own scenario.
const defaultTemplateItems = Array.from({ length: 8 }, (_, i) => validTemplate(`urn:${i}`));

describe('mini-editor', () => {
  let fetchStub;

  beforeEach(() => {
    window.Typekit = { load: ({ active }) => active?.() };
    fetchStub = sinon.stub(window, 'fetch').resolves({ json: async () => ({ items: defaultTemplateItems }) });
    sinon.stub(window, 'requestAnimationFrame').callsFake((callback) => {
      callback(performance.now());
      return 1;
    });
  });

  afterEach(() => {
    delete window.Typekit;
    delete window.lana;
    delete window.placeholders;
    delete navigator.share;
    delete navigator.canShare;
    sinon.restore();
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

  it('downloads the content model once after rapid clicks', async () => {
    const block = await decorateWithBody();
    const downloadStub = sinon.stub(MiniEditorCardExporter, 'download').resolves();

    const downloadButton = block.querySelector('.me-action--download');
    downloadButton.click();
    downloadButton.click();
    await waitFor(() => downloadStub.calledOnce);

    expect(downloadStub.calledOnce).to.be.true;
    expect(downloadStub.firstCall.args[0]).to.deep.include({
      quote: '"Patience is bitter, but its fruit is sweet."',
      author: 'Jean-Jacques Rousseau',
    });
    expect(downloadStub.firstCall.args[0].backgroundUrl).to.equal('https://cdn/rendition/urn:0');
    expect(downloadButton.disabled).to.be.false;
    expect(downloadButton.hasAttribute('aria-busy')).to.be.false;
  });

  it('downloads the latest model after carousel navigation', async () => {
    const block = await decorateWithBody();
    const downloadStub = sinon.stub(MiniEditorCardExporter, 'download').resolves();

    block.querySelector('.me-arc-nav--next').click();
    block.querySelector('.me-action--download').click();
    await waitFor(() => downloadStub.calledOnce);

    expect(downloadStub.firstCall.args[0]).to.deep.include({
      quote: '"Adopt the pace of nature: her secret is patience."',
      author: 'Ralph Waldo Emerson',
    });
    expect(downloadStub.firstCall.args[0].backgroundUrl).to.equal('https://cdn/rendition/urn:1');
  });

  it('uses the generic menu and shares a fresh PNG from More options', async () => {
    window.placeholders = {
      'mini-editor-share-image': 'Share image',
      'share-menu-whatsapp': 'WhatsApp',
      'mini-editor-copy-image': 'Copy image',
      'share-menu-more-options': 'More options',
    };
    const blob = new Blob(['png'], { type: 'image/png' });
    const createBlobStub = sinon.stub(MiniEditorCardExporter, 'createCardBlob').resolves(blob);
    const shareStub = sinon.stub().resolves();
    Object.defineProperty(navigator, 'share', { configurable: true, value: shareStub });
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: sinon.stub().returns(true),
    });
    const block = await decorateWithBody();

    block.querySelector('.me-action--share').click();
    const menu = block.querySelector('.share-menu-list');
    expect(menu).to.exist;
    expect(menu.querySelectorAll('sp-menu-item')).to.have.length(3);
    expect(menu.querySelector('sp-menu-group [slot="header"]').textContent).to.equal('Share image');
    const whatsAppIcon = menu.querySelector('sp-menu-item[value="whatsapp"] sp-icon');
    expect(whatsAppIcon.src).to.contain('/express/code/icons/S2_Icon_WhatsApp_20_N.svg');
    expect(whatsAppIcon.size).to.equal('m');
    expect(menu.querySelector('sp-menu-item[value="copy"] sp-icon-image')).to.exist;
    expect(menu.querySelector('sp-menu-item[value="more"] sp-icon-more')).to.exist;

    menu.querySelector('sp-menu-item[value="more"]').click();
    await waitFor(() => shareStub.calledOnce);
    expect(block.querySelector('.me-action--share').getAttribute('aria-expanded'))
      .to.equal('true');

    block.querySelector('.me-arc-nav--next').click();
    menu.querySelector('sp-menu-item[value="more"]').click();
    await waitFor(() => shareStub.calledTwice);

    expect(createBlobStub.calledTwice).to.be.true;
    expect(createBlobStub.secondCall.args[0].backgroundUrl)
      .to.equal('https://cdn/rendition/urn:1');
    const [shareData] = shareStub.firstCall.args;
    expect(shareData.title).to.equal('Share image');
    expect(shareData.files).to.have.length(1);
    expect(shareData.files[0].name).to.equal('quote-card.png');
    expect(shareData.files[0].type).to.equal('image/png');
  });

  it('logs and shows a localized negative toast when download fails', async () => {
    const block = await decorateWithBody();
    window.placeholders = { 'screenshot-download-failed': 'Unable to download this design.' };
    window.lana = { log: sinon.spy() };
    sinon.stub(MiniEditorCardExporter, 'download').rejects(new Error('render failed'));

    block.querySelector('.me-action--download').click();
    await waitFor(() => !!document.querySelector('sp-toast'));

    const toast = document.querySelector('sp-toast');
    expect(toast.textContent).to.equal('Unable to download this design.');
    expect(toast.getAttribute('variant')).to.equal('negative');
    expect(window.lana.log.calledWithMatch('Mini-editor download failed: render failed')).to.be.true;
    expect(document.body.contains(block)).to.be.true;
  });

  it('removes the whole section when no quotes are authored on the page', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    document.querySelectorAll('.collapsible-rows').forEach((quoteBlock) => quoteBlock.remove());
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
    // Default TEMPLATE_LIMIT (8) fetched cards minus the one powering the main
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
