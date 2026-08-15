/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { serviceManager } from '../../../../express/code/libs/services/core/ServiceManager.js';
import {
  createColorModesHeader,
  createModeSelectFallback,
} from '../../../../express/code/scripts/color-shared/modal/createColorModesHeader.js';
import { setPreferredColorMode } from '../../../../express/code/scripts/color-shared/utils/colorModePreference.js';

const palette = { name: 'Jolly rancher palette', colors: ['#FF0000', '#00FF00'] };

function pickerElement(header) {
  return header.element.querySelector('.modal-color-mode-picker sp-picker');
}

function pickerItems(header) {
  return [...header.element.querySelectorAll('.modal-color-mode-picker sp-menu-item')];
}

function selectMode(header, mode) {
  const picker = pickerElement(header);
  picker.value = mode;
  picker.dispatchEvent(new Event('change'));
}

function codesTrigger(header) {
  return header.element.querySelector('.modal-codes-menu sp-action-button');
}

function codesItems(header) {
  return [...header.element.querySelectorAll('.modal-codes-menu sp-menu-item')];
}

describe('createColorModesHeader', () => {
  let header;
  let originalLana;

  beforeEach(() => {
    originalLana = window.lana;
    window.lana = { log: sinon.spy() };
    // requestAnimationFrame is throttled to ~1fps in background browser tabs
    // (concurrent WTR sessions). Use queueMicrotask so rAF-based retry loops
    // inside express-picker resolve immediately under load.
    sinon.stub(window, 'requestAnimationFrame').callsFake((cb) => {
      queueMicrotask(() => cb(0));
      return 0;
    });
  });

  afterEach(() => {
    header?.destroy?.();
    header = null;
    sinon.restore();
    setPreferredColorMode('HEX');
    document.body.innerHTML = '';
    if (originalLana === undefined) delete window.lana;
    else window.lana = originalLana;
  });

  async function mount(paletteArg, options) {
    header = createColorModesHeader(paletteArg, options);
    document.body.appendChild(header.element);
    await header.waitForReady();
    return header;
  }

  it('renders a real sp-picker (not a native select or custom popover) with HEX/RGB/HSB/Lab options', async () => {
    await mount(palette, { type: 'palette' });
    const picker = pickerElement(header);
    expect(picker.tagName).to.equal('SP-PICKER');
    expect(header.element.querySelector('select')).to.equal(null);

    const values = pickerItems(header).map((i) => i.getAttribute('value'));
    expect(values).to.deep.equal(['HEX', 'RGB', 'HSB', 'Lab']);
  });

  it('defaults to the persisted preferred color mode', async () => {
    setPreferredColorMode('RGB');
    await mount(palette, { type: 'palette' });
    expect(header.getMode()).to.equal('RGB');
    expect(pickerElement(header).value).to.equal('RGB');
  });

  it('gives the picker a static accessible name matching its visible label', async () => {
    await mount(palette, { type: 'palette' });
    // sp-picker caches whatever aria-label is present at first connect and
    // silently reapplies it on every later render, so this must be static
    // (not "Color mode: HEX") rather than reflecting the live selection.
    expect(pickerElement(header).getAttribute('aria-label')).to.equal('Color mode');

    selectMode(header, 'RGB');
    expect(pickerElement(header).getAttribute('aria-label')).to.equal('Color mode');
  });

  it('selecting a picker value persists the mode and notifies onModeChange', async () => {
    const onModeChange = sinon.stub();
    await mount(palette, { type: 'palette', onModeChange });

    selectMode(header, 'HSB');

    expect(onModeChange.calledWith('HSB')).to.equal(true);
    expect(header.getMode()).to.equal('HSB');
  });

  it('renders a codes menu trigger exposing LESS/CSS/SASS/XML formats with "Copy as" labels', async () => {
    await mount(palette, { type: 'palette' });
    codesTrigger(header).click();
    const items = codesItems(header);
    expect(items.map((i) => i.getAttribute('value'))).to.deep.equal(['less', 'css', 'scss', 'xml']);
    expect(items.map((i) => i.textContent)).to.deep.equal([
      'Copy as LESS',
      'Copy as CSS',
      'Copy as SASS',
      'Copy as XML',
    ]);
  });

  it('renders only "Copy as CSS" for gradients — LESS/SASS/XML have no gradient-aware export', async () => {
    await mount(palette, { type: 'gradient' });
    codesTrigger(header).click();
    const items = codesItems(header);
    expect(items.map((i) => i.getAttribute('value'))).to.deep.equal(['css']);
    expect(items.map((i) => i.textContent)).to.deep.equal(['Copy as CSS']);
  });

  it('renders the real sp-icon-code Spectrum icon', async () => {
    await mount(palette, { type: 'palette' });
    const trigger = codesTrigger(header);
    expect(trigger.querySelector('sp-icon-code')).to.exist;
  });

  it('selecting a codes format calls the download provider export method and copies to clipboard', async () => {
    const exportCSS = sinon.stub().resolves({ format: 'CSS', output: '.foo{}', clipboardSuccess: true });
    sinon.stub(serviceManager, 'getProvider').resolves({ exportCSS });

    await mount(palette, { type: 'palette' });
    codesTrigger(header).click();
    const cssItem = codesItems(header).find((i) => i.getAttribute('value') === 'css');
    cssItem.click();
    await new Promise((r) => { setTimeout(r, 0); });

    expect(exportCSS.calledOnce).to.equal(true);
    expect(exportCSS.firstCall.args[0]).to.include({ name: 'Jolly rancher palette' });
    expect(exportCSS.firstCall.args[1]).to.equal('HEX');
  });

  it('passes the currently-selected color mode to the export call, not just the default', async () => {
    const exportCSS = sinon.stub().resolves({ format: 'CSS', output: '', clipboardSuccess: true });
    sinon.stub(serviceManager, 'getProvider').resolves({ exportCSS });

    await mount(palette, { type: 'palette' });
    selectMode(header, 'HSB');
    codesTrigger(header).click();
    const cssItem = codesItems(header).find((i) => i.getAttribute('value') === 'css');
    cssItem.click();
    await new Promise((r) => { setTimeout(r, 0); });

    expect(exportCSS.firstCall.args[1]).to.equal('HSB');
  });

  it('marks themeData as a gradient asset when type is gradient', async () => {
    const exportCSS = sinon.stub().resolves({ format: 'CSS', output: '', clipboardSuccess: true });
    sinon.stub(serviceManager, 'getProvider').resolves({ exportCSS });

    await mount(palette, { type: 'gradient' });
    codesTrigger(header).click();
    const cssItem = codesItems(header).find((i) => i.getAttribute('value') === 'css');
    cssItem.click();
    await new Promise((r) => { setTimeout(r, 0); });

    expect(exportCSS.firstCall.args[0]).to.include({ assetType: 'gradient' });
  });

  it('destroy() tears down the picker and codes menu without throwing', async () => {
    await mount(palette, { type: 'palette' });
    expect(() => header.destroy()).to.not.throw();
  });

  it('regression: an unrelated body mutation before the header is inserted must not tear it down (was a real bug on slow first loads)', async () => {
    // Build the header but do NOT insert it yet — this recreates the real
    // gap where the caller builds the whole modal content tree detached,
    // then inserts it once everything else is ready. The self-cleaning
    // MutationObserver starts watching document.body immediately at
    // construction, before that insertion happens.
    header = createColorModesHeader(palette, { type: 'palette' });

    // An unrelated mutation elsewhere on the page, while the header is still
    // detached — previously mistaken for "the header was removed" and the
    // whole component was torn down before the modal ever opened.
    const decoy = document.createElement('div');
    document.body.appendChild(decoy);
    decoy.remove();
    await new Promise((resolve) => { queueMicrotask(resolve); });

    // Now really insert it, same as the real caller would.
    document.body.appendChild(header.element);
    await header.waitForReady();

    expect(header.element.querySelector('.modal-codes-menu')).to.exist;
    expect(pickerElement(header)).to.exist;
  });
});

