/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/link-list-v2/link-list-v2.js'),
]);
const { default: decorate } = imports[1];

document.body.innerHTML = await readFile({ path: './mocks/basic.html' });

describe('Link List V2', () => {
  before(async () => {
    window.isTestEnv = true;
    const linkListV2 = document.querySelector('.link-list-v2');
    await decorate(linkListV2);
  });

  it('Link list v2 exists', () => {
    const linkListV2 = document.querySelector('.link-list-v2');
    expect(linkListV2).to.exist;
  });

  it('Link list v2 has the correct container structure', () => {
    expect(document.querySelector('.ax-link-list-v2-container')).to.exist;
    expect(document.querySelector('.link-list-v2-wrapper')).to.exist;
    expect(document.querySelector('.carousel-container')).to.exist;
    expect(document.querySelector('.carousel-platform')).to.exist;
  });

  it('Link list v2 has buttons with correct classes', () => {
    const buttons = document.querySelectorAll('.button.secondary');
    expect(buttons).to.have.length(3);

    buttons.forEach((button) => {
      expect(button.classList.contains('button')).to.be.true;
      expect(button.classList.contains('secondary')).to.be.true;
    });
  });

  it('Buttons have correct href attributes', () => {
    const buttons = document.querySelectorAll('.button.secondary');
    expect(buttons[0].getAttribute('href')).to.equal('https://example.com/1');
    expect(buttons[1].getAttribute('href')).to.equal('https://example.com/2');
    expect(buttons[2].getAttribute('href')).to.equal('https://example.com/3');
  });

  it('Buttons have correct text content', () => {
    const buttons = document.querySelectorAll('.button.secondary');
    expect(buttons[0].textContent.trim()).to.equal('Button 1');
    expect(buttons[1].textContent.trim()).to.equal('Button 2');
    expect(buttons[2].textContent.trim()).to.equal('Button 3');
  });

  it('Link list v2 has heading', () => {
    const heading = document.querySelector('.link-list-v2 h3');
    expect(heading).to.exist;
    expect(heading.textContent.trim()).to.equal('Test Link List V2');
  });

  it('Button containers exist', () => {
    const buttonContainers = document.querySelectorAll('.button-container');
    expect(buttonContainers).to.have.length(3);
  });

  it('Carousel platform exists', () => {
    const carouselPlatform = document.querySelector('.carousel-platform');
    expect(carouselPlatform).to.exist;
  });

  it('Carousel platform has correct classes', () => {
    const carouselPlatform = document.querySelector('.carousel-platform');
    expect(carouselPlatform).to.exist;
    expect(carouselPlatform.classList.contains('carousel-platform')).to.be.true;
  });

  it('Buttons have correct base styling classes', () => {
    const buttons = document.querySelectorAll('.button.secondary');
    buttons.forEach((button) => {
      expect(button.classList.contains('button')).to.be.true;
      expect(button.classList.contains('secondary')).to.be.true;
    });
  });

  it('Buttons are focusable and have proper attributes', () => {
    const buttons = document.querySelectorAll('.button.secondary');
    buttons.forEach((button) => {
      expect(button.getAttribute('href')).to.exist;
      expect(button.tagName.toLowerCase()).to.equal('a');
    });
  });

  it('Link list v2 has proper container structure for styling', () => {
    const container = document.querySelector('.ax-link-list-v2-container');
    expect(container).to.exist;
    expect(container.classList.contains('ax-link-list-v2-container')).to.be.true;
  });
});
