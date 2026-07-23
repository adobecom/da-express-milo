import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };
window.isTestEnv = true;

const [{ getLibs }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);

await import(`${getLibs()}/utils/utils.js`).then((mod) => mod.setConfig({ locales }));

const { default: decorate } = await import('../../../express/code/blocks/icon-carousel/icon-carousel.js');

async function prepBlock(filePath) {
  document.body.innerHTML = await readFile({ path: filePath });
  const block = document.querySelector('.icon-carousel');
  await decorate(block);
  return block;
}

describe('icon-carousel / structure', () => {
  it('decorates without error', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block).to.exist;
  });

  it('builds header element', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.icon-carousel-header')).to.exist;
  });

  it('preserves heading in header', async () => {
    const block = await prepBlock('./mocks/default.html');
    const heading = block.querySelector('.icon-carousel-header h2');
    expect(heading).to.exist;
    expect(heading.textContent).to.include('Lorem ipsum');
  });

  it('preserves subtitle paragraph in header', async () => {
    const block = await prepBlock('./mocks/default.html');
    const subtitle = block.querySelector('.icon-carousel-header p');
    expect(subtitle).to.exist;
  });

  it('exposes the gallery as a carousel group', async () => {
    const block = await prepBlock('./mocks/default.html');
    const gallery = block.querySelector('.icon-carousel-gallery');
    expect(gallery).to.exist;
    expect(gallery.getAttribute('role')).to.equal('group');
  });

  it('sets gallery aria-label from heading text', async () => {
    const block = await prepBlock('./mocks/default.html');
    const gallery = block.querySelector('.icon-carousel-gallery');
    expect(gallery.getAttribute('aria-label')).to.include('Lorem ipsum');
  });

  it('renders correct number of cards', async () => {
    const block = await prepBlock('./mocks/default.html');
    const cards = block.querySelectorAll('.icon-carousel-card');
    expect(cards.length).to.equal(4);
  });

  it('each card has a body element', async () => {
    const block = await prepBlock('./mocks/default.html');
    const bodies = block.querySelectorAll('.icon-carousel-card-body');
    expect(bodies.length).to.equal(4);
  });

  it('card body preserves heading', async () => {
    const block = await prepBlock('./mocks/default.html');
    const firstCardHeading = block.querySelector('.icon-carousel-card-body h4');
    expect(firstCardHeading).to.exist;
  });

  it('card body preserves paragraph', async () => {
    const block = await prepBlock('./mocks/default.html');
    const firstCardBody = block.querySelector('.icon-carousel-card-body p');
    expect(firstCardBody).to.exist;
  });

  it('card icon container is built when picture is present', async () => {
    const block = await prepBlock('./mocks/default.html');
    const icon = block.querySelector('.icon-carousel-card-icon');
    expect(icon).to.exist;
  });

  it('icon container has aria-hidden="true"', async () => {
    const block = await prepBlock('./mocks/default.html');
    const icon = block.querySelector('.icon-carousel-card-icon');
    expect(icon.getAttribute('aria-hidden')).to.equal('true');
  });

  it('icon container wraps the picture element', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.icon-carousel-card-icon picture')).to.exist;
  });
});

describe('icon-carousel / controls', () => {
  it('renders controls container', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.gallery-control')).to.exist;
  });

  it('renders prev button', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.gallery-control .prev')).to.exist;
  });

  it('renders next button', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.gallery-control .next')).to.exist;
  });

  it('nav buttons contain svg chevron', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.gallery-control .prev svg')).to.exist;
    expect(block.querySelector('.gallery-control .next svg')).to.exist;
  });

  it('nav buttons have aria-label', async () => {
    const block = await prepBlock('./mocks/default.html');
    const prev = block.querySelector('.gallery-control .prev');
    const next = block.querySelector('.gallery-control .next');
    expect(prev.getAttribute('aria-label')).to.be.a('string').with.length.greaterThan(0);
    expect(next.getAttribute('aria-label')).to.be.a('string').with.length.greaterThan(0);
  });

  it('controls start hidden until observer confirms overflow', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.gallery-control').classList.contains('loading')).to.be.true;
  });
});

describe('icon-carousel / no-icon variant', () => {
  it('renders cards without icon containers when no pictures', async () => {
    const block = await prepBlock('./mocks/no-icons.html');
    expect(block.querySelector('.icon-carousel-card-icon')).to.not.exist;
  });

  it('still renders card body content', async () => {
    const block = await prepBlock('./mocks/no-icons.html');
    const cards = block.querySelectorAll('.icon-carousel-card');
    expect(cards.length).to.equal(2);
    expect(cards[0].querySelector('.icon-carousel-card-body h4')).to.exist;
  });
});

describe('icon-carousel / first row is header only', () => {
  it('header row is not rendered as a card', async () => {
    const block = await prepBlock('./mocks/default.html');
    const cards = block.querySelectorAll('.icon-carousel-card');
    // mock has 1 header row + 4 card rows → exactly 4 cards
    expect(cards.length).to.equal(4);
    // none of those cards should contain the block heading
    const headingInCard = block.querySelector('.icon-carousel-card h2');
    expect(headingInCard).to.not.exist;
  });

  it('gallery aria-label matches heading text exactly', async () => {
    const block = await prepBlock('./mocks/default.html');
    const heading = block.querySelector('.icon-carousel-header h2');
    const gallery = block.querySelector('.icon-carousel-gallery');
    expect(gallery.getAttribute('aria-label')).to.equal(heading.textContent.trim());
  });
});

describe('icon-carousel / nav button icons', () => {
  it('each button contains exactly one svg', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelectorAll('.gallery-control svg').length).to.equal(2);
  });

  it('chevron svgs are aria-hidden', async () => {
    const block = await prepBlock('./mocks/default.html');
    block.querySelectorAll('.gallery-control svg').forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).to.equal('true');
    });
  });
});

describe('icon-carousel / dark variant', () => {
  it('dark class is preserved after decoration', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/default.html' });
    const block = document.querySelector('.icon-carousel');
    block.classList.add('dark');
    await decorate(block);
    expect(block.classList.contains('dark')).to.be.true;
  });
});

describe('icon-carousel / no-subcopy variant', () => {
  it('no-subcopy class is preserved after decoration', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/default.html' });
    const block = document.querySelector('.icon-carousel');
    block.classList.add('no-subcopy');
    await decorate(block);
    expect(block.classList.contains('no-subcopy')).to.be.true;
    expect(block.querySelector('.icon-carousel-header p')).to.exist;
  });
});
