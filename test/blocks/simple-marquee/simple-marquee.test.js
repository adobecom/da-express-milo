/* eslint-env mocha */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/simple-marquee/simple-marquee.js'),
]);
const { default: decorate } = imports[1];
const basic = await readFile({ path: './mocks/basic.html' });

async function render(...variants) {
  document.body.innerHTML = basic;
  const block = document.querySelector('.simple-marquee');
  block.classList.add(...variants);
  await decorate(block);
  return block;
}

describe('Simple Marquee', () => {
  before(() => {
    window.isTestEnv = true;
  });

  afterEach(() => {
    document.head.querySelectorAll('meta[name="inject-branding-logo"], meta[name="marquee-inject-acrobat-logo"]')
      .forEach((meta) => meta.remove());
  });

  it('decorates the headline, body copy, and CTA row', async () => {
    const block = await render();
    const buttons = block.querySelectorAll('.headline a.button');

    expect(block.querySelector('.foreground > .headline h1')).to.exist;
    expect(block.querySelector('.headline p')).to.exist;
    expect(block.querySelector('.headline .ctas')).to.exist;
    expect(buttons).to.have.length(2);
    expect(buttons[0].classList.contains('primaryCTA')).to.be.true;
    expect(buttons[1].classList.contains('secondaryCTA')).to.be.true;
    expect([...buttons].every((button) => button.classList.contains('button-l'))).to.be.true;
  });

  it('injects an authored CTA icon into the button', async () => {
    const block = await render();
    const icon = block.querySelector('.primaryCTA .text-group > .icon');

    expect(icon).to.exist;
    expect(icon.getAttribute('aria-hidden')).to.equal('true');
    expect(icon.querySelector('.icon-ax-blank')).to.exist;
  });

  it('promotes a media-only row to a decorative background', async () => {
    const block = await render();
    const background = block.querySelector('.background');
    const image = background.querySelector('img');

    expect(background.getAttribute('aria-hidden')).to.equal('true');
    expect(image.alt).to.equal('');
    expect(image.loading).to.equal('eager');
    expect(background.classList.contains('headline')).to.be.false;
  });

  it('uses the white Adobe Express logo for the dark variant', async () => {
    const block = await render('dark');
    const logo = block.querySelector('.express-logo');

    expect(logo.classList.contains('icon-adobe-express-logo-white')).to.be.true;
  });

  it('marks the Acrobat co-branded logo for the design width', async () => {
    const meta = document.createElement('meta');
    meta.name = 'marquee-inject-acrobat-logo';
    meta.content = 'on';
    document.head.append(meta);
    const block = await render();
    const logo = block.querySelector('.express-logo');

    expect(logo.classList.contains('icon-cobrand-lockup-acrobat-express')).to.be.true;
    expect(logo.classList.contains('cobrand-logo')).to.be.true;
  });

  it('uses the white premium crown for the premium primary CTA', async () => {
    const block = await render('premium-cta');
    const primary = block.querySelector('.primaryCTA');
    const crown = primary.querySelector('.icon-premium-crown-white');

    expect(primary.classList.contains('gradient')).to.be.true;
    expect(crown).to.exist;
    expect(crown.getAttribute('src')).to.equal('/express/code/icons/premium-crown-white.svg');
    expect(crown.getAttribute('alt')).to.equal('');
    expect(primary.querySelector('.icon-ax-blank')).to.not.exist;
  });

  it('preserves alignment and secondary-link variants for CSS treatment', async () => {
    const block = await render('right-aligned', 'secondary-cta-link', 'keep-cta-mobile');

    expect(block.classList.contains('right-aligned')).to.be.true;
    expect(block.classList.contains('secondary-cta-link')).to.be.true;
    expect(block.classList.contains('keep-cta-mobile')).to.be.true;
    expect(block.querySelector('.secondaryCTA')).to.exist;
  });

  it('marks a headline with no CTA and runs without throwing', async () => {
    document.body.innerHTML = `
      <div class="simple-marquee">
        <div><div><h2>Just a heading</h2><p>Body copy only.</p></div></div>
      </div>`;
    const block = document.querySelector('.simple-marquee');
    await decorate(block);

    expect(block.querySelector('.headline').classList.contains('no-cta')).to.be.true;
    expect(block.querySelector('.background')).to.not.exist;
  });
});
