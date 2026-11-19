import { expect } from '@esm-bundle/chai';
import { executeServerCommand } from '@web/test-runner-commands';
import { waitFor } from '../../helpers/waitfor.js';

const imports = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
const { getLibs } = imports[0];
await import(`${getLibs()}/utils/utils.js`).then((mod) => mod.setConfig({}));
const { default: buildGallery } = await import('../../../express/code/scripts/widgets/gallery/gallery.js');

describe('shared gallery direction', () => {
  ['ltr', 'rtl'].forEach((direction) => {
    it(`updates controls and navigates in ${direction}`, async function testDirection() {
      this.timeout(10000);
      // the gallery needs a rendered page; see bring-to-front in web-test-runner.config.js
      await executeServerCommand('bring-to-front');
      const root = document.createElement('div');
      root.dir = direction;
      const container = document.createElement('div');
      container.style.cssText = 'display: flex; flex-wrap: nowrap; overflow-x: auto; width: 300px; height: 100px; padding: 0; gap: 0;';
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
        root.scrollIntoView({ block: 'start', behavior: 'instant' });
        const prev = control.querySelector('.prev');
        const next = control.querySelector('.next');
        await waitFor(() => !control.classList.contains('loading'), 3000);
        expect(prev.disabled).to.be.true;
        expect(next.disabled).to.be.false;
        const { transform } = getComputedStyle(next.querySelector('svg'));
        expect(transform).to.equal(direction === 'rtl' ? 'matrix(-1, 0, 0, 1, 0, 0)' : 'none');

        next.click();
        await waitFor(() => !prev.disabled, 3000);
        expect(Math.sign(container.scrollLeft)).to.equal(direction === 'rtl' ? -1 : 1);

        const sign = direction === 'rtl' ? -1 : 1;
        container.scrollTo({ left: sign * container.scrollWidth, behavior: 'instant' });
        await waitFor(() => next.disabled, 3000);
        expect(prev.disabled).to.be.false;

        prev.click();
        await waitFor(() => !next.disabled, 3000);
        container.scrollTo({ left: 0, behavior: 'instant' });
        await waitFor(() => prev.disabled, 3000);
        expect(next.disabled).to.be.false;
      } finally {
        root.remove();
      }
    });
  });
});
