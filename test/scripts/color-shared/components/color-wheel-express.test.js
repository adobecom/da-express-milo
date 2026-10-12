/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../../../../express/code/scripts/color-shared/components/color-wheel-express/index.js';

describe('color-wheel-express resizing', () => {
  let wheel;
  let host;
  let notify;
  let clock;
  let disconnect;

  beforeEach(async () => {
    clock = sinon.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    disconnect = sinon.spy();
    sinon.stub(window, 'ResizeObserver').callsFake(function observer(callback) {
      notify = callback;
      this.observe = () => {};
      this.disconnect = disconnect;
    });
    host = document.createElement('div');
    host.style.width = '320px';
    wheel = document.createElement('color-wheel-express');
    host.append(wheel);
    document.body.append(host);
    await wheel.updateComplete;
  });

  afterEach(() => {
    host.remove();
    sinon.restore();
  });

  async function resize() {
    notify();
    clock.tick(16);
    await wheel.updateComplete;
  }

  it('sizes the canvas on load and resize in the scheduled frame', async () => {
    await resize();
    expect(wheel.wheelRadius).to.equal(160);
    expect(wheel.shadowRoot.querySelector('canvas.wheel').width).to.equal(320);

    for (const width of [500, 240, 400]) {
      host.style.width = `${width}px`;
      await resize();
      expect(wheel.wheelRadius).to.equal(width / 2);
      expect(wheel.shadowRoot.querySelector('.wheel-wrapper').offsetHeight).to.equal(width);
      expect(wheel.shadowRoot.querySelector('canvas.wheel').width).to.equal(width);
    }
  });

  it('does not redraw when only the container height changes', async () => {
    await resize();
    const redraw = sinon.spy(wheel, 'generateColorWheel');
    const render = sinon.spy(wheel, 'requestUpdate');
    wheel.container.style.height = '420px';
    await resize();
    expect(redraw.called).to.equal(false);
    expect(render.called).to.equal(false);
    expect(wheel.wheelRadius).to.equal(160);
  });

  it('preserves the radius while hidden and resizes when shown again', async () => {
    await resize();
    host.style.display = 'none';
    host.style.width = '500px';
    await resize();
    expect(wheel.wheelRadius).to.equal(160);
    host.style.display = '';
    await resize();
    expect(wheel.wheelRadius).to.equal(250);
  });

  it('defers writes and coalesces notifications using the latest width', async () => {
    const update = sinon.spy(wheel, 'updateRadius');
    host.style.width = '400px';
    notify();
    notify();
    expect(update.called).to.equal(false);
    host.style.width = '500px';
    clock.tick(16);
    await wheel.updateComplete;
    expect(update.calledOnce).to.equal(true);
    expect(wheel.wheelRadius).to.equal(250);
  });

  it('cancels pending resize work when removed', () => {
    const update = sinon.spy(wheel, 'updateRadius');
    notify();
    host.remove();
    clock.tick(16);
    expect(update.called).to.equal(false);
    expect(disconnect.calledOnce).to.equal(true);
  });
});
