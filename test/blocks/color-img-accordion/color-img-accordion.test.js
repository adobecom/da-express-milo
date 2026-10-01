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

  it('keeps at most one item open', async () => {
    const block = await prepBlock('./mocks/default.html');
    const buttons = [...block.querySelectorAll('.color-img-accordion-button')];

    buttons[1].click();
    expect(buttons[0].getAttribute('aria-expanded')).to.equal('false');
    expect(buttons[1].getAttribute('aria-expanded')).to.equal('true');
    expect(document.getElementById(buttons[0].getAttribute('aria-controls')).hasAttribute('inert')).to.be.true;

    buttons[1].click();
    expect(buttons.every((button) => button.getAttribute('aria-expanded') === 'false')).to.be.true;
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
  });

  it('supports the simple-image and image-left variants', async () => {
    const block = await prepBlock('./mocks/simple-image.html');

    expect(block.classList.contains('image-left')).to.be.true;
    expect(block.querySelector('.color-img-accordion-photo > picture')).to.exist;
    expect(block.querySelector('.color-img-accordion-palette')).to.not.exist;
  });
});
