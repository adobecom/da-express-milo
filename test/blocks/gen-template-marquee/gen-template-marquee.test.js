/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

window.isTestEnv = true;

const [, { default: decorate }] = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/gen-template-marquee/gen-template-marquee.js'),
]);

const fixture = await readFile({ path: './mocks/default.html' });

async function prepareBlock() {
  document.body.innerHTML = fixture;
  const block = document.querySelector('.gen-template-marquee');
  await decorate(block);
  return block;
}

describe('gen-template-marquee', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('builds the authored prompt experience', async () => {
    const block = await prepareBlock();
    const input = block.querySelector('.gen-template-prompt-input');
    const form = block.querySelector('.gen-template-prompt-form');

    expect(block.querySelector('h1').textContent).to.equal('Generate templates with AI.');
    expect(input.placeholder).to.equal('Describe what template you want to make');
    expect(block.querySelector('label').htmlFor).to.equal(input.id);
    expect(block.querySelector('.gen-template-prompt-submit').textContent).to.contain('Generate');
    expect(form.dataset.desktopHref).to.equal('https://example.com/neural-editor?entry=create-menu');
    expect(form.dataset.mobileHref).to.equal('https://example.com/new?action=text+to+template');
  });

  it('fills the prompt from an authored suggestion', async () => {
    const block = await prepareBlock();
    const suggestion = block.querySelector('.gen-template-suggestion');
    const input = block.querySelector('.gen-template-prompt-input');

    suggestion.click();

    expect(input.value).to.equal('Dog trainer advertisement');
    expect(document.activeElement).to.equal(input);
  });

  it('builds five decorative gallery columns and preserves layered media', async () => {
    const block = await prepareBlock();
    const columns = block.querySelectorAll('.gen-template-column');
    const cards = block.querySelectorAll('.gen-template-card');

    expect(columns).to.have.length(5);
    expect(cards).to.have.length(7);
    expect(block.querySelector('.gen-template-gallery').getAttribute('aria-hidden')).to.equal('true');
    expect(block.querySelectorAll('.gen-template-card-square')).to.have.length(4);
    expect(block.querySelectorAll('.gen-template-card img[alt=""]')).to.have.length(7);
  });

  it('keeps an empty submission on the page and focuses the prompt', async () => {
    const block = await prepareBlock();
    const form = block.querySelector('.gen-template-prompt-form');
    const input = block.querySelector('.gen-template-prompt-input');

    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));

    expect(document.activeElement).to.equal(input);
  });

  it('preserves reserved characters in the routed desktop prompt', async () => {
    const block = await prepareBlock();
    const form = block.querySelector('.gen-template-prompt-form');
    const input = block.querySelector('.gen-template-prompt-input');
    const originalMatchMedia = window.matchMedia;
    const originalLocationAssign = window.t_locationAssign;
    const originalTrackingAppender = window.t_getTrackingAppendedURL;
    window.matchMedia = () => ({ matches: true });
    window.t_getTrackingAppendedURL = (url) => Promise.resolve(url);

    const redirectPromise = new Promise((resolve) => {
      window.t_locationAssign = resolve;
    });
    input.value = 'A + B & #1';
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    const routedUrl = new URL(await redirectPromise);

    window.matchMedia = originalMatchMedia;
    window.t_locationAssign = originalLocationAssign;
    window.t_getTrackingAppendedURL = originalTrackingAppender;
    expect(routedUrl.pathname).to.equal('/neural-editor');
    expect(routedUrl.searchParams.get('prompt')).to.equal('A + B & #1');
  });
});
