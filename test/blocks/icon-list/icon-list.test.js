/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const [, { default: decorate }] = await Promise.all([import('../../../express/code/scripts/scripts.js'), import('../../../express/code/blocks/icon-list/icon-list.js')]);

describe('Icon List', () => {
  it('Icon List exists', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const iconList = document.querySelector('.icon-list');
    await decorate(iconList);
    expect(iconList).to.exist;
  });

  it('4 columns should be transformed to 2', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/4-column-body.html' });
    const iconList = document.querySelector('.icon-list');
    await decorate(iconList);
    const columns = document.querySelectorAll('.icon-list-column');
    expect(columns.length).to.equal(2);
  });

  it('2 columns should have icon-list-image and icon-list-description classes', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const iconList = document.querySelector('.icon-list');
    await decorate(iconList);
    const columns = document.querySelectorAll('.icon-list-column');

    columns.forEach((column) => {
      const hasImageClass = column.classList.contains('icon-list-image');
      const hasDescriptionClass = column.classList.contains('icon-list-description');

      expect(hasImageClass).to.be.true;
      expect(hasDescriptionClass).to.be.true;
    });
  });

  it('Text content in .icon-list-image should be icon if no img or svg', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const iconList = document.querySelector('.icon-list');
    await decorate(iconList);
    const columns = document.querySelectorAll('.icon-list-column');

    columns.forEach((column) => {
      const imageDiv = column.querySelector('.icon-list-image');
      const originalTextContent = imageDiv.textContent.trim();

      if (!imageDiv.querySelector('img, svg')) {
        expect(imageDiv.innerHTML).to.not.equal(originalTextContent);
      }
    });
  });
});
