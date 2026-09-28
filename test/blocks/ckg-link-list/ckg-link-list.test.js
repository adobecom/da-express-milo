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

// See ckg-link-list-chips.test.js for why the chips (heading) variant is
// tested in a separate file: browse-api-controller's getData() is memoized
// per page/module lifetime, so a second describe block here would silently
// reuse this file's stubbed response instead of its own.
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
  const block = document.querySelector('.ckg-link-list');
  await decorate(block);
  return block;
}

describe('CKG Link List / legacy variant (no authored heading)', () => {
  it('block exists and does not opt into the chips variant', async () => {
    const block = await prepBlock('./mocks/basic.html');
    expect(block).to.exist;
    expect(block.classList.contains('ckg-link-list-chips')).to.be.false;
  });

  it('renders a button-container pill per valid pill, skipping no_link_available', async () => {
    const block = await prepBlock('./mocks/basic.html');
    const pills = block.querySelectorAll('.button-container');
    expect(pills.length).to.equal(3);
  });

  it('title-cases the pill label and links to the API-provided href', async () => {
    const block = await prepBlock('./mocks/basic.html');
    const link = [...block.querySelectorAll('.button-container a.button')]
      .find((a) => a.textContent.trim() === 'Pink');
    expect(link).to.exist;
    expect(link.getAttribute('href')).to.equal('/express/colors/hot-pink');
  });

  it('prepends the locale prefix to relative links, leaves absolute URLs untouched', () => {
    const localize = (link, prefix) => (link.startsWith('/') ? `${prefix}${link}` : link);
    expect(localize('/express/colors/hot-pink', '/de')).to.equal('/de/express/colors/hot-pink');
    expect(localize('https://example.com/path', '/de')).to.equal('https://example.com/path');
  });

  it('adds a color-dot swatch tinted to the pill hex', async () => {
    const block = await prepBlock('./mocks/basic.html');
    const link = [...block.querySelectorAll('.button-container a.button')]
      .find((a) => a.textContent.trim() === 'Pink');
    const dot = link.querySelector('.color-dot');
    expect(dot).to.exist;
    expect(dot.style.backgroundColor).to.not.equal('');
    expect(link.classList.contains('colorful')).to.be.true;
  });

  it('builds the shared carousel widget around the pills', async () => {
    const block = await prepBlock('./mocks/basic.html');
    expect(block.querySelector('.carousel-container')).to.exist;
    expect(block.querySelector('.carousel-platform')).to.exist;
  });
});
