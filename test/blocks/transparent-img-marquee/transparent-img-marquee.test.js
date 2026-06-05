/* eslint-env mocha */
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

const { default: decorate } = await import('../../../express/code/blocks/transparent-img-marquee/transparent-img-marquee.js');

async function prepBlock(filePath) {
  document.body.innerHTML = await readFile({ path: filePath });
  const block = document.querySelector('.transparent-img-marquee');
  await decorate(block);
  return block;
}

describe('transparent-img-marquee', () => {
  it('decorates without error', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block).to.exist;
  });

  it('adds appear class', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.classList.contains('appear')).to.be.true;
  });

  it('builds foreground and image-container', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.foreground')).to.exist;
    expect(block.querySelector('.image-container')).to.exist;
  });

  it('removes original authored row', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.children.length).to.equal(2);
    expect(block.children[0].classList.contains('foreground')).to.be.true;
    expect(block.children[1].classList.contains('image-container')).to.be.true;
  });

  it('moves image into image-container', async () => {
    const block = await prepBlock('./mocks/default.html');
    const img = block.querySelector('.image-container img');
    expect(img).to.exist;
    expect(img.alt).to.equal('test image');
  });

  it('splits foreground into text-content and cta-container', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.foreground .text-content')).to.exist;
    expect(block.querySelector('.foreground .cta-container')).to.exist;
  });

  it('puts heading and body in text-content', async () => {
    const block = await prepBlock('./mocks/default.html');
    const textContent = block.querySelector('.text-content');
    expect(textContent.querySelector('h2')).to.exist;
    expect(textContent.querySelector('p:not(.disclaimer)')).to.exist;
  });

  it('puts CTA links in cta-container', async () => {
    const block = await prepBlock('./mocks/default.html');
    const ctaContainer = block.querySelector('.cta-container');
    expect(ctaContainer.querySelector('a[href]')).to.exist;
  });

  it('marks last non-CTA paragraph as disclaimer', async () => {
    const block = await prepBlock('./mocks/default.html');
    const disclaimer = block.querySelector('.disclaimer');
    expect(disclaimer).to.exist;
    expect(disclaimer.textContent).to.equal('Lorem ipsum disclaimer text.');
  });

  it('puts disclaimer in cta-container', async () => {
    const block = await prepBlock('./mocks/default.html');
    const ctaContainer = block.querySelector('.cta-container');
    expect(ctaContainer.querySelector('.disclaimer')).to.exist;
  });
});

describe('transparent-img-marquee logo injection', () => {
  function addMeta(name, content) {
    const meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    document.head.appendChild(meta);
  }

  afterEach(() => {
    document.head.querySelectorAll('meta[name^="marquee-inject"]').forEach((m) => m.remove());
  });

  it('does not inject logo without meta tag', async () => {
    const block = await prepBlock('./mocks/inject-logo.html');
    expect(block.querySelector('.express-logo')).to.not.exist;
  });

  it('injects logo when marquee-inject-logo is yes', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/inject-logo.html' });
    addMeta('marquee-inject-logo', 'yes');
    const block = document.querySelector('.transparent-img-marquee');
    await decorate(block);
    const logo = block.querySelector('.express-logo');
    expect(logo).to.exist;
    expect(logo.classList.contains('icon-adobe-express-logo')).to.be.true;
  });

  it('injects logo when marquee-inject-logo is on', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/inject-logo.html' });
    addMeta('marquee-inject-logo', 'on');
    const block = document.querySelector('.transparent-img-marquee');
    await decorate(block);
    expect(block.querySelector('.express-logo')).to.exist;
  });

  it('logo is placed in text-content before heading', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/inject-logo.html' });
    addMeta('marquee-inject-logo', 'yes');
    const block = document.querySelector('.transparent-img-marquee');
    await decorate(block);
    const textContent = block.querySelector('.text-content');
    const logo = textContent.querySelector('.express-logo');
    const heading = textContent.querySelector('h2');
    expect(logo).to.exist;
    expect(heading).to.exist;
    const children = [...textContent.children];
    expect(children.indexOf(logo)).to.be.lessThan(children.indexOf(heading));
  });
});
