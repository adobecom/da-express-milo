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

const { default: decorate } = await import('../../../express/code/blocks/verb-express-hero/verb-express-hero.js');

async function prepBlock(filePath) {
  document.body.innerHTML = await readFile({ path: filePath });
  const block = document.querySelector('.verb-express-hero');
  await decorate(block);
  return block;
}

describe('verb-express-hero', () => {
  it('decorates successfully', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block).to.exist;
  });

  it('builds foreground with copy-column and image-column', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.foreground')).to.exist;
    expect(block.querySelector('.copy-column')).to.exist;
    expect(block.querySelector('.image-column')).to.exist;
    expect(block.querySelector('.image-column picture')).to.exist;
  });

  it('injects the Adobe brand logo into the heading group', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.copy-column .heading-group > .express-logo')).to.exist;
  });

  it('keeps the authored heading and body copy, separate from the dropzone', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.copy h1')).to.exist;
    expect(block.querySelector('.copy p')).to.exist;
  });

  it('decorates the authored CTA link as a milo con-button', async () => {
    const block = await prepBlock('./mocks/default.html');
    const ctaLink = block.querySelector('.cta-dropzone > .action-area a');
    expect(ctaLink).to.exist;
    expect(ctaLink.classList.contains('con-button')).to.be.true;
  });

  it('builds a real interactive dropzone with a file input', async () => {
    const block = await prepBlock('./mocks/default.html');
    const dropzone = block.querySelector('.cta-dropzone .verb-dropzone-area');
    expect(dropzone).to.exist;
    expect(dropzone.tagName).to.equal('BUTTON');
    expect(dropzone.querySelector('.verb-dropzone-heading')).to.exist;
    expect(dropzone.querySelector('.verb-dropzone-sub')).to.exist;
    expect(block.querySelector('input[type="file"]')).to.exist;
  });

  it('builds a verb-dropzone-footer with legal copy and an info icon', async () => {
    const block = await prepBlock('./mocks/default.html');
    const footer = block.querySelector('.verb-dropzone-footer');
    expect(footer).to.exist;
    expect(footer.querySelector('.verb-dropzone-legal')).to.exist;
    expect(footer.querySelector('.info-icon')).to.exist;
  });

  it('appends a hidden error state to the block', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.error.hide')).to.exist;
  });
});
