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
const newAuthoringPicture = await readFile({ path: './mocks/new-authoring-picture.html' });

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

  const waitForVideo = async (root, timeoutMs = 2000) => {
    const start = performance.now();
    let video = root.querySelector('.drawer video');
    while (!video && performance.now() - start < timeoutMs) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => { setTimeout(resolve, 20); });
      video = root.querySelector('.drawer video');
    }
    if (!video) throw new Error('Timeout waiting for drawer video');
    return video;
  };

  it('Drawer video poster reuses the optimized card face image, not the PNG fallback', async () => {
    document.body.innerHTML = newAuthoringPicture;
    const gm = document.querySelector('.grid-marquee');
    await decorateGrid(gm);

    const card = gm.querySelector('.card');
    expect(card).to.exist;
    card.dispatchEvent(new MouseEvent('mouseenter'));

    const video = await waitForVideo(gm);
    expect(video.poster).to.not.be.empty;
    expect(video.poster).to.not.include('format=png');
    expect(video.poster).to.include('format=webply');
  });

  it('Drawer video poster matches the webp source the face will use when currentSrc is empty', async () => {
    document.body.innerHTML = newAuthoringPicture;
    const gm = document.querySelector('.grid-marquee');
    await decorateGrid(gm);

    const faceImg = gm.querySelector('.face img');
    expect(faceImg).to.exist;
    Object.defineProperty(faceImg, 'currentSrc', { get: () => '', configurable: true });

    const sources = [...faceImg.closest('picture').querySelectorAll('source[type="image/webp"]')];
    const expected = sources.find((s) => !s.media || window.matchMedia(s.media).matches).srcset;

    gm.querySelector('.card').dispatchEvent(new MouseEvent('mouseenter'));

    const video = await waitForVideo(gm);
    expect(video.poster).to.not.include('format=png');
    expect(video.poster).to.equal(new URL(expected, window.location.href).href);
  });

  it('Drawer video poster leaves non-pipeline image URLs untouched', async () => {
    document.body.innerHTML = newAuthoringPicture;
    const gm = document.querySelector('.grid-marquee');
    await decorateGrid(gm);

    const faceImg = gm.querySelector('.face img');
    Object.defineProperty(faceImg, 'currentSrc', { get: () => '', configurable: true });
    faceImg.closest('picture').querySelectorAll('source').forEach((s) => s.remove());
    faceImg.setAttribute('src', '/express/code/img/favicons/favicon-32.png');

    gm.querySelector('.card').dispatchEvent(new MouseEvent('mouseenter'));

    const video = await waitForVideo(gm);
    expect(video.poster).to.include('/express/code/img/favicons/favicon-32.png');
    expect(video.poster).to.not.include('format=');
  });
});
