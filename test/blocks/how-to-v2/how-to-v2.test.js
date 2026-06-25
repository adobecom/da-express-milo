import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };

window.isTestEnv = true;
const imports = await Promise.all([import('../../../express/code/scripts/utils.js'), import('../../../express/code/scripts/scripts.js')]);
const { getLibs } = imports[0];

await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  const conf = { locales };
  mod.setConfig(conf);
});

document.body.innerHTML = await readFile({ path: './mocks/body.html' });
describe('How-to-v2', () => {
  let blocks;
  before(async () => {
    blocks = [...document.querySelectorAll('.how-to-v2')];
  });
  after(() => {});
  it('decorates into collection of steps', async () => {
    const bl = blocks[0];
    const ol = bl.querySelector('ol');
    expect(ol).to.exist;
    expect(ol.classList.contains('steps')).to.be.true;
    const lis = [...ol.querySelectorAll('li')];
    lis.forEach((li) => {
      expect(li.classList.contains('step'));
      const h3 = li.querySelector('h3');
      expect(h3).not.to.be.null;
    });
    expect(lis.length).to.equal(5);
  });
  it('adds step numbers to cards', async () => {
    const bl = blocks[0];
    const ol = bl.querySelector('ol');
    const lis = [...ol.querySelectorAll('li')];
    lis.forEach((li, i) => {
      expect(li.classList.contains('step'));
      const h3 = li.querySelector('h3');
      const stepNumber = h3.textContent;
      const num = i + 1;
      expect(stepNumber.includes(num.toString())).to.be.true;
    });
  });
});
