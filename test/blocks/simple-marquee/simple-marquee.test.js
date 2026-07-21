/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/simple-marquee/simple-marquee.js'),
]);
const { default: decorate } = imports[1];

const basic = await readFile({ path: './mocks/basic.html' });

describe('Simple Marquee', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('decorates headline, eyebrow, body copy and CTAs into the foreground', async () => {
    document.body.innerHTML = basic;
    const block = document.querySelector('.simple-marquee');
    await decorate(block);

    const foreground = block.querySelector('.foreground');
    const headline = block.querySelector('.headline');
    const h1 = block.querySelector('.headline h1');
    const body = block.querySelector('.headline p:not(.ctas)');
    const ctas = block.querySelector('.headline .ctas');
    const buttons = block.querySelectorAll('.headline a.button');

    expect(foreground).to.exist;
    expect(headline).to.exist;
    expect(foreground.contains(headline)).to.be.true;
    expect(h1).to.exist;
    expect(block.querySelector('.express-logo')).to.exist;
    expect(body).to.exist;
    expect(ctas).to.exist;
    expect(buttons.length).to.equal(2);
    expect(buttons[0].classList.contains('primaryCTA')).to.be.true;
    expect(buttons[1].classList.contains('primaryCTA')).to.be.false;
  });

  it('promotes a media-only row to the background', async () => {
    document.body.innerHTML = basic;
    const block = document.querySelector('.simple-marquee');
    await decorate(block);

    const background = block.querySelector('.background');
    expect(background).to.exist;
    expect(background.querySelector('img')).to.exist;
    expect(background.querySelector('img').loading).to.equal('lazy');
    // Media row must not be treated as the headline.
    expect(background.classList.contains('headline')).to.be.false;
  });

  it('marks a headline with no CTA and runs without throwing', async () => {
    document.body.innerHTML = `
      <div class="simple-marquee">
        <div><div><h2>Just a heading</h2><p>Body copy only.</p></div></div>
      </div>`;
    const block = document.querySelector('.simple-marquee');
    await decorate(block);

    const headline = block.querySelector('.headline');
    expect(headline).to.exist;
    expect(headline.classList.contains('no-cta')).to.be.true;
    expect(block.querySelector('.background')).to.not.exist;
  });
});
