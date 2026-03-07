/* eslint-disable no-underscore-dangle */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import '../../../../express/code/scripts/color-shared/components/base-color/index.js';

describe('BaseColor component', () => {
  let el;

  async function createElement(props = {}) {
    el = document.createElement('base-color');
    Object.assign(el, props);
    document.body.appendChild(el);
    await el.updateComplete;
    return el;
  }

  afterEach(async () => {
    sinon.restore();
    if (el?.parentNode) el.remove();
    el = null;
    await new Promise((r) => setTimeout(r, 50));
  });

  describe('registration and defaults', () => {
    it('is registered as a custom element', () => {
      expect(customElements.get('base-color')).to.exist;
    });

    it('has correct default property values', async () => {
      await createElement();
      expect(el.color).to.equal('#FF0000');
      expect(el.colorMode).to.equal('HEX');
      expect(el.showHeader).to.be.true;
      expect(el.showBrightnessControl).to.be.true;
      expect(el._isLocked).to.be.false;
    });
  });

  describe('rendering (desktop)', () => {
    it('renders .base-color-panel in shadow DOM', async () => {
      await createElement();
      expect(el.shadowRoot.querySelector('.base-color-panel')).to.exist;
    });

    it('renders header when showHeader is true', async () => {
      await createElement({ showHeader: true });
      expect(el.shadowRoot.querySelector('.bc-header')).to.exist;
      expect(el.shadowRoot.querySelector('.bc-title')).to.exist;
    });

    it('hides header when showHeader is false', async () => {
      await createElement({ showHeader: false });
      expect(el.shadowRoot.querySelector('.bc-header')).to.be.null;
    });

    it('renders color-control section with sp-color-area and sp-color-slider', async () => {
      await createElement();
      const control = el.shadowRoot.querySelector('.bc-color-control');
      expect(control).to.exist;
      expect(control.querySelector('.bc-color-area-wrapper')).to.exist;
    });

    it('does not render overlay or sheet elements', async () => {
      await createElement();
      expect(el.shadowRoot.querySelector('.bc-overlay')).to.be.null;
      expect(el.shadowRoot.querySelector('.bc-sheet')).to.be.null;
    });
  });

  describe('color sync', () => {
    it('syncs HSB from hex color #FF0000 (pure red)', async () => {
      await createElement({ color: '#FF0000' });
      expect(el._hue).to.be.closeTo(0, 1);
      expect(el._saturation).to.be.closeTo(100, 1);
      expect(el._brightness).to.be.closeTo(100, 1);
    });

    it('syncs HSB from hex color #00FF00 (pure green)', async () => {
      await createElement({ color: '#00FF00' });
      expect(el._hue).to.be.closeTo(120, 1);
      expect(el._saturation).to.be.closeTo(100, 1);
      expect(el._brightness).to.be.closeTo(100, 1);
    });

    it('syncs HSB from hex color #0000FF (pure blue)', async () => {
      await createElement({ color: '#0000FF' });
      expect(el._hue).to.be.closeTo(240, 1);
      expect(el._saturation).to.be.closeTo(100, 1);
      expect(el._brightness).to.be.closeTo(100, 1);
    });

    it('updates internal HSB when color property changes', async () => {
      await createElement({ color: '#FF0000' });
      expect(el._hue).to.be.closeTo(0, 1);
      el.color = '#0000FF';
      await el.updateComplete;
      expect(el._hue).to.be.closeTo(240, 1);
    });

    it('handles achromatic colors (black / white)', async () => {
      await createElement({ color: '#000000' });
      expect(el._brightness).to.be.closeTo(0, 1);

      el.color = '#FFFFFF';
      await el.updateComplete;
      expect(el._brightness).to.be.closeTo(100, 1);
      expect(el._saturation).to.be.closeTo(0, 1);
    });
  });

  describe('computed values', () => {
    it('_hex returns a valid uppercase hex string', async () => {
      await createElement({ color: '#FF0000' });
      expect(el._hex).to.match(/^#[0-9A-F]{6}$/);
    });

    it('_rgb returns correct RGB object for red', async () => {
      await createElement({ color: '#FF0000' });
      const { red, green, blue } = el._rgb;
      expect(red).to.equal(255);
      expect(green).to.equal(0);
      expect(blue).to.equal(0);
    });

    it('_hsb returns an object with h, s, b', async () => {
      await createElement({ color: '#FF0000' });
      const hsb = el._hsb;
      expect(hsb).to.have.keys('h', 's', 'b');
    });

    it('_hsl returns an object with hue, saturation, lightness', async () => {
      await createElement({ color: '#FF0000' });
      const hsl = el._hsl;
      expect(hsl).to.have.property('hue');
      expect(hsl).to.have.property('saturation');
      expect(hsl).to.have.property('lightness');
    });

    it('_lab returns an object with l, a, b', async () => {
      await createElement({ color: '#FF0000' });
      const lab = el._lab;
      expect(lab).to.have.keys('l', 'a', 'b');
    });
  });

  describe('color mode display (_colorValue)', () => {
    it('returns hex string in HEX mode', async () => {
      await createElement({ color: '#FF0000', colorMode: 'HEX' });
      expect(el._colorValue).to.match(/^#[0-9A-F]{6}$/);
    });

    it('returns "R, G, B" format in RGB mode', async () => {
      await createElement({ color: '#FF0000', colorMode: 'RGB' });
      expect(el._colorValue).to.equal('255, 0, 0');
    });

    it('returns "H°, S%, B%" format in HSB mode', async () => {
      await createElement({ color: '#FF0000', colorMode: 'HSB' });
      expect(el._colorValue).to.match(/^\d+°, \d+%, \d+%$/);
    });

    it('returns "L, a, b" format in Lab mode', async () => {
      await createElement({ color: '#FF0000', colorMode: 'Lab' });
      expect(el._colorValue).to.match(/^-?\d+, -?\d+, -?\d+$/);
    });
  });

  describe('events', () => {
    it('dispatches color-change with full detail payload', async () => {
      await createElement({ color: '#FF0000' });
      const spy = sinon.spy();
      el.addEventListener('color-change', spy);

      el._emitColorChange();

      expect(spy.calledOnce).to.be.true;
      const { detail } = spy.firstCall.args[0];
      expect(detail).to.have.property('hex');
      expect(detail).to.have.property('rgb');
      expect(detail).to.have.property('hsb');
      expect(detail).to.have.property('hsl');
      expect(detail).to.have.property('lab');
      expect(detail).to.have.property('hue');
      expect(detail).to.have.property('saturation');
      expect(detail).to.have.property('brightness');
    });

    it('color-change event bubbles and is composed', async () => {
      await createElement({ color: '#FF0000' });
      const spy = sinon.spy();
      document.addEventListener('color-change', spy);

      el._emitColorChange();

      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0].bubbles).to.be.true;
      expect(spy.firstCall.args[0].composed).to.be.true;
      document.removeEventListener('color-change', spy);
    });

    it('dispatches mode-change when mode is selected', async () => {
      await createElement();
      const spy = sinon.spy();
      el.addEventListener('mode-change', spy);

      el._onModeSelect('RGB');

      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0].detail.mode).to.equal('RGB');
      expect(el.colorMode).to.equal('RGB');
      expect(el._modeMenuOpen).to.be.false;
    });

    it('dispatches lock-change when lock is toggled', async () => {
      await createElement();
      const spy = sinon.spy();
      el.addEventListener('lock-change', spy);

      el._toggleLock();

      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0].detail.locked).to.be.true;
      expect(el._isLocked).to.be.true;
    });

  });

  describe('lock behavior', () => {
    it('toggling lock twice returns to unlocked', async () => {
      await createElement();
      el._toggleLock();
      expect(el._isLocked).to.be.true;
      el._toggleLock();
      expect(el._isLocked).to.be.false;
    });

    it('_isLocked state tracks lock toggles', async () => {
      await createElement();
      expect(el._isLocked).to.be.false;
      el._toggleLock();
      expect(el._isLocked).to.be.true;
      el._toggleLock();
      expect(el._isLocked).to.be.false;
    });
  });

  describe('mode menu', () => {
    it('_onModeSelect closes menu and updates colorMode', async () => {
      await createElement();
      el._modeMenuOpen = true;
      el._onModeSelect('Lab');
      expect(el._modeMenuOpen).to.be.false;
      expect(el.colorMode).to.equal('Lab');
    });
  });

  describe('HEX color value input', () => {
    it('accepts valid 6-digit hex with #', async () => {
      await createElement({ color: '#FF0000', colorMode: 'HEX' });
      const spy = sinon.spy();
      el.addEventListener('color-change', spy);

      el._onColorValueInput({ target: { value: '#00FF00' } });

      expect(el.color).to.equal('#00FF00');
      expect(spy.calledOnce).to.be.true;
    });

    it('accepts valid 6-digit hex without #', async () => {
      await createElement({ color: '#FF0000', colorMode: 'HEX' });
      const spy = sinon.spy();
      el.addEventListener('color-change', spy);

      el._onColorValueInput({ target: { value: '0000FF' } });

      expect(el.color).to.equal('#0000FF');
      expect(spy.calledOnce).to.be.true;
    });

    it('ignores invalid hex input', async () => {
      await createElement({ color: '#FF0000', colorMode: 'HEX' });
      const spy = sinon.spy();
      el.addEventListener('color-change', spy);

      el._onColorValueInput({ target: { value: 'ZZZZZZ' } });

      expect(el.color).to.equal('#FF0000');
      expect(spy.called).to.be.false;
    });
  });

  describe('color-blindness demo scenario', () => {
    it('works with the exact setup used in color-blindness block', async () => {
      await createElement({
        color: '#FF0000',
        colorMode: 'HEX',
        showHeader: true,
      });

      expect(el.shadowRoot.querySelector('.base-color-panel')).to.exist;
      expect(el.shadowRoot.querySelector('.bc-header')).to.exist;
      expect(el._hex).to.equal('#FF0000');

      const spy = sinon.spy();
      el.addEventListener('color-change', spy);
      el._emitColorChange();
      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0].detail.hex).to.equal('#FF0000');
    });
  });
});
