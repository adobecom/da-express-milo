import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const [, { default: decorate }] = await Promise.all([import('../../../express/code/scripts/scripts.js'), import('../../../express/code/blocks/color-how-to-carousel/color-how-to-carousel.js')]);

const redBody = await readFile({ path: './mocks/body.html' });
const blackBody = await readFile({ path: './mocks/body-dark.html' });

describe('Color How To Carousel', () => {
  describe('with 6 lines in the first row', () => {
    beforeEach(() => {
      window.isTestEnv = true;
      document.body.innerHTML = redBody;
    });

    it('block exists', async () => {
      const block = document.querySelector('.color-how-to-carousel');
      await decorate(block);
      expect(block).to.exist;
    });

    it('schema variant builds schema', async () => {
      const block = document.querySelector('.color-how-to-carousel');
      block.classList.add('schema');
      await decorate(block);
      const schema = document.querySelector('head script[type="application/ld+json"]');
      expect(schema).to.exist;
    });
  });

  describe('with only 4 lines in the first row + is dark', () => {
    beforeEach(() => {
      window.isTestEnv = true;
      document.body.innerHTML = blackBody;
    });

    it('block has a dark class', async () => {
      const block = document.querySelector('.color-how-to-carousel');
      await decorate(block);
      expect(block.classList.contains('dark')).to.be.true;
    });

    it('schema variant builds schema', async () => {
      const block = document.querySelector('.color-how-to-carousel');
      block.classList.add('schema');
      await decorate(block);
      const schema = document.querySelector('head script[type="application/ld+json"]');
      expect(schema).to.exist;
    });

    it('the missing 2 rows are icon and CTA', async () => {
      const block = document.querySelector('.color-how-to-carousel');
      await decorate(block);
      const icon = block.querySelector('.icon-color-how-to-icon');
      const cta = block.querySelector('.contnt-wrapper a.button.accent');
      expect(icon).to.not.exist;
      expect(cta).to.not.exist;
    });
  });
});