describe('createModeSelectFallback', () => {
  let fallback;

  afterEach(() => {
    fallback?.destroy?.();
    fallback = null;
  });

  const options = [
    { value: 'HEX', label: 'HEX' },
    { value: 'RGB', label: 'RGB' },
  ];

  it('renders a native select with the given options and initial value selected', () => {
    fallback = createModeSelectFallback(options, 'RGB', 'Color mode', () => {});
    expect(fallback.element.tagName).to.equal('SELECT');
    expect(fallback.element.getAttribute('aria-label')).to.equal('Color mode');
    expect(fallback.element.value).to.equal('RGB');
    expect([...fallback.element.options].map((o) => o.value)).to.deep.equal(['HEX', 'RGB']);
  });

  it('calls onChange with the newly selected value', () => {
    const onChange = sinon.stub();
    fallback = createModeSelectFallback(options, 'HEX', 'Color mode', onChange);
    fallback.element.value = 'RGB';
    fallback.element.dispatchEvent(new Event('change'));
    expect(onChange.calledWith('RGB')).to.equal(true);
  });

  it('setValue() updates the select without emitting a change event', () => {
    const onChange = sinon.stub();
    fallback = createModeSelectFallback(options, 'HEX', 'Color mode', onChange);
    fallback.setValue('RGB');
    expect(fallback.element.value).to.equal('RGB');
    expect(onChange.called).to.equal(false);
  });

  it('destroy() removes the element and stops emitting onChange', () => {
    const onChange = sinon.stub();
    document.body.appendChild((fallback = createModeSelectFallback(options, 'HEX', 'Color mode', onChange)).element);
    const { element } = fallback;
    fallback.destroy();
    expect(element.isConnected).to.equal(false);
    element.value = 'RGB';
    element.dispatchEvent(new Event('change'));
    expect(onChange.called).to.equal(false);
  });
});
