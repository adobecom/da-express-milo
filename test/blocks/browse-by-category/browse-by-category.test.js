/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

await import('../../../express/code/scripts/scripts.js');

const { default: decorate } = await import(
  '../../../express/code/blocks/browse-by-category/browse-by-category.js'
);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Browse-by-category', () => {
  before(() => {
    window.istestEnv = true;
  });

  it('Browse by category exists', async () => {
    const categories = document.querySelector('#browse-by-category-pure');
    await decorate(categories);
    expect(categories).to.exist;

    expect(
      categories.querySelector('.browse-by-category-heading').textContent,
    ).to.equal('Browse by Category');

    expect(
      categories.querySelectorAll('.browse-by-category-card').length,
    ).to.equal(4);
  });

  it('Marks card images decorative and keeps card text and links', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const block = document.querySelector('#browse-by-category-pure');
    const imgs = [...block.querySelectorAll('img')];
    imgs[0].setAttribute('alt', 'Inserting image...');
    imgs[1]?.removeAttribute('alt');
    imgs[2]?.setAttribute('alt', 'A meaningful description');
    imgs[3]?.setAttribute('title', 'Image title');
    imgs[3]?.setAttribute('aria-label', 'Image label');
    const sizing = imgs.map((i) => [i.getAttribute('loading'), i.getAttribute('width'), i.getAttribute('height')]);

    await decorate(block);

    const cards = [...block.querySelectorAll('.browse-by-category-card')];
    const decorated = [...block.querySelectorAll('.browse-by-category-card img')];
    expect(decorated.length).to.equal(imgs.length);
    decorated.forEach((img, i) => {
      expect(img.getAttribute('alt')).to.equal('');
      expect(img.hasAttribute('title')).to.be.false;
      expect(img.hasAttribute('aria-label')).to.be.false;
      expect(img.hasAttribute('aria-labelledby')).to.be.false;
      expect([img.getAttribute('loading'), img.getAttribute('width'), img.getAttribute('height')])
        .to.deep.equal(sizing[i]);
    });
    cards.forEach((card) => {
      const title = card.querySelector('.browse-by-category-card-title').textContent;
      const link = card.querySelector('.browse-by-category-card-link');
      expect(title).to.not.equal('');
      expect(link.title).to.equal(title);
      expect(link.getAttribute('href')).to.not.equal('');
    });
  });

  it('Browse by category with empty head', async () => {
    const categories = document.querySelector('#browse-by-category-empty-head');
    await decorate(categories);
    expect(categories).to.exist;

    expect(
      categories.querySelector('.browse-by-category-heading').textContent,
    ).to.equal('');
  });

  it('Browse by category with fullwidth', async () => {
    const categories = document.querySelector('#browse-by-category-fullwidth');
    await decorate(categories);
    expect(categories).to.exist;

    expect(
      categories.querySelector('.browse-by-category-heading').textContent,
    ).to.equal('Browse by Category');
  });
});
