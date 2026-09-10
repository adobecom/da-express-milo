import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const [, { default: decorate }] = await Promise.all([import('../../../express/code/scripts/scripts.js'), import('../../../express/code/blocks/color-how-to-carousel/color-how-to-carousel.js')]);

const redBody = await readFile({ path: './mocks/body.html' });
const blackBody = await readFile({ path: './mocks/body-dark.html' });

function setColorPageType() {
  const meta = document.createElement('meta');
  meta.name = 'pagetype';
  meta.content = 'color';
  document.head.appendChild(meta);
}

describe('Color How To Carousel', () => {
  afterEach(() => {
    document.head.querySelectorAll('script[type="application/ld+json"]').forEach((s) => s.remove());
    document.head.querySelectorAll('meta[name="pagetype"]').forEach((m) => m.remove());
  });

  describe('with 6 lines in the first row', () => {
    beforeEach(() => {
      window.isTestEnv = true;
      document.body.innerHTML = redBody;
    });

    it('block exists', async () => {
      const block = document.querySelector('.color-how-to-carousel');
      await decorate(block);
      expect(block).to.exist;
    });

    it('schema variant builds schema', async () => {
      const block = document.querySelector('.color-how-to-carousel');
      block.classList.add('schema');
      await decorate(block);
      const schema = document.querySelector('head script[type="application/ld+json"]');
      expect(schema).to.exist;
    });
  });

  describe('with only 4 lines in the first row + is dark', () => {
    beforeEach(() => {
      window.isTestEnv = true;
      document.body.innerHTML = blackBody;
    });

    it('block has a dark class', async () => {
      const block = document.querySelector('.color-how-to-carousel');
      await decorate(block);
      expect(block.classList.contains('dark')).to.be.true;
    });

    it('schema variant builds schema', async () => {
      const block = document.querySelector('.color-how-to-carousel');
      block.classList.add('schema');
      await decorate(block);
      const schema = document.querySelector('head script[type="application/ld+json"]');
      expect(schema).to.exist;
    });

    it('the missing 2 rows are icon and CTA', async () => {
      const block = document.querySelector('.color-how-to-carousel');
      await decorate(block);
      const icon = block.querySelector('.icon-color-how-to-icon');
      const cta = block.querySelector('.contnt-wrapper a.button.accent');
      expect(icon).to.not.exist;
      expect(cta).to.not.exist;
    });
  });

  describe('specs-card variant (opt-in via pagetype=color metadata)', () => {
    async function prepBlock(mock = './mocks/specs-basic.html') {
      window.isTestEnv = true;
      document.body.innerHTML = await readFile({ path: mock });
      setColorPageType();
      const block = document.querySelector('.color-how-to-carousel');
      await decorate(block);
      return block;
    }

    it('does not activate without pagetype=color metadata (legacy rendering is untouched)', async () => {
      window.isTestEnv = true;
      document.body.innerHTML = redBody;
      const block = document.querySelector('.color-how-to-carousel');
      await decorate(block);
      expect(block.querySelector('.chtc-heading')).to.not.exist;
      expect(block.querySelector('.img-wrapper')).to.exist;
    });

    it('decorates without error', async () => {
      const block = await prepBlock();
      expect(block).to.exist;
      expect(block.classList.contains('temporary-specs-card')).to.be.true;
    });

    it('does not leak legacy .tips/.tip styling (display/margin) onto the temporary-specs-card layout', async () => {
      // Regression test: the legacy render path styles `.tips .tip` with
      // `display: none` / `margin-top` / `margin-bottom` under the bare
      // `.color-how-to-carousel` selector. Those rules must not apply once
      // `.temporary-specs-card` is present, or inactive tips get removed from the
      // grid's height calculation (display:none) while the active tip picks
      // up unwanted legacy margins — inflating the how-to-card with extra
      // blank space below its content.
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = new URL('../../../express/code/blocks/color-how-to-carousel/color-how-to-carousel.css', import.meta.url).href;
      document.head.appendChild(link);
      await new Promise((resolve) => {
        link.onload = resolve;
        link.onerror = resolve;
      });

      try {
        const block = await prepBlock('./mocks/specs-varied-lengths.html');
        const tips = [...block.querySelectorAll('.tip')];
        expect(tips).to.have.lengthOf(3);

        tips.forEach((tip) => {
          expect(getComputedStyle(tip).display).to.not.equal('none');
          expect(getComputedStyle(tip).marginBottom).to.equal('0px');
        });

        const heights = tips.map((tip) => tip.getBoundingClientRect().height);
        expect(heights[0]).to.be.closeTo(heights[1], 1);
        expect(heights[1]).to.be.closeTo(heights[2], 1);
      } finally {
        link.remove();
      }
    });

    it('renders the heading above the graphic/content split, not inside a card', async () => {
      const block = await prepBlock();
      const heading = block.querySelector(':scope > .chtc-heading h2');
      expect(heading).to.exist;
      expect(heading.textContent.trim()).to.equal('How to use jade color.');
      expect(heading.closest('.chtc-how-to-card')).to.not.exist;
    });

    it('builds the graphic panel with the color-how-to-graph symbol tinted from the authored hex', async () => {
      const block = await prepBlock();
      const graphic = block.querySelector('.chtc-graphic');
      expect(graphic.style.backgroundColor).to.not.equal('');
      expect(graphic.querySelector('svg.color-how-to-graph')).to.exist;
    });

    it('does not render an icon (dropped in the specs-card design)', async () => {
      const block = await prepBlock();
      expect(block.querySelector('.icon')).to.not.exist;
    });

    it('renders the pager with 5 numbered steps, first one active', async () => {
      const block = await prepBlock();
      const numbers = block.querySelectorAll('.tip-number');
      expect(numbers.length).to.equal(5);
      expect(numbers[0].classList.contains('active')).to.be.true;
      expect(block.querySelector('.tip.active h3').textContent.trim())
        .to.equal('Information about jade color.');
    });

    it('switching the active pager number switches the active tip', async () => {
      const block = await prepBlock();
      block.querySelector('.tip-number.tip-3').click();
      expect(block.querySelector('.tip-number.tip-3').classList.contains('active')).to.be.true;
      expect(block.querySelector('.tip.tip-3').classList.contains('active')).to.be.true;
      expect(block.querySelector('.tip-number.tip-1').classList.contains('active')).to.be.false;
    });

    it('renders the CTA as a styled button inside the how-to card', async () => {
      const block = await prepBlock();
      const cta = block.querySelector('.chtc-how-to-card a.chtc-cta');
      expect(cta).to.exist;
      expect(cta.classList.contains('button')).to.be.true;
      expect(cta.getAttribute('href')).to.equal('https://example.com/create-now');
    });

    it('computes RGB/CMYK/HSL specs from the authored primary hex', async () => {
      const block = await prepBlock();
      const rows = [...block.querySelectorAll('.chtc-specs-row')];
      const specs = Object.fromEntries(rows.map((row) => [
        row.querySelector('.chtc-specs-label').textContent.trim(),
        row.querySelector('.chtc-specs-value').textContent.trim(),
      ]));

      expect(specs.HEX).to.equal('#1FA774');
      expect(specs.RGB).to.equal('31, 167, 116');
      expect(specs.CMYK).to.equal('81, 0, 31, 35');
      expect(specs.HSL).to.equal('158°, 69%, 39%');
    });

    it('copies a spec row value to the clipboard when its copy button is clicked', async () => {
      const block = await prepBlock();
      const writeText = sinon.stub().resolves();
      sinon.stub(navigator.clipboard, 'writeText').callsFake(writeText);

      const hexRow = [...block.querySelectorAll('.chtc-specs-row')]
        .find((row) => row.querySelector('.chtc-specs-label').textContent.trim() === 'HEX');
      hexRow.querySelector('.chtc-specs-copy').click();
      await new Promise((resolve) => { setTimeout(resolve, 0); });

      expect(writeText.calledWith('#1FA774')).to.be.true;
      navigator.clipboard.writeText.restore();
    });

    it('decorates a row with no icon paragraph but a CTA (5 elements: heading/name/hex/graph/cta)', async () => {
      const block = await prepBlock('./mocks/specs-no-icon.html');

      expect(block.querySelector(':scope > .chtc-heading h2').textContent.trim())
        .to.equal('How to use color jade.');
      expect(block.querySelectorAll('.tip-number')).to.have.lengthOf(5);
      const cta = block.querySelector('.chtc-how-to-card a.chtc-cta');
      expect(cta).to.exist;
      expect(cta.getAttribute('href')).to.equal('https://example.com/create-now');
      expect(block.querySelector('.chtc-specs-row .chtc-specs-value').textContent.trim())
        .to.equal('#1FA774');
    });

    it('does not emit a schema script when the schema variant is not authored alongside it', async () => {
      // specs-no-icon.html carries only `temporary-specs-card`, no `schema` —
      // this is the "drop the schema variant" case for pages adopting specs-card.
      const block = await prepBlock('./mocks/specs-no-icon.html');
      expect(block.classList.contains('schema')).to.be.false;
      const schema = document.querySelector('head script[type="application/ld+json"]');
      expect(schema).to.not.exist;
    });

    it('renders the CTA left-aligned, not centered', async () => {
      const block = await prepBlock();
      const container = block.querySelector('.chtc-how-to-card .button-container');
      expect(['left', 'start']).to.include(getComputedStyle(container).textAlign);
    });

    it('falls back to "Color specs" when the placeholder key is unauthored', async () => {
      const block = await prepBlock();
      const title = block.querySelector('.chtc-card-title');
      expect(title.textContent.trim()).to.equal('Color specs');
    });

    it('schema variant emits a HowTo JSON-LD script with each step in order (combined with temporary-specs-card)', async () => {
      window.isTestEnv = true;
      document.body.innerHTML = await readFile({ path: './mocks/specs-basic.html' });
      const block = document.querySelector('.color-how-to-carousel');
      block.classList.add('schema');
      await decorate(block);

      const schema = document.querySelector('head script[type="application/ld+json"]');
      expect(schema).to.exist;
      const parsed = JSON.parse(schema.textContent);
      expect(parsed['@type']).to.equal('HowTo');
      expect(parsed.step).to.have.lengthOf(5);
      expect(parsed.step[0].name).to.equal('Information about jade color.');
    });
  });
});
