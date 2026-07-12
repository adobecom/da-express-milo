/* eslint-env mocha */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import('../../../express/code/blocks/discovery-table/discovery-table.js');

const body = await readFile({ path: './mocks/body.html' });
const shortTable = await readFile({ path: './mocks/short-table.html' });
const singleCol = await readFile({ path: './mocks/single-col.html' });

function getBlock() {
  return document.querySelector('.discovery-table');
}

describe('Discovery Table', () => {
  describe('DOM structure', () => {
    before(() => {
      document.body.innerHTML = body;
      decorate(getBlock());
    });

    it('block exists after decoration', () => {
      expect(getBlock()).to.exist;
    });

    it('creates a section header', () => {
      expect(getBlock().querySelector('.dt-section-header')).to.exist;
    });

    it('preserves heading text in the header', () => {
      const h2 = getBlock().querySelector('.dt-header-text h2');
      expect(h2).to.exist;
      expect(h2.textContent).to.include('Choose your plan');
    });

    it('creates a carousel nav with two buttons', () => {
      const nav = getBlock().querySelector('.dt-carousel-nav');
      expect(nav).to.exist;
      expect(nav.querySelectorAll('.dt-nav-btn').length).to.equal(2);
    });

    it('carousel nav has correct aria attributes', () => {
      const nav = getBlock().querySelector('.dt-carousel-nav');
      expect(nav.getAttribute('role')).to.equal('group');
      expect(nav.getAttribute('aria-label')).to.equal('Navigate columns');
    });

    it('creates a table container', () => {
      expect(getBlock().querySelector('.dt-table-container')).to.exist;
    });

    it('creates a table with thead and tbody', () => {
      const table = getBlock().querySelector('.dt-table');
      expect(table.querySelector('thead')).to.exist;
      expect(table.querySelector('tbody')).to.exist;
    });

    it('thead has one label col and the correct number of data cols', () => {
      const ths = getBlock().querySelectorAll('thead th');
      expect(ths.length).to.equal(3); // 1 label + 2 data
      expect(ths[0].classList.contains('dt-label-col')).to.be.true;
      expect(ths[1].classList.contains('dt-data-col')).to.be.true;
    });

    it('creates a tbody row for each data row', () => {
      expect(getBlock().querySelectorAll('tbody tr').length).to.equal(6);
    });

    it('first cell of each body row is a label th', () => {
      expect(getBlock().querySelectorAll('tbody tr th.dt-label-col').length).to.equal(6);
    });

    it('renders column header name and subcopy spans', () => {
      const th = getBlock().querySelector('thead .dt-data-col');
      expect(th.querySelector('.dt-col-name')).to.exist;
      expect(th.querySelector('.dt-col-price')).to.exist;
    });

    it('data cells have correct data-col index', () => {
      const firstDataTd = getBlock().querySelector('tbody tr td.dt-data-col');
      expect(firstDataTd.dataset.col).to.equal('0');
    });

    it('inserts header cover elements inside the table', () => {
      const table = getBlock().querySelector('.dt-table');
      expect(table.querySelector('.dt-header-cover')).to.exist;
      expect(table.querySelector('.dt-header-cover-right')).to.exist;
    });

    it('header covers have aria-hidden="true"', () => {
      expect(getBlock().querySelector('.dt-header-cover').getAttribute('aria-hidden')).to.equal('true');
      expect(getBlock().querySelector('.dt-header-cover-right').getAttribute('aria-hidden')).to.equal('true');
    });
  });

  describe('Position classes', () => {
    before(() => {
      document.body.innerHTML = body;
      decorate(getBlock());
    });

    it('all thead cells have dt-first-row', () => {
      getBlock().querySelectorAll('thead th').forEach((cell) => {
        expect(cell.classList.contains('dt-first-row')).to.be.true;
      });
    });

    it('all cells in the last tbody row have dt-last-row', () => {
      const rows = getBlock().querySelectorAll('tbody tr');
      rows[rows.length - 1].querySelectorAll('th, td').forEach((cell) => {
        expect(cell.classList.contains('dt-last-row')).to.be.true;
      });
    });

    it('first cell in every row has dt-first-col', () => {
      const table = getBlock().querySelector('.dt-table');
      [table.querySelector('thead tr'), ...table.querySelectorAll('tbody tr')].forEach((tr) => {
        expect(tr.querySelector('th, td').classList.contains('dt-first-col')).to.be.true;
      });
    });

    it('last cell in every row has dt-last-col', () => {
      const table = getBlock().querySelector('.dt-table');
      [table.querySelector('thead tr'), ...table.querySelectorAll('tbody tr')].forEach((tr) => {
        const cells = tr.querySelectorAll('th, td');
        expect(cells[cells.length - 1].classList.contains('dt-last-col')).to.be.true;
      });
    });

    it('middle cells do not have dt-first-row or dt-last-row', () => {
      const rows = getBlock().querySelectorAll('tbody tr');
      // pick a middle row (not first or last)
      const midRow = rows[Math.floor(rows.length / 2)];
      midRow.querySelectorAll('th, td').forEach((cell) => {
        expect(cell.classList.contains('dt-first-row')).to.be.false;
        expect(cell.classList.contains('dt-last-row')).to.be.false;
      });
    });
  });

  describe('Variant classes', () => {
    it('adds dt-short when data rows <= 5', () => {
      document.body.innerHTML = shortTable;
      decorate(getBlock());
      expect(getBlock().classList.contains('dt-short')).to.be.true;
    });

    it('does not add dt-short when data rows > 5', () => {
      document.body.innerHTML = body;
      decorate(getBlock());
      expect(getBlock().classList.contains('dt-short')).to.be.false;
    });

    it('adds dt-single-col when there is exactly one data column', () => {
      document.body.innerHTML = singleCol;
      decorate(getBlock());
      expect(getBlock().classList.contains('dt-single-col')).to.be.true;
    });

    it('does not add dt-single-col for multiple data columns', () => {
      document.body.innerHTML = body;
      decorate(getBlock());
      expect(getBlock().classList.contains('dt-single-col')).to.be.false;
    });
  });

  describe('Carousel navigation', () => {
    before(() => {
      document.body.innerHTML = body;
      decorate(getBlock());
    });

    it('prev button starts disabled', () => {
      expect(getBlock().querySelector('.dt-prev').disabled).to.be.true;
    });

    it('next button starts enabled with multiple columns', () => {
      expect(getBlock().querySelector('.dt-next').disabled).to.be.false;
    });

    it('clicking next enables prev and disables next at last column', () => {
      const prevBtn = getBlock().querySelector('.dt-prev');
      const nextBtn = getBlock().querySelector('.dt-next');
      nextBtn.click();
      expect(prevBtn.disabled).to.be.false;
      expect(nextBtn.disabled).to.be.true;
    });

    it('clicking prev from last column re-disables prev and enables next', () => {
      const prevBtn = getBlock().querySelector('.dt-prev');
      const nextBtn = getBlock().querySelector('.dt-next');
      prevBtn.click();
      expect(prevBtn.disabled).to.be.true;
      expect(nextBtn.disabled).to.be.false;
    });
  });

  describe('Edge cases', () => {
    it('does nothing if block has fewer than 3 rows', () => {
      document.body.innerHTML = `<div class="discovery-table block">
        <div><div>Title</div></div>
        <div><div>Col</div></div>
      </div>`;
      const block = getBlock();
      const originalHTML = block.innerHTML;
      decorate(block);
      expect(block.innerHTML).to.equal(originalHTML);
    });

    it('wraps plain text title in an h2 when no heading element is present', () => {
      document.body.innerHTML = `<div class="discovery-table block">
        <div><div>My Table Title</div></div>
        <div><div></div><div><p>Col A</p></div></div>
        <div><div><p>Row 1</p></div><div><p>Value</p></div></div>
      </div>`;
      decorate(getBlock());
      const h2 = getBlock().querySelector('.dt-header-text h2');
      expect(h2).to.exist;
      expect(h2.textContent).to.include('My Table Title');
    });

    it('renders row label secondary text when two paragraphs are present', () => {
      document.body.innerHTML = `<div class="discovery-table block">
        <div><div><h2>Title</h2></div></div>
        <div><div></div><div><p>Col A</p></div></div>
        <div><div><p>Primary</p><p>Secondary</p></div><div><p>Value</p></div></div>
      </div>`;
      decorate(getBlock());
      const label = getBlock().querySelector('tbody .dt-label-col');
      expect(label.querySelector('.dt-row-primary').textContent).to.equal('Primary');
      expect(label.querySelector('.dt-row-secondary').textContent).to.equal('Secondary');
    });

    it('omits subcopy span when column header has only one paragraph', () => {
      document.body.innerHTML = `<div class="discovery-table block">
        <div><div><h2>Title</h2></div></div>
        <div><div></div><div><p>Only Name</p></div></div>
        <div><div><p>Row</p></div><div><p>Cell</p></div></div>
      </div>`;
      decorate(getBlock());
      const th = getBlock().querySelector('thead .dt-data-col');
      expect(th.querySelector('.dt-col-name')).to.exist;
      expect(th.querySelector('.dt-col-price')).to.not.exist;
    });
  });
});
