import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

window.isTestEnv = true;

const [{ getLibs }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
const { setConfig } = await import(`${getLibs()}/utils/utils.js`);
setConfig({});

const { default: decorate } = await import('../../../express/code/blocks/color-img-accordion/color-img-accordion.js');

async function prepBlock(filePath) {
  document.body.innerHTML = await readFile({ path: filePath });
  const block = document.querySelector('.color-img-accordion');
  await decorate(block);
  return block;
}

async function waitFor(check, timeout = 1000) {
  const start = performance.now();
  while (!check()) {
    if (performance.now() - start > timeout) throw new Error('Timed out waiting for condition');
    await new Promise((resolve) => { setTimeout(resolve, 10); });
  }
}

describe('color-img-accordion', () => {
  it('builds the heading, image, and authored accordion items', async () => {
    const block = await prepBlock('./mocks/default.html');

    expect(block.querySelector('.color-img-accordion-heading h2').textContent).to.equal('Make the most of your color palette.');
    expect(block.querySelector('.color-img-accordion-photo > picture img')).to.exist;
    expect(block.querySelectorAll('.color-img-accordion-item')).to.have.length(3);
  });

  it('opens the first item by default with an accessible button and region', async () => {
    const block = await prepBlock('./mocks/default.html');
    const button = block.querySelector('.color-img-accordion-button');
    const panel = document.getElementById(button.getAttribute('aria-controls'));

    expect(button.tagName).to.equal('BUTTON');
    expect(button.getAttribute('type')).to.equal('button');
    expect(button.getAttribute('aria-expanded')).to.equal('true');
    expect(panel.getAttribute('role')).to.equal('region');
    expect(panel.getAttribute('aria-labelledby')).to.equal(button.id);
    expect(panel.getAttribute('aria-hidden')).to.equal('false');
    expect(panel.hasAttribute('inert')).to.be.false;
  });

  it('opens the first valid item when an earlier authored row is incomplete', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/default.html' });
    const block = document.querySelector('.color-img-accordion');
    const incompleteRow = document.createElement('div');
    incompleteRow.append(document.createElement('div'));
    block.firstElementChild.after(incompleteRow);

    await decorate(block);

    expect(block.querySelector('.color-img-accordion-button').getAttribute('aria-expanded')).to.equal('true');
  });

  it('toggles items independently so multiple panels can stay open', async () => {
    const block = await prepBlock('./mocks/default.html');
    const buttons = [...block.querySelectorAll('.color-img-accordion-button')];
    const firstPanel = document.getElementById(buttons[0].getAttribute('aria-controls'));
    const secondPanel = document.getElementById(buttons[1].getAttribute('aria-controls'));

    buttons[1].click();
    expect(buttons[0].getAttribute('aria-expanded')).to.equal('true');
    expect(buttons[1].getAttribute('aria-expanded')).to.equal('true');
    expect(firstPanel.hasAttribute('inert')).to.be.false;
    expect(secondPanel.hasAttribute('inert')).to.be.false;

    buttons[1].click();
    expect(buttons[0].getAttribute('aria-expanded')).to.equal('true');
    expect(buttons[1].getAttribute('aria-expanded')).to.equal('false');
  });

  it('preserves structured and image content inside panels', async () => {
    const block = await prepBlock('./mocks/default.html');
    const panels = block.querySelectorAll('.color-img-accordion-panel');

    expect(panels[1].querySelectorAll('li')).to.have.length(2);
    expect(panels[2].querySelector('picture img').getAttribute('alt')).to.equal('Contrast chart');
  });

  it('extracts six palette colors from the authored image', async () => {
    const block = await prepBlock('./mocks/default.html');
    const palette = block.querySelector('.color-img-accordion-palette');

    await waitFor(() => palette.classList.contains('is-ready'));
    const swatches = [...palette.querySelectorAll('.color-img-accordion-swatch')];
    expect(swatches).to.have.length(6);
    swatches.forEach((swatch) => expect(swatch.style.background).to.not.equal(''));
    const colors = new Set(swatches.map((swatch) => swatch.style.background));
    expect(colors.size).to.be.greaterThan(1);
  });

  it('supports the simple-image and image-left variants', async () => {
    const block = await prepBlock('./mocks/simple-image.html');

    expect(block.classList.contains('image-left')).to.be.true;
    expect(block.querySelector('.color-img-accordion-photo > picture')).to.exist;
    expect(block.querySelector('.color-img-accordion-palette')).to.not.exist;
  });

  it('wraps each item button in an h3 heading', async () => {
    const block = await prepBlock('./mocks/default.html');
    const buttons = [...block.querySelectorAll('.color-img-accordion-button')];
    expect(buttons.length).to.be.greaterThan(0);
    buttons.forEach((button) => expect(button.parentElement.tagName).to.equal('H3'));
  });

  it('gives two blocks on one page distinct ids', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/default.html' });
    const first = document.querySelector('.color-img-accordion');
    first.after(first.cloneNode(true));
    const blocks = [...document.querySelectorAll('.color-img-accordion')];
    await Promise.all(blocks.map((b) => decorate(b)));
    const ids = [...document.querySelectorAll('[aria-controls]')].map((b) => b.getAttribute('aria-controls'));
    expect(new Set(ids).size).to.equal(ids.length);
    ids.forEach((id) => expect(document.getElementById(id)).to.exist);
  });

  it('settles to false instead of hanging when the image fails to load', async () => {
    const { waitForImage } = await import('../../../express/code/blocks/color-img-accordion/color-img-accordion.js');
    const timeout = new Promise((resolve) => { setTimeout(() => resolve('timeout'), 2000); });
    const pending = document.createElement('img');
    pending.src = '/does-not-exist-pending.png';
    expect(await Promise.race([waitForImage(pending), timeout])).to.equal(false);
    const failed = document.createElement('img');
    failed.src = '/does-not-exist-failed.png';
    await waitFor(() => failed.complete, 2000);
    expect(await Promise.race([waitForImage(failed), timeout])).to.equal(false);
  });
});
