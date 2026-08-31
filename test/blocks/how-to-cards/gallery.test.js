import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { delay, waitFor } from '../../helpers/waitfor.js';

const [, { buildGallery, default: init }] = await Promise.all([import('../../../express/code/scripts/scripts.js'), import('../../../express/code/blocks/how-to-cards/how-to-cards.js')]);

document.body.innerHTML = await readFile({ path: './mocks/gallery-body.html' });
const otherDoc = await readFile({ path: './mocks/body.html' });
const parser = new DOMParser();
// Parse the HTML string into a Document object
const htmlDocument = parser.parseFromString(otherDoc, 'text/html');
// Access the HTML content as an object
const howToCards = htmlDocument.body;
await init(howToCards.querySelector('.how-to-cards'));

// The mock body has no block CSS, so give the container/items a real, scrollable
// layout: gallery state is now derived from actual scroll position, not
// IntersectionObserver entries.
const CARD_WIDTH = 300;
const VIEWPORT_WIDTH = 620; // fits under 2 cards -> guarantees overflow + multiple pips
function layoutGallery(root) {
  const container = root.querySelector('.cards-container');
  container.style.display = 'flex';
  container.style.overflowX = 'scroll';
  container.style.width = `${VIEWPORT_WIDTH}px`;
  container.style.padding = '0';
  container.style.margin = '0';
  container.style.gap = '0px';
  [...container.querySelectorAll('.card')].forEach((item) => {
    item.style.flex = '0 0 auto';
    item.style.width = `${CARD_WIDTH}px`;
    item.style.margin = '0';
  });
  return container;
}

async function scrollTo(container, left) {
  container.scrollLeft = left;
  container.dispatchEvent(new Event('scroll'));
  await delay(150); // clears the render throttle's trailing window
}

// The initial render is also triggered by rAF/IntersectionObserver, but those
// fire on their own schedule (and get throttled when the tab isn't focused,
// e.g. under a full parallel test run). Force a render deterministically via
// the same 'scroll' listener the rest of the suite drives instead of racing it.
const rendered = (container, control) => scrollTo(container, container.scrollLeft)
  .then(() => waitFor(() => !control.classList.contains('loading'), 3000));

describe('gallery', () => {
  it('handles irregular inputs', async () => {
    try {
      await buildGallery();
    } catch (e) {
      expect(() => e).to.throw;
    }
  });

  it('decorates items into gallery and renders initial pip state from layout', async function decoratesGallery() {
    this.timeout(6000);
    const root = document.querySelector('.how-to-cards');
    const container = layoutGallery(root);
    const items = [...root.querySelectorAll('.card')];
    await buildGallery(items, container, root);
    expect(container.classList.contains('gallery')).to.be.true;
    items.forEach((item) => {
      expect(item.classList.contains('gallery--item')).to.be.true;
    });

    const control = root.querySelector('.gallery-control');
    expect(control).to.exist;
    await rendered(container, control);
    const prev = control.querySelector('button.prev');
    const next = control.querySelector('button.next');
    expect(prev).to.exist;
    expect(next).to.exist;
    expect(prev.disabled).to.be.true;
    expect(next.disabled).to.be.false;
    const dots = [...control.querySelectorAll('.dot')];
    expect(dots.length).to.be.greaterThan(1);
    expect(dots.findIndex((dot) => dot.classList.contains('curr'))).to.equal(0);
  });

  it('updates pips and buttons as the gallery scrolls', async () => {
    const root = document.querySelector('.how-to-cards');
    const container = root.querySelector('.cards-container');
    const control = root.querySelector('.gallery-control');
    const prev = control.querySelector('button.prev');
    const next = control.querySelector('button.next');
    const dots = () => [...control.querySelectorAll('.dot')];

    await scrollTo(container, container.scrollWidth - container.clientWidth);
    expect(next.disabled).to.be.true;
    expect(prev.disabled).to.be.false;
    expect(dots().findIndex((dot) => dot.classList.contains('curr'))).to.equal(dots().length - 1);

    await scrollTo(container, 0);
    expect(prev.disabled).to.be.true;
    expect(next.disabled).to.be.false;
    expect(dots().findIndex((dot) => dot.classList.contains('curr'))).to.equal(0);
  });

  it('hides the control and shows all cards when everything already fits', async function fitsGallery() {
    this.timeout(6000);
    const root = document.querySelector('.how-to-cards');
    const container = root.querySelector('.cards-container');
    container.style.width = `${CARD_WIDTH * 5}px`;
    container.dispatchEvent(new Event('scroll'));

    const control = root.querySelector('.gallery-control');
    await waitFor(() => control.classList.contains('hide'), 3000);
    expect(control.classList.contains('hide')).to.be.true;
    expect(container.classList.contains('gallery--all-displayed')).to.be.true;
  });
});
