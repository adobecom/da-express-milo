import { readFile, setViewport } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const styles = await Promise.all([
  readFile({ path: '../../../express/code/scripts/widgets/carousel.css' }),
  readFile({ path: '../../../express/code/blocks/gen-ai-cards/gen-ai-cards.css' }),
]);

function expectCenteredChevron(arrow) {
  const style = getComputedStyle(arrow, '::before');
  const width = parseFloat(style.width) + parseFloat(style.borderRightWidth);
  const height = parseFloat(style.height) + parseFloat(style.borderTopWidth);
  const border = parseFloat(style.borderTopWidth);
  const matrix = new DOMMatrix(style.transform);
  const points = [
    [0, 0], [width, 0], [width, height],
    [width - border, height], [width - border, border], [0, border],
  ].map(([x, y]) => matrix.transformPoint({
    x: x - width / 2,
    y: y - height / 2,
  }));
  const centerX = parseFloat(style.left) + width / 2
    + (Math.min(...points.map(({ x }) => x)) + Math.max(...points.map(({ x }) => x))) / 2;
  const centerY = parseFloat(style.top) + height / 2
    + (Math.min(...points.map(({ y }) => y)) + Math.max(...points.map(({ y }) => y))) / 2;

  expect(centerX).to.be.closeTo(arrow.clientWidth / 2, 0.1);
  expect(centerY).to.be.closeTo(arrow.clientHeight / 2, 0.1);
}

describe('Gen AI Cards homepage arrows', () => {
  let main;
  let stylesheet;

  before(() => {
    stylesheet = document.createElement('style');
    stylesheet.textContent = styles.join('\n');
    document.head.append(stylesheet);
    main = document.createElement('main');
    const block = document.createElement('div');
    block.className = 'gen-ai-cards homepage';
    const carousel = document.createElement('div');
    carousel.className = 'carousel-container';
    ['left', 'right'].forEach((direction) => {
      const fader = document.createElement('div');
      fader.className = `carousel-fader-${direction}`;
      const arrow = document.createElement('a');
      arrow.className = `button carousel-arrow carousel-arrow-${direction}`;
      fader.append(arrow);
      carousel.append(fader);
    });
    block.append(carousel);
    main.append(block);
    document.body.append(main);
  });

  after(() => {
    main.remove();
    stylesheet.remove();
    document.documentElement.removeAttribute('dir');
  });

  [390, 768].forEach((width) => {
    ['ltr', 'rtl'].forEach((direction) => {
      it(`centers both chevrons at ${width}px in ${direction}, including disabled controls`, async () => {
        await setViewport({ width, height: 900 });
        document.documentElement.dir = direction;
        const arrows = main.querySelectorAll('.carousel-arrow');
        [false, true].forEach((disabled) => {
          arrows.forEach((arrow) => {
            arrow.parentElement.classList.toggle('arrow-hidden', disabled);
            expectCenteredChevron(arrow);
          });
        });
      });
    });
  });
});
