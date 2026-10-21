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

function buildArea() {
  const area = document.createElement('div');
  area.innerHTML = `
    <div>
      <div class="wayfinder"><div><div>Default promo</div></div></div>
      <div class="section-metadata"><div><div>metadata-fragment</div><div>${KEY}</div></div></div>
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

  it('removes the section when page metadata is off', () => {
    setMeta('off');
    const area = buildArea();
    preDecorateSections(area);
    expect(area.children.length).to.equal(0);
  });

  it('keeps the authored content when page metadata is on', () => {
    setMeta('Yes');
    const area = buildArea();
    preDecorateSections(area);
    expect(area.querySelector('.wayfinder')).to.exist;
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
});
