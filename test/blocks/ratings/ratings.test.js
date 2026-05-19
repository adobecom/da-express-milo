import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

// Set ?nala=ratings so isNalaTestRatings() returns true in ratings-utils.js.
// This bypasses IMS token validation and returns mock ratings data.
window.history.replaceState({}, '', '?nala=ratings');
window.isTestEnv = true;
window.lana = { log: () => {} };

// Initialize setLibs (same pattern as app-ratings.test.js)
const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };
const imports = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
const { getLibs } = imports[0];
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({ locales });
});

const { default: decorate } = await import('../../../express/code/blocks/ratings/ratings.js');

// Poll until the submit button appears (block finishes async decoration)
async function waitForSlider(block, timeout = 8000) {
  const start = Date.now();
  while (!block.querySelector('input[type=submit]')) {
    if (Date.now() - start > timeout) return false;
    await new Promise((r) => { setTimeout(r, 100); });
  }
  return true;
}

// Poll until the no-slider (cannot-rate) state appears
async function waitForNoSlider(block, timeout = 8000) {
  const start = Date.now();
  while (!block.querySelector('.no-slider')) {
    if (Date.now() - start > timeout) return false;
    await new Promise((r) => { setTimeout(r, 100); });
  }
  return true;
}

describe('Ratings Block - syncSubmitDisabledState (WCAG 2.4.7)', () => {
  let block;

  beforeEach(async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    block = document.querySelector('.ratings');
    localStorage.clear();
  });

  afterEach(() => {
    sinon.restore();
    if (window.ratingSubmitCountdown) {
      clearInterval(window.ratingSubmitCountdown);
      window.ratingSubmitCountdown = null;
    }
  });

  it('renders the slider form after decoration', async () => {
    await decorate(block);
    const ready = await waitForSlider(block);
    expect(ready).to.be.true;
    expect(block.querySelector('form')).to.exist;
    expect(block.querySelector('textarea')).to.exist;
    expect(block.querySelector('input[type=submit]')).to.exist;
  });

  it('sets aria-disabled="true" on submit when textarea is required and empty', async () => {
    await decorate(block);
    await waitForSlider(block);

    const textarea = block.querySelector('textarea');
    const submit = block.querySelector('input[type=submit]');

    textarea.setAttribute('required', 'true');
    textarea.value = '';
    textarea.dispatchEvent(new Event('input'));

    expect(submit.getAttribute('aria-disabled')).to.equal('true');
  });

  it('removes aria-disabled when user types content into the required textarea', async () => {
    await decorate(block);
    await waitForSlider(block);

    const textarea = block.querySelector('textarea');
    const submit = block.querySelector('input[type=submit]');

    // First put it in disabled state
    textarea.setAttribute('required', 'true');
    textarea.value = '';
    textarea.dispatchEvent(new Event('input'));
    expect(submit.getAttribute('aria-disabled')).to.equal('true');

    // Now type content
    textarea.value = 'This tool is great!';
    textarea.dispatchEvent(new Event('input'));

    expect(submit.hasAttribute('aria-disabled')).to.be.false;
  });

  it('treats whitespace-only input as empty and keeps aria-disabled', async () => {
    await decorate(block);
    await waitForSlider(block);

    const textarea = block.querySelector('textarea');
    const submit = block.querySelector('input[type=submit]');

    textarea.setAttribute('required', 'true');
    textarea.value = '   ';
    textarea.dispatchEvent(new Event('input'));

    expect(submit.getAttribute('aria-disabled')).to.equal('true');
  });

  it('does not set aria-disabled when textarea has no required attribute', async () => {
    await decorate(block);
    await waitForSlider(block);

    const textarea = block.querySelector('textarea');
    const submit = block.querySelector('input[type=submit]');

    textarea.removeAttribute('required');
    textarea.value = '';
    textarea.dispatchEvent(new Event('input'));

    expect(submit.hasAttribute('aria-disabled')).to.be.false;
  });

  it('does not set aria-disabled after clearing required and having content', async () => {
    await decorate(block);
    await waitForSlider(block);

    const textarea = block.querySelector('textarea');
    const submit = block.querySelector('input[type=submit]');

    // Start disabled
    textarea.setAttribute('required', 'true');
    textarea.value = '';
    textarea.dispatchEvent(new Event('input'));
    expect(submit.getAttribute('aria-disabled')).to.equal('true');

    // Type content → enabled
    textarea.value = 'Some feedback';
    textarea.dispatchEvent(new Event('input'));
    expect(submit.hasAttribute('aria-disabled')).to.be.false;

    // Clear content but also remove required → still no aria-disabled
    textarea.value = '';
    textarea.removeAttribute('required');
    textarea.dispatchEvent(new Event('input'));
    expect(submit.hasAttribute('aria-disabled')).to.be.false;
  });

  it('blocks form submission when aria-disabled is set', async () => {
    await decorate(block);
    await waitForSlider(block);

    const textarea = block.querySelector('textarea');
    const submit = block.querySelector('input[type=submit]');
    const form = block.querySelector('form');

    textarea.setAttribute('required', 'true');
    textarea.value = '';
    textarea.dispatchEvent(new Event('input'));
    expect(submit.getAttribute('aria-disabled')).to.equal('true');

    const snapshotHTML = block.innerHTML;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => { setTimeout(r, 200); });

    // Block content should be unchanged — submit was blocked
    expect(block.innerHTML).to.equal(snapshotHTML);
  });

  it('keyup on textarea also syncs aria-disabled state', async () => {
    await decorate(block);
    await waitForSlider(block);

    const textarea = block.querySelector('textarea');
    const submit = block.querySelector('input[type=submit]');

    textarea.setAttribute('required', 'true');
    textarea.value = '';
    textarea.dispatchEvent(new KeyboardEvent('keyup'));

    expect(submit.getAttribute('aria-disabled')).to.equal('true');

    textarea.value = 'Good feedback';
    textarea.dispatchEvent(new KeyboardEvent('keyup'));

    expect(submit.hasAttribute('aria-disabled')).to.be.false;
  });
});

