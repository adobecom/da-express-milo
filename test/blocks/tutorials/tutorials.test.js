/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

window.isTestEnv = true;
const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/tutorials/tutorials.js'),
]);
const { default: decorate } = imports[1];

document.body.innerHTML = await readFile({ path: './mocks/body.html' });
describe('Tutorials', () => {
  before(async () => {
    window.isTestEnv = true;
    const tutorials = document.querySelector('.tutorials');
    if (tutorials) {
      await decorate(tutorials);
    }
  });
  it('Tutorials exists', () => {
    const tutorials = document.querySelector('.tutorials');
    expect(tutorials).to.exist;
    expect(tutorials.children.length).to.be.greaterThan(0);
  });

  it('Tutorials has correct elements', () => {
    expect(document.querySelector('.tutorial-card')).to.exist;
    expect(document.querySelector('.tutorial-card-top')).to.exist;
    expect(document.querySelector('.tutorial-card-overlay')).to.exist;
    expect(document.querySelector('.tutorial-card-play')).to.exist;
    expect(document.querySelector('.tutorial-card-duration')).to.exist;
  });

  it('Display video modal when card is clicked', () => {
    const card = document.querySelector('.tutorial-card');
    card.click();
  });
});
