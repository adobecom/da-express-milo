/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

await import('../../../express/code/scripts/scripts.js');

const { default: decorate } = await import(
  '../../../express/code/blocks/browse-by-category/browse-by-category.js'
);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

function expectDecorativeCards(categories, labels) {
  const images = [...categories.querySelectorAll('.browse-by-category-card img')];
  expect(images.length).to.be.greaterThan(0);
  images.forEach((img) => {
    expect(img.hasAttribute('alt')).to.be.true;
    expect(img.getAttribute('alt')).to.equal('');
    expect(img.hasAttribute('title')).to.be.false;
    expect(img.hasAttribute('aria-label')).to.be.false;
    expect(img.hasAttribute('aria-labelledby')).to.be.false;
  });
  expect(categories.querySelectorAll('img[alt="Inserting image..."]').length).to.equal(0);

  const titles = [...categories.querySelectorAll('.browse-by-category-card-title')];
  expect(titles.map((t) => t.textContent)).to.deep.equal(labels);
  const links = [...categories.querySelectorAll('.browse-by-category-card-link')];
  expect(links.map((a) => a.title)).to.deep.equal(labels);
}

describe('Browse-by-category', () => {
  it('Browse by category exists', async () => {
    const categories = document.querySelector('#browse-by-category-pure');
    const authored = categories.querySelector('img[title]');
    expect(authored.hasAttribute('title')).to.be.true;
    expect(authored.hasAttribute('aria-label')).to.be.true;
    expect(authored.hasAttribute('aria-labelledby')).to.be.true;
    await decorate(categories);
    expect(categories).to.exist;
    expect(authored.hasAttribute('title')).to.be.false;
    expect(authored.hasAttribute('aria-label')).to.be.false;
    expect(authored.hasAttribute('aria-labelledby')).to.be.false;
    expect(authored.getAttribute('alt')).to.equal('');

    expect(
      categories.querySelector('.browse-by-category-heading').textContent,
    ).to.equal('Browse by Category');

    expect(
      categories.querySelectorAll('.browse-by-category-card').length,
    ).to.equal(4);

    expectDecorativeCards(categories, ['Logos', 'Collages', 'Posters', 'Book Covers']);
  });

  it('Browse by category with empty head', async () => {
    const categories = document.querySelector('#browse-by-category-empty-head');
    await decorate(categories);
    expect(categories).to.exist;

    expect(
      categories.querySelector('.browse-by-category-heading').textContent,
    ).to.equal('');

    expectDecorativeCards(categories, ['Logos', 'Collages', 'Posters', 'Book Covers']);
  });

  it('Browse by category with fullwidth', async () => {
    const categories = document.querySelector('#browse-by-category-fullwidth');
    await decorate(categories);
    expect(categories).to.exist;

    expect(
      categories.querySelector('.browse-by-category-heading').textContent,
    ).to.equal('Browse by Category');

    expectDecorativeCards(categories, ['Logos', 'Collages', 'Posters']);
    const lastImg = [...categories.querySelectorAll('.browse-by-category-card img')].pop();
    expect(lastImg.getAttribute('alt')).to.equal('');
  });
});
