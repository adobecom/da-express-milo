/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };
window.isTestEnv = true;
const imports = await Promise.all([import('../../../express/code/scripts/utils.js'), import('../../../express/code/scripts/scripts.js')]);
const { getLibs } = imports[0];

await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  const conf = { locales };
  mod.setConfig(conf);
});
const { default: decorate } = await import('../../../express/code/blocks/ax-columns/ax-columns.js');

// eslint-disable-next-line max-len
const [buttonLight, color, fullsize, highlight, icon, iconWithSibling, iconList, notHighlight, numbered30, offer, offerIcon, picture, video, marquee, fullsizeTwoButtons] = await Promise.all(
  [readFile({ path: './mocks/button-light.html' }), readFile({ path: './mocks/color.html' }), readFile({ path: './mocks/fullsize.html' }), readFile({ path: './mocks/highlight.html' }),
    readFile({ path: './mocks/icon.html' }), readFile({ path: './mocks/icon-with-sibling.html' }), readFile({ path: './mocks/icon-list.html' }), readFile({ path: './mocks/not-highlight.html' }), readFile({ path: './mocks/numbered-30.html' }),
    readFile({ path: './mocks/offer.html' }), readFile({ path: './mocks/offer-icon.html' }), readFile({ path: './mocks/picture.html' }), readFile({ path: './mocks/video.html' }),
    readFile({ path: './mocks/marquee.html' }), readFile({ path: './mocks/fullsize-two-buttons.html' })],
);

describe('Columns', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('Columns exists', async () => {
    const body = await readFile({ path: './mocks/body.html' });
    document.body.innerHTML = body;
    const columns = document.querySelector('.ax-columns');
    await decorate(columns);
    expect(columns).to.exist;
  });

  it('Should render a numbered column', async () => {
    document.body.innerHTML = numbered30;
    const columns = document.querySelector('.ax-columns');
    await decorate(columns);

    const columnNumber = columns.querySelector('.num');
    expect(columnNumber.textContent).to.be.equal('01/30 —');
  });

  it('Should render an offer column & have only 1 row', async () => {
    document.body.innerHTML = offer;
    const columns = document.querySelector('.ax-columns');
    await decorate(columns);

    const rows = Array.from(columns.children);
    expect(rows.length).to.be.equal(1);
  });

  it('Should transform primary color to bg color and secondary color to fill', async () => {
    document.body.innerHTML = color;
    const columns = document.querySelector('.ax-columns');
    await decorate(columns);

    const imgWrapper = columns.querySelector('.img-wrapper');
    expect(imgWrapper.style.backgroundColor).to.be.equal('rgb(255, 87, 51)');
    expect(imgWrapper.style.fill).to.be.equal('rgb(52, 210, 228)');
  });

  it('Should render an offer column and decorate icons', async () => {
    document.body.innerHTML = offerIcon;
    const columns = document.querySelector('.ax-columns');
    await decorate(columns);

    const title = columns.querySelector('h1');
    const titleIcon = columns.querySelector('.columns-offer-icon');
    expect(title).to.exist;
    expect(titleIcon).to.exist;
  });

  it('Should render a column and decorate icons', async () => {
    document.body.innerHTML = icon;
    const columns = document.querySelector('.ax-columns');
    await decorate(columns);

    const iconDecorate = columns.querySelector('.brand');
    const iconParent = columns.children[0];
    expect(iconDecorate).to.exist;
    expect(iconParent.classList.contains('has-brand')).to.be.true;
  });

  it('Should render a column and decorate icons with sibling', async () => {
    document.body.innerHTML = iconWithSibling;
    const columns = document.querySelector('.ax-columns');
    await decorate(columns);

    const columnsIcon = columns.querySelector('.columns-iconlist');
    expect(columnsIcon).to.exist;
  });

  it('Should contain right classes if column video has highlight', async () => {
    document.body.innerHTML = highlight;
    const columns = document.querySelector('.ax-columns');
    await decorate(columns);

    const highlightRow = columns.querySelector('#hightlight-row');
    highlightRow.click();
    highlightRow.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));

    const sibling = columns.querySelector('.column-picture');
    const columnVideo = columns.querySelector('.column-video');
    expect(sibling).to.exist;
    expect(columnVideo).to.exist;
  });

  it('Icon list should be wrapped in a column-iconlist div', async () => {
    document.body.innerHTML = iconList;
    const columns = document.querySelector('.ax-columns');
    await decorate(columns);

    const childrenLength = columns.children.length;
    const iconListDiv = columns.querySelector('.columns-iconlist');
    expect(childrenLength).to.not.equal(0);
    expect(iconListDiv).to.exist;
  });

  it('Picture should be wrapped in a div if it exists', async () => {
    document.body.innerHTML = picture;
    const columns = document.querySelector('.ax-columns');
    await decorate(columns);

    const picDiv = columns.querySelector('picture');
    const parent = picDiv.parentElement;
    expect(parent.tagName).to.equal('DIV');
  });

  it('Should replace accent to primary if button contains classList light', async () => {
    document.body.innerHTML = buttonLight;
    const columns = document.querySelector('.ax-columns');
    await decorate(columns);

    const button = columns.querySelector('.button');
    expect(button.classList.contains('light')).to.be.true;
    expect(button.classList.contains('primary')).to.be.true;
  });

  it('P should be removed if empty', async () => {
    document.body.innerHTML = buttonLight;
    const columns = document.querySelector('.ax-columns');
    await decorate(columns);

    const p = columns.querySelectorAll('p');
    expect(p.length).to.equal(1);
  });

  it('Powered by classList should be added if innerText matches/has Powered By', async () => {
    document.body.innerHTML = buttonLight;
    const columns = document.querySelector('.ax-columns');
    await decorate(columns);

    const poweredBy = columns.querySelector('.powered-by');
    expect(poweredBy).to.exist;
  });

  it('Invert buttons in regular columns inside columns-highlight-container', async () => {
    document.body.innerHTML = notHighlight;
    const columns = document.querySelector('.ax-columns');
    await decorate(columns);

    const button = columns.querySelector('.button');
    expect(button.classList.contains('dark')).to.be.true;
  });

  it('Should decorate two buttons in a row', async () => {
    document.body.innerHTML = fullsizeTwoButtons;
    const columns = document.querySelector('.ax-columns');
    await decorate(columns);

    const buttons = columns.querySelectorAll('.button');
    expect(buttons.length).to.equal(2);

    const primaryButton = buttons[0];
    expect(primaryButton.classList.contains('accent')).to.be.true;
    expect(primaryButton.classList.contains('primaryCTA')).to.be.true;

    const secondaryButton = buttons[1];
    expect(secondaryButton.classList.contains('primary')).to.be.true;
    expect(secondaryButton.classList.contains('reverse')).to.be.true;
  });
});
