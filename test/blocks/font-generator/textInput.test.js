import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const [{ getLibs }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
await import(`${getLibs()}/utils/utils.js`).then((mod) => mod.setConfig({}));

const [
  { getState, setState },
  { default: createTextInput },
  { DEFAULT_PLACEHOLDERS },
] = await Promise.all([
  import('../../../express/code/blocks/font-generator/state.js'),
  import('../../../express/code/blocks/font-generator/textInput.js'),
  import('../../../express/code/blocks/font-generator/placeholders.js'),
]);

// Fake touch-ish event: the code only reads `.touches[0].clientY` and `.cancelable`.
function touchEvent(type, clientY) {
  const evt = new Event(type, { bubbles: true, cancelable: true });
  evt.touches = [{ clientY }];
  evt.changedTouches = [{ clientY }];
  return evt;
}

describe('font-generator/textInput', () => {
  beforeEach(() => setState({ previewText: '' }));
  afterEach(() => sinon.restore());

  it('builds the text input panel with a 200-char textarea', () => {
    const { panel } = createTextInput();
    expect(panel.classList.contains('font-generator-text-input')).to.be.true;
    const ta = panel.querySelector('textarea.label');
    expect(ta).to.exist;
    expect(ta.maxLength).to.equal(200);
  });

  it('applies placeholder and aria-label from strings', () => {
    const { panel } = createTextInput({ strings: DEFAULT_PLACEHOLDERS });
    const ta = panel.querySelector('textarea.label');
    expect(ta.placeholder).to.equal(DEFAULT_PLACEHOLDERS.previewPlaceholder);
    expect(ta.getAttribute('aria-label')).to.equal(DEFAULT_PLACEHOLDERS.inputLabel);
  });

  it('sets the "try these" label from strings', () => {
    const { panel } = createTextInput({ strings: DEFAULT_PLACEHOLDERS });
    expect(panel.querySelector('.text-wrapper').textContent).to.equal(DEFAULT_PLACEHOLDERS.tryThese);
  });

  it('renders a visible label from the placeholder, associated with the textarea', () => {
    const { panel } = createTextInput({ strings: DEFAULT_PLACEHOLDERS });
    const label = panel.querySelector('label.preview-text-label');
    const ta = panel.querySelector('textarea.label');
    expect(label).to.exist;
    expect(label.textContent).to.equal(DEFAULT_PLACEHOLDERS.previewTextLabel);
    expect(ta.id).to.have.length.greaterThan(0);
    expect(label.getAttribute('for')).to.equal(ta.id);
  });

  it('honours an authored preview-text label', () => {
    const strings = { ...DEFAULT_PLACEHOLDERS, previewTextLabel: 'Texto de vista previa' };
    const { panel } = createTextInput({ strings });
    expect(panel.querySelector('label.preview-text-label').textContent).to.equal('Texto de vista previa');
  });

  it('gives each instance a unique input id', () => {
    const a = createTextInput().panel.querySelector('textarea.label').id;
    const b = createTextInput().panel.querySelector('textarea.label').id;
    expect(a).to.not.equal(b);
  });

  it('shows the initial character count', () => {
    const { panel } = createTextInput();
    expect(panel.querySelector('.character-count').textContent).to.equal('0/200');
  });

  it('restores previewText and its count from the store', () => {
    setState({ previewText: 'Restored' });
    const { panel } = createTextInput();
    expect(panel.querySelector('textarea.label').value).to.equal('Restored');
    expect(panel.querySelector('.character-count').textContent).to.equal('8/200');
  });

  it('renders a suggestion pill per suggestion', () => {
    const { panel } = createTextInput({ suggestions: ['One', 'Two'] });
    expect(panel.querySelectorAll('.tag-pills').length).to.equal(2);
  });

  it('clicking a suggestion pill sets the preview text', () => {
    const { panel } = createTextInput({ suggestions: ['Pangram'] });
    document.body.append(panel);
    panel.querySelector('.tag-pills').click();
    expect(panel.querySelector('textarea.label').value).to.equal('Pangram');
    expect(getState().previewText).to.equal('Pangram');
    panel.remove();
  });

  it('activates a suggestion pill on Enter', () => {
    const { panel } = createTextInput({ suggestions: ['ViaKey'] });
    document.body.append(panel);
    panel.querySelector('.tag-pills').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(getState().previewText).to.equal('ViaKey');
    panel.remove();
  });

  it('updates the counter live as text is typed', () => {
    const { panel } = createTextInput();
    const ta = panel.querySelector('textarea.label');
    ta.value = 'abc';
    ta.dispatchEvent(new Event('input'));
    expect(panel.querySelector('.character-count').textContent).to.equal('3/200');
  });

  it('debounced typing updates previewText in the store', () => {
    const clock = sinon.useFakeTimers();
    const { panel } = createTextInput();
    const ta = panel.querySelector('textarea.label');
    ta.value = 'Typed';
    ta.dispatchEvent(new Event('input'));
    clock.tick(400);
    expect(getState().previewText).to.equal('Typed');
    clock.restore();
  });

  it('resizes the textarea on mouse drag via the handle', () => {
    const { panel } = createTextInput();
    document.body.append(panel);
    const ta = panel.querySelector('textarea.label');
    panel.querySelector('.resize-handle')
      .dispatchEvent(new MouseEvent('mousedown', { clientY: 100, bubbles: true, cancelable: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientY: 300 }));
    document.dispatchEvent(new MouseEvent('mouseup'));
    expect(parseInt(ta.style.height, 10)).to.be.greaterThan(104);
    panel.remove();
  });

  it('resizes the textarea on touch drag (mobile/tablet)', () => {
    const { panel } = createTextInput();
    document.body.append(panel);
    const ta = panel.querySelector('textarea.label');
    panel.querySelector('.resize-handle').dispatchEvent(touchEvent('touchstart', 100));
    document.dispatchEvent(touchEvent('touchmove', 300));
    document.dispatchEvent(touchEvent('touchend', 300));
    expect(parseInt(ta.style.height, 10)).to.be.greaterThan(104);
    panel.remove();
  });

  it('cleanup cancels a pending debounced input', () => {
    const clock = sinon.useFakeTimers();
    const { panel, unsubscribe } = createTextInput();
    const ta = panel.querySelector('textarea.label');
    ta.value = 'later';
    ta.dispatchEvent(new Event('input'));
    unsubscribe();
    clock.tick(400);
    expect(getState().previewText).to.equal('');
    clock.restore();
  });
});
