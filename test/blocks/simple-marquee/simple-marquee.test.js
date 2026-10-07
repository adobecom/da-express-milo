/* eslint-env mocha */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/simple-marquee/simple-marquee.js'),
]);
const { default: decorate } = imports[1];
const fixture = await readFile({ path: './mocks/default.html' });

async function render() {
  document.body.innerHTML = fixture;
  const block = document.querySelector('.simple-marquee');
  await decorate(block);
  return block;
}

function addMeta(name, content) {
  const meta = document.createElement('meta');
  meta.name = name;
  meta.content = content;
  document.head.append(meta);
}

describe('Simple Marquee', () => {
  beforeEach(() => {
    window.isTestEnv = true;
  });

  afterEach(() => {
    document.head.querySelectorAll('meta[name="inject-branding-logo"], meta[name="marquee-inject-acrobat-logo"]')
      .forEach((meta) => meta.remove());
  });

  it('decorates the headline and CTAs', async () => {
    const block = await render();
    const buttons = block.querySelectorAll('.headline a.button');

    expect(block.querySelector('.foreground > .headline h1')).to.exist;
    expect(block.querySelector('.headline .ctas')).to.exist;
    expect(buttons).to.have.length(2);
    expect(buttons[0].classList.contains('primaryCTA')).to.be.true;
    expect(buttons[0].getAttribute('aria-label')).to.equal('Get started Create anything with Adobe Express.');
  });

  it('injects the authored CTA icon into the button', async () => {
    const block = await render();
    const icon = block.querySelector('.primaryCTA .text-group > .icon');

    expect(icon).to.exist;
    expect(icon.getAttribute('aria-hidden')).to.equal('true');
    expect(icon.querySelector('.icon-ax-blank')).to.exist;
  });

  it('injects the default Adobe Express branding logo', async () => {
    const block = await render();
    const logo = block.querySelector('.foreground > .express-logo');

    expect(logo).to.exist;
    expect(logo.classList.contains('icon-adobe-express-logo')).to.be.true;
  });

  it('supports a custom branding logo from metadata', async () => {
    addMeta('inject-branding-logo', 'cobrand-lockup-acrobat-express');
    const block = await render();
    const logo = block.querySelector('.foreground > .express-logo');

    expect(logo.classList.contains('icon-cobrand-lockup-acrobat-express')).to.be.true;
  });
});
