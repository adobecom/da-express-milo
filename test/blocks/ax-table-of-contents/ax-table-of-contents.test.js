/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([import('../../../express/code/scripts/utils.js'), import('../../../express/code/scripts/scripts.js'), import('../../../express/code/blocks/ax-table-of-contents/ax-table-of-contents.js'), import('../../../express/code/scripts/widgets/free-plan.js')]);
const { getLibs } = imports[0];
const { default: decorate } = imports[2];
const { addFreePlanWidget } = imports[3];
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({ locales: { '': { ietf: 'en-US', tk: 'iwo3rvz.css' } } });
});

describe('table-of-contents', () => {
  before(() => {
    window.isTestEnv = true;
  });

  beforeEach(async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const block = document.querySelector('.table-of-contents');
    block.classList.add('table-of-contents');
  });

  it('generates toc-entry elements for h2 headings', () => {
    const block = document.querySelector('.table-of-contents');
    const config = { levels: '2' };
    block.dataset.config = JSON.stringify(config);

    decorate(block, 'table-of-contents', document);

    const tocEntries = document.querySelectorAll('.toc-entry');
    tocEntries.forEach((entry) => {
      const levelClass = entry.classList[1];
      expect(levelClass).to.equal('toc-level-h2');
      addFreePlanWidget();
    });
  });
});
