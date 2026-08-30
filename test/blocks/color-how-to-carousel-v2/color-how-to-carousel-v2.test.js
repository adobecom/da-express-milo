import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const [, { default: decorate }] = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/color-how-to-carousel-v2/color-how-to-carousel-v2.js'),
]);

async function prepBlock() {
  window.isTestEnv = true;
  document.body.innerHTML = await readFile({ path: './mocks/basic.html' });
  const block = document.querySelector('.color-how-to-carousel-v2');
  await decorate(block);
  return block;
}

describe('Color How To Carousel v2', () => {
  it('decorates without error', async () => {
    const block = await prepBlock();
    expect(block).to.exist;
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

  it('does not render an icon (dropped in the v2 design)', async () => {
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
    expect(cta.getAttribute('href')).to.equal('https://adobesparkpost.app.link/c4bWARQhWAb');
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
    window.isTestEnv = true;
    document.body.innerHTML = await readFile({ path: './mocks/no-icon.html' });
    const block = document.querySelector('.color-how-to-carousel-v2');
    await decorate(block);

    expect(block.querySelector(':scope > .chtc-heading h2').textContent.trim())
      .to.equal('How to use color jade.');
    expect(block.querySelectorAll('.tip-number')).to.have.lengthOf(5);
    const cta = block.querySelector('.chtc-how-to-card a.chtc-cta');
    expect(cta).to.exist;
    expect(cta.getAttribute('href')).to.equal('https://adobesparkpost.app.link/c4bWARQhWAb');
    expect(block.querySelector('.chtc-specs-row .chtc-specs-value').textContent.trim())
      .to.equal('#1FA774');
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
    document.body.innerHTML = await readFile({ path: './mocks/basic.html' });
    const block = document.querySelector('.color-how-to-carousel-v2');
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
