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
