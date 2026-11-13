/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import sinon from 'sinon';
import { readFile, setViewport } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const [, { default: decorate, resizeSvg }] = await Promise.all([import('../../../express/code/scripts/scripts.js'), import('../../../express/code/blocks/hero-color/hero-color.js')]);

document.body.innerHTML = await readFile({ path: './mocks/body.html' });
const clock = sinon.useFakeTimers({ shouldAdvanceTime: true });

describe('Hero Color', () => {
  before(async () => {
    const heroColor = document.querySelector('.hero-color');
    await decorate(heroColor);
  });

  after(() => {
    clock.restore();
  });

  it('Should have the correct elements', () => {
    expect(document.querySelector('.hero-color')).to.exist;
    expect(document.querySelector('.color-svg')).to.exist;
    expect(document.querySelector('h1')).to.exist;
    expect(document.querySelector('p')).to.exist;
    expect(document.querySelector('.button')).to.exist;
  });

  it('Should have a primary and secondary color', () => {
    const svgContainer = document.querySelector('.svg-container');
    const svgImg = document.querySelector('.color-svg-img');
    const primaryColor = svgContainer.style.backgroundColor;
    const secondaryColor = svgImg.style.fill;

    expect(primaryColor).to.exist;
    expect(secondaryColor).to.exist;
  });
});
