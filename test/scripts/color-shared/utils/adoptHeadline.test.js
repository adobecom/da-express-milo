import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../../express/code/scripts/utils.js';

setLibs('/libs');

const { default: adoptHeadline } = await import(
  '../../../../express/code/scripts/color-shared/utils/adoptHeadline.js'
);

function createSection({ hasHeadline = true, hasHeading = true, hasLogo = false } = {}) {
  const section = document.createElement('div');
  section.className = 'section';

  if (hasHeadline) {
    const headline = document.createElement('div');
    headline.className = 'color-headline tools';
    if (hasHeading) {
      const inner = document.createElement('div');
      inner.innerHTML = '<div><h2>Test Heading</h2><p>Subtitle</p></div>';
      headline.appendChild(inner);
    }
    if (hasLogo) {
      const logo = document.createElement('span');
      logo.className = 'icon icon-adobe-express-logo express-logo';
      const heading = headline.querySelector('h2');
      if (heading) heading.before(logo);
      else headline.prepend(logo);
    }
    section.appendChild(headline);
  }

  const block = document.createElement('div');
  block.className = 'color-blindness block';
  section.appendChild(block);

  return { section, block };
}

function createMockLayout() {
  const sidebar = document.createElement('div');
  sidebar.setAttribute('data-shell-slot', 'sidebar');
  return { slots: { sidebar } };
}

describe('adoptHeadline', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('moves .color-headline.tools into the sidebar slot', () => {
    const { section, block } = createSection();
    document.body.appendChild(section);
    const layout = createMockLayout();

    adoptHeadline(block, layout);

    const adopted = layout.slots.sidebar.querySelector('.color-headline.tools');
    expect(adopted).to.exist;
    expect(adopted.dataset.adopted).to.equal('true');
    expect(section.querySelector('.color-headline.tools')).to.be.null;
  });

  it('injects the express logo when not already present', () => {
    const { section, block } = createSection({ hasLogo: false });
    document.body.appendChild(section);
    const layout = createMockLayout();

    adoptHeadline(block, layout);

    const logo = layout.slots.sidebar.querySelector('.express-logo');
    expect(logo).to.exist;
  });

  it('does not duplicate logo when already present', () => {
    const { section, block } = createSection({ hasLogo: true });
    document.body.appendChild(section);
    const layout = createMockLayout();

    adoptHeadline(block, layout);

    const logos = layout.slots.sidebar.querySelectorAll('.express-logo');
    expect(logos).to.have.lengthOf(1);
  });

  it('is a no-op when block has no .section ancestor', () => {
    const block = document.createElement('div');
    block.className = 'color-blindness block';
    document.body.appendChild(block);
    const layout = createMockLayout();

    adoptHeadline(block, layout);

    expect(layout.slots.sidebar.children).to.have.lengthOf(0);
  });

  it('is a no-op when section has no .color-headline.tools', () => {
    const { section, block } = createSection({ hasHeadline: false });
    document.body.appendChild(section);
    const layout = createMockLayout();

    adoptHeadline(block, layout);

    expect(layout.slots.sidebar.children).to.have.lengthOf(0);
  });

  it('does not inject logo when headline has no heading element', () => {
    const { section, block } = createSection({ hasHeading: false });
    document.body.appendChild(section);
    const layout = createMockLayout();

    adoptHeadline(block, layout);

    const adopted = layout.slots.sidebar.querySelector('.color-headline.tools');
    expect(adopted).to.exist;
    expect(adopted.querySelector('.express-logo')).to.be.null;
  });

  it('prepends headline before existing sidebar content', () => {
    const { section, block } = createSection();
    document.body.appendChild(section);
    const layout = createMockLayout();
    const existing = document.createElement('div');
    existing.className = 'existing-content';
    layout.slots.sidebar.appendChild(existing);

    adoptHeadline(block, layout);

    expect(layout.slots.sidebar.firstElementChild.classList.contains('color-headline')).to.be.true;
    expect(layout.slots.sidebar.lastElementChild.classList.contains('existing-content')).to.be.true;
  });
});
