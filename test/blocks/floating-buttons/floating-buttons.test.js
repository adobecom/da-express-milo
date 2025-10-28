/* eslint-env mocha */
/* eslint-disable no-unused-vars */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/floating-buttons/floating-buttons.js'),
]);
const { default: decorate } = imports[1];
const testBody = await readFile({ path: './mocks/body.html' });
const testBody2 = await readFile({ path: './mocks/body-paragraphed.html' });

describe('Floating buttons', () => {
  beforeEach(() => {
    window.isTestEnv = true;
    window.placeholders = {};
  });

  it('loading the static state correctly', async () => {
    document.body.innerHTML = testBody;
    const block = document.querySelector('.floating-buttons');
    await decorate(block);
    expect(block).to.exist;
  });

  it('knows what to do when authors accidentally stacked the links', async () => {
    document.body.innerHTML = testBody2;
    const block = document.querySelector('.floating-buttons');
    await decorate(block);
    expect(block.querySelector('.button-container')).to.not.exist;
  });

  it('should apply gradient class to buttons wrapped in STRONG tags', async () => {
    document.body.innerHTML = '<div class="floating-buttons"><strong><a href="/test">Test Button</a></strong></div>';
    const block = document.querySelector('.floating-buttons');
    await decorate(block);
    const button = block.querySelector('a');
    expect(button.classList.contains('gradient')).to.be.true;
    expect(button.classList.contains('button')).to.be.true;
  });
});
