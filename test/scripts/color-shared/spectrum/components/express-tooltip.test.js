/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setViewport } from '@web/test-runner-commands';
import { createExpressTooltip } from '../../../../../express/code/scripts/color-shared/spectrum/components/express-tooltip.js';

async function waitFor(condition, diagnostics = () => '') {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (condition()) return;
    await new Promise((resolve) => { setTimeout(resolve, 10); });
  }
  throw new Error(`Timed out waiting for tooltip ${diagnostics()}`);
}

describe('Express tooltip anchoring', () => {
  let target;
  let tip;
  let dialog;
  let viewport;

  beforeEach(async () => {
    viewport = { width: window.innerWidth, height: window.innerHeight };
    await setViewport({ width: 1200, height: 900 });
    target = document.createElement('button');
    target.type = 'button';
    target.textContent = 'Tooltip target';
    Object.assign(target.style, {
      position: 'absolute', left: '420px', top: '360px', width: '120px', height: '32px',
    });
    document.body.append(target);
  });

  afterEach(async () => {
    tip?.destroy();
    if (dialog?.open) dialog.close();
    dialog?.remove();
    target.remove();
    sinon.restore();
    await setViewport(viewport);
  });

  async function create(options = {}) {
    tip = await createExpressTooltip({
      targetEl: target, content: 'Tooltip help', delay: 0, ...options,
    });
    return tip.element.querySelector('sp-tooltip');
  }

  async function expectAnchored(tooltip, placement = 'top') {
    const overlay = tooltip.shadowRoot.querySelector('sp-overlay');
    const content = tooltip.shadowRoot.querySelector('sp-tooltip-openable');
    await waitFor(() => {
      const anchor = target.getBoundingClientRect();
      const box = content.getBoundingClientRect();
      const gap = placement === 'top' ? anchor.top - box.bottom : box.top - anchor.bottom;
      return tooltip.hasAttribute('open') && box.width > 0
        && Math.abs(box.left + box.width / 2 - anchor.left - anchor.width / 2) <= 2
        && Math.abs(gap - 8) <= 2;
    }, () => JSON.stringify({
      anchor: target.getBoundingClientRect(),
      content: content.getBoundingClientRect(),
      open: tooltip.open,
      overlayOpen: overlay.open,
      placement: overlay.placement,
      state: overlay.getAttribute('state'),
    }));
    expect(overlay.triggerElement).to.equal(target);
    expect(overlay.triggerInteraction).to.equal(undefined);
    const anchor = target.getBoundingClientRect();
    const box = content.getBoundingClientRect();
    expect(box.left + box.width / 2).to.be.closeTo(anchor.left + anchor.width / 2, 2);
    if (placement === 'top') expect(box.bottom).to.be.closeTo(anchor.top - 8, 2);
    else expect(box.top).to.be.closeTo(anchor.bottom + 8, 2);
  }

  it('positions against the actual target despite the zero-size theme wrapper', async () => {
    const tooltip = await create();
    expect(tip.element.getBoundingClientRect().width).to.equal(0);
    target.dispatchEvent(new PointerEvent('pointerenter'));
    await expectAnchored(tooltip);
    tip.setContent('Updated tooltip help');
    expect(tooltip.textContent).to.equal('Updated tooltip help');
    tip.hide();
    expect(tooltip.hasAttribute('open')).to.equal(false);
  });

  it('rebinds the target after moving the wrapper into and out of a native dialog', async () => {
    const tooltip = await create();
    dialog = document.createElement('dialog');
    Object.assign(dialog.style, {
      position: 'fixed', margin: '0', inset: '0', width: '100%', height: '100%',
    });
    document.body.append(dialog);
    dialog.append(target, tip.element);
    dialog.showModal();
    await tooltip.updateComplete;
    target.dispatchEvent(new PointerEvent('pointerenter'));
    await expectAnchored(tooltip);
    tip.hide();
    dialog.close();
    document.body.append(target, tip.element);
    target.style.left = '620px';
    await tooltip.updateComplete;
    target.dispatchEvent(new PointerEvent('pointerenter'));
    await expectAnchored(tooltip);
  });

  it('preserves requested placement and follows the target after it moves', async () => {
    const tooltip = await create({ placement: 'bottom' });
    target.dispatchEvent(new PointerEvent('pointerenter'));
    await expectAnchored(tooltip, 'bottom');
    tip.hide();
    target.style.top = '520px';
    target.dispatchEvent(new PointerEvent('pointerenter'));
    await expectAnchored(tooltip, 'bottom');
  });

  it('keeps the configured delay, popover suppression and activation dismissal', async () => {
    const tooltip = await create({ delay: 80, dismissOnActivate: true });
    target.setAttribute('aria-expanded', 'true');
    target.dispatchEvent(new PointerEvent('pointerenter'));
    await new Promise((resolve) => { setTimeout(resolve, 100); });
    expect(tooltip.hasAttribute('open')).to.equal(false);
    target.setAttribute('aria-expanded', 'false');
    target.dispatchEvent(new PointerEvent('pointerenter'));
    expect(tooltip.hasAttribute('open')).to.equal(false);
    await expectAnchored(tooltip);
    target.click();
    expect(tooltip.hasAttribute('open')).to.equal(false);
  });

  it('supports keyboard focus and Escape without Spectrum reopening the tooltip', async () => {
    const tooltip = await create();
    target.focus();
    await expectAnchored(tooltip);
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(tooltip.hasAttribute('open')).to.equal(false);
    await new Promise((resolve) => { setTimeout(resolve, 100); });
    expect(tooltip.hasAttribute('open')).to.equal(false);
    expect(document.activeElement).to.equal(target);
    expect(target.getAttribute('aria-describedby')).to.equal(tooltip.id);
  });

  it('anchors touch tooltips while preserving guarded dismissal and cleanup', async () => {
    const matchMedia = window.matchMedia.bind(window);
    sinon.stub(window, 'matchMedia').callsFake((query) => {
      const result = matchMedia(query);
      if (query === '(hover: none)') {
        return { matches: true, media: query };
      }
      return result;
    });
    const tooltip = await create();
    target.click();
    await expectAnchored(tooltip);
    tooltip.removeAttribute('open');
    await waitFor(() => tooltip.hasAttribute('open'));
    tip.hide();
    expect(tooltip.hasAttribute('open')).to.equal(false);
    tip.destroy();
    expect(target.hasAttribute('aria-describedby')).to.equal(false);
    expect(tip.element.isConnected).to.equal(false);
  });
});
