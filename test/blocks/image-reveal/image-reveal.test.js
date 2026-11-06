import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };
window.isTestEnv = true;

const imports = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
const { getLibs } = imports[0];

await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({ locales });
});

const { default: decorate } = await import('../../../express/code/blocks/image-reveal/image-reveal.js');

const FIRST_IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const SECOND_IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw';

async function prepBlock(filePath) {
  document.body.innerHTML = await readFile({ path: filePath });
  const block = document.querySelector('.image-reveal');
  await decorate(block);
  return block;
}

function pressKey(el, key) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function pickRadio(input) {
  input.checked = true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

async function waitForAnnouncement() {
  await new Promise((resolve) => { setTimeout(resolve, 150); });
  return document.querySelector('#express-spectrum-live-region');
}

describe('image-reveal', () => {
  it('builds header, panel, and stage from authored content', async () => {
    const block = await prepBlock('./mocks/default.html');
    const [header, sandbox] = block.children;
    expect(header.classList.contains('image-reveal-header')).to.be.true;
    expect(sandbox.classList.contains('image-reveal-sandbox')).to.be.true;
    expect(header.querySelector('h2').textContent).to.equal('Recolor your image with Adobe Express.');
    expect(sandbox.querySelector('.image-reveal-panel')).to.exist;
    expect(sandbox.querySelector('.image-reveal-stage')).to.exist;
    expect(block.querySelector('.image-reveal-original img').getAttribute('src')).to.equal(FIRST_IMG);
  });

  it('clones the selected image for the filtered layer', async () => {
    const block = await prepBlock('./mocks/default.html');
    const filtered = block.querySelector('.image-reveal-filtered');
    expect(filtered.getAttribute('aria-hidden')).to.equal('true');
    const clone = filtered.querySelector('img');
    expect(clone.getAttribute('src')).to.equal(FIRST_IMG);
    expect(clone.getAttribute('alt')).to.equal('');
  });

  it('builds effect and image thumbnail radio groups', async () => {
    const block = await prepBlock('./mocks/default.html');
    const effects = [...block.querySelectorAll('input[name$="-effect"]')];
    expect(effects.map((r) => r.value)).to.eql(['grayscale', 'color-punch', 'duotone']);
    expect(effects[0].checked).to.be.true;
    expect(block.querySelector('.image-reveal-thumb-img--duotone')).to.exist;
    const swaps = [...block.querySelectorAll('input[name$="-image"]')];
    expect(swaps.length).to.equal(2);
    expect(swaps[0].checked).to.be.true;
    const labels = [...block.querySelectorAll('.image-reveal-thumb-label')].map((l) => l.textContent);
    expect(labels).to.include('Photography');
    expect(labels).to.include('Graphic design');
  });

  it('exposes an accessible slider handle', async () => {
    const block = await prepBlock('./mocks/default.html');
    const handle = block.querySelector('.image-reveal-handle');
    expect(handle.getAttribute('role')).to.equal('slider');
    expect(handle.getAttribute('tabindex')).to.equal('0');
    expect(handle.getAttribute('aria-label')).to.not.be.empty;
    expect(handle.getAttribute('aria-valuemin')).to.equal('0');
    expect(handle.getAttribute('aria-valuemax')).to.equal('100');
    expect(handle.getAttribute('aria-valuenow')).to.equal('50');
    expect(handle.getAttribute('aria-valuetext')).to.include('50%');
  });

  it('moves the slider with the keyboard', async () => {
    const block = await prepBlock('./mocks/default.html');
    const handle = block.querySelector('.image-reveal-handle');
    pressKey(handle, 'ArrowRight');
    expect(handle.getAttribute('aria-valuenow')).to.equal('51');
    pressKey(handle, 'ArrowLeft');
    expect(handle.getAttribute('aria-valuenow')).to.equal('50');
    pressKey(handle, 'PageUp');
    expect(handle.getAttribute('aria-valuenow')).to.equal('60');
    pressKey(handle, 'PageDown');
    expect(handle.getAttribute('aria-valuenow')).to.equal('50');
    pressKey(handle, 'End');
    expect(handle.getAttribute('aria-valuenow')).to.equal('100');
    pressKey(handle, 'Home');
    expect(handle.getAttribute('aria-valuenow')).to.equal('0');
    const stage = block.querySelector('.image-reveal-stage');
    expect(stage.style.getPropertyValue('--image-reveal-position')).to.equal('0%');
  });

  it('switches effects and announces the change', async () => {
    const block = await prepBlock('./mocks/default.html');
    const stage = block.querySelector('.image-reveal-stage');
    expect(stage.dataset.effect).to.equal('grayscale');
    const duotone = block.querySelector('input[name$="-effect"][value="duotone"]');
    pickRadio(duotone);
    expect(stage.dataset.effect).to.equal('duotone');
    const ref = block.style.getPropertyValue('--image-reveal-duotone');
    const filterId = ref.match(/url\(#(.+)\)/)?.[1];
    expect(filterId).to.exist;
    expect(block.querySelector(`#${CSS.escape(filterId)}`)).to.exist;
    const region = await waitForAnnouncement();
    expect(region.textContent).to.include('Duotone');
  });

  it('swaps the base image from the image radio group', async () => {
    const block = await prepBlock('./mocks/default.html');
    const second = block.querySelectorAll('input[name$="-image"]')[1];
    pickRadio(second);
    expect(block.querySelector('.image-reveal-original img').getAttribute('src')).to.equal(SECOND_IMG);
    expect(block.querySelector('.image-reveal-filtered img').getAttribute('src')).to.equal(SECOND_IMG);
    block.querySelectorAll('.image-reveal-thumb-img[class*="--"] img').forEach((img) => {
      expect(img.getAttribute('src')).to.equal(SECOND_IMG);
    });
    const region = await waitForAnnouncement();
    expect(region.textContent).to.include('Graphic design');
  });

  it('provides tabs that toggle the control groups', async () => {
    const block = await prepBlock('./mocks/default.html');
    const tabs = [...block.querySelectorAll('[role="tab"]')];
    expect(tabs.length).to.equal(2);
    expect(tabs[0].getAttribute('aria-selected')).to.equal('true');
    const [effectsPanel, swapPanel] = [...block.querySelectorAll('[role="tabpanel"]')];
    expect(effectsPanel.hidden).to.be.false;
    expect(swapPanel.hidden).to.be.true;
    tabs[1].click();
    expect(tabs[1].getAttribute('aria-selected')).to.equal('true');
    expect(effectsPanel.hidden).to.be.true;
    expect(swapPanel.hidden).to.be.false;
    pressKey(tabs[0], 'ArrowLeft');
    expect(tabs[0].getAttribute('aria-selected')).to.equal('true');
    expect(effectsPanel.hidden).to.be.false;
  });

  it('moves the CTA into the panel and marks the subtext', async () => {
    const block = await prepBlock('./mocks/default.html');
    const cta = block.querySelector('.image-reveal-cta');
    expect(cta.querySelector('a[href="https://www.adobe.com/express/"]')).to.exist;
    expect(cta.querySelector('.image-reveal-cta-subtext').textContent).to.include('Sign in');
  });

  it('removes itself when no image is authored', async () => {
    await prepBlock('./mocks/no-image.html');
    expect(document.querySelector('.image-reveal')).to.not.exist;
  });
});
