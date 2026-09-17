import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../express/code/scripts/utils.js';
import showCopyToast from '../../../express/code/scripts/utils/copy-toast.js';

// copy-toast lazily imports `${getLibs()}/utils/utils.js` for createTag/loadStyle/
// getConfig on first call — point it at the lightweight test mock instead of a
// real libs origin.
setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

describe('copy-toast', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    clock.restore();
    // The module keeps its container singleton for the page's lifetime (see
    // copy-toast.js's module-level `container`) — only clear its contents
    // between tests, not the container itself, to match that real behaviour.
    document.querySelectorAll('.copy-toast').forEach((el) => el.remove());
  });

  it('appends a single, reusable toast container to the body', async () => {
    await showCopyToast('First message');
    await showCopyToast('Second message');
    expect(document.querySelectorAll('.copy-toast-container')).to.have.length(1);
  });

  it('shows the message text and marks the toast visible on the next frame', async () => {
    await showCopyToast('Quote copied to clipboard');
    const toast = document.querySelector('.copy-toast');
    expect(toast.querySelector('.copy-toast-message').textContent).to.equal('Quote copied to clipboard');
    await new Promise((resolve) => { requestAnimationFrame(() => resolve()); });
    expect(toast.classList.contains('is-visible')).to.be.true;
  });

  it('removes any previous toast before showing a new one', async () => {
    await showCopyToast('First');
    const first = document.querySelector('.copy-toast');
    await showCopyToast('Second');
    expect(document.body.contains(first)).to.be.false;
    expect(document.querySelectorAll('.copy-toast')).to.have.length(1);
    expect(document.querySelector('.copy-toast-message').textContent).to.equal('Second');
  });

  it('auto-dismisses after 5 seconds', async () => {
    await showCopyToast('Auto dismiss me');
    const toast = document.querySelector('.copy-toast');
    await clock.tickAsync(5000);
    expect(toast.classList.contains('is-visible')).to.be.false;
    toast.dispatchEvent(new Event('transitionend'));
    expect(document.body.contains(toast)).to.be.false;
  });

  it('the close button removes the toast without waiting for the timeout', async () => {
    await showCopyToast('Dismiss me now');
    const toast = document.querySelector('.copy-toast');
    toast.querySelector('.copy-toast-close').click();
    expect(toast.classList.contains('is-visible')).to.be.false;
    toast.dispatchEvent(new Event('transitionend'));
    expect(document.body.contains(toast)).to.be.false;
  });

  it('exposes an accessible status container with polite live region semantics', async () => {
    await showCopyToast('Accessible message');
    const container = document.querySelector('.copy-toast-container');
    expect(container.getAttribute('role')).to.equal('status');
    expect(container.getAttribute('aria-live')).to.equal('polite');
  });
});
