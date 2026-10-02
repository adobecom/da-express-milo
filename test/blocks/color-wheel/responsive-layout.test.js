/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setViewport } from '@web/test-runner-commands';
import { setLibs } from '../../../express/code/scripts/utils.js';
import { createActionMenuComponent } from '../../../express/code/scripts/color-shared/components/createActionMenuComponent.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });
window.isTestEnv = true;
const { configureResponsiveLayout } = await import('../../../express/code/blocks/color-wheel/color-wheel.js');

describe('color-wheel responsive layout', () => {
  let block;
  let desktopMenu;
  let mobileMenu;
  let dispose;
  let exitDesktop;
  let slots;
  let notifyBreakpointChange;
  const styles = [];

  async function resizeTo(width) {
    await setViewport({ width, height: 900 });
    notifyBreakpointChange?.();
  }

  before(async () => {
    await Promise.all([
      '/express/code/blocks/color-wheel/color-wheel.css',
      '/express/code/scripts/color-shared/action-menu.css',
      '/express/code/scripts/color-shared/shell/layouts/styles/color-tool-layout.css',
    ].map((href) => new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      styles.push(link);
      document.head.append(link);
    })));
  });

  beforeEach(async () => {
    await resizeTo(1440);
    block = document.createElement('div');
    block.className = 'color-wheel';
    const root = document.createElement('div');
    root.className = 'ax-color-tool-layout';
    slots = {};
    ['sidebar', 'topbar', 'canvas', 'footer'].forEach((name) => {
      const slot = document.createElement('div');
      slot.className = `ax-shell-slot ax-shell-slot--${name}`;
      slots[name] = slot;
      root.append(slot);
    });
    const section = document.createElement('section');
    section.append(root);
    block.append(section);
    document.body.append(block);
    const options = {
      id: 'responsive-wheel-test',
      controls: [
        { id: 'undo', label: 'Undo' },
        { id: 'redo', label: 'Redo' },
        { id: 'generate-random', label: 'Generate random' },
      ],
    };
    desktopMenu = await createActionMenuComponent({
      ...options,
      controls: [...options.controls, { id: 'expand', label: 'Maximize', expandedLabel: 'Minimize' }],
      onExpand: (expanded) => {
        block.toggleAttribute('data-sidebar-collapsed', expanded);
      },
    });
    mobileMenu = await createActionMenuComponent({ ...options, type: 'controls-only' });
    slots.topbar.append(desktopMenu.element);
    slots.canvas.append(mobileMenu.element);
    exitDesktop = sinon.spy();
    const desktopQuery = {
      get matches() { return window.innerWidth >= 1200; },
      addEventListener(event, handler) { notifyBreakpointChange = handler; },
      removeEventListener() { notifyBreakpointChange = null; },
    };
    sinon.stub(window, 'matchMedia').callThrough()
      .withArgs('(min-width: 1200px)').returns(desktopQuery);
    dispose = configureResponsiveLayout(block, { slots, actionMenu: desktopMenu }, exitDesktop);
    desktopMenu.pushState(['#FF0000', '#00FF00']);
  });

  afterEach(async () => {
    dispose?.();
    desktopMenu?.destroy();
    mobileMenu?.destroy();
    block?.remove();
    sinon.restore();
    await setViewport({ width: 800, height: 600 });
  });

  after(() => { styles.forEach((style) => style.remove()); });

  it('shows exactly one control set across mobile, tablet, and desktop breakpoints', async () => {
    const desktopControls = desktopMenu.element.querySelector('.action-menu-controls');
    const root = slots.topbar.parentNode;
    const initialSlots = [...root.children];
    expect(initialSlots[0]).to.equal(slots.topbar);

    for (const width of [375, 600, 887, 888, 1199, 1200, 1440, 1199, 1200]) {
      await resizeTo(width);
      const isDesktop = width >= 1200;
      expect(getComputedStyle(desktopControls).display === 'none').to.equal(!isDesktop);
      expect(getComputedStyle(mobileMenu.element).display === 'none').to.equal(isDesktop);
      expect(desktopControls.querySelector('.undo-btn').getBoundingClientRect().width > 0).to.equal(isDesktop);
      expect(mobileMenu.element.querySelector('.undo-btn').getBoundingClientRect().width > 0).to.equal(!isDesktop);
      expect([...root.children]).to.deep.equal(initialSlots);
      expect(desktopMenu.getCurrentPalette()).to.deep.equal(['#FF0000', '#00FF00']);
    }
  });

  it('preserves undo and redo history when switching between control sets', async () => {
    desktopMenu.pushState(['#0000FF', '#FFFFFF']);
    await resizeTo(500);
    mobileMenu.element.querySelector('.undo-btn').click();
    expect(desktopMenu.getCurrentPalette()).to.deep.equal(['#FF0000', '#00FF00']);
    expect(mobileMenu.element.querySelector('.redo-btn').getAttribute('aria-disabled')).to.equal('false');
    await resizeTo(1440);
    desktopMenu.element.querySelector('.redo-btn').click();
    expect(mobileMenu.getCurrentPalette()).to.deep.equal(['#0000FF', '#FFFFFF']);
    expect(desktopMenu.element.querySelector('.redo-btn').getAttribute('aria-disabled')).to.equal('true');
  });

  it('restores the sidebar and expand label when leaving desktop', async () => {
    const expand = desktopMenu.element.querySelector('.expand-btn');
    expand.click();
    expect(block.hasAttribute('data-sidebar-collapsed')).to.equal(true);
    await resizeTo(1199);
    expect(block.hasAttribute('data-sidebar-collapsed')).to.equal(false);
    expect(expand.getAttribute('aria-label')).to.equal('Maximize');
    expect(desktopMenu.element.classList.contains('expanded')).to.equal(false);
    expect(exitDesktop.calledOnce).to.equal(true);
    await resizeTo(1440);
    expect(expand.getAttribute('aria-label')).to.equal('Maximize');
  });

  it('removes its breakpoint listener on disposal', async () => {
    dispose();
    await resizeTo(500);
    expect(exitDesktop.called).to.equal(false);
  });
});
