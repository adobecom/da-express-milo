import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/transparent-image-marquee/transparent-image-marquee.js'),
]);

const { default: decorate } = imports[1];

async function prepBlock(filePath) {
  document.body.innerHTML = await readFile({ path: filePath });
  const block = document.querySelector('.transparent-image-marquee');
  await decorate(block);
  return block;
}

describe('transparent-image-marquee', () => {
  beforeEach(() => {
    window.isTestEnv = true;
  });

  it('decorates successfully', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block).to.exist;
    expect(block.dataset.blockStatus).to.not.equal('failed');
  });

  it('creates foreground container', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.foreground')).to.exist;
  });

  it('creates text-content and text-container', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.text-content')).to.exist;
    expect(block.querySelector('.text-container')).to.exist;
  });

  it('creates image-container with picture', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.image-container')).to.exist;
    expect(block.querySelector('.image-container picture')).to.exist;
  });

  it('injects the branding logo as a standalone element in text-content', async () => {
    const block = await prepBlock('./mocks/default.html');
    const logo = block.querySelector('.text-content > .express-logo');
    expect(logo).to.exist;
    expect(logo.tagName).to.equal('IMG');
  });

  it('keeps authored paragraphs as body copy, not merged with the logo', async () => {
    const block = await prepBlock('./mocks/default.html');
    const logo = block.querySelector('.express-logo');
    // logo carries no authored text — the subcopy stays in the text-container
    expect(logo.textContent.trim()).to.equal('');
    const paras = [...block.querySelectorAll('.text-container p')];
    expect(paras.some((p) => p.textContent.includes('Create stylized text'))).to.be.true;
  });

  it('places heading inside text-container', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.text-container h2')).to.exist;
  });

  it('applies background color from authored content', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.style.background).to.be.ok;
  });

  it('keeps the dark treatment for a dark authored background', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.classList.contains('light')).to.be.false;
  });
});

describe('transparent-image-marquee / CTAs + disclaimer', () => {
  beforeEach(() => {
    window.isTestEnv = true;
  });

  it('builds a cta-container with a button-group', async () => {
    const block = await prepBlock('./mocks/with-ctas.html');
    expect(block.querySelector('.cta-container')).to.exist;
    expect(block.querySelector('.cta-container .button-group')).to.exist;
  });

  it('marks the strong-wrapped link as the primary CTA', async () => {
    const block = await prepBlock('./mocks/with-ctas.html');
    const primary = block.querySelector('.cta.primary');
    expect(primary).to.exist;
    expect(primary.tagName).to.equal('A');
    expect(primary.textContent.trim()).to.equal('Get started');
  });

  it('marks the second link as the secondary CTA', async () => {
    const block = await prepBlock('./mocks/with-ctas.html');
    const secondary = block.querySelector('.cta.secondary');
    expect(secondary).to.exist;
    expect(secondary.textContent.trim()).to.equal('Learn more');
  });

  it('renders the trailing no-link paragraph as the disclaimer', async () => {
    const block = await prepBlock('./mocks/with-ctas.html');
    const disclaimer = block.querySelector('.cta-container .disclaimer');
    expect(disclaimer).to.exist;
    expect(disclaimer.textContent).to.include('No credit card');
  });

  it('keeps the subcopy in the text-container, not as a CTA or disclaimer', async () => {
    const block = await prepBlock('./mocks/with-ctas.html');
    const paras = [...block.querySelectorAll('.text-container p')];
    expect(paras.some((p) => p.textContent.includes('Create stylized text'))).to.be.true;
    expect(block.querySelector('.text-container .disclaimer')).to.not.exist;
  });

  it('activates the light treatment for a light authored background', async () => {
    const block = await prepBlock('./mocks/with-ctas.html');
    expect(block.classList.contains('light')).to.be.true;
  });
});
