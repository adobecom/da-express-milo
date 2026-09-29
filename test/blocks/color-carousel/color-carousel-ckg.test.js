import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const [{ getLibs }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
const { setConfig } = await import(`${getLibs()}/utils/utils.js`);
setConfig({});

const { default: decorate } = await import('../../../express/code/blocks/color-carousel/color-carousel.js');

// Kept separate from color-carousel.test.js: browse-api-controller's getData() is memoized
// per module lifetime, so the ckg + failsafe paths must not share a stubbed response with
// the authored describe block (which never calls getData()).
const MOCK_PILLS = [
  { canonicalName: 'pink', metadata: { hexCode: '#ff69b4', link: '/express/colors/hot-pink', status: 'enabled' } },
  { canonicalName: 'magenta', metadata: { hexCode: '#ff00ff', link: '/express/colors/magenta', status: 'enabled' } },
  { canonicalName: 'fuchsia', metadata: { hexCode: '#ff00ff', link: '/express/colors/fuchsia', status: 'enabled' } },
  { canonicalName: 'rosa', metadata: { hexCode: '#ff66cc', link: 'no_link_available', status: 'disabled' } },
];

let fetchStub;
let tasksMeta;

beforeEach(() => {
  tasksMeta = document.createElement('meta');
  tasksMeta.name = 'tasks-x';
  tasksMeta.content = 'pink';
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
  const block = document.querySelector('.color-carousel');
  await decorate(block);
  return block;
}

describe('Color Carousel / ckg + failsafe variants', () => {
  it('renders a chip per enabled pill, skipping disabled/no-link entries', async () => {
    const block = await prepBlock('./mocks/ckg.html');
    // rosa is disabled -> filtered out by getData(); 3 enabled pills remain.
    expect(block.querySelectorAll('.color-carousel-chip').length).to.equal(3);
  });

  it('title-cases pill names and links to the API-provided href', async () => {
    const block = await prepBlock('./mocks/ckg.html');
    const chip = [...block.querySelectorAll('a.color-carousel-chip')]
      .find((c) => c.querySelector('.color-carousel-chip-name')?.textContent === 'Pink');
    expect(chip).to.exist;
    expect(chip.getAttribute('href')).to.equal('/express/colors/hot-pink');
  });

  it('failsafe: auto-adds the ckg class and renders dynamic chips when no chips are authored', async () => {
    const block = await prepBlock('./mocks/empty.html');
    expect(block.classList.contains('ckg')).to.be.true;
    expect(block.querySelectorAll('.color-carousel-chip').length).to.equal(3);
  });
});
