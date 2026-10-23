import { readFile, setViewport } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const styles = await Promise.all([
  readFile({ path: '../../../express/code/scripts/widgets/carousel.css' }),
  readFile({ path: '../../../express/code/blocks/gen-ai-cards/gen-ai-cards.css' }),
  readFile({ path: '../../../express/code/blocks/content-cards/content-cards.css' }),
  readFile({ path: '../../../express/code/blocks/content-toggle-v2/content-toggle-v2.css' }),
]);

function expectOpticallyCenteredChevron(arrow) {
  const style = getComputedStyle(arrow, '::before');
  const width = parseFloat(style.width) + parseFloat(style.borderRightWidth);
  const height = parseFloat(style.height) + parseFloat(style.borderTopWidth);
  const border = parseFloat(style.borderTopWidth);
  expect(border).to.be.greaterThan(0);
  const matrix = new DOMMatrix(style.transform);
  const points = [
    [0, 0], [width, 0], [width, height],
    [width - border, height], [width - border, border], [0, border],
  ].map(([x, y]) => matrix.transformPoint({
    x: x - width / 2,
    y: y - height / 2,
  }));
  const area = points.reduce((result, point, index) => {
    const next = points[(index + 1) % points.length];
    const cross = point.x * next.y - next.x * point.y;
    return {
      twiceArea: result.twiceArea + cross,
      x: result.x + (point.x + next.x) * cross,
      y: result.y + (point.y + next.y) * cross,
    };
  }, { twiceArea: 0, x: 0, y: 0 });
  expect(area.twiceArea).to.be.greaterThan(0);
  const centerX = parseFloat(style.left) + width / 2 + area.x / (3 * area.twiceArea);
  const centerY = parseFloat(style.top) + height / 2 + area.y / (3 * area.twiceArea);

  expect(centerX).to.be.closeTo(arrow.clientWidth / 2, 0.02);
  expect(centerY).to.be.closeTo(arrow.clientHeight / 2, 0.02);
}

describe('Shared carousel arrows', () => {
  let main;
  let stylesheet;

  before(() => {
    stylesheet = document.createElement('style');
    stylesheet.textContent = [
      `:root {
        --spacing-200: 12px;
        --spacing-400: 24px;
        --color-white: #fff;
        --color-gray-700: #505050;
        --color-gray-400: #b6b6b6;
      }`,
      ...styles,
    ].join('\n');
    document.head.append(stylesheet);
    main = document.createElement('main');
    [
      'default',
      'gen-ai-cards homepage',
      'gen-ai-cards homepage spotlight',
      'content-cards',
      'content-toggle-v2',
    ].forEach((variant) => {
      const block = document.createElement('div');
      block.className = variant;
      const carousel = document.createElement('div');
      carousel.className = 'carousel-container circleless-button';
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
    });
    document.body.append(main);
  });

  after(() => {
    main.remove();
    stylesheet.remove();
    document.documentElement.removeAttribute('dir');
  });

  [390, 768, 1280].forEach((width) => {
    ['ltr', 'rtl'].forEach((direction) => {
      it(`centers both chevrons at ${width}px in ${direction}, including disabled controls`, async () => {
        await setViewport({ width, height: 900 });
        document.documentElement.dir = direction;
        const arrows = main.querySelectorAll('.carousel-arrow');
        [false, true].forEach((disabled) => {
          arrows.forEach((arrow) => {
            arrow.parentElement.classList.toggle('arrow-hidden', disabled);
            const hiddenAtDesktop = (width >= 935 && arrow.closest('.gen-ai-cards.homepage:not(.spotlight)'))
              || (width >= 900 && arrow.closest('.content-cards'));
            if (hiddenAtDesktop) {
              expect(getComputedStyle(arrow.parentElement).display).to.equal('none');
            } else {
              const variant = arrow.closest('.carousel-container').parentElement.className;
              expect(arrow.clientWidth, `${variant} at ${width}px`).to.be.greaterThan(0);
              expectOpticallyCenteredChevron(arrow);
            }
          });
        });
      });
    });
  });

  it('keeps smaller and larger chevrons centered as their strokes scale', () => {
    const scaledStyles = document.createElement('style');
    document.head.append(scaledStyles);
    try {
      [4, 8, 12, 16].forEach((size) => {
        scaledStyles.textContent = `
          main .default .carousel-container a.button.carousel-arrow::before {
            --carousel-arrow-size: ${size}px;
          }
        `;
        main.querySelectorAll('.default .carousel-arrow').forEach((arrow) => {
          const style = getComputedStyle(arrow, '::before');
          expect(parseFloat(style.width)).to.equal(size);
          expect(parseFloat(style.borderTopWidth)).to.equal(size / 4);
          expectOpticallyCenteredChevron(arrow);
        });
      });
    } finally {
      scaledStyles.remove();
    }
  });
});
