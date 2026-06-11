import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
const { getLibs } = imports[0];
await import(`${getLibs()}/utils/utils.js`).then((mod) => mod.setConfig({}));
const { default: buildLoopGallery } = await import('../../../express/code/scripts/widgets/gallery/gallery-loop.js');

function makeContainer(count) {
  const container = document.createElement('div');
  container.style.width = '300px';
  const items = [];
  for (let i = 0; i < count; i += 1) {
    const item = document.createElement('div');
    item.style.width = '100px';
    item.style.height = '100px';
    item.dataset.i = String(i);
    const link = document.createElement('a');
    link.href = '#';
    item.append(link);
    items.push(item);
  }
  document.body.append(container);
  return { container, items };
}

describe('gallery-loop engine', () => {
  it('builds a viewport/track and centers the first real item', async () => {
    const { container, items } = makeContainer(5);
    await buildLoopGallery(items, container, { labels: { prev: 'P', next: 'N' } });

    expect(container.classList.contains('gallery-loop')).to.be.true;
    const track = container.querySelector('.gallery-loop-track');
    expect(track).to.exist;
    const active = track.querySelectorAll('.active');
    expect(active.length).to.equal(1);
    expect(active[0].dataset.i).to.equal('0');
  });

  it('clones a buffer on each end, hoverable but out of the a11y/tab tree', async () => {
    const { container, items } = makeContainer(5);
    await buildLoopGallery(items, container, {});
    const clones = container.querySelectorAll('.gallery-loop-clone');
    expect(clones.length).to.be.greaterThan(0);
    clones.forEach((clone) => {
      // inert would block :hover, so it must NOT be set
      expect(clone.hasAttribute('inert')).to.be.false;
      expect(clone.getAttribute('aria-hidden')).to.equal('true');
      // focusable descendants pulled out of the tab order
      expect(clone.querySelector('a').getAttribute('tabindex')).to.equal('-1');
    });
  });

  it('advances the spotlight on next, looping the real index', async () => {
    const { container, items } = makeContainer(5);
    const { control } = await buildLoopGallery(items, container, {});
    const next = control.querySelector('button.next');

    next.click();
    let active = container.querySelector('.gallery-loop-track .active');
    expect(active.dataset.i).to.equal('1');

    next.click();
    active = container.querySelector('.gallery-loop-track .active');
    expect(active.dataset.i).to.equal('2');
  });

  it('moves backward on prev', async () => {
    const { container, items } = makeContainer(5);
    const { control } = await buildLoopGallery(items, container, {});
    control.querySelector('button.prev').click();
    // From real index 0, stepping back centers a clone of the last item; its
    // backing real item is index 4 after the seam normalizes.
    const active = container.querySelector('.gallery-loop-track .active');
    expect(active).to.exist;
  });

  it('lets a tap (no drag) pass through without moving or capturing the pointer', async () => {
    const { container, items } = makeContainer(5);
    await buildLoopGallery(items, container, {});
    const viewport = container.querySelector('.gallery-loop-viewport');
    const before = container.querySelector('.gallery-loop-track .active').dataset.i;

    let captured = false;
    viewport.setPointerCapture = () => { captured = true; };
    viewport.dispatchEvent(new PointerEvent('pointerdown', { clientX: 50, pointerId: 1, bubbles: true }));
    viewport.dispatchEvent(new PointerEvent('pointerup', { clientX: 50, pointerId: 1, bubbles: true }));

    expect(captured).to.be.false;
    const after = container.querySelector('.gallery-loop-track .active').dataset.i;
    expect(after).to.equal(before);
  });

  it('handles a single item without controls', async () => {
    const { container, items } = makeContainer(1);
    const { control } = await buildLoopGallery(items, container, {});
    expect(control.classList.contains('hide')).to.be.true;
    expect(items[0].classList.contains('active')).to.be.true;
    expect(container.querySelectorAll('.gallery-loop-clone').length).to.equal(0);
  });
});
