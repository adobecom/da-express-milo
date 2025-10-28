/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/grid-marquee-hero/grid-marquee-hero.js'),
]);
const { default: decorate } = imports[1];

const basic = await readFile({ path: './mocks/basic.html' });

describe('Grid Marquee Hero', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('Renders logo and headline; adds CTA classes', async () => {
    document.body.innerHTML = basic;
    const hero = document.querySelector('.grid-marquee-hero');
    await decorate(hero);

    const logo = hero.querySelector('.express-logo');
    const headline = hero.querySelector('.headline');
    const h1 = hero.querySelector('.headline h1');
    const ctas = hero.querySelector('.headline .ctas');
    const buttons = hero.querySelectorAll('.headline a.button');

    expect(logo).to.exist;
    expect(headline).to.exist;
    expect(h1).to.exist;
    expect(ctas).to.exist;
    expect(buttons.length).to.be.at.least(2);
    expect(buttons[0].classList.contains('primaryCTA')).to.be.true;
  });
});
