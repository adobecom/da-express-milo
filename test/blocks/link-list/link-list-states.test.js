/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/link-list/link-list.js'),
]);
const { default: decorate } = imports[1];

document.body.innerHTML = await readFile({ path: './mocks/basic.html' });

describe('Link List States', () => {
  before(async () => {
    window.isTestEnv = true;
    const linkList = document.querySelector('.link-list');
    await decorate(linkList);
  });

  it('Buttons respond to focus events', () => {
    const button = document.querySelector('.button.secondary');
    expect(button).to.exist;

    // Simulate focus
    button.focus();
    expect(document.activeElement).to.equal(button);
  });

  it('Buttons respond to click events', () => {
    const button = document.querySelector('.button.secondary');
    expect(button).to.exist;

    // Simulate click
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(clickEvent);

    // Button should still exist after click
    expect(button).to.exist;
  });

  it('Buttons have proper accessibility attributes', () => {
    const buttons = document.querySelectorAll('.button.secondary');
    buttons.forEach((button) => {
      expect(button.getAttribute('href')).to.exist;
      expect(button.tagName.toLowerCase()).to.equal('a');
      // Links should be focusable by default
      expect(button.tabIndex).to.not.equal(-1);
    });
  });

  it('Button containers provide proper structure for styling', () => {
    const buttonContainers = document.querySelectorAll('.button-container');
    buttonContainers.forEach((container) => {
      expect(container.tagName.toLowerCase()).to.equal('p');
      expect(container.children.length).to.equal(1);
      expect(container.querySelector('.button.secondary')).to.exist;
    });
  });
});
