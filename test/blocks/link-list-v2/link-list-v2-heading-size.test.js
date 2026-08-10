/* eslint-env mocha */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/link-list-v2/link-list-v2.js'),
]);
const { default: decorate } = imports[1];

describe('Link List V2 heading-size variant', () => {
  it('survives heading normalization and lands on the final h3', async () => {
    window.isTestEnv = true;
    document.body.innerHTML = await readFile({ path: './mocks/heading-size.html' });
    const linkListV2 = document.querySelector('.link-list-v2');
    await decorate(linkListV2);

    const heading = linkListV2.querySelector('h3');
    expect(heading).to.exist;
    expect(heading.classList.contains('ax-heading-l')).to.be.true;
  });
});
