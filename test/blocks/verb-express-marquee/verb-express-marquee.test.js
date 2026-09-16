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

const { default: decorate } = await import('../../../express/code/blocks/verb-express-marquee/verb-express-marquee.js');

async function prepBlock(filePath) {
  document.body.innerHTML = await readFile({ path: filePath });
  const block = document.querySelector('.verb-express-marquee');
  await decorate(block);
  return block;
}

describe('verb-express-marquee', () => {
  it('decorates successfully', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block).to.exist;
    expect(block.dataset.blockStatus).to.not.equal('failed');
  });

  it('builds foreground with copy-column and image-column', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.foreground')).to.exist;
    expect(block.querySelector('.copy-column')).to.exist;
    expect(block.querySelector('.image-column')).to.exist;
    expect(block.querySelector('.image-column picture')).to.exist;
  });

  it('injects the Adobe Express logo into the copy column', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.copy-column > .express-logo')).to.exist;
  });

  it('keeps the authored heading and body copy', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.copy h1')).to.exist;
    expect(block.querySelector('.copy p')).to.exist;
  });

  it('builds a cta-dropzone with the authored CTA and a mini dropzone', async () => {
    const block = await prepBlock('./mocks/default.html');
    const ctaDropzone = block.querySelector('.cta-dropzone');
    expect(ctaDropzone).to.exist;
    expect(ctaDropzone.querySelector('a')).to.exist;
    expect(ctaDropzone.querySelector('.mini-dropzone')).to.exist;
    expect(ctaDropzone.querySelector('.mini-dropzone-icon')).to.exist;
  });

  it('builds a legal-copy footer', async () => {
    const block = await prepBlock('./mocks/default.html');
    const legalCopy = block.querySelector('.legal-copy');
    expect(legalCopy).to.exist;
    expect(legalCopy.querySelector('.info-icon')).to.exist;
  });
});
