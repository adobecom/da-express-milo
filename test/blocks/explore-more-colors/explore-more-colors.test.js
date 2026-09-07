import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const [{ getLibs }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
const { setConfig } = await import(`${getLibs()}/utils/utils.js`);
setConfig({});

const { default: decorate } = await import('../../../express/code/blocks/explore-more-colors/explore-more-colors.js');

// NOTE: browse-api-controller's memoize() key is derived from `args.join(',')`
// on a fetch(url, options) call, which always stringifies to '[object Object]'
// regardless of the actual request body. This means only the FIRST successful
// fetch response is ever reused across calls within a page/module lifetime, so
// every test below shares one consistent pill dataset instead of varying per-test.
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

beforeEach(() => {
  tasksMeta = document.createElement('meta');
  tasksMeta.name = 'tasks-x';
  tasksMeta.content = 'green';
  document.head.append(tasksMeta);

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
});

async function prepBlock(filePath) {
  document.body.innerHTML = await readFile({ path: filePath });
  const block = document.querySelector('.explore-more-colors');
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

describe('Explore More Colors', () => {
  it('decorates without error', async () => {
    const block = await prepBlock('./mocks/basic.html');
    expect(block).to.exist;
  });

  it('preserves the authored heading', async () => {
    const block = await prepBlock('./mocks/basic.html');
    const heading = block.querySelector('.explore-more-colors-header h2');
    expect(heading).to.exist;
    expect(heading.textContent.trim()).to.equal('Explore more colors.');
  });

  it('wraps content in a labeled section landmark', async () => {
    const block = await prepBlock('./mocks/basic.html');
    const section = block.querySelector(':scope > section');
    expect(section).to.exist;
    expect(section.getAttribute('aria-label')).to.equal('Explore more colors.');
  });

  it('sets each chip swatch background from the API-provided hex', async () => {
    const block = await prepBlock('./mocks/basic.html');
    const firstSwatch = block.querySelector('.explore-more-colors-chip-swatch');
    expect(firstSwatch.style.backgroundColor).to.not.equal('');
  });

  it('title-cases the API canonicalName and uppercases the hex per chip', async () => {
    const block = await prepBlock('./mocks/basic.html');
    const firstChip = block.querySelector('.explore-more-colors-chip');
    expect(firstChip.querySelector('.explore-more-colors-chip-name').textContent.trim()).to.equal('Mint');
    expect(firstChip.querySelector('.explore-more-colors-chip-hex').textContent.trim()).to.equal('#32906E');
  });

  it('renders each chip as a real anchor to the API-provided link', async () => {
    const block = await prepBlock('./mocks/basic.html');
    const forestGreen = [...block.querySelectorAll('.explore-more-colors-chip')]
      .find((chip) => chip.querySelector('.explore-more-colors-chip-name')?.textContent.trim() === 'Forest Green');
    expect(forestGreen.tagName).to.equal('A');
    expect(forestGreen.getAttribute('href')).to.equal('/express/colors/forest-green');
  });

  it('filters out pills missing a name/link/hex or with a malformed hex', async () => {
    const block = await prepBlock('./mocks/basic.html');
    expect(block.querySelectorAll('.explore-more-colors-chip').length).to.equal(VALID_PILL_COUNT);
  });

  it('does nothing when the heading is missing (and never calls the API)', async () => {
    document.body.innerHTML = '<div class="explore-more-colors"><div><div>Not a heading</div></div></div>';
    const block = document.querySelector('.explore-more-colors');
    await decorate(block);
    expect(block.querySelector('.explore-more-colors-chip')).to.not.exist;
    expect(fetchStub.called).to.be.false;
  });
});

describe('Explore More Colors / fits without overflow (no carousel)', () => {
  it('renders chips directly in the row, not wrapped in a carousel', async () => {
    const block = await prepBlock('./mocks/basic.html');
    const row = block.querySelector('.explore-more-colors-row');
    expect(row.querySelector('.carousel-container')).to.not.exist;
    expect(row.querySelectorAll(':scope > .explore-more-colors-chip').length).to.equal(VALID_PILL_COUNT);
  });

  it('renders no fade arrows', async () => {
    const block = await prepBlock('./mocks/basic.html');
    expect(block.querySelector('.carousel-fader-left')).to.not.exist;
    expect(block.querySelector('.carousel-fader-right')).to.not.exist;
  });
});

describe('Explore More Colors / overflowing (infinite carousel)', () => {
  beforeEach(() => forceRowOverflow());
  afterEach(() => restoreRowOverflow());

  it('builds the shared carousel widget (carousel-container/platform)', async () => {
    const block = await prepBlock('./mocks/basic.html');
    expect(block.querySelector('.explore-more-colors-row .carousel-container')).to.exist;
    expect(block.querySelector('.carousel-platform')).to.exist;
  });

  it('loops the chips (infinity scroll duplicates content) instead of stopping at the end', async () => {
    const block = await prepBlock('./mocks/basic.html');
    const chips = block.querySelectorAll('.explore-more-colors-chip');
    expect(chips.length).to.be.greaterThan(VALID_PILL_COUNT);
    expect(chips.length % VALID_PILL_COUNT).to.equal(0);
  });

  it('shows both fade arrows (infinite carousels always have more to scroll to)', async () => {
    const block = await prepBlock('./mocks/basic.html');
    const left = block.querySelector('.carousel-fader-left');
    const right = block.querySelector('.carousel-fader-right');
    expect(left).to.exist;
    expect(right).to.exist;
    expect(left.classList.contains('arrow-hidden')).to.be.false;
    expect(right.classList.contains('arrow-hidden')).to.be.false;
  });

  it('patches localized aria-labels onto the arrow buttons', async () => {
    const block = await prepBlock('./mocks/basic.html');
    const prev = block.querySelector('.carousel-arrow-left');
    const next = block.querySelector('.carousel-arrow-right');
    expect(prev.getAttribute('aria-label')).to.be.a('string').with.length.greaterThan(0);
    expect(next.getAttribute('aria-label')).to.be.a('string').with.length.greaterThan(0);
  });
});
