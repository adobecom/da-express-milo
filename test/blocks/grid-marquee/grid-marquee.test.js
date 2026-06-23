/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/grid-marquee/grid-marquee.js'),
  import('../../../express/code/blocks/grid-marquee-hero/grid-marquee-hero.js'),
]);
const { default: decorateGrid } = imports[1];
const { default: decorateHero } = imports[2];

const oldAuthoring = await readFile({ path: './mocks/old-authoring.html' });
const newAuthoring = await readFile({ path: './mocks/new-authoring.html' });

describe('Grid Marquee - Legacy vs New Authoring', () => {
  let originalRAF;
  before(() => {
    window.isTestEnv = true;
    originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) => {
      cb(performance.now());
      return 0;
    };
  });

  after(() => {
    window.requestAnimationFrame = originalRAF;
  });

  it('Legacy mode (h1 inside grid-marquee) decorates headline and CTAs', async () => {
    document.body.innerHTML = oldAuthoring;
    const gm = document.querySelector('.grid-marquee');
    await decorateGrid(gm);

    // Wait up to 1s for both CTA buttons to be decorated
    const waitForTwoButtons = async (root, timeoutMs = 1000) => {
      const start = performance.now();
      return new Promise((resolve, reject) => {
        const check = () => {
          const btns = root.querySelectorAll('.headline a.button');
          if (btns.length >= 2) return resolve(btns);
          if (performance.now() - start > timeoutMs) return reject(new Error('Timeout waiting for two CTA buttons'));
          requestAnimationFrame(check);
          return undefined;
        };
        check();
      });
    };

    const headline = gm.querySelector('.headline');
    const h1 = gm.querySelector('.headline h1');
    const ctas = gm.querySelector('.headline .ctas');
    const buttons = await waitForTwoButtons(gm);

    expect(headline).to.exist;
    expect(h1).to.exist;
    expect(ctas).to.exist;
    expect(buttons.length).to.be.at.least(2);
    expect(buttons[0].classList.contains('primaryCTA')).to.be.true;
  });

  it('New mode (hero split) has no headline inside grid-marquee', async () => {
    document.body.innerHTML = newAuthoring;
    const hero = document.querySelector('.grid-marquee-hero');
    const gm = document.querySelector('.grid-marquee');
    await decorateHero(hero);
    await decorateGrid(gm);

    const waitForCards = (root) => {
      const el = root.querySelector('.cards-container');
      if (!el) throw new Error('.cards-container not found after decorateGrid');
      return el;
    };

    const headlineInGM = gm.querySelector('.headline');
    const h1InGM = gm.querySelector('h1');
    const heroH1 = hero.querySelector('h1');
    const cards = waitForCards(gm);

    expect(heroH1).to.exist;
    expect(headlineInGM).to.not.exist;
    expect(h1InGM).to.not.exist;
    expect(cards).to.exist;
  });

  it('keeps decorated injected content intact when decoration is invoked again', async () => {
    document.body.innerHTML = oldAuthoring;
    const gm = document.querySelector('.grid-marquee');
    await decorateGrid(gm);

    const decoratedHTML = gm.innerHTML;
    await decorateGrid(gm);

    expect(gm.innerHTML).to.equal(decoratedHTML);
    expect(gm.querySelectorAll(':scope > .foreground').length).to.equal(1);
    expect(gm.querySelectorAll('.cards-container').length).to.equal(1);
    expect(gm.querySelectorAll('.background').length).to.equal(1);
    expect(gm.dataset.gridMarqueeDecorated).to.equal('true');
    expect(gm.dataset.gridMarqueeDecorating).to.be.undefined;
  });

  it('keeps decorated injected split-authoring content intact when decoration is invoked again', async () => {
    document.body.innerHTML = newAuthoring;
    const hero = document.querySelector('.grid-marquee-hero');
    const gm = document.querySelector('.grid-marquee');
    await decorateHero(hero);
    await decorateGrid(gm);

    const decoratedHeroHTML = hero.innerHTML;
    const decoratedGridHTML = gm.innerHTML;
    await decorateHero(hero);
    await decorateGrid(gm);

    expect(hero.innerHTML).to.equal(decoratedHeroHTML);
    expect(gm.innerHTML).to.equal(decoratedGridHTML);
    expect(hero.querySelectorAll(':scope > .foreground').length).to.equal(1);
    expect(gm.querySelectorAll(':scope > .foreground').length).to.equal(1);
    expect(gm.querySelectorAll('.cards-container').length).to.equal(1);
    expect(gm.querySelectorAll('.background').length).to.equal(1);
    expect(hero.dataset.gridMarqueeHeroDecorated).to.equal('true');
    expect(hero.dataset.gridMarqueeHeroDecorating).to.be.undefined;
    expect(gm.dataset.gridMarqueeDecorated).to.equal('true');
    expect(gm.dataset.gridMarqueeDecorating).to.be.undefined;
  });
});
