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

// The authored variant never calls browse-api-controller's getData(). The ckg and
// failsafe (getData-backed) paths live in color-carousel-ckg.test.js because getData()
// is memoized per module lifetime and would leak a stubbed response across describes.
let fetchStub;

beforeEach(() => {
  // Only the Milo placeholders fetch is exercised here; return an empty sheet so the
  // prev/next aria-label lookups resolve to their code fallbacks without hitting network.
  fetchStub = sinon.stub(window, 'fetch').resolves({
    ok: true,
    json: async () => ({ data: [] }),
  });
});

afterEach(() => {
  fetchStub.restore();
});

async function prepBlock(filePath) {
  document.body.innerHTML = await readFile({ path: filePath });
  const block = document.querySelector('.color-carousel');
  await decorate(block);
  return block;
}

describe('Color Carousel / authored variant', () => {
  it('renders one chip per authored row', async () => {
    const block = await prepBlock('./mocks/authored.html');
    expect(block).to.exist;
    expect(block.classList.contains('ckg')).to.be.false;
    expect(block.querySelectorAll('.color-carousel-chip').length).to.equal(3);
  });

  it('renders the authored name, hex text, and swatch color per chip', async () => {
    const block = await prepBlock('./mocks/authored.html');
    const chip = [...block.querySelectorAll('.color-carousel-chip')]
      .find((c) => c.querySelector('.color-carousel-chip-name')?.textContent === 'Red');
    expect(chip).to.exist;
    expect(chip.querySelector('.color-carousel-chip-hex').textContent).to.equal('#FF0000');
    expect(chip.querySelector('.color-carousel-chip-swatch').style.backgroundColor).to.not.equal('');
  });

  it('links each chip to the authored href', async () => {
    const block = await prepBlock('./mocks/authored.html');
    const chip = [...block.querySelectorAll('a.color-carousel-chip')]
      .find((c) => c.querySelector('.color-carousel-chip-name')?.textContent === 'Red');
    expect(chip).to.exist;
    expect(chip.getAttribute('href')).to.equal('/express/colors/red');
  });

  it('renders the optional heading when authored', async () => {
    const block = await prepBlock('./mocks/authored.html');
    const header = block.querySelector('.color-carousel-header');
    expect(header).to.exist;
    expect(header.textContent.trim()).to.equal('Explore more colors');
    expect(block.querySelector('section').getAttribute('aria-label')).to.equal('Explore more colors');
  });

  it('renders without a heading when the heading row is omitted', async () => {
    const block = await prepBlock('./mocks/authored-no-heading.html');
    expect(block.querySelector('.color-carousel-header')).to.not.exist;
    expect(block.querySelectorAll('.color-carousel-chip').length).to.equal(2);
  });
});
