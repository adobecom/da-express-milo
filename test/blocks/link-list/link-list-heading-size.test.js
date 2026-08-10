/* eslint-env mocha */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

window.isTestEnv = true;

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/link-list/link-list.js'),
]);
const { default: decorate } = imports[1];

describe('Link List heading-size variant', () => {
  it('survives heading normalization and lands on the final h3', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/heading-size.html' });
    const linkList = document.querySelector('.link-list');
    await decorate(linkList);

    const heading = linkList.querySelector('h3');
    expect(heading).to.exist;
    expect(heading.classList.contains('ax-heading-l')).to.be.true;
  });
});