describe('Ratings Block - slider interactions', () => {
  let block;

  beforeEach(async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    block = document.querySelector('.ratings');
    localStorage.clear();
  });

  afterEach(() => {
    sinon.restore();
    if (window.ratingSubmitCountdown) {
      clearInterval(window.ratingSubmitCountdown);
      window.ratingSubmitCountdown = null;
    }
  });

  it('updateSliderValue: change event snaps slider and adds rated + star class to block', async () => {
    await decorate(block);
    await waitForSlider(block);

    const input = block.querySelector('input[type=range]');
    input.value = '4';
    input.dispatchEvent(new Event('change'));

    expect(block.classList.contains('rated')).to.be.true;
    expect(block.classList.contains('four-stars')).to.be.true;
  });

  it('updateSliderStyle: sets tooltip left style after slider change', async () => {
    await decorate(block);
    await waitForSlider(block);

    const input = block.querySelector('input[type=range]');
    const tooltip = block.querySelector('.tooltip');
    input.value = '4';
    input.dispatchEvent(new Event('change'));

    expect(tooltip.style.left).to.not.equal('');
  });

  it('updateCommentBoxAndTimer: feedback-required rating (3 stars) shows submit section and no countdown', async () => {
    await decorate(block);
    await waitForSlider(block);

    const input = block.querySelector('input[type=range]');
    const commentBox = block.querySelector('.slider-comment');
    input.value = '3';
    input.dispatchEvent(new Event('change'));

    expect(commentBox.classList.contains('submit--appear')).to.be.true;
    expect(commentBox.classList.contains('comment--appear')).to.be.true;
    expect(window.ratingSubmitCountdown).to.be.null;
  });

  it('countdown: starts interval for non-feedback-required rating (4 stars)', async () => {
    await decorate(block);
    await waitForSlider(block);

    const input = block.querySelector('input[type=range]');
    input.value = '4';
    input.dispatchEvent(new Event('change'));

    expect(window.ratingSubmitCountdown).to.not.be.null;
  });

  it('countdown: clears interval when switching from 4-star to 3-star', async () => {
    await decorate(block);
    await waitForSlider(block);

    const input = block.querySelector('input[type=range]');
    input.value = '4';
    input.dispatchEvent(new Event('change'));
    expect(window.ratingSubmitCountdown).to.not.be.null;

    input.value = '3';
    input.dispatchEvent(new Event('change'));
    expect(window.ratingSubmitCountdown).to.be.null;
  });

  it('updateSliderStyle: called on window resize without error', async () => {
    await decorate(block);
    await waitForSlider(block);

    expect(() => window.dispatchEvent(new Event('resize'))).to.not.throw();
  });

  it('updateSliderValue: input event (no snap) sets slider fill width', async () => {
    await decorate(block);
    await waitForSlider(block);

    const input = block.querySelector('input[type=range]');
    const sliderFill = block.querySelector('.slider-fill');
    input.value = '4';
    input.dispatchEvent(new Event('input'));

    expect(sliderFill.style.width).to.not.equal('');
  });

  it('scrollToScrollAnchor: ArrowLeft keyup decrements slider value (first-time path)', async () => {
    await decorate(block);
    await waitForSlider(block);

    const input = block.querySelector('input[type=range]');
    input.value = '3';
    input.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowLeft' }));

    expect(parseFloat(input.value)).to.equal(2);
    expect(block.classList.contains('two-stars')).to.be.true;
  });

  it('scrollToScrollAnchor: second ArrowLeft keyup uses direct scroll (non-first-time path)', async () => {
    await decorate(block);
    await waitForSlider(block);

    const input = block.querySelector('input[type=range]');
    input.value = '5';
    // First keyup — firstTimeInteract=true
    input.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowLeft' }));
    expect(parseFloat(input.value)).to.equal(4);
    // Second keyup — firstTimeInteract=false (direct scroll path)
    input.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowLeft' }));
    expect(parseFloat(input.value)).to.equal(3);
  });

  it('scrollToScrollAnchor: ArrowRight keyup triggers updateSliderValue (value clamped to max)', async () => {
    await decorate(block);
    await waitForSlider(block);

    const input = block.querySelector('input[type=range]');
    input.value = '3';
    // += 1 concatenates ('3' + 1 = '31'), range input clamps to max=5
    input.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight' }));

    expect(parseFloat(input.value)).to.equal(5);
    expect(block.classList.contains('five-stars')).to.be.true;
  });

  it('mousedown removes transition from tooltip and slider fill', async () => {
    await decorate(block);
    await waitForSlider(block);

    const input = block.querySelector('input[type=range]');
    const tooltip = block.querySelector('.tooltip');
    const sliderFill = block.querySelector('.slider-fill');
    input.dispatchEvent(new MouseEvent('mousedown'));

    expect(tooltip.style.transition).to.equal('none');
    expect(sliderFill.style.transition).to.equal('none');
  });

  it('mouseup restores transitions on tooltip and slider fill', async () => {
    await decorate(block);
    await waitForSlider(block);

    const input = block.querySelector('input[type=range]');
    const tooltip = block.querySelector('.tooltip');
    const sliderFill = block.querySelector('.slider-fill');
    input.dispatchEvent(new MouseEvent('mouseup'));

    // Chrome normalizes shorthand decimals: '.3s' → '0.3s'
    expect(tooltip.style.transition).to.match(/left 0?\.3s, right 0?\.3s/);
    expect(sliderFill.style.transition).to.match(/width 0?\.3s/);
  });

  it('mouseup with textarea content calls submit.focus', async () => {
    await decorate(block);
    await waitForSlider(block);

    const input = block.querySelector('input[type=range]');
    const textarea = block.querySelector('textarea');
    const submit = block.querySelector('input[type=submit]');
    const focusSpy = sinon.spy(submit, 'focus');

    textarea.value = 'some feedback';
    input.dispatchEvent(new MouseEvent('mouseup'));

    expect(focusSpy.calledOnce).to.be.true;
  });

  it('star click sets input value and updates block class', async () => {
    await decorate(block);
    await waitForSlider(block);

    const firstStar = block.querySelector('.one-star');
    firstStar.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const input = block.querySelector('input[type=range]');
    expect(input.value).to.equal('1');
    expect(block.classList.contains('one-star')).to.be.true;
  });

  it('textarea focus stops countdown and shows submit section', async () => {
    await decorate(block);
    await waitForSlider(block);

    const input = block.querySelector('input[type=range]');
    const textarea = block.querySelector('textarea');
    const commentBox = block.querySelector('.slider-comment');

    // Start countdown with a non-feedback-required star
    input.value = '4';
    input.dispatchEvent(new Event('change'));
    expect(window.ratingSubmitCountdown).to.not.be.null;

    textarea.dispatchEvent(new Event('focus'));

    expect(window.ratingSubmitCountdown).to.be.null;
    expect(commentBox.classList.contains('submit--appear')).to.be.true;
  });

  it('restores textarea value and slider position from localStorage on init', async () => {
    localStorage.setItem('ccxActionRatingsFeedbacknalaTestRatings', '3,previous feedback');
    await decorate(block);
    await waitForSlider(block);

    const textarea = block.querySelector('textarea');
    expect(textarea.value).to.equal('previous feedback');

    const commentBox = block.querySelector('.slider-comment');
    expect(commentBox.classList.contains('comment--appear')).to.be.true;
  });

  it('decorateCannotRateBlock: shows submitted state when user has already rated', async () => {
    localStorage.setItem('ccxActionRatings', 'nala-test-ratings');
    await decorate(block);
    const ready = await waitForNoSlider(block);

    expect(ready).to.be.true;
    expect(block.classList.contains('submitted')).to.be.true;
    expect(block.querySelector('form')).to.not.exist;
    expect(block.querySelector('.no-slider')).to.exist;
  });
});
