/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import { createActionMenuComponent } from '../../../../express/code/scripts/color-shared/components/createActionMenuComponent.js';

const VALID_NAV_LINKS = [
  { id: 'palette', href: '#palette', label: 'Palette', active: true },
  { id: 'contrast', href: '#contrast', label: 'Contrast', active: false },
];

const VALID_CONTROLS = [
  { id: 'undo', label: 'Undo' },
  { id: 'redo', label: 'Redo' },
];

describe('createActionMenuComponent', () => {
  let instance;

  afterEach(() => {
    if (instance?.destroy) {
      instance.destroy();
    }
  });

  it('returns null for invalid type', async () => {
    const result = await createActionMenuComponent({ type: 'invalid' });
    expect(result).to.be.null;
  });

  it('returns { element, destroy } for valid type and provides nav for nav-only', async () => {
    instance = await createActionMenuComponent({
      type: 'nav-only',
      navLinks: VALID_NAV_LINKS,
    });
    expect(instance).to.not.be.null;
    expect(instance.element).to.exist;
    expect(instance.destroy).to.be.a('function');
    const navEl = instance.element.querySelector('nav');
    expect(navEl).to.exist;
    expect(navEl.getAttribute('aria-label')).to.equal('Color palette tools');
    expect(instance.element.querySelectorAll('.action-menu-link')).to.have.lengthOf(2);
  });

  it('full type renders nav and controls', async () => {
    instance = await createActionMenuComponent({
      type: 'full',
      navLinks: VALID_NAV_LINKS,
      controls: VALID_CONTROLS,
    });
    expect(instance.element.classList.contains('action-menu-full')).to.be.true;
    expect(instance.element.querySelector('.action-menu-nav')).to.exist;
    expect(instance.element.querySelector('.action-menu-controls')).to.exist;
    expect(instance.element.querySelector('.undo-btn')).to.exist;
    expect(instance.element.querySelector('.redo-btn')).to.exist;
  });

  it('destroy() removes element from DOM', async () => {
    instance = await createActionMenuComponent({
      type: 'nav-only',
      navLinks: VALID_NAV_LINKS,
    });
    const el = instance.element;
    document.body.appendChild(el);
    expect(document.body.contains(el)).to.be.true;

    instance.destroy();
    expect(document.body.contains(el)).to.be.false;
  });

  it('action-menu:history-index-changed updates undo/redo aria-disabled', async () => {
    instance = await createActionMenuComponent({
      type: 'controls-only',
      controls: VALID_CONTROLS,
    });
    const undoBtn = instance.element.querySelector('.undo-btn');
    const redoBtn = instance.element.querySelector('.redo-btn');
    expect(undoBtn.getAttribute('aria-disabled')).to.equal('true');
    expect(redoBtn.getAttribute('aria-disabled')).to.equal('true');

    document.dispatchEvent(new CustomEvent('action-menu:history-index-changed', {
      detail: { historyIndex: 1, historyLength: 3 },
      bubbles: true,
    }));
    expect(undoBtn.getAttribute('aria-disabled')).to.equal('false');
    expect(redoBtn.getAttribute('aria-disabled')).to.equal('false');

    document.dispatchEvent(new CustomEvent('action-menu:history-index-changed', {
      detail: { historyIndex: 0, historyLength: 3 },
      bubbles: true,
    }));
    expect(undoBtn.getAttribute('aria-disabled')).to.equal('true');
    expect(redoBtn.getAttribute('aria-disabled')).to.equal('false');
  });
});
