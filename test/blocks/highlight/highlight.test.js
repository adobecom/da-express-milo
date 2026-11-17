/* eslint-env mocha */
/* eslint-disable no-unused-vars */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import('../../../express/code/blocks/highlight/highlight.js');

document.body.innerHTML = await readFile({ path: './mocks/highlight.html' });

describe('Highlight Block', () => {
  before(async () => {
    const highlight = document.querySelector('.highlight');
    await decorate(highlight);
  });

  it('Should have the correct elements', () => {
    expect(document.querySelector('.highlight')).to.exist;
    expect(document.querySelectorAll('.icon-row')).to.have.lengthOf(4); // Assuming 4 icon rows
    expect(document.querySelectorAll('.text')).to.have.lengthOf(4);
    expect(document.querySelectorAll('img')).to.have.lengthOf(4);
  });

  it('Should have correct accessibility attributes', () => {
    const rows = document.querySelectorAll('.icon-row');
    rows.forEach((row) => {
      expect(row.getAttribute('role')).to.equal('listitem');
      expect(row.getAttribute('tabindex')).to.equal('0');
      expect(row.getAttribute('aria-label')).to.exist;
    });

    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      expect(img.getAttribute('role')).to.equal('presentation');
    });

    expect(document.querySelector('.highlight').getAttribute('role')).to.equal('list');
  });
});
