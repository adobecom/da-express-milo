/* eslint-env mocha */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const [{ getLibs }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
const { setConfig } = await import(`${getLibs()}/utils/utils.js`);
setConfig({});

const { default: decorate } = await import('../../../express/code/blocks/color-seo-hero/color-seo-hero.js');

describe('Color SEO Hero', () => {
  let block;

  beforeEach(async () => {
    document.body.innerHTML = await readFile({ path: './mocks/basic.html' });
    block = document.querySelector('.color-seo-hero');
    await decorate(block);
  });

  it('builds the interactive preview from the authored color row', async () => {
    const canvasRail = block.querySelector('.color-seo-hero-canvas-rail');
    const stripRail = block.querySelector('.color-seo-hero-swatch-strip');
    await canvasRail.updateComplete;

    expect(block.classList.contains('is-ready')).to.be.true;
    expect(block.style.getPropertyValue('--color-seo-hero-primary')).to.equal('#1EA774');
    expect(canvasRail.swatches).to.deep.equal([{ hex: '#1EA774' }]);
    expect(canvasRail.shadowRoot.querySelector('.hex-code').textContent.trim()).to.equal('#1EA774');
    expect(stripRail.swatches).to.have.length(3);
  });

  it('opens the color editor popover when the canvas edit button is clicked', async () => {
    const canvasRail = block.querySelector('.color-seo-hero-canvas-rail');
    await canvasRail.updateComplete;
    const editButton = canvasRail.shadowRoot.querySelector('.hex-code-group .icon-button--edit-tint');
    editButton.dispatchEvent(new Event('click', { bubbles: true }));
    await new Promise((resolve) => { setTimeout(resolve, 100); });

    expect(block.querySelector('.color-seo-hero-editor-popover').hidden).to.be.false;
    expect(editButton.getAttribute('aria-expanded')).to.equal('true');
  });

  it('recomputes the swatch strip when a different harmony rule is selected', async () => {
    const stripRail = block.querySelector('.color-seo-hero-swatch-strip');
    const before = stripRail.swatches.map((s) => s.hex);
    const picker = block.querySelector('sp-picker');

    picker.value = 'COMPLEMENTARY';
    picker.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((resolve) => { setTimeout(resolve, 50); });

    expect(stripRail.swatches).to.have.length(2);
    expect(stripRail.swatches.map((s) => s.hex)).to.not.deep.equal(before);
  });

  it('builds a color-wheel deep link carrying the current palette', () => {
    const link = block.querySelector('.color-seo-hero-build-link');
    expect(link.getAttribute('href')).to.include('/create/color-wheel');
    expect(link.getAttribute('href')).to.include('color-palette=');
  });

  it('does nothing when the color row is missing a valid hex value', async () => {
    document.body.innerHTML = '<div class="color-seo-hero"><div><h1>Broken</h1></div><div><div>Jade</div><div>not-a-hex</div></div></div>';
    const brokenBlock = document.querySelector('.color-seo-hero');
    await decorate(brokenBlock);

    expect(brokenBlock.classList.contains('is-ready')).to.be.false;
    expect(brokenBlock.querySelector('.color-seo-hero-preview')).to.not.exist;
  });

  it('renders the shared floating-toolbar component with a single-color palette', async () => {
    const toolbar = block.querySelector('.color-floating-toolbar-container');
    expect(toolbar).to.exist;

    const swatches = toolbar.querySelectorAll('.ax-swatch-strip .ax-swatch');
    expect(swatches).to.have.length(1);
    expect(swatches[0].style.backgroundColor).to.equal('rgb(30, 167, 116)');

    // No CC-library icon in our custom action set, and the palette-name
    // field is hidden — both opt-in options specific to this consumer.
    expect(toolbar.querySelector('.ax-palette-name')).to.not.exist;
    expect(toolbar.querySelectorAll('.ax-toolbar-actions sp-action-button')).to.have.length(3);
  });

  it('shows a persistent "Edit color" label on the floating toolbar edit button', () => {
    const editLabel = block.querySelector('.ax-edit-btn-label');
    expect(editLabel).to.exist;
    expect(editLabel.textContent.trim()).to.equal('Edit color');
  });

  it('opens the floating toolbar edit popover and closes the canvas one if it was open', async () => {
    const canvasRail = block.querySelector('.color-seo-hero-canvas-rail');
    await canvasRail.updateComplete;
    const canvasEditButton = canvasRail.shadowRoot.querySelector('.hex-code-group .icon-button--edit-tint');
    canvasEditButton.dispatchEvent(new Event('click', { bubbles: true }));
    await new Promise((resolve) => { setTimeout(resolve, 100); });
    expect(block.querySelector('.color-seo-hero-editor-popover').hidden).to.be.false;

    const floatingEditButton = block.querySelector('.ax-edit-btn');
    floatingEditButton.click();
    await new Promise((resolve) => { setTimeout(resolve, 100); });

    expect(block.querySelector('.color-seo-hero-editor-popover').hidden).to.be.true;
    expect(canvasEditButton.getAttribute('aria-expanded')).to.equal('false');
    expect(document.querySelector('.color-seo-hero-floating-editor-popover').hidden).to.be.false;
    expect(floatingEditButton.getAttribute('aria-expanded')).to.equal('true');
  });

  it('copies a code snippet for all container colors when a copy-as-code format is selected', async () => {
    const writeText = sinon.stub().resolves();
    sinon.stub(navigator.clipboard, 'writeText').callsFake(writeText);

    const [codeMenu] = block.querySelectorAll('.ax-toolbar-actions .ax-lib-card__action-menu');
    codeMenu.querySelector('.ax-lib-card__action').click();
    const cssItem = [...codeMenu.querySelectorAll('sp-menu-item')]
      .find((item) => item.getAttribute('value') === 'CSS');
    cssItem.click();
    await new Promise((resolve) => { setTimeout(resolve, 50); });

    expect(writeText.called).to.be.true;
    expect(writeText.firstCall.args[0]).to.include('#1EA774');
    navigator.clipboard.writeText.restore();
  });

  it('offers JPEG and ASE options in the download menu', () => {
    const menus = block.querySelectorAll('.ax-toolbar-actions .ax-lib-card__action-menu');
    const downloadMenu = menus[menus.length - 1];
    const values = [...downloadMenu.querySelectorAll('sp-menu-item')]
      .map((item) => item.getAttribute('value'));

    expect(values).to.include.members(['JPEG', 'ASE']);
  });
});
