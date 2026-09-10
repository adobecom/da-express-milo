import { expect } from '@esm-bundle/chai';

const [{ getLibs }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
await import(`${getLibs()}/utils/utils.js`).then((mod) => mod.setConfig({}));

const [{ initFonts }, { default: initPanel }] = await Promise.all([
  import('../../../express/code/blocks/font-generator/state.js'),
  import('../../../express/code/blocks/font-generator/panel.js'),
]);

initFonts([
  { name: 'Bold', category: 'bold', map: {} },
  { name: 'Italic', category: 'italic', map: {} },
]);

function makeBlock() {
  const block = document.createElement('div');
  block.className = 'font-generator';
  document.body.appendChild(block);
  return block;
}

// ── DOM structure ──────────────────────────────────────────────────────────────

describe('panel / DOM structure', () => {
  let block;
  let api;

  before(async () => {
    block = makeBlock();
    api = await initPanel(block);
  });

  after(() => {
    api.destroy();
    block.remove();
  });

  it('appends overlay to block', () => {
    expect(block.querySelector('.fg-overlay')).to.exist;
  });

  it('overlay starts with aria-hidden="true" and inert', () => {
    const overlay = block.querySelector('.fg-overlay');
    expect(overlay.getAttribute('aria-hidden')).to.equal('true');
    expect(overlay.hasAttribute('inert')).to.be.true;
  });

  it('panel has role="dialog" and aria-modal="true"', () => {
    const panelEl = block.querySelector('.fg-panel');
    expect(panelEl.getAttribute('role')).to.equal('dialog');
    expect(panelEl.getAttribute('aria-modal')).to.equal('true');
  });

  it('panel aria-label falls back to "Filters"', () => {
    expect(block.querySelector('.fg-panel').getAttribute('aria-label')).to.equal('Filters');
  });

  it('close button has aria-label="Close filters"', () => {
    expect(block.querySelector('.fg-panel-close').getAttribute('aria-label')).to.equal('Close filters');
  });

  it('close button contains an SVG', () => {
    expect(block.querySelector('.fg-panel-close svg')).to.exist;
  });

  it('drag handle has aria-hidden="true"', () => {
    expect(block.querySelector('.fg-tray-handle').getAttribute('aria-hidden')).to.equal('true');
  });

  it('returns open, close, and destroy functions', () => {
    expect(typeof api.open).to.equal('function');
    expect(typeof api.close).to.equal('function');
    expect(typeof api.destroy).to.equal('function');
  });
});

// ── open() ────────────────────────────────────────────────────────────────────

describe('panel / open()', () => {
  let block;
  let api;
  let overlay;

  beforeEach(async () => {
    block = makeBlock();
    api = await initPanel(block);
    overlay = block.querySelector('.fg-overlay');
  });

  afterEach(() => {
    api.destroy();
    block.remove();
  });

  it('removes aria-hidden from overlay', () => {
    api.open();
    expect(overlay.hasAttribute('aria-hidden')).to.be.false;
  });

  it('removes inert from overlay', () => {
    api.open();
    expect(overlay.hasAttribute('inert')).to.be.false;
  });

  it('adds panel-open class to block', () => {
    api.open();
    expect(block.classList.contains('panel-open')).to.be.true;
  });

  it('is a no-op when already open', () => {
    api.open();
    api.open();
    expect(block.classList.contains('panel-open')).to.be.true;
    expect(overlay.hasAttribute('aria-hidden')).to.be.false;
  });
});

// ── close() ───────────────────────────────────────────────────────────────────

describe('panel / close()', () => {
  let block;
  let api;
  let overlay;

  beforeEach(async () => {
    block = makeBlock();
    api = await initPanel(block);
    overlay = block.querySelector('.fg-overlay');
    api.open();
  });

  afterEach(() => {
    api.destroy();
    block.remove();
  });

  it('restores aria-hidden on overlay', () => {
    api.close();
    expect(overlay.getAttribute('aria-hidden')).to.equal('true');
  });

  it('restores inert on overlay', () => {
    api.close();
    expect(overlay.hasAttribute('inert')).to.be.true;
  });

  it('removes panel-open class from block', () => {
    api.close();
    expect(block.classList.contains('panel-open')).to.be.false;
  });

  it('is a no-op when already closed', () => {
    api.close();
    api.close(); // should not throw
    expect(block.classList.contains('panel-open')).to.be.false;
  });
});

// ── close button and overlay click ────────────────────────────────────────────

describe('panel / close button and overlay click', () => {
  let block;
  let api;

  beforeEach(async () => {
    block = makeBlock();
    api = await initPanel(block);
    api.open();
  });

  afterEach(() => {
    api.destroy();
    block.remove();
  });

  it('clicking close button closes the panel', () => {
    block.querySelector('.fg-panel-close').click();
    expect(block.classList.contains('panel-open')).to.be.false;
  });

  it('clicking the overlay backdrop closes the panel', () => {
    const overlay = block.querySelector('.fg-overlay');
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(block.classList.contains('panel-open')).to.be.false;
  });

  it('clicking inside the panel does not close', () => {
    const panelEl = block.querySelector('.fg-panel');
    panelEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(block.classList.contains('panel-open')).to.be.true;
  });
});

// ── drag-to-close ─────────────────────────────────────────────────────────────

describe('panel / drag-to-close', () => {
  let block;
  let api;
  let handle;
  let panelEl;

  beforeEach(async () => {
    block = makeBlock();
    api = await initPanel(block);
    handle = block.querySelector('.fg-tray-handle');
    panelEl = block.querySelector('.fg-panel');
    api.open();
  });

  afterEach(() => {
    api.destroy();
    block.remove();
  });

  it('dragging down > 100px closes the panel', () => {
    handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientY: 0 }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientY: 150 }));
    expect(block.classList.contains('panel-open')).to.be.false;
  });

  it('dragging down < 100px does not close', () => {
    handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientY: 0 }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientY: 50 }));
    expect(block.classList.contains('panel-open')).to.be.true;
  });

  it('drag move applies translateY transform', () => {
    handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientY: 0 }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientY: 60 }));
    expect(panelEl.style.transform).to.equal('translateY(60px)');
    window.dispatchEvent(new MouseEvent('mouseup', { clientY: 60 }));
  });

  it('transform is cleared on drag end', () => {
    handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientY: 0 }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientY: 60 }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientY: 60 }));
    expect(panelEl.style.transform).to.equal('');
  });
});

// ── destroy() ─────────────────────────────────────────────────────────────────

describe('panel / destroy()', () => {
  let block;
  let api;

  beforeEach(async () => {
    block = makeBlock();
    api = await initPanel(block);
  });

  afterEach(() => {
    block.remove();
  });

  it('removes overlay from DOM', () => {
    api.destroy();
    expect(block.querySelector('.fg-overlay')).to.be.null;
  });

  it('close button click has no effect after destroy', () => {
    api.open();
    const closeBtn = block.querySelector('.fg-panel-close');
    api.destroy();
    closeBtn.click(); // signal is aborted — listener is gone, no error
    expect(block.classList.contains('panel-open')).to.be.false;
  });
});
