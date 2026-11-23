import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const [, { default: decorate }] = await Promise.all([import('../../../express/code/scripts/scripts.js'), import('../../../express/code/blocks/color-how-to-carousel/color-how-to-carousel.js')]);

describe('Color How To Carousel', () => {
  afterEach(() => {
    document.head.querySelectorAll('script[type="application/ld+json"]').forEach((s) => s.remove());
  });

  describe('specs-card layout', () => {
    async function prepBlock(mock = './mocks/specs-basic.html', colorName = '') {
      window.isTestEnv = true;
      document.body.innerHTML = await readFile({ path: mock });
      const block = document.querySelector('.color-how-to-carousel');
      if (colorName) block.querySelector('h2').nextElementSibling.textContent = colorName;
      await decorate(block);
      return block;
    }

    describe('English CTA search terms', () => {
      let originalUrl;

      beforeEach(() => {
        originalUrl = window.location.href;
      });

      afterEach(() => {
        window.history.replaceState({}, '', originalUrl);
      });

      [
        ['/meanings/red', 'Rosso', 'red'],
        ['/it/meanings/red', 'Rosso', 'red'],
        ['/it/meanings/hot-pink', 'Rosa acceso', 'hot pink'],
        ['/fr/meanings/light-sky-blue', 'Bleu ciel clair', 'light sky blue'],
        ['/it/meanings/hot-pink/', 'Rosa acceso', 'hot pink'],
        ['/it/meanings/hot-pink.html', 'Rosa acceso', 'hot pink'],
        ['/it/meanings/hot-pink.html/', 'Rosa acceso', 'hot pink'],
        ['/it/meanings/hot%20pink', 'Rosa acceso', 'hot pink'],
        ['/it/meanings/hot-pink?source=test#steps', 'Rosa acceso', 'hot pink'],
        ['/express/colors/hot-pink', 'Jade', 'jade'],
        ['/it/express/colors/hot-pink.html', 'Jade', 'jade'],
        ['/test/preview', 'Jade', 'jade'],
      ].forEach(([path, authoredName, englishName]) => {
        it(`uses "${englishName}" for ${path} without changing authored content`, async () => {
          window.history.replaceState({}, '', path);
          const block = await prepBlock(undefined, authoredName);
          const cta = block.querySelector('.chtc-how-to-card a.chtc-cta');
          const url = new URL(cta.href);

          expect(url.searchParams.get('q')).to.equal(englishName);
          expect(url.searchParams.get('searchCategory')).to.equal('templates');
          expect(url.searchParams.get('category')).to.equal('templates');
          expect(url.searchParams.get('placement')).to.equal('outside-blocks');
          expect(block.querySelector('.chtc-heading h2').textContent.trim())
            .to.equal('How to use jade color.');
          expect(cta.textContent).to.equal('Create Now');
        });
      });
    });

    it('decorates without error', async () => {
      const block = await prepBlock();
      expect(block).to.exist;
      expect(block.querySelector(':scope > .chtc-container')).to.exist;
    });

    it('keeps every tip in the grid so the card height does not change between slides', async () => {
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

    it('renders the CTA as a styled button inside the how-to card, with the current color injected into its href', async () => {
      const block = await prepBlock();
      const cta = block.querySelector('.chtc-how-to-card a.chtc-cta');
      expect(cta).to.exist;
      expect(cta.classList.contains('button')).to.be.true;
      expect(cta.getAttribute('href')).to.equal('https://adobesparkpost.app.link/c4bWARQhWAb?category=templates&url=%2F&placement=outside-blocks&locale=en-US&contentRegion=us&q=jade&searchCategory=templates');
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
      expect(cta.getAttribute('href')).to.equal('https://adobesparkpost.app.link/c4bWARQhWAb?category=templates&url=%2F&placement=outside-blocks&locale=en-US&contentRegion=us&q=jade&searchCategory=templates');
      expect(block.querySelector('.chtc-specs-row .chtc-specs-value').textContent.trim())
        .to.equal('#1FA774');
    });

    it('does not emit a schema script when the schema variant is not authored', async () => {
      // specs-no-icon.html carries no `schema` variant.
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

    it('schema variant emits a HowTo JSON-LD script with each step in order', async () => {
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
