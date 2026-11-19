/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const [, { default: decorate }] = await Promise.all([import('../../../express/code/scripts/scripts.js'), import('../../../express/code/blocks/collapsible-card/collapsible-card.js')]);

document.body.innerHTML = await readFile({ path: './mocks/body.html' });
const clock = sinon.useFakeTimers({ shouldAdvanceTime: true });

describe('Collapsible Card', () => {
  before(async () => {
    const collapsibleCard = document.querySelector('.collapsible-card');
    await decorate(collapsibleCard);
  });

  after(() => {
    clock.restore();
  });

  it('Collapsible Card exists', () => {
    const collapsibleCard = document.querySelector('.collapsible-card');
    decorate(collapsibleCard);
    expect(collapsibleCard).to.exist;
  });

  it('If toggle expanded', async () => {
    const toggleButton = document.querySelector('.toggle-button');
    toggleButton.click();

    await clock.nextAsync();
    expect(document.querySelector('.collapsible-card').classList.contains('expanded')).to.be.true;
  });

  it('If no toggle expanded', async () => {
    const toggleButton = document.querySelector('.toggle-button');
    toggleButton.click();

    await clock.nextAsync();
    expect(document.querySelector('.collapsible-card').classList.contains('expanded')).to.be.false;
  });

  it('Anchor has right class', async () => {
    const anchor = document.querySelector('a');
    expect(anchor.classList.contains('badge')).to.be.true;
  });
});
