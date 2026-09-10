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
const { getLibs } = await import('../../../express/code/scripts/utils.js');
const { setConfig } = await import(`${getLibs()}/utils/utils.js`);

const oldAuthoring = await readFile({ path: './mocks/old-authoring.html' });
const newAuthoring = await readFile({ path: './mocks/new-authoring.html' });
const newAuthoringPicture = await readFile({ path: './mocks/new-authoring-picture.html' });
const newAuthoringStaticImage = await readFile({ path: './mocks/new-authoring-static-image.html' });

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

  it('Card authored with a static image (no video anchor) opens the drawer with an image instead of a video', async () => {
    document.body.innerHTML = newAuthoringStaticImage;
    const gm = document.querySelector('.grid-marquee');
    await decorateGrid(gm);

    const card = gm.querySelector('.card');
    expect(card).to.exist;
    card.dispatchEvent(new MouseEvent('mouseenter'));

    const waitForVideoContainer = async (root, timeoutMs = 2000) => {
      const start = performance.now();
      let container = root.querySelector('.drawer .video-container');
      while (!container?.firstElementChild && performance.now() - start < timeoutMs) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => { setTimeout(resolve, 20); });
        container = root.querySelector('.drawer .video-container');
      }
      if (!container?.firstElementChild) throw new Error('Timeout waiting for drawer video-container');
      return container;
    };

    const videoContainer = await waitForVideoContainer(gm);
    expect(videoContainer.querySelector('video')).to.not.exist;
    const img = videoContainer.querySelector('img');
    expect(img).to.exist;
    expect(img.src).to.not.be.empty;
  });
});

describe('Grid Marquee - Ratings store icon localization', () => {
  const localesForTest = {
    '': { ietf: 'en-US', tk: 'hah7vzn.css' },
    ara: { ietf: 'ar', tk: 'cbp4pzm.css', dir: 'rtl' },
    fr: { ietf: 'fr-FR', tk: 'vrk5vyv.css' },
    mx: { ietf: 'es-MX', tk: 'oln4yqj.css' },
    ch_it: { ietf: 'it-CH', tk: 'bbf5pok.css' },
  };

  // milo's replaceKey short-circuits on config.placeholders before fetching, so
  // seeding these here avoids the (disallowed) placeholders.json network request.
  const placeholders = {
    'app-store-ratings': '4.9, 233.8k; 4.6, 117k; https://adobesparkpost.app.link/GJrBPFUWBBb',
    'app-store-stars': 'stars',
    'app-store-ratings-play-store': 'Download on Google Play',
    'app-store-ratings-apple-store': 'Download on the App Store',
  };

  before(() => {
    window.isTestEnv = true;
  });

  // renderRatings mutates milo's module-level config; reset it so a later test
  // (or reordering) doesn't inherit this block's locale/placeholders.
  after(() => {
    setConfig({ locales: localesForTest, pathname: '/' });
  });

  const renderRatings = async (pathname) => {
    setConfig({ locales: localesForTest, pathname, placeholders });
    document.body.innerHTML = oldAuthoring;
    const gm = document.querySelector('.grid-marquee');
    await decorateGrid(gm);
    return [...gm.querySelectorAll('.ratings .ratings-container a img')];
  };

  it('uses the localized store badges for a locale that has them (ara -> ar)', async () => {
    const [apple, google] = await renderRatings('/ara/express/');
    expect(apple.getAttribute('src')).to.equal('/express/code/icons/apple-store-ar.svg');
    expect(google.getAttribute('src')).to.equal('/express/code/icons/google-store-ar.svg');
  });

  it('uses the English store badges for English locales without a 404 attempt (us)', async () => {
    const [apple, google] = await renderRatings('/');
    expect(apple.getAttribute('src')).to.equal('/express/code/icons/apple-store.svg');
    expect(google.getAttribute('src')).to.equal('/express/code/icons/google-store.svg');
  });

  it('resolves the badge by language, not URL region, for country locales', async () => {
    const [mxApple, mxGoogle] = await renderRatings('/mx/express/');
    expect(mxApple.getAttribute('src')).to.equal('/express/code/icons/apple-store-es-419.svg');
    expect(mxGoogle.getAttribute('src')).to.equal('/express/code/icons/google-store-es-419.svg');

    const [itApple, itGoogle] = await renderRatings('/ch_it/express/');
    expect(itApple.getAttribute('src')).to.equal('/express/code/icons/apple-store-it.svg');
    expect(itGoogle.getAttribute('src')).to.equal('/express/code/icons/google-store-it.svg');
  });

  it('falls back to the English badge when a localized asset is missing', async () => {
    const [apple, google] = await renderRatings('/fr/express/');
    // alt keeps the originally requested localized icon name (the fallback swaps
    // only src), proving the localized badge was attempted. src is asserted after
    // the error below to stay deterministic regardless of the real 404's timing.
    expect(apple.getAttribute('alt')).to.equal('apple-store-fr');
    expect(google.getAttribute('alt')).to.equal('google-store-fr');

    apple.dispatchEvent(new Event('error'));
    google.dispatchEvent(new Event('error'));
    expect(apple.getAttribute('src')).to.equal('/express/code/icons/apple-store.svg');
    expect(google.getAttribute('src')).to.equal('/express/code/icons/google-store.svg');
  });
});
