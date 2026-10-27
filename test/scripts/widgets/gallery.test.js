import { expect } from '@esm-bundle/chai';
import { delay } from '../../helpers/waitfor.js';

const imports = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
const { getLibs } = imports[0];
await import(`${getLibs()}/utils/utils.js`).then((mod) => mod.setConfig({}));
const { default: buildGallery } = await import('../../../express/code/scripts/widgets/gallery/gallery.js');

async function scrollTo(container, left) {
  container.scrollLeft = left;
  container.dispatchEvent(new Event('scroll'));
  await delay(150); // clears the click throttle's trailing window
}

describe('shared gallery direction', () => {
  ['ltr', 'rtl'].forEach((direction) => {
    it(`updates controls and navigates in ${direction}`, async () => {
      const sign = direction === 'rtl' ? -1 : 1;
      const root = document.createElement('div');
      root.dir = direction;
      const container = document.createElement('div');
      container.style.cssText = 'display: flex; flex-wrap: nowrap; overflow-x: auto; width: 300px; height: 100px; padding: 0; gap: 0; scroll-behavior: auto;';
      const items = Array.from({ length: 5 }, () => {
        const item = document.createElement('div');
        item.style.cssText = 'flex: 0 0 200px; height: 100px;';
        container.append(item);
        return item;
      });
      root.append(container);
      document.body.append(root);
      try {
        const { control } = await buildGallery(items, container);
        root.append(control);
        const prev = control.querySelector('.prev');
        const next = control.querySelector('.next');
        // initial state is computed synchronously, no observer round-trip needed
        expect(control.classList.contains('loading')).to.be.false;
        expect(control.classList.contains('hide')).to.be.false;
        expect(prev.disabled).to.be.true;
        expect(next.disabled).to.be.false;
        const { transform } = getComputedStyle(next.querySelector('svg'));
        expect(transform).to.equal(direction === 'rtl' ? 'matrix(-1, 0, 0, 1, 0, 0)' : 'none');

        // smooth scrolling is timing-dependent; make it instant and observable
        const scrolled = [];
        items.forEach((item) => {
          item.scrollIntoView = () => {
            scrolled.push(items.indexOf(item));
            const edge = direction === 'rtl' ? 'right' : 'left';
            const itemEdge = item.getBoundingClientRect()[edge];
            container.scrollLeft += itemEdge - container.getBoundingClientRect()[edge];
            container.dispatchEvent(new Event('scroll'));
          };
        });
        next.click();
        await delay(150);
        expect(scrolled).to.deep.equal([1]);
        expect(Math.sign(container.scrollLeft)).to.equal(sign);
        expect(prev.disabled).to.be.false;

        await scrollTo(container, sign * container.scrollWidth);
        expect(next.disabled).to.be.true;
        expect(prev.disabled).to.be.false;

        await scrollTo(container, 0);
        expect(prev.disabled).to.be.true;
        expect(next.disabled).to.be.false;
      } finally {
        root.remove();
      }
    });
  });
});
