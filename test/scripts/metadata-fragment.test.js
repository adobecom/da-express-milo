import { expect } from '@esm-bundle/chai';
import { preDecorateSections } from '../../express/code/scripts/utils.js';

const KEY = 'test-promo';

function setMeta(value) {
  document.head.querySelector(`meta[name="${KEY}"]`)?.remove();
  if (value === undefined) return;
  const meta = document.createElement('meta');
  meta.name = KEY;
  meta.content = value;
  document.head.append(meta);
}

function buildArea(keyCell = KEY) {
  const area = document.createElement('div');
  area.innerHTML = `
    <div>
      <div class="wayfinder"><div><div>Default promo</div></div></div>
      <div class="section-metadata"><div><div>metadata-fragment</div><div>${keyCell}</div></div></div>
    </div>`;
  return area;
}

describe('section-metadata metadata-fragment', () => {
  afterEach(() => setMeta());

  it('removes the section when page metadata is missing', () => {
    const area = buildArea();
    preDecorateSections(area);
    expect(area.children.length).to.equal(0);
  });

  it('swaps the content for a fragment link when page metadata is a path', () => {
    setMeta('/express/fragments/wayfinder/variant-b');
    const area = buildArea();
    preDecorateSections(area);
    const section = area.firstElementChild;
    expect(section.querySelector('.wayfinder')).to.not.exist;
    const link = section.querySelector('a');
    expect(new URL(link.href).pathname).to.equal('/express/fragments/wayfinder/variant-b');
    expect(section.lastElementChild.classList.contains('section-metadata')).to.be.true;
  });

  it('re-roots authored aem.page links on the current origin', () => {
    setMeta('https://main--da-express-milo--adobecom.aem.page/express/fragments/wayfinder-id');
    const area = buildArea();
    preDecorateSections(area);
    const link = new URL(area.querySelector('a').href);
    expect(link.origin).to.equal(window.location.origin);
    expect(link.pathname).to.equal('/express/fragments/wayfinder-id');
  });

  it('removes the section when the value is not a fragment path', () => {
    setMeta('/express/pricing');
    const area = buildArea();
    preDecorateSections(area);
    expect(area.children.length).to.equal(0);
  });

  it('matches a key authored with spaces and capitals', () => {
    setMeta('/express/fragments/wayfinder/variant-b');
    const area = buildArea('Test Promo');
    preDecorateSections(area);
    expect(area.querySelector('a')).to.exist;
  });

  it('does not throw on a multi-paragraph or quoted key', () => {
    expect(() => preDecorateSections(buildArea('<p>test-promo</p><p>x</p>'))).to.not.throw();
    expect(() => preDecorateSections(buildArea('test"promo'))).to.not.throw();
  });
});
