import { expect } from '@esm-bundle/chai';
import { delay } from '../../helpers/waitfor.js';

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

    await delay(420); // wait out the one-step-per-gesture lock
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

  it('exposes a polite "X of N" live region wired to the nav buttons', async () => {
    const { container, items } = makeContainer(5);
    const { control } = await buildLoopGallery(items, container, {});
    const live = container.querySelector('.gallery-loop-status');
    expect(live).to.exist;
    expect(live.getAttribute('aria-live')).to.equal('polite');
    expect(live.textContent).to.equal('1 of 5');
    expect(control.querySelector('button.prev').getAttribute('aria-describedby')).to.equal(live.id);
    expect(control.querySelector('button.next').getAttribute('aria-describedby')).to.equal(live.id);
  });

  it('exposes the carousel as a focusable, named group (first focus level)', async () => {
    const { container, items } = makeContainer(5);
    await buildLoopGallery(items, container, { labels: { group: 'Template carousel' } });
    const vp = container.querySelector('.gallery-loop-viewport');
    expect(vp.getAttribute('role')).to.equal('group');
    expect(vp.getAttribute('tabindex')).to.equal('0');
    expect(vp.getAttribute('aria-label')).to.equal('Template carousel');
    // cards live inside the group, so the group is tabbed before them
    expect(vp.contains(items[0])).to.be.true;
  });

  it('keeps a single tab stop on the centre card and roves with arrow keys', async () => {
    const { container, items } = makeContainer(5);
    await buildLoopGallery(items, container, {});
    const links = items.map((it) => it.querySelector('a'));

    const tabbable = links.filter((l) => l.getAttribute('tabindex') === '0');
    expect(tabbable.length).to.equal(1);
    expect(links[0].getAttribute('tabindex')).to.equal('0');

    const viewport = container.querySelector('.gallery-loop-viewport');
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    expect(links[1].getAttribute('tabindex')).to.equal('0');
    expect(links[0].getAttribute('tabindex')).to.equal('-1');
    expect(container.querySelector('.gallery-loop-status').textContent).to.equal('2 of 5');
  });

  it('uses the localized position template', async () => {
    const { container, items } = makeContainer(3);
    await buildLoopGallery(items, container, { labels: { position: 'Plantilla {{current}} de {{total}}' } });
    expect(container.querySelector('.gallery-loop-status').textContent).to.equal('Plantilla 1 de 3');
  });

  it('handles a single item without controls', async () => {
    const { container, items } = makeContainer(1);
    const { control } = await buildLoopGallery(items, container, {});
    expect(control.classList.contains('hide')).to.be.true;
    expect(items[0].classList.contains('active')).to.be.true;
    expect(container.querySelectorAll('.gallery-loop-clone').length).to.equal(0);
  });
});
