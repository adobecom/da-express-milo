import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const [{ getLibs }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
const { setConfig } = await import(`${getLibs()}/utils/utils.js`);
setConfig({});

const { default: decorate } = await import('../../../express/code/blocks/ckg-link-list/ckg-link-list.js');

// NOTE: browse-api-controller's memoize() key is derived from `args.join(',')`
// on a fetch(url, options) call, which always stringifies to '[object Object]'
// regardless of the actual request body. This means only the FIRST successful
// fetch response is ever reused across calls within a page/module lifetime, so
// every test below shares one consistent pill dataset instead of varying per-test.
// This is also why the legacy (no-heading) path is tested in a separate file —
// it would otherwise reuse this file's cached response instead of its own stub.
const VALID_PILLS = [
  { canonicalName: 'mint', metadata: { link: '/express/colors/mint', hexCode: '#32906E', status: 'enabled' } },
  { canonicalName: 'forest green', metadata: { link: '/express/colors/forest-green', hexCode: '#186118', status: 'enabled' } },
  { canonicalName: 'kelly green', metadata: { link: '/express/colors/kelly-green', hexCode: '#358310', status: 'enabled' } },
  { canonicalName: 'olive green', metadata: { link: '/express/colors/olive-green', hexCode: '#253C1A', status: 'enabled' } },
  { canonicalName: 'grass green', metadata: { link: '/express/colors/grass-green', hexCode: '#66AA46', status: 'enabled' } },
  { canonicalName: 'sea green', metadata: { link: '/express/colors/sea-green', hexCode: '#2E8B57', status: 'enabled' } },
];
const INVALID_PILLS = [
  { canonicalName: 'incomplete', metadata: { link: '/express/colors/incomplete', status: 'enabled' } },
  { canonicalName: 'bad hex', metadata: { link: '/express/colors/bad-hex', hexCode: 'not-a-hex', status: 'enabled' } },
];
const MOCK_PILLS = [...VALID_PILLS, ...INVALID_PILLS];
const VALID_PILL_COUNT = VALID_PILLS.length;

let fetchStub;
let tasksMeta;
let pageTypeMeta;

beforeEach(() => {
  tasksMeta = document.createElement('meta');
  tasksMeta.name = 'tasks-x';
  tasksMeta.content = 'green';
  document.head.append(tasksMeta);

  pageTypeMeta = document.createElement('meta');
  pageTypeMeta.name = 'pagetype';
  pageTypeMeta.content = 'color';
  document.head.append(pageTypeMeta);

  fetchStub = sinon.stub(window, 'fetch').resolves({
    ok: true,
    json: async () => ({
      status: { httpCode: 200 },
      querySuggestionResults: { groupResults: [{ buckets: MOCK_PILLS }] },
    }),
  });
});

afterEach(() => {
  fetchStub.restore();
  tasksMeta.remove();
  pageTypeMeta.remove();
});

async function prepBlock(filePath) {
  document.body.innerHTML = await readFile({ path: filePath });
  const block = document.querySelector('.ckg-link-list');
  await decorate(block);
  await new Promise((resolve) => { requestAnimationFrame(() => requestAnimationFrame(resolve)); });
  await new Promise((resolve) => { setTimeout(resolve, 100); });
  return block;
}

const originalScrollWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollWidth');
const originalClientWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');

function forceRowOverflow() {
  Object.defineProperty(Element.prototype, 'scrollWidth', {
    configurable: true,
    get() {
      return this.classList?.contains('explore-more-colors-row') ? 2000 : originalScrollWidth.get.call(this);
    },
  });
  Object.defineProperty(Element.prototype, 'clientWidth', {
    configurable: true,
    get() {
      return this.classList?.contains('explore-more-colors-row') ? 1000 : originalClientWidth.get.call(this);
    },
  });
}

function restoreRowOverflow() {
  Object.defineProperty(Element.prototype, 'scrollWidth', originalScrollWidth);
  Object.defineProperty(Element.prototype, 'clientWidth', originalClientWidth);
}

describe('CKG Link List / chips variant (opt-in via pagetype=color metadata)', () => {
  it('decorates without error', async () => {
    const block = await prepBlock('./mocks/chips.html');
    expect(block).to.exist;
    expect(block.classList.contains('ckg-link-list-chips')).to.be.true;
  });

  it('preserves the authored heading', async () => {
    const block = await prepBlock('./mocks/chips.html');
    const heading = block.querySelector('.explore-more-colors-header h2');
    expect(heading).to.exist;
    expect(heading.textContent.trim()).to.equal('Explore more colors.');
  });

  it('wraps content in a labeled section landmark', async () => {
    const block = await prepBlock('./mocks/chips.html');
    const section = block.querySelector(':scope > section');
    expect(section).to.exist;
    expect(section.getAttribute('aria-label')).to.equal('Explore more colors.');
  });

  it('sets each chip swatch background from the API-provided hex', async () => {
    const block = await prepBlock('./mocks/chips.html');
    const firstSwatch = block.querySelector('.explore-more-colors-chip-swatch');
    expect(firstSwatch.style.backgroundColor).to.not.equal('');
  });

  it('title-cases the API canonicalName and uppercases the hex per chip', async () => {
    const block = await prepBlock('./mocks/chips.html');
    const firstChip = block.querySelector('.explore-more-colors-chip');
    expect(firstChip.querySelector('.explore-more-colors-chip-name').textContent.trim()).to.equal('Mint');
    expect(firstChip.querySelector('.explore-more-colors-chip-hex').textContent.trim()).to.equal('#32906E');
  });

  it('renders each chip as a real anchor to the API-provided link', async () => {
    const block = await prepBlock('./mocks/chips.html');
    const forestGreen = [...block.querySelectorAll('.explore-more-colors-chip')]
      .find((chip) => chip.querySelector('.explore-more-colors-chip-name')?.textContent.trim() === 'Forest Green');
    expect(forestGreen.tagName).to.equal('A');
    expect(forestGreen.getAttribute('href')).to.equal('/express/colors/forest-green');
  });

  it('filters out pills missing a name/link/hex or with a malformed hex', async () => {
    const block = await prepBlock('./mocks/chips.html');
    expect(block.querySelectorAll('.explore-more-colors-chip').length).to.equal(VALID_PILL_COUNT);
  });

  it('does nothing when the heading is missing, even on a color page (and never calls the API)', async () => {
    document.body.innerHTML = '<div class="ckg-link-list"><div><div>Not a heading</div></div></div>';
    const block = document.querySelector('.ckg-link-list');
    await decorate(block);
    expect(block.querySelector('.explore-more-colors-chip')).to.not.exist;
    expect(fetchStub.called).to.be.false;
  });

  it('falls back to the legacy pill carousel when pagetype is not color, even with a heading authored', async () => {
    pageTypeMeta.remove();
    const block = await prepBlock('./mocks/chips.html');
    expect(block.classList.contains('ckg-link-list-chips')).to.be.false;
    expect(block.querySelector('.explore-more-colors-chip')).to.not.exist;
  });
});

describe('CKG Link List / chips variant / fits without overflow (no carousel)', () => {
  it('renders chips directly in the row, not wrapped in a carousel', async () => {
    const block = await prepBlock('./mocks/chips.html');
    const row = block.querySelector('.explore-more-colors-row');
    expect(row.querySelector('.carousel-container')).to.not.exist;
    expect(row.querySelectorAll(':scope > .explore-more-colors-chip').length).to.equal(VALID_PILL_COUNT);
  });

  it('renders no fade arrows', async () => {
    const block = await prepBlock('./mocks/chips.html');
    expect(block.querySelector('.carousel-fader-left')).to.not.exist;
    expect(block.querySelector('.carousel-fader-right')).to.not.exist;
  });
});

describe('CKG Link List / chips variant / overflowing (infinite carousel)', () => {
  beforeEach(() => forceRowOverflow());
  afterEach(() => restoreRowOverflow());

  it('builds the shared carousel widget (carousel-container/platform)', async () => {
    const block = await prepBlock('./mocks/chips.html');
    expect(block.querySelector('.explore-more-colors-row .carousel-container')).to.exist;
    expect(block.querySelector('.carousel-platform')).to.exist;
  });

  it('loops the chips (infinity scroll duplicates content) instead of stopping at the end', async () => {
    const block = await prepBlock('./mocks/chips.html');
    const chips = block.querySelectorAll('.explore-more-colors-chip');
    expect(chips.length).to.be.greaterThan(VALID_PILL_COUNT);
    expect(chips.length % VALID_PILL_COUNT).to.equal(0);
  });

  it('shows the right fade arrow immediately but defers the left one until the user scrolls (deferLeftArrow)', async () => {
    const block = await prepBlock('./mocks/chips.html');
    const left = block.querySelector('.carousel-fader-left');
    const right = block.querySelector('.carousel-fader-right');
    expect(left).to.exist;
    expect(right).to.exist;
    expect(left.classList.contains('arrow-hidden')).to.be.true;
    expect(right.classList.contains('arrow-hidden')).to.be.false;

    const platform = block.querySelector('.carousel-platform');
    Object.defineProperty(platform, 'scrollLeft', { value: 40, configurable: true });
    platform.dispatchEvent(new Event('scroll'));

    expect(left.classList.contains('arrow-hidden')).to.be.false;
  });

  it('patches localized aria-labels onto the arrow buttons', async () => {
    const block = await prepBlock('./mocks/chips.html');
    const prev = block.querySelector('.carousel-arrow-left');
    const next = block.querySelector('.carousel-arrow-right');
    expect(prev.getAttribute('aria-label')).to.be.a('string').with.length.greaterThan(0);
    expect(next.getAttribute('aria-label')).to.be.a('string').with.length.greaterThan(0);
  });
});
