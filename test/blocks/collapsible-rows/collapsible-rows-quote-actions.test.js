import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../express/code/scripts/utils.js';
import decorate from '../../../express/code/blocks/collapsible-rows/collapsible-rows.js';
import { waitFor } from '../../helpers/waitfor.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

describe('collapsible-rows quote actions ("Copy quote" / "Create a design")', () => {
  let clipboardStub;
  const setPageType = (value) => {
    const existingMeta = document.querySelector('meta[name="pagetype"]');
    if (existingMeta) existingMeta.remove();
    if (!value) return;
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'pagetype');
    meta.setAttribute('content', value);
    document.head.append(meta);
  };

  beforeEach(() => {
    clipboardStub = sinon.stub(navigator.clipboard, 'writeText').resolves();
  });

  afterEach(() => {
    clipboardStub.restore();
    document.body.innerHTML = '';
    setPageType('');
  });

  it('does not render quote actions when no mini-editor block is present on the page', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const block = document.querySelector('.collapsible-rows');
    await decorate(block);
    expect(block.querySelector('.collapsible-row-actions')).to.not.exist;
    expect(block.querySelector('.collapsible-row-actions--mini-editor')).to.not.exist;
    expect(block.querySelector('.collapsible-row-accordion--mini-editor')).to.not.exist;
    expect(block.querySelector('.collapsible-row-header--mini-editor')).to.not.exist;
    expect(block.querySelector('.collapsible-row-sub-header--mini-editor')).to.not.exist;
  });

  it('does not render quote actions when pagetype is not mini-editor', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    setPageType('faq');

    const block = document.querySelector('.collapsible-rows');
    await decorate(block);

    expect(block.querySelector('.collapsible-row-actions')).to.not.exist;
  });

  describe('with pagetype mini-editor', () => {
    let block;

    beforeEach(async () => {
      document.body.innerHTML = await readFile({ path: './mocks/body.html' });
      setPageType('mini-editor');
      block = document.querySelector('.collapsible-rows');
      await decorate(block);
    });

    it('renders a Copy quote and Create a design button per row with mini-editor modifiers', () => {
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
        const accordion = actions.closest('.collapsible-row-accordion');
        expect(accordion?.classList.contains('collapsible-row-accordion--mini-editor')).to.be.true;
        expect(accordion?.querySelector('.collapsible-row-header')?.classList.contains('collapsible-row-header--mini-editor')).to.be.true;
        expect(accordion?.querySelector('.collapsible-row-sub-header')?.classList.contains('collapsible-row-sub-header--mini-editor')).to.be.true;
      });
    });

    it('copies "quote — author" to the clipboard and shows the shared toast', async () => {
      const [firstActions] = block.querySelectorAll('.collapsible-row-actions');
      firstActions.querySelector('.collapsible-row-action--copy').click();
      await waitFor(() => !!document.querySelector('.copy-toast-message'));
      expect(clipboardStub.calledOnceWith('"Patience is bitter, but its fruit is sweet." — Jean-Jacques Rousseau')).to.be.true;
      expect(document.querySelector('.copy-toast-message').textContent).to.equal('Quote copied to clipboard');
    });

    it('copies the quote alone when the row has no author', async () => {
      const actionsRows = block.querySelectorAll('.collapsible-row-actions');
      const lastActions = actionsRows[actionsRows.length - 1];
      lastActions.querySelector('.collapsible-row-action--copy').click();
      await waitFor(() => clipboardStub.called);
      expect(clipboardStub.calledOnceWith('"No author quote here."')).to.be.true;
    });

    it('dispatches mini-editor:use-quote with the quote and author when "Create a design" is clicked', () => {
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
      clipboardStub.rejects(new Error('denied'));
      const [firstActions] = block.querySelectorAll('.collapsible-row-actions');
      expect(() => firstActions.querySelector('.collapsible-row-action--copy').click()).to.not.throw();
      await clipboardStub.returnValues[0].catch(() => {});
      expect(document.querySelector('.copy-toast')).to.not.exist;
    });
  });
});
