import { readFile, setViewport } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

window.isTestEnv = true;

const [{ getLibs }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({ locales: { '': { ietf: 'en-US', tk: 'hah7vzn.css' } } });
});

const {
  default: decorate,
  SELECT_EVENT,
  getAction,
} = await import('../../../express/code/blocks/resume-upload-fork/resume-upload-fork.js');

await new Promise((resolve, reject) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/express/code/blocks/resume-upload-fork/resume-upload-fork.css';
  link.addEventListener('load', resolve, { once: true });
  link.addEventListener('error', reject, { once: true });
  document.head.append(link);
});

const mockHtml = await readFile({ path: './mocks/default.html' });

function render(inModal = false) {
  const fixture = new DOMParser().parseFromString(mockHtml, 'text/html');
  const block = document.importNode(fixture.querySelector('.resume-upload-fork'), true);
  if (!inModal) {
    document.body.replaceChildren(block);
    return { block };
  }
  const dialog = document.createElement('div');
  dialog.className = 'dialog-modal';
  dialog.id = 'resume-upload-fork';
  const fragment = document.createElement('div');
  fragment.className = 'fragment';
  const section = document.createElement('div');
  section.className = 'section';
  section.append(block);
  fragment.append(section);
  dialog.append(fragment);
  const curtain = document.createElement('div');
  curtain.className = 'modal-curtain is-open';
  document.body.replaceChildren(dialog, curtain);
  return { block, dialog, curtain };
}

const key = (target, k) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

