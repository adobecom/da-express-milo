import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
  createColorInput,
  shouldAutoFocusColorEditInput,
} from '../../../../express/code/blocks/color-contrast-checker/renderers/components/createColorInput.js';

function waitForFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
}

async function waitForElement(selector, attempts = 10) {
  for (let index = 0; index < attempts; index += 1) {
    const element = document.body.querySelector(selector);
    if (element) return element;
    await waitForFrame();
  }

  return null;
}

async function waitForCondition(predicate, attempts = 10) {
  for (let index = 0; index < attempts; index += 1) {
    if (predicate()) return true;
    await waitForFrame();
  }

  return false;
}

async function waitFrames(count = 1) {
  for (let index = 0; index < count; index += 1) {
    await waitForFrame();
  }
}

function stubViewport(matchMediaStub, { mobile = false, tablet = false } = {}) {
  matchMediaStub.callsFake((query) => ({
    matches: (query === '(max-width: 599px)' && mobile)
      || (query === '(min-width: 600px) and (max-width: 1199px)' && tablet),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
}

function dispatchPointerClick(element) {
  element.dispatchEvent(new PointerEvent('pointerdown', {
    bubbles: true,
    composed: true,
  }));
  element.dispatchEvent(new PointerEvent('pointerup', {
    bubbles: true,
    composed: true,
  }));
  element.dispatchEvent(new MouseEvent('click', {
    bubbles: true,
    composed: true,
  }));
}

describe('createColorInput', () => {
  let matchMediaStub;

  beforeEach(() => {
    matchMediaStub = sinon.stub(window, 'matchMedia');
    stubViewport(matchMediaStub, { mobile: true });
  });

  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('treats color-edit changes as live input and commits once on close', async () => {
    const onInput = sinon.spy();
    const onChange = sinon.spy();
    const input = createColorInput({
      label: 'Foreground color',
      value: '#FFFFFF',
      onInput,
      onChange,
    });

    document.body.appendChild(input.element);
    input.element.querySelector('.ax-color-input__swatch').click();

    const editor = await waitForElement('color-edit');
    expect(editor).to.exist;

    editor.dispatchEvent(new CustomEvent('color-change', {
      detail: { hex: '#111111' },
      bubbles: true,
      composed: true,
    }));
    editor.dispatchEvent(new CustomEvent('color-change', {
      detail: { hex: '#222222' },
      bubbles: true,
      composed: true,
    }));

    expect(onInput.callCount).to.equal(2);
    expect(onChange.callCount).to.equal(0);

    editor.dispatchEvent(new CustomEvent('panel-close', {
      bubbles: true,
      composed: true,
    }));

    expect(onChange.callCount).to.equal(1);
    expect(onChange.firstCall.args[0]).to.deep.equal({ value: '#222222' });
    expect(input.getValue()).to.equal('#222222');
    expect(matchMediaStub.called).to.be.true;
  });

  it('auto-focuses the color-edit hex input on desktop only', () => {
    stubViewport(matchMediaStub, { mobile: false, tablet: false });
    expect(shouldAutoFocusColorEditInput()).to.be.true;
  });

  // Fix test MWPW-192264
  it.skip('does not auto-focus the color-edit hex input on mobile', async () => {
    stubViewport(matchMediaStub, { mobile: true, tablet: false });
    await import('../../../../express/code/scripts/color-shared/components/color-edit/index.js');
    const ColorEdit = customElements.get('color-edit');
    const focusInputStub = sinon.stub(ColorEdit.prototype, 'focusInput').resolves();

    const input = createColorInput({
      label: 'Foreground color',
      value: '#FFFFFF',
    });

    document.body.appendChild(input.element);
    input.element.querySelector('.ax-color-input__swatch').click();

    await waitForElement('color-edit');
    await waitFrames(3);

    expect(focusInputStub.called).to.be.false;
    expect(shouldAutoFocusColorEditInput()).to.be.false;
  });

  // Fix test MWPW-192264
  it.skip('does not auto-focus the color-edit hex input on tablet', async () => {
    stubViewport(matchMediaStub, { mobile: false, tablet: true });
    await import('../../../../express/code/scripts/color-shared/components/color-edit/index.js');
    const ColorEdit = customElements.get('color-edit');
    const focusInputStub = sinon.stub(ColorEdit.prototype, 'focusInput').resolves();

    const input = createColorInput({
      label: 'Foreground color',
      value: '#FFFFFF',
    });

    document.body.appendChild(input.element);
    input.element.querySelector('.ax-color-input__swatch').click();

    await waitForElement('color-edit');
    await waitFrames(3);

    expect(focusInputStub.called).to.be.false;
    expect(shouldAutoFocusColorEditInput()).to.be.false;
  });

  it('does not open the picker from the text input or field, but opens from the dot', async () => {
    const input = createColorInput({ label: 'Foreground color', value: '#FFFFFF' });
    document.body.appendChild(input.element);
    const textInput = input.element.querySelector('.ax-color-input__input');
    const field = input.element.querySelector('.ax-color-input__field');
    const swatch = input.element.querySelector('.ax-color-input__swatch');

    textInput.click();
    dispatchPointerClick(textInput);
    dispatchPointerClick(field);
    await waitFrames(3);
    expect(document.body.querySelector('color-edit')).to.be.null;

    dispatchPointerClick(swatch);
    expect(await waitForElement('color-edit')).to.exist;
  });

  it('opens the picker on Enter from the text input', async () => {
    const input = createColorInput({ label: 'Foreground color', value: '#FFFFFF' });
    document.body.appendChild(input.element);
    input.element.querySelector('.ax-color-input__input')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(await waitForElement('color-edit')).to.exist;
  });

  it('allows direct HEX entry and restores the last valid value on invalid change', () => {
    const onInput = sinon.spy();
    const onChange = sinon.spy();
    const input = createColorInput({
      label: 'Foreground color', value: '#FFFFFF', onInput, onChange,
    });
    document.body.appendChild(input.element);
    const textInput = input.element.querySelector('.ax-color-input__input');

    expect(textInput.hasAttribute('readonly')).to.be.false;

    textInput.value = '#123456';
    textInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(onInput.lastCall.args[0]).to.deep.equal({ value: '#123456' });

    textInput.dispatchEvent(new Event('change', { bubbles: true }));
    expect(onChange.lastCall.args[0]).to.deep.equal({ value: '#123456' });

    textInput.value = 'zzz';
    textInput.dispatchEvent(new Event('change', { bubbles: true }));
    expect(onChange.callCount).to.equal(1);
    expect(input.getValue()).to.equal('#FFFFFF');
  });

  // Fix test MWPW-192264
  it.skip('switches from one desktop color input to the other without immediately closing', async () => {
    stubViewport(matchMediaStub, { mobile: false, tablet: false });

    const foregroundInput = createColorInput({
      label: 'Foreground color',
      value: '#FFFFFF',
    });
    const backgroundInput = createColorInput({
      label: 'Background color',
      value: '#000000',
    });

    document.body.appendChild(foregroundInput.element);
    document.body.appendChild(backgroundInput.element);

    const foregroundField = foregroundInput.element.querySelector('.ax-color-input__field');
    const backgroundField = backgroundInput.element.querySelector('.ax-color-input__field');
    const backgroundSwatch = backgroundInput.element.querySelector('.ax-color-input__swatch');

    dispatchPointerClick(foregroundInput.element.querySelector('.ax-color-input__swatch'));

    const foregroundOpened = await waitForCondition(
      () => foregroundField.nextElementSibling?.localName === 'sp-overlay',
      30,
    );
    expect(foregroundOpened).to.be.true;

    dispatchPointerClick(backgroundSwatch);

    const backgroundOpened = await waitForCondition(
      () => backgroundField.nextElementSibling?.localName === 'sp-overlay',
      30,
    );
    expect(backgroundOpened).to.be.true;

    await waitFrames(3);

    expect(foregroundField.nextElementSibling?.localName).to.not.equal('sp-overlay');
    expect(backgroundField.nextElementSibling?.localName).to.equal('sp-overlay');
    expect(document.body.querySelectorAll('color-edit')).to.have.lengthOf(1);
  });
});
