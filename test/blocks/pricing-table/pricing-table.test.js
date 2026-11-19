import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/pricing-table/pricing-table.js'),
]);

const { default: decorate } = imports[1];

// Shared test setup
const setupTest = async (htmlFile) => {
  const testBody = await readFile({ path: htmlFile });
  document.body.innerHTML = testBody;
  window.placeholders = { 'search-branch-links': 'https://adobesparkpost.app.link/c4bWARQhWAb' };
  await decorate(document.querySelector('.pricing-table'));
  return document.querySelector('.pricing-table-wrapper');
};

// Shared test cleanup
const cleanupTest = () => {
  window.placeholders = undefined;
  document.body.innerHTML = '';
};

// Shared assertions
const assertHeaderRow = (block) => {
  const headerRow = block.querySelector('.row-heading');
  expect(headerRow).to.exist;
  expect(headerRow.querySelector('.col-1').textContent).to.equal('Compare tiers');
  const tierColumns = headerRow.querySelectorAll('.col-heading:nth-child(n+2)');
  const tierNames = Array.from(tierColumns).map((col) => col.textContent.trim());
  expect(tierNames).to.deep.equal(['Champion', 'Icon', 'Legend']);
};

const assertSectionHeaders = (block) => {
  const sectionHeaders = block.querySelectorAll('.section-header-row .section-head-title');
  const expectedHeaders = ['Test Header'];
  const actualHeaders = Array.from(sectionHeaders).map((header) => header.textContent);
  expect(actualHeaders).to.deep.equal(expectedHeaders);
};

const assertFeatureRows = (block) => {
  const featureRows = block.querySelectorAll('.section-row:not(.shaded):not(.section-header-row)');
  expect(featureRows.length).to.equal(3);
};

const assertAdditionalRows = (block) => {
  const additionalRows = block.querySelectorAll('.additional-row');
  expect(additionalRows.length).to.equal(4);
};

const assertIncludedFeatures = (block) => {
  const includedFeatures = block.querySelectorAll('.included-feature');
  expect(includedFeatures.length).to.be.greaterThan(0);
  includedFeatures.forEach((feature) => {
    expect(feature.querySelector('.feat-icon.check') || feature.querySelector('p:not(.icon-container)')).to.exist;
  });
};

const assertToggleButton = async (block) => {
  const toggleButton = block.querySelector('.toggle-row');
  expect(toggleButton).to.exist;
  expect(toggleButton.textContent.trim()).to.equal('view all features');

  // Test toggle functionality
  toggleButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
  toggleButton.dispatchEvent(new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window,
  }));
  expect(block.querySelectorAll('.additional-row.collapsed').length).to.equal(4);

  toggleButton.dispatchEvent(new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window,
  }));
  expect(block.querySelectorAll('.additional-row.collapsed').length).to.equal(0);
};

describe('Pricing Table', () => {
  let block;

  before(async () => {
    block = await setupTest('./mocks/body.html');
  });

  afterEach(cleanupTest);

  it('should render the correct number of rows', async () => {
    const rows = block.querySelectorAll('.pricing-table > .row');
    expect(rows.length).to.equal(11);
  });

  it('should have a header row with "Compare tiers" and tier names', () => assertHeaderRow(block));
  it('should have section header rows', () => assertSectionHeaders(block));
  it('should have feature rows with descriptions', () => assertFeatureRows(block));
  it('should have additional rows with descriptions', () => assertAdditionalRows(block));
  it('should have include indicators for features', () => assertIncludedFeatures(block));
  it('should have a "View all features" toggle button', () => assertToggleButton(block));
});

describe('Pricing Table Single Section', () => {
  let block;

  before(async () => {
    block = await setupTest('./mocks/single-section.html');
  });

  afterEach(cleanupTest);

  it('should render the correct number of rows', async () => {
    const rows = block.querySelectorAll('.pricing-table > .row');
    expect(rows.length).to.equal(10);
  });

  it('should have a header row with "Compare tiers" and tier names', () => assertHeaderRow(block));
  it('should have section header rows', () => assertSectionHeaders(block));
  it('should have feature rows with descriptions', () => assertFeatureRows(block));
  it('should have additional rows with descriptions', () => assertAdditionalRows(block));
  it('should have include indicators for features', () => assertIncludedFeatures(block));
});