describe('resume-upload-fork', () => {
  let events;
  const onSelect = (e) => events.push(e.detail);

  beforeEach(() => {
    events = [];
    window.addEventListener(SELECT_EVENT, onSelect);
  });

  afterEach(() => {
    window.removeEventListener(SELECT_EVENT, onSelect);
    document.body.replaceChildren();
  });

  it('maps action hashes to actions', () => {
    expect(getAction('https://www.adobe.com#_button-fill#_continue-fork')).to.equal('continue-fork');
    expect(getAction('/fr/#_cancel-fork')).to.equal('cancel-fork');
    expect(getAction('https://www.adobe.com/')).to.equal(null);
  });

  it('builds the header, a radio group of cards and the actions', async () => {
    const { block } = render();
    await decorate(block);
    const heading = block.querySelector('.resume-upload-fork-header h2');
    expect(heading.textContent).to.equal('What would you like to do with your resume?');
    const group = block.querySelector('[role="radiogroup"]');
    expect(group.getAttribute('aria-labelledby')).to.equal(heading.id);
    const cards = [...group.querySelectorAll('[role="radio"]')];
    expect(cards.map((c) => c.dataset.choice)).to.deep.equal(['sharpen', 'refine']);
    expect(block.querySelector('.resume-upload-fork-actions')).to.exist;
  });

  it('uses the desktop and mobile images and drops the empty heading wrapper', async () => {
    const { block } = render();
    await decorate(block);
    const [sharpen] = block.querySelectorAll('.resume-upload-fork-card');
    const media = sharpen.querySelector('.resume-upload-fork-card-media');
    expect(media.classList.contains('has-mobile-image')).to.be.true;
    expect(media.querySelector('.resume-upload-fork-image-desktop img').dataset.image).to.equal('sharpen-desktop');
    expect(media.querySelector('.resume-upload-fork-image-mobile img').dataset.image).to.equal('sharpen-mobile');
    const headings = [...sharpen.querySelectorAll('h3')];
    expect(headings).to.have.length(1);
    expect(headings[0].textContent).to.equal('Sharpen content');
    expect(sharpen.getAttribute('aria-labelledby')).to.equal('sharpen-content');
  });

  it('shows the mobile image only below 600px', async () => {
    const { block } = render();
    await decorate(block);
    const media = block.querySelector('.resume-upload-fork-card-media');
    const desktop = media.querySelector('.resume-upload-fork-image-desktop');
    const mobile = media.querySelector('.resume-upload-fork-image-mobile');
    try {
      await setViewport({ width: 1024, height: 800 });
      expect(getComputedStyle(desktop).display).to.equal('block');
      expect(getComputedStyle(mobile).display).to.equal('none');
      await setViewport({ width: 375, height: 800 });
      expect(getComputedStyle(desktop).display).to.equal('none');
      expect(getComputedStyle(mobile).display).to.equal('block');
    } finally {
      await setViewport({ width: 800, height: 600 });
    }
  });

  it('selects the first card by default', async () => {
    const { block } = render();
    await decorate(block);
    const [sharpen, refine] = block.querySelectorAll('[role="radio"]');
    expect(sharpen.getAttribute('aria-checked')).to.equal('true');
    expect(sharpen.tabIndex).to.equal(0);
    expect(refine.getAttribute('aria-checked')).to.equal('false');
    expect(refine.tabIndex).to.equal(-1);
  });

  it('selects a card on click', async () => {
    const { block } = render();
    await decorate(block);
    const [sharpen, refine] = block.querySelectorAll('[role="radio"]');
    refine.click();
    expect(refine.getAttribute('aria-checked')).to.equal('true');
    expect(sharpen.getAttribute('aria-checked')).to.equal('false');
  });

  it('moves the selection and focus with arrow keys and wraps', async () => {
    const { block } = render();
    await decorate(block);
    const [sharpen, refine] = block.querySelectorAll('[role="radio"]');
    key(sharpen, 'ArrowRight');
    expect(refine.getAttribute('aria-checked')).to.equal('true');
    expect(document.activeElement).to.equal(refine);
    key(refine, 'ArrowDown');
    expect(sharpen.getAttribute('aria-checked')).to.equal('true');
    key(sharpen, 'ArrowUp');
    expect(refine.getAttribute('aria-checked')).to.equal('true');
    key(refine, 'ArrowLeft');
    expect(sharpen.getAttribute('aria-checked')).to.equal('true');
  });

  it('renders the authored links as non-navigating Milo buttons', async () => {
    const { block } = render();
    await decorate(block);
    const actions = block.querySelector('.resume-upload-fork-actions');
    expect(actions.querySelector('a')).to.not.exist;
    const [cancel, cont] = actions.querySelectorAll('button');
    expect(cancel.textContent).to.equal('Cancel');
    expect(cancel.dataset.action).to.equal('cancel-fork');
    expect(cancel.classList.contains('con-button')).to.be.true;
    expect(cancel.classList.contains('outline')).to.be.true;
    expect(cont.textContent).to.equal('Continue');
    expect(cont.dataset.action).to.equal('continue-fork');
    expect(cont.classList.contains('fill')).to.be.true;
  });

  it('dispatches continue-fork with the selected choice', async () => {
    const { block } = render();
    await decorate(block);
    block.querySelector('[data-action="continue-fork"]').click();
    block.querySelectorAll('[role="radio"]')[1].click();
    block.querySelector('[data-action="continue-fork"]').click();
    expect(events).to.deep.equal([
      { action: 'continue-fork', choice: 'sharpen' },
      { action: 'continue-fork', choice: 'refine' },
    ]);
  });

  it('dispatches cancel-fork', async () => {
    const { block } = render();
    await decorate(block);
    block.querySelector('[data-action="cancel-fork"]').click();
    expect(events).to.deep.equal([{ action: 'cancel-fork' }]);
  });

  describe('in a Milo modal', () => {
    it('adds the modal class and a close animation callback', async () => {
      const { block, dialog } = render(true);
      await decorate(block);
      expect(dialog.classList.contains('resume-upload-fork-modal')).to.be.true;
      expect(dialog.closeCallback).to.be.a('function');
    });

    it('closes the modal after a choice', async () => {
      const { block, dialog, curtain } = render(true);
      await decorate(block);
      const closed = new Promise((resolve) => {
        window.addEventListener('milo:modal:closed', (e) => resolve(e.detail), { once: true });
      });
      block.querySelector('[data-action="continue-fork"]').click();
      expect(events).to.deep.equal([{ action: 'continue-fork', choice: 'sharpen' }]);
      expect(dialog.classList.contains('is-closing')).to.be.true;
      expect(curtain.classList.contains('is-closing')).to.be.true;
      const detail = await closed;
      expect(detail.id).to.equal('resume-upload-fork');
      expect(dialog.isConnected).to.be.false;
      expect(curtain.isConnected).to.be.false;
    });
  });
});
