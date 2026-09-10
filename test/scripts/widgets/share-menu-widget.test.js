import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../express/code/scripts/utils.js';
import createShareMenuWidget from '../../../express/code/scripts/widgets/share-menu-widget/share-menu-widget.js';
import { waitFor } from '../../helpers/waitfor.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

const descriptor = (key, fallback) => ({ key, fallback });

async function mount(overrides = {}) {
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.textContent = 'Share';
  const widget = await createShareMenuWidget({
    trigger,
    heading: descriptor('mini-editor-share-image', 'Share image'),
    actions: [
      {
        value: 'copy',
        type: 'copy',
        label: descriptor('mini-editor-copy-image', 'Copy image'),
      },
      {
        value: 'more',
        type: 'native',
        label: descriptor('share-menu-more-options', 'More options'),
        fallback: 'copy',
      },
    ],
    feedback: {
      copied: descriptor('mini-editor-image-copied', 'Image copied to clipboard'),
      failed: descriptor('mini-editor-share-failed', 'Unable to share this design.'),
    },
    getContent: async () => ({ share: { text: 'Test' }, clipboard: { text: 'Test' } }),
    notify: () => {},
    ...overrides,
  });
  document.body.append(widget.element);
  return { trigger, widget };
}

describe('share-menu-widget', () => {
  afterEach(() => {
    delete window.placeholders;
    delete window.ClipboardItem;
    delete navigator.share;
    delete navigator.canShare;
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('renders a Spectrum section header with correctly cased placeholders', async () => {
    const { trigger } = await mount();
    trigger.click();

    expect(trigger.getAttribute('aria-expanded')).to.equal('true');
    const group = document.querySelector('sp-menu-group');
    expect(group).to.exist;
    expect(group.querySelector('[slot="header"]').textContent).to.equal('Share image');
    expect(document.querySelector('.share-menu-popover p')).to.not.exist;
    expect(document.querySelector('sp-menu-item[value="copy"]').textContent)
      .to.equal('Copy image');
    expect(document.querySelector('sp-menu-item[value="more"]').textContent)
      .to.equal('More options');

    document.body.click();
    expect(trigger.getAttribute('aria-expanded')).to.equal('false');
  });

  it('passes text, URL, and files to the native share API', async () => {
    const file = new File(['image'], 'card.png', { type: 'image/png' });
    const share = { title: 'Card', text: 'Quote', url: 'https://example.com', files: [file] };
    const shareStub = sinon.stub().resolves();
    Object.defineProperty(navigator, 'share', { configurable: true, value: shareStub });
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: sinon.stub().withArgs(share).returns(true),
    });
    const { trigger } = await mount({ getContent: async () => ({ share }) });

    trigger.click();
    document.querySelector('sp-menu-item[value="more"]').click();
    await waitFor(() => shareStub.calledOnce);

    expect(shareStub.calledWith(share)).to.be.true;
  });

  it('keeps the menu open when an action disables dismissal', async () => {
    const shareStub = sinon.stub().resolves();
    Object.defineProperty(navigator, 'share', { configurable: true, value: shareStub });
    const actions = [{
      value: 'more',
      type: 'native',
      label: descriptor('share-menu-more-options', 'More options'),
      dismissOnSelect: false,
    }];
    const { trigger } = await mount({ actions });

    trigger.click();
    document.querySelector('sp-menu-item[value="more"]').click();
    await waitFor(() => shareStub.calledOnce);

    expect(trigger.getAttribute('aria-expanded')).to.equal('true');
    expect(document.querySelector('.share-menu-popover').hidden).to.be.false;
  });

  it('copies fresh file content on every selection', async () => {
    class ClipboardItemMock {
      constructor(data) { this.data = data; }
    }
    window.ClipboardItem = ClipboardItemMock;
    const writeStub = sinon.stub().resolves();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { write: writeStub },
    });
    let contentVersion = 0;
    const getContent = sinon.stub().callsFake(async () => {
      contentVersion += 1;
      return {
        clipboard: {
          files: [new File([String(contentVersion)], `card-${contentVersion}.png`, {
            type: 'image/png',
          })],
        },
      };
    });
    const { trigger } = await mount({ getContent });

    trigger.click();
    document.querySelector('sp-menu-item[value="copy"]').click();
    await waitFor(() => writeStub.calledOnce);
    trigger.click();
    document.querySelector('sp-menu-item[value="copy"]').click();
    await waitFor(() => writeStub.calledTwice);

    expect(getContent.callCount).to.equal(2);
    expect(writeStub.firstCall.args[0][0].data['image/png'].name).to.equal('card-1.png');
    expect(writeStub.secondCall.args[0][0].data['image/png'].name).to.equal('card-2.png');
  });

  it('falls back to copy when native file sharing is unsupported', async () => {
    const writeStub = sinon.stub().resolves();
    window.ClipboardItem = function ClipboardItemMock() {};
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { write: writeStub },
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: sinon.stub().resolves(),
    });
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: sinon.stub().returns(false),
    });
    const file = new File(['image'], 'card.png', { type: 'image/png' });
    const { trigger } = await mount({
      getContent: async () => ({ share: { files: [file] }, clipboard: { files: [file] } }),
    });

    trigger.click();
    document.querySelector('sp-menu-item[value="more"]').click();
    await waitFor(() => writeStub.calledOnce);

    expect(navigator.share.called).to.be.false;
  });
});
