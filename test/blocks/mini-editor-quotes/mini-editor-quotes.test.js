import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../express/code/scripts/utils.js';
import decorate from '../../../express/code/blocks/mini-editor-quotes/mini-editor-quotes.js';
import { waitFor } from '../../helpers/waitfor.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

describe('mini-editor-quotes', () => {
  let clipboardStub;

  beforeEach(() => {
    clipboardStub = sinon.stub(navigator.clipboard, 'writeText').resolves();
  });

  afterEach(() => {
    clipboardStub.restore();
    document.body.innerHTML = '';
  });

  it('renders a Copy quote and Create a design button per row with mini-editor modifiers', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const block = document.querySelector('.mini-editor-quotes');
    await decorate(block);

    const rows = block.querySelectorAll('.collapsible-row-actions');
    expect(rows).to.have.length(3);
    expect(block.querySelectorAll('.collapsible-row-actions--mini-editor')).to.have.length(3);
    expect(block.querySelectorAll('.collapsible-row-accordion--mini-editor')).to.have.length(3);
    expect(block.querySelectorAll('.collapsible-row-header--mini-editor')).to.have.length(3);
    expect(block.querySelectorAll('.collapsible-row-sub-header--mini-editor')).to.have.length(3);

    rows.forEach((actions) => {
      expect(actions.classList.contains('collapsible-row-actions--mini-editor')).to.be.true;
      expect(actions.querySelector('.collapsible-row-action--copy')).to.exist;
      expect(actions.querySelector('.collapsible-row-action--design')).to.exist;
      expect(actions.querySelector('.collapsible-row-action-icon--copy')).to.exist;
      expect(actions.querySelector('.collapsible-row-action-icon--design')).to.exist;
      const accordion = actions.closest('.collapsible-row-accordion');
      expect(accordion?.classList.contains('collapsible-row-accordion--mini-editor')).to.be.true;
      expect(accordion?.querySelector('.collapsible-row-header')?.classList.contains('collapsible-row-header--mini-editor')).to.be.true;
      expect(accordion?.querySelector('.collapsible-row-sub-header')?.classList.contains('collapsible-row-sub-header--mini-editor')).to.be.true;
    });
  });

  it('copies "quote — author" to the clipboard and shows the shared toast', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const block = document.querySelector('.mini-editor-quotes');
    await decorate(block);

    const [firstActions] = block.querySelectorAll('.collapsible-row-actions');
    firstActions.querySelector('.collapsible-row-action--copy').click();
    await waitFor(() => !!document.querySelector('.copy-toast-message'));
    expect(clipboardStub.calledOnceWith('"Patience is bitter, but its fruit is sweet." — Jean-Jacques Rousseau')).to.be.true;
    expect(document.querySelector('.copy-toast-message').textContent).to.equal('Quote copied to clipboard');
  });

  it('copies the quote alone when the row has no author', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const block = document.querySelector('.mini-editor-quotes');
    await decorate(block);

    const actionsRows = block.querySelectorAll('.collapsible-row-actions');
    const lastActions = actionsRows[actionsRows.length - 1];
    lastActions.querySelector('.collapsible-row-action--copy').click();
    await waitFor(() => clipboardStub.called);
    expect(clipboardStub.calledOnceWith('"No author quote here."')).to.be.true;
  });

  it('dispatches mini-editor:use-quote with the quote and author when "Create a design" is clicked', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const block = document.querySelector('.mini-editor-quotes');
    await decorate(block);

    const listener = sinon.spy();
    document.addEventListener('mini-editor:use-quote', listener);
    const [firstActions] = block.querySelectorAll('.collapsible-row-actions');
    firstActions.querySelector('.collapsible-row-action--design').click();
    document.removeEventListener('mini-editor:use-quote', listener);
    expect(listener.calledOnce).to.be.true;
    expect(listener.firstCall.args[0].detail).to.deep.equal({
      quote: '"Patience is bitter, but its fruit is sweet."',
      author: 'Jean-Jacques Rousseau',
    });
  });

  it('does not throw and shows no toast when the clipboard write is rejected', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const block = document.querySelector('.mini-editor-quotes');
    await decorate(block);

    clipboardStub.rejects(new Error('denied'));
    const [firstActions] = block.querySelectorAll('.collapsible-row-actions');
    expect(() => firstActions.querySelector('.collapsible-row-action--copy').click()).to.not.throw();
    await clipboardStub.returnValues[0].catch(() => {});
    expect(document.querySelector('.copy-toast')).to.not.exist;
  });

  it('keeps its own width hook when sharing a section with template-x-promo', async () => {
    document.body.innerHTML = `
      <main>
        <div class="section ax-template-x-promo multiple-up">
          <div class="template-x-promo block" data-block-name="template-x-promo" data-block-status="loaded"></div>
          <div class="mini-editor-quotes block" data-block-name="mini-editor-quotes" data-block-status="loading">
            <div><div>Quote one</div><div>Author one</div></div>
            <div><div>Quote two</div><div>Author two</div></div>
          </div>
        </div>
      </main>
    `;

    const section = document.querySelector('.section');
    const block = document.querySelector('.mini-editor-quotes');
    await decorate(block);

    expect(section.classList.contains('ax-mini-editor-quotes')).to.be.false;
    expect(block.classList.contains('ax-mini-editor-quotes')).to.be.true;
  });

  it('keeps expandable background and section classes scoped when sharing a section', async () => {
    document.body.innerHTML = `
      <main>
        <div class="section ax-template-x-promo one-up">
          <div class="template-x-promo block" data-block-name="template-x-promo" data-block-status="loaded"></div>
          <div class="mini-editor-quotes block expandable" data-block-name="mini-editor-quotes" data-block-status="loading">
            <div><div><picture><img src="/media/bg.png" alt=""></picture></div></div>
            <div><div>Header</div></div>
            <div><div>Quote one</div><div>Author one</div></div>
            <div><div>Quote two</div><div>Author two</div></div>
          </div>
        </div>
      </main>
    `;

    const section = document.querySelector('.section');
    const block = document.querySelector('.mini-editor-quotes');
    await decorate(block);

    expect(section.classList.contains('mini-editor-quotes-grey-bg')).to.be.false;
    expect(section.classList.contains('mini-editor-quotes-section-padding')).to.be.false;
    expect(section.querySelector(':scope > .collapsible-rows-background')).to.not.exist;
    expect(block.querySelector(':scope > .collapsible-rows-background')).to.exist;
  });
});
