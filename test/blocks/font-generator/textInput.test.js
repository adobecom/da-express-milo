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

  it('builds the text input panel with a 2000-char textarea', () => {
    const { panel } = createTextInput();
    expect(panel.classList.contains('font-generator-text-input')).to.be.true;
    const ta = panel.querySelector('textarea.label');
    expect(ta).to.exist;
    expect(ta.maxLength).to.equal(2000);
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

  it('shows the initial character count', () => {
    const { panel } = createTextInput();
    expect(panel.querySelector('.character-count').textContent).to.equal('0/2,000');
  });

  it('restores previewText and its count from the store', () => {
    setState({ previewText: 'Restored' });
    const { panel } = createTextInput();
    expect(panel.querySelector('textarea.label').value).to.equal('Restored');
    expect(panel.querySelector('.character-count').textContent).to.equal('8/2,000');
  });

  it('uses maxLength from strings when provided', () => {
    const { panel } = createTextInput({ strings: { maxLength: 10 } });
    const ta = panel.querySelector('textarea.label');
    expect(ta.maxLength).to.equal(10);
    expect(panel.querySelector('.character-count').textContent).to.equal('0/10');
  });

  it('truncates an overlong restored previewText to the resolved limit', () => {
    setState({ previewText: 'This value is way too long for a ten char limit' });
    const { panel } = createTextInput({ strings: { maxLength: 10 } });
    const ta = panel.querySelector('textarea.label');
    expect(ta.value).to.equal('This value');
    expect(panel.querySelector('.character-count').textContent).to.equal('10/10');
    expect(getState().previewText).to.equal('This value');
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

  it('truncates a suggestion pill to the resolved character limit', () => {
    const { panel } = createTextInput({ suggestions: ['A pangram far too long'], strings: { maxLength: 10 } });
    document.body.append(panel);
    panel.querySelector('.tag-pills').click();
    expect(panel.querySelector('textarea.label').value).to.equal('A pangram ');
    expect(getState().previewText).to.equal('A pangram ');
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
    expect(panel.querySelector('.character-count').textContent).to.equal('3/2,000');
  });

  it('formats counts of 1,000 or more with thousands separators', () => {
    const { panel } = createTextInput({ strings: { maxLength: 2200 } });
    const ta = panel.querySelector('textarea.label');
    ta.value = 'a'.repeat(1234);
    ta.dispatchEvent(new Event('input'));
    expect(panel.querySelector('.character-count').textContent).to.equal('1,234/2,200');
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
