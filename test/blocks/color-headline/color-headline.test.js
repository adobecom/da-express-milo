/* eslint-env mocha */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/color-headline/color-headline.js'),
]);
const { default: init } = imports[1];

const basic = await readFile({ path: './mocks/basic.html' });
const extract = await readFile({ path: './mocks/extract.html' });

function addMeta(name, content) {
  const meta = document.createElement('meta');
  meta.name = name;
  meta.content = content;
  document.head.append(meta);
  return meta;
}

describe('Color Headline', () => {
  before(() => {
    window.isTestEnv = true;
  });

  afterEach(() => {
    document.head.querySelectorAll('meta[name="marquee-inject-logo"], meta[name="marquee-inject-photo-logo"]').forEach((m) => m.remove());
  });

  describe('basic variant', () => {
    it('block exists after init', async () => {
      document.body.innerHTML = basic;
      const block = document.querySelector('.color-headline');
      await init(block);
      expect(block).to.exist;
    });

    it('heading is present', async () => {
      document.body.innerHTML = basic;
      const block = document.querySelector('.color-headline');
      await init(block);
      expect(block.querySelector('h2')).to.exist;
    });

    it('paragraph is present', async () => {
      document.body.innerHTML = basic;
      const block = document.querySelector('.color-headline');
      await init(block);
      expect(block.querySelector('p')).to.exist;
    });

    it('does not inject logo when marquee-inject-logo metadata is absent', async () => {
      document.body.innerHTML = basic;
      const block = document.querySelector('.color-headline');
      await init(block);
      expect(block.querySelector('.express-logo')).to.not.exist;
    });
  });

  describe('extract variant', () => {
    it('block exists after init', async () => {
      document.body.innerHTML = extract;
      const block = document.querySelector('.color-headline');
      await init(block);
      expect(block).to.exist;
    });

    it('heading is present', async () => {
      document.body.innerHTML = extract;
      const block = document.querySelector('.color-headline');
      await init(block);
      expect(block.querySelector('h1')).to.exist;
    });

    it('paragraph is present', async () => {
      document.body.innerHTML = extract;
      const block = document.querySelector('.color-headline');
      await init(block);
      expect(block.querySelector('p')).to.exist;
    });

    it('always injects logo for extract variant (regardless of metadata)', async () => {
      document.body.innerHTML = extract;
      const block = document.querySelector('.color-headline');
      await init(block);
      expect(block.querySelector('.express-logo')).to.exist;
    });
  });

  describe('logo injection via marquee-inject-logo metadata', () => {
    it('injects logo when value is "on"', async () => {
      addMeta('marquee-inject-logo', 'on');
      document.body.innerHTML = basic;
      const block = document.querySelector('.color-headline');
      await init(block);
      expect(block.querySelector('.express-logo')).to.exist;
    });

    it('injects logo when value is "yes"', async () => {
      addMeta('marquee-inject-logo', 'yes');
      document.body.innerHTML = basic;
      const block = document.querySelector('.color-headline');
      await init(block);
      expect(block.querySelector('.express-logo')).to.exist;
    });

    it('does not inject logo for unrecognised values', async () => {
      addMeta('marquee-inject-logo', 'true');
      document.body.innerHTML = basic;
      const block = document.querySelector('.color-headline');
      await init(block);
      expect(block.querySelector('.express-logo')).to.not.exist;
    });

    it('logo appears immediately before the heading', async () => {
      addMeta('marquee-inject-logo', 'on');
      document.body.innerHTML = extract;
      const block = document.querySelector('.color-headline');
      await init(block);
      const logo = block.querySelector('.express-logo');
      const heading = block.querySelector('h1');
      expect(logo).to.exist;
      expect(logo.nextElementSibling).to.equal(heading);
    });
  });

  describe('photo logo injection via marquee-inject-photo-logo metadata', () => {
    it('injects photo logo when value is "on"', async () => {
      addMeta('marquee-inject-photo-logo', 'on');
      document.body.innerHTML = basic;
      const block = document.querySelector('.color-headline');
      await init(block);
      const logo = block.querySelector('.express-logo');
      expect(logo).to.exist;
      expect(logo.classList.contains('icon-adobe-express-logo-photos')).to.be.true;
    });

    it('prefers photo logo over standard logo when both metadata are set', async () => {
      addMeta('marquee-inject-logo', 'on');
      addMeta('marquee-inject-photo-logo', 'on');
      document.body.innerHTML = basic;
      const block = document.querySelector('.color-headline');
      await init(block);
      const logo = block.querySelector('.express-logo');
      expect(logo.classList.contains('icon-adobe-express-logo-photos')).to.be.true;
    });
  });
});
