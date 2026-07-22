import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../../express/code/scripts/utils.js';

setLibs('/libs');

const { default: adoptHeadline } = await import(
  '../../../../express/code/scripts/color-shared/utils/adoptHeadline.js'
);

function createHeadlineSection({ hasHeading = true, hasLogo = false } = {}) {
  const section = document.createElement('div');
  section.className = 'section';
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
  return section;
}

function createEmptySection() {
  const section = document.createElement('div');
  section.className = 'section';
  return section;
}

function createToolSection() {
  const section = document.createElement('div');
  section.className = 'section';
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

  it('finds headline in the same section as the tool block', () => {
    const wrapper = document.createElement('div');
    const section = document.createElement('div');
    section.className = 'section';
    const headline = document.createElement('div');
    headline.className = 'color-headline tools';
    headline.innerHTML = '<div><div><h2>Same Section</h2></div></div>';
    headline.id = 'same';
    const block = document.createElement('div');
    block.className = 'color-blindness block';
    section.appendChild(headline);
    section.appendChild(block);
    wrapper.appendChild(section);
    document.body.appendChild(wrapper);
    const layout = createMockLayout();

    adoptHeadline(block, layout);

    const adopted = layout.slots.sidebar.querySelector('.color-headline.tools');
    expect(adopted).to.exist;
    expect(adopted.id).to.equal('same');
  });

  it('prefers headline in same section over sibling sections', () => {
    const wrapper = document.createElement('div');
    wrapper.appendChild(createHeadlineSection());
    const section = document.createElement('div');
    section.className = 'section';
    const headline = document.createElement('div');
    headline.className = 'color-headline tools';
    headline.innerHTML = '<div><div><h2>Same Section</h2></div></div>';
    headline.id = 'same';
    const block = document.createElement('div');
    block.className = 'color-blindness block';
    section.appendChild(headline);
    section.appendChild(block);
    wrapper.appendChild(section);
    document.body.appendChild(wrapper);
    const layout = createMockLayout();

    adoptHeadline(block, layout);

    const adopted = layout.slots.sidebar.querySelector('.color-headline.tools');
    expect(adopted.id).to.equal('same');
  });

  it('moves .color-headline.tools from preceding section into the sidebar slot', () => {
    const wrapper = document.createElement('div');
    wrapper.appendChild(createHeadlineSection());
    const { section, block } = createToolSection();
    wrapper.appendChild(section);
    document.body.appendChild(wrapper);
    const layout = createMockLayout();

    adoptHeadline(block, layout);

    const adopted = layout.slots.sidebar.querySelector('.color-headline.tools');
    expect(adopted).to.exist;
    expect(adopted.dataset.adopted).to.equal('true');
  });

  it('finds headline in a following section', () => {
    const wrapper = document.createElement('div');
    const { section, block } = createToolSection();
    wrapper.appendChild(section);
    wrapper.appendChild(createHeadlineSection());
    document.body.appendChild(wrapper);
    const layout = createMockLayout();

    adoptHeadline(block, layout);

    const adopted = layout.slots.sidebar.querySelector('.color-headline.tools');
    expect(adopted).to.exist;
    expect(adopted.dataset.adopted).to.equal('true');
  });

  it('prefers previous over next at equal distance', () => {
    const wrapper = document.createElement('div');
    const prevSection = createHeadlineSection();
    prevSection.querySelector('.color-headline').id = 'prev';
    wrapper.appendChild(prevSection);
    const { section, block } = createToolSection();
    wrapper.appendChild(section);
    const nextSection = createHeadlineSection();
    nextSection.querySelector('.color-headline').id = 'next';
    wrapper.appendChild(nextSection);
    document.body.appendChild(wrapper);
    const layout = createMockLayout();

    adoptHeadline(block, layout);

    const adopted = layout.slots.sidebar.querySelector('.color-headline.tools');
    expect(adopted.id).to.equal('prev');
  });

  it('picks the closer side regardless of direction', () => {
    const wrapper = document.createElement('div');
    const farSection = createHeadlineSection();
    farSection.querySelector('.color-headline').id = 'far';
    wrapper.appendChild(farSection);
    wrapper.appendChild(createEmptySection());
    const { section, block } = createToolSection();
    wrapper.appendChild(section);
    const nearSection = createHeadlineSection();
    nearSection.querySelector('.color-headline').id = 'near';
    wrapper.appendChild(nearSection);
    document.body.appendChild(wrapper);
    const layout = createMockLayout();

    adoptHeadline(block, layout);

    const adopted = layout.slots.sidebar.querySelector('.color-headline.tools');
    expect(adopted.id).to.equal('near');
  });

  it('skips non-matching sections and finds headline further out', () => {
    const wrapper = document.createElement('div');
    wrapper.appendChild(createHeadlineSection());
    wrapper.appendChild(createEmptySection());
    const { section, block } = createToolSection();
    wrapper.appendChild(section);
    document.body.appendChild(wrapper);
    const layout = createMockLayout();

    adoptHeadline(block, layout);

    const adopted = layout.slots.sidebar.querySelector('.color-headline.tools');
    expect(adopted).to.exist;
  });

  it('injects the express logo when not already present', () => {
    const wrapper = document.createElement('div');
    wrapper.appendChild(createHeadlineSection({ hasLogo: false }));
    const { section, block } = createToolSection();
    wrapper.appendChild(section);
    document.body.appendChild(wrapper);
    const layout = createMockLayout();

    adoptHeadline(block, layout);

    const logo = layout.slots.sidebar.querySelector('.express-logo');
    expect(logo).to.exist;
  });

  it('does not duplicate logo when already present', () => {
    const wrapper = document.createElement('div');
    wrapper.appendChild(createHeadlineSection({ hasLogo: true }));
    const { section, block } = createToolSection();
    wrapper.appendChild(section);
    document.body.appendChild(wrapper);
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

  it('is a no-op when no sibling section has .color-headline.tools', () => {
    const wrapper = document.createElement('div');
    wrapper.appendChild(createEmptySection());
    const { section, block } = createToolSection();
    wrapper.appendChild(section);
    wrapper.appendChild(createEmptySection());
    document.body.appendChild(wrapper);
    const layout = createMockLayout();

    adoptHeadline(block, layout);

    expect(layout.slots.sidebar.children).to.have.lengthOf(0);
  });

  it('does not inject logo when headline has no heading element', () => {
    const wrapper = document.createElement('div');
    wrapper.appendChild(createHeadlineSection({ hasHeading: false }));
    const { section, block } = createToolSection();
    wrapper.appendChild(section);
    document.body.appendChild(wrapper);
    const layout = createMockLayout();

    adoptHeadline(block, layout);

    const adopted = layout.slots.sidebar.querySelector('.color-headline.tools');
    expect(adopted).to.exist;
    expect(adopted.querySelector('.express-logo')).to.be.null;
  });

  it('prepends headline before existing sidebar content', () => {
    const wrapper = document.createElement('div');
    wrapper.appendChild(createHeadlineSection());
    const { section, block } = createToolSection();
    wrapper.appendChild(section);
    document.body.appendChild(wrapper);
    const layout = createMockLayout();
    const existing = document.createElement('div');
    existing.className = 'existing-content';
    layout.slots.sidebar.appendChild(existing);

    adoptHeadline(block, layout);

    expect(layout.slots.sidebar.firstElementChild.classList.contains('color-headline')).to.be.true;
    expect(layout.slots.sidebar.lastElementChild.classList.contains('existing-content')).to.be.true;
  });
});
