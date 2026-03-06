/* eslint-disable no-underscore-dangle */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import '../../../../express/code/scripts/color-shared/components/color-edit/index.js';

const SAMPLE_PALETTE = ['#FF5733', '#33FF57', '#3357FF', '#F1C40F', '#8E44AD'];

describe('ColorEdit component', () => {
  let el;

  async function createElement(props = {}) {
    el = document.createElement('color-edit');
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
      expect(customElements.get('color-edit')).to.exist;
    });

    it('has correct default property values', async () => {
      await createElement();
      expect(el.palette).to.deep.equal([]);
      expect(el.selectedIndex).to.equal(0);
      expect(el.colorMode).to.equal('RGB');
      expect(el.showPalette).to.be.true;
      expect(el.mobile).to.be.false;
      expect(el.open).to.be.false;
    });
  });

  describe('rendering (desktop)', () => {
    it('renders .color-edit-panel in shadow DOM', async () => {
      await createElement();
      expect(el.shadowRoot.querySelector('.color-edit-panel')).to.exist;
    });

    it('renders header with "Edit color" title', async () => {
      await createElement();
      const title = el.shadowRoot.querySelector('.ce-title');
      expect(title).to.exist;
      expect(title.textContent).to.equal('Edit color');
    });

    it('renders mode trigger button', async () => {
      await createElement();
      const trigger = el.shadowRoot.querySelector('.ce-mode-trigger');
      expect(trigger).to.exist;
    });

    it('embeds a <base-color> element', async () => {
      await createElement();
      const baseColor = el.shadowRoot.querySelector('base-color');
      expect(baseColor).to.exist;
    });

    it('does not render overlay in desktop mode', async () => {
      await createElement();
      expect(el.shadowRoot.querySelector('.ce-overlay')).to.be.null;
    });

    it('does not render drag handle in desktop mode', async () => {
      await createElement();
      expect(el.shadowRoot.querySelector('.ce-drag-handle')).to.be.null;
    });
  });

  describe('rendering (mobile)', () => {
    it('renders overlay and sheet when mobile is true', async () => {
      await createElement({ mobile: true });
      expect(el.shadowRoot.querySelector('.ce-overlay')).to.exist;
      expect(el.shadowRoot.querySelector('.ce-sheet')).to.exist;
    });

    it('renders drag handle when mobile is true', async () => {
      await createElement({ mobile: true });
      const handle = el.shadowRoot.querySelector('.ce-drag-handle');
      expect(handle).to.exist;
      expect(handle.querySelector('.ce-drag-pill')).to.exist;
    });

    it('overlay has "open" class when open is true', async () => {
      await createElement({ mobile: true, open: true });
      const overlay = el.shadowRoot.querySelector('.ce-overlay');
      expect(overlay.classList.contains('open')).to.be.true;
    });

    it('sheet has "open" class when open is true', async () => {
      await createElement({ mobile: true, open: true });
      const sheet = el.shadowRoot.querySelector('.ce-sheet');
      expect(sheet.classList.contains('open')).to.be.true;
    });
  });

  describe('palette rendering', () => {
    it('renders palette section when showPalette is true and palette has items', async () => {
      await createElement({ palette: [...SAMPLE_PALETTE], showPalette: true });
      const section = el.shadowRoot.querySelector('.ce-palette-section');
      expect(section).to.exist;
      expect(section.querySelector('.ce-palette-label').textContent).to.equal('Palette colors');
    });

    it('does not render palette section when showPalette is false', async () => {
      await createElement({ palette: [...SAMPLE_PALETTE], showPalette: false });
      expect(el.shadowRoot.querySelector('.ce-palette-section')).to.be.null;
    });

    it('does not render palette section when palette is empty', async () => {
      await createElement({ palette: [], showPalette: true });
      expect(el.shadowRoot.querySelector('.ce-palette-section')).to.be.null;
    });
  });

  describe('palette sync', () => {
    it('syncs HSB from selected palette color', async () => {
      await createElement({ palette: [...SAMPLE_PALETTE], selectedIndex: 0 });
      expect(el._hue).to.be.a('number');
      expect(el._saturation).to.be.a('number');
      expect(el._brightness).to.be.a('number');
      expect(el._hex).to.match(/^#[0-9A-F]{6}$/);
    });

    it('updates internal HSB when selectedIndex changes', async () => {
      await createElement({ palette: [...SAMPLE_PALETTE], selectedIndex: 0 });
      const hue0 = el._hue;

      el.selectedIndex = 2;
      await el.updateComplete;
      expect(el._hue).to.not.equal(hue0);
    });

    it('updates internal HSB when palette changes', async () => {
      await createElement({ palette: ['#FF0000'], selectedIndex: 0 });
      expect(el._hue).to.be.closeTo(0, 1);

      el.palette = ['#0000FF'];
      await el.updateComplete;
      expect(el._hue).to.be.closeTo(240, 1);
    });

    it('handles empty palette gracefully', async () => {
      await createElement({ palette: [], selectedIndex: 0 });
      expect(el._hue).to.be.a('number');
      expect(el._hex).to.match(/^#[0-9A-F]{6}$/);
    });
  });

  describe('computed values', () => {
    it('_hex returns a valid hex string', async () => {
      await createElement({ palette: [...SAMPLE_PALETTE], selectedIndex: 0 });
      expect(el._hex).to.match(/^#[0-9A-F]{6}$/);
    });

    it('_rgb returns an object with red, green, blue', async () => {
      await createElement({ palette: ['#FF0000'], selectedIndex: 0 });
      const rgb = el._rgb;
      expect(rgb).to.have.property('red');
      expect(rgb).to.have.property('green');
      expect(rgb).to.have.property('blue');
    });
  });

  describe('events', () => {
    it('dispatches color-change with hex, rgb, index, and HSB', async () => {
      await createElement({ palette: [...SAMPLE_PALETTE], selectedIndex: 1 });
      const spy = sinon.spy();
      el.addEventListener('color-change', spy);

      el._emitColorChange();

      expect(spy.calledOnce).to.be.true;
      const { detail } = spy.firstCall.args[0];
      expect(detail).to.have.property('hex');
      expect(detail).to.have.property('rgb');
      expect(detail).to.have.property('index', 1);
      expect(detail).to.have.property('hue');
      expect(detail).to.have.property('saturation');
      expect(detail).to.have.property('brightness');
    });

    it('color-change event bubbles and is composed', async () => {
      await createElement({ palette: [...SAMPLE_PALETTE], selectedIndex: 0 });
      const spy = sinon.spy();
      document.addEventListener('color-change', spy);

      el._emitColorChange();

      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0].bubbles).to.be.true;
      expect(spy.firstCall.args[0].composed).to.be.true;
      document.removeEventListener('color-change', spy);
    });

    it('dispatches swatch-select when a different swatch is clicked', async () => {
      await createElement({ palette: [...SAMPLE_PALETTE], selectedIndex: 0 });
      const spy = sinon.spy();
      el.addEventListener('swatch-select', spy);

      el._onSwatchClick(3);

      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0].detail.index).to.equal(3);
      expect(el.selectedIndex).to.equal(3);
    });

    it('does not dispatch swatch-select when same swatch is clicked', async () => {
      await createElement({ palette: [...SAMPLE_PALETTE], selectedIndex: 2 });
      const spy = sinon.spy();
      el.addEventListener('swatch-select', spy);

      el._onSwatchClick(2);

      expect(spy.called).to.be.false;
    });

    it('dispatches mode-change when mode is selected', async () => {
      await createElement();
      const spy = sinon.spy();
      el.addEventListener('mode-change', spy);

      el._onModeSelect('HEX');

      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0].detail.mode).to.equal('HEX');
      expect(el.colorMode).to.equal('HEX');
    });

    it('dispatches panel-close when hide() is called', async () => {
      await createElement({ mobile: true, open: true });
      const spy = sinon.spy();
      el.addEventListener('panel-close', spy);

      el.hide();
      await new Promise((r) => { setTimeout(r, 400); });

      expect(spy.calledOnce).to.be.true;
      expect(el.open).to.be.false;
    });
  });

  describe('show / hide', () => {
    it('show() sets open to true', async () => {
      await createElement({ mobile: true });
      expect(el.open).to.be.false;
      el.show();
      expect(el.open).to.be.true;
    });

    it('hide() sets open to false and dispatches panel-close', async () => {
      await createElement({ mobile: true, open: true });
      const spy = sinon.spy();
      el.addEventListener('panel-close', spy);

      el.hide();
      await new Promise((r) => { setTimeout(r, 400); });

      expect(el.open).to.be.false;
      expect(spy.calledOnce).to.be.true;
    });

    it('open attribute is reflected on the host element', async () => {
      await createElement({ mobile: true });
      expect(el.hasAttribute('open')).to.be.false;
      el.show();
      await el.updateComplete;
      expect(el.hasAttribute('open')).to.be.true;
    });

    it('mobile attribute is reflected on the host element', async () => {
      await createElement({ mobile: true });
      expect(el.hasAttribute('mobile')).to.be.true;
    });
  });

  describe('mode menu', () => {
    it('_toggleModeMenu flips _modeMenuOpen', async () => {
      await createElement();
      expect(el._modeMenuOpen).to.be.false;
      await el._toggleModeMenu();
      expect(el._modeMenuOpen).to.be.true;
      await el._toggleModeMenu();
      expect(el._modeMenuOpen).to.be.false;
    });

    it('_onModeSelect closes menu and updates colorMode', async () => {
      await createElement();
      el._modeMenuOpen = true;
      el._onModeSelect('HEX');
      expect(el._modeMenuOpen).to.be.false;
      expect(el.colorMode).to.equal('HEX');
    });

    it('_onModeMenuChange ignores invalid modes', async () => {
      await createElement();
      const spy = sinon.spy();
      el.addEventListener('mode-change', spy);

      el._onModeMenuChange({ target: { value: 'INVALID' } });

      expect(spy.called).to.be.false;
      expect(el.colorMode).to.equal('RGB');
    });
  });

  describe('HEX input', () => {
    it('renders HEX input section when colorMode is HEX', async () => {
      await createElement({ colorMode: 'HEX' });
      expect(el.shadowRoot.querySelector('.ce-hex-section')).to.exist;
    });

    it('does not render HEX input section when colorMode is RGB', async () => {
      await createElement({ colorMode: 'RGB' });
      expect(el.shadowRoot.querySelector('.ce-hex-section')).to.be.null;
    });

    it('_onHexInput updates color from valid hex', async () => {
      await createElement({ palette: ['#FF0000'], selectedIndex: 0, colorMode: 'HEX' });
      const spy = sinon.spy();
      el.addEventListener('color-change', spy);

      el._onHexInput({ target: { value: '#00FF00' } });

      expect(el._hue).to.be.closeTo(120, 1);
      expect(spy.calledOnce).to.be.true;
    });

    it('_onHexInput ignores invalid hex', async () => {
      await createElement({ palette: ['#FF0000'], selectedIndex: 0, colorMode: 'HEX' });
      const spy = sinon.spy();
      el.addEventListener('color-change', spy);

      el._onHexInput({ target: { value: 'not-a-hex' } });

      expect(spy.called).to.be.false;
    });
  });

  describe('base-color integration', () => {
    it('passes current hex to base-color', async () => {
      await createElement({ palette: [...SAMPLE_PALETTE], selectedIndex: 0 });
      const baseColor = el.shadowRoot.querySelector('base-color');
      expect(baseColor).to.exist;
      expect(baseColor.getAttribute('color')).to.match(/^#[0-9A-F]{6}$/i);
    });

    it('disables header on embedded base-color', async () => {
      await createElement();
      const baseColor = el.shadowRoot.querySelector('base-color');
      expect(baseColor.showHeader).to.be.false;
    });

    it('updates HSB when base-color emits color-change', async () => {
      await createElement({ palette: [...SAMPLE_PALETTE], selectedIndex: 0 });
      const spy = sinon.spy();
      el.addEventListener('color-change', spy);

      el._onBaseColorChange({ detail: { hue: 180, saturation: 50, brightness: 75 } });

      expect(el._hue).to.equal(180);
      expect(el._saturation).to.equal(50);
      expect(el._brightness).to.equal(75);
      expect(spy.calledOnce).to.be.true;
    });
  });

  describe('screen reader announcements', () => {
    it('schedules a debounced announcement on _emitColorChange', async () => {
      await createElement({ palette: ['#FF0000'], selectedIndex: 0, colorMode: 'RGB' });
      expect(el._announceTimer).to.not.be.ok;
      el._emitColorChange();
      expect(el._announceTimer).to.be.ok;
    });

    it('builds RGB announcement message when colorMode is RGB', async () => {
      await createElement({ palette: ['#FF0000'], selectedIndex: 0, colorMode: 'RGB' });
      el._emitColorChange();
      expect(el._announceTimer).to.not.be.null;
    });

    it('debounces rapid color changes (only last timer survives)', async () => {
      await createElement({ palette: ['#FF0000'], selectedIndex: 0, colorMode: 'RGB' });
      el._emitColorChange();
      const firstTimer = el._announceTimer;
      el._hue = 120;
      el._emitColorChange();
      expect(el._announceTimer).to.not.equal(firstTimer);
    });

    it('clears announce timer on disconnect', async () => {
      await createElement({ palette: ['#FF0000'], selectedIndex: 0, colorMode: 'RGB' });
      el._emitColorChange();
      expect(el._announceTimer).to.not.be.null;
      el.remove();
      expect(el._announceTimer).to.be.null;
    });
  });

  describe('color-blindness demo scenario', () => {
    it('works with palette-based setup from the demo', async () => {
      await createElement({
        palette: [...SAMPLE_PALETTE],
        showPalette: true,
        colorMode: 'RGB',
      });

      expect(el.shadowRoot.querySelector('.color-edit-panel')).to.exist;
      expect(el.shadowRoot.querySelector('.ce-palette-section')).to.exist;
      expect(el.shadowRoot.querySelector('base-color')).to.exist;

      const spy = sinon.spy();
      el.addEventListener('color-change', spy);
      el._emitColorChange();
      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0].detail).to.have.property('index', 0);
    });

    it('works without palette from the demo', async () => {
      await createElement({
        palette: [],
        showPalette: false,
        colorMode: 'RGB',
      });

      expect(el.shadowRoot.querySelector('.color-edit-panel')).to.exist;
      expect(el.shadowRoot.querySelector('.ce-palette-section')).to.be.null;
      expect(el.shadowRoot.querySelector('base-color')).to.exist;
    });

    it('works in mobile mode with show/hide', async () => {
      await createElement({
        palette: [...SAMPLE_PALETTE],
        showPalette: true,
        colorMode: 'RGB',
        mobile: true,
      });

      expect(el.shadowRoot.querySelector('.ce-overlay')).to.exist;
      expect(el.shadowRoot.querySelector('.ce-drag-handle')).to.exist;

      el.show();
      await el.updateComplete;
      expect(el.open).to.be.true;
      expect(el.shadowRoot.querySelector('.ce-overlay.open')).to.exist;

      const spy = sinon.spy();
      el.addEventListener('panel-close', spy);
      el.hide();
      await new Promise((r) => { setTimeout(r, 400); });
      expect(el.open).to.be.false;
      expect(spy.calledOnce).to.be.true;
    });
  });
});
