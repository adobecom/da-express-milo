import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { createColorInput } from '../../../../express/code/blocks/contrast-checker/renderers/components/createColorInput.js';

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

describe('createColorInput', () => {
  let matchMediaStub;

  beforeEach(() => {
    matchMediaStub = sinon.stub(window, 'matchMedia').callsFake((query) => ({
      matches: query === '(max-width: 599px)',
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }));
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
    input.element.querySelector('.ax-color-input__field').click();

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
});
