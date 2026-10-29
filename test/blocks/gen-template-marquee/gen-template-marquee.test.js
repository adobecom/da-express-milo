/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

window.isTestEnv = true;

await import('../../../express/code/scripts/scripts.js');
const { setLibs } = await import('../../../express/code/scripts/utils.js');
setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });
const { default: decorate } = await import('../../../express/code/blocks/gen-template-marquee/gen-template-marquee.js');

const fixture = await readFile({ path: './mocks/default.html' });
const originalFetch = window.fetch;
const MOCK_TEMPLATES = Array.from({ length: 16 }, (_, index) => ({
  id: `template-${index}`,
  status: 'approved',
  assetType: 'Template',
  behaviors: ['still'],
  customLinks: { branchUrl: `https://example.com/template-${index}` },
  pages: [{
    rendition: {
      image: {
        thumbnail: {
          componentId: `component-${index}`,
          height: index % 2 ? 1080 : 800,
          width: index % 2 ? 720 : 800,
          mediaType: 'image/jpeg',
        },
      },
    },
  }],
  _links: {
    'http://ns.adobe.com/adobecloud/rel/rendition': {
      href: `https://example.com/rendition-${index}{&page,size,type,fragment}`,
    },
    'http://ns.adobe.com/adobecloud/rel/component': {
      href: `https://example.com/component-${index}{&revision,component_id}`,
    },
  },
}));
let fetchedUrl;

function addMetadata(metadata) {
  Object.entries(metadata).forEach(([name, content]) => {
    const meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    meta.dataset.genTemplateTest = '';
    document.head.append(meta);
  });
}

async function prepareBlock(metadata = {}, templateSource = '') {
  addMetadata(metadata);
  document.body.innerHTML = fixture;
  const block = document.querySelector('.gen-template-marquee');
  if (templateSource) block.children[2].firstElementChild.textContent = templateSource;
  await decorate(block);
  return block;
}

describe('gen-template-marquee', () => {
  beforeEach(() => {
    fetchedUrl = '';
    window.fetch = (url) => {
      fetchedUrl = url;
      return Promise.resolve({ json: () => Promise.resolve({ items: MOCK_TEMPLATES }) });
    };
  });

  afterEach(() => {
    window.fetch = originalFetch;
    document.body.replaceChildren();
    document.head.querySelectorAll('meta[data-gen-template-test]').forEach((meta) => meta.remove());
  });

  it('builds the prompt experience with current text fallbacks', async () => {
    const block = await prepareBlock();
    const input = block.querySelector('.gen-template-prompt-input');
    const form = block.querySelector('.gen-template-prompt-form');

    expect(block.querySelector('h1').textContent).to.equal('Generate templates with AI.');
    expect(input.placeholder).to.equal('Describe what template you want to make');
    expect(block.querySelector('label').textContent).to.equal('Prompt');
    expect(block.querySelector('label').htmlFor).to.equal(input.id);
    expect(block.querySelector('.gen-template-prompt-submit').textContent).to.contain('Generate');
    expect(form.dataset.href).to.equal('https://new.express.adobe.com/neural-pixel-editor?entry=create-menu');
    expect(block.querySelector('.gen-template-suggestions-label').textContent)
      .to.equal('Get started with an example prompt');
  });

  it('only injects the authored branding logo', async () => {
    const blockWithoutLogo = await prepareBlock();
    expect(blockWithoutLogo.querySelector('.gen-template-logo')).to.not.exist;

    const blockWithLogo = await prepareBlock({
      'inject-branding-logo': 'adobe-express-logo',
    });
    const logo = blockWithLogo.querySelector('.gen-template-logo');

    expect(logo).to.exist;
    expect(logo.src).to.contain('/express/code/icons/adobe-express-logo.svg');
  });

  it('uses page metadata to override every prompt placeholder', async () => {
    const block = await prepareBlock({
      'gen-template-prompt-label': 'Your prompt',
      'gen-template-prompt-placeholder': 'Describe your design',
      'gen-template-prompt-submit': 'Create',
      'gen-template-suggestions-label': 'Try an example',
    });

    expect(block.querySelector('.gen-template-prompt-label').textContent).to.equal('Your prompt');
    expect(block.querySelector('.gen-template-prompt-input').placeholder).to.equal('Describe your design');
    expect(block.querySelector('.gen-template-prompt-submit').textContent).to.contain('Create');
    expect(block.querySelector('.gen-template-suggestions-label').textContent).to.equal('Try an example');
  });

  it('uses the trailing first-row link as the destination, not as body copy', async () => {
    const block = await prepareBlock();
    const text = block.querySelector('.gen-template-text');

    expect(text.querySelector('a')).to.be.null;
    expect(text.querySelectorAll(':scope > p')).to.have.length(1);
    expect(block.querySelector('.gen-template-prompt-submit').textContent).to.equal('Generate');
  });

  it('does not route without an authored destination', async () => {
    document.body.innerHTML = fixture;
    const block = document.querySelector('.gen-template-marquee');
    block.querySelector('a').closest('p').remove();
    await decorate(block);

    expect(block.querySelector('.gen-template-prompt-form').dataset.href).to.be.undefined;
    expect(block.querySelector('.gen-template-text > p').textContent)
      .to.equal('Create a fully editable template from a single prompt in minutes.');
  });

  it('grows and shrinks the prompt to fit its lines', async () => {
    const block = await prepareBlock();
    const input = block.querySelector('.gen-template-prompt-input');
    const initialHeight = parseFloat(input.style.height);

    input.value = 'First line\nSecond line\nThird line\nFourth line';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const expandedHeight = parseFloat(input.style.height);

    input.value = 'One line';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(expandedHeight).to.be.greaterThan(initialHeight);
    expect(parseFloat(input.style.height)).to.be.lessThan(expandedHeight);
  });

  it('splits the authored comma-separated suggestion row', async () => {
    const block = await prepareBlock();
    const suggestions = block.querySelectorAll('.gen-template-suggestion');
    const input = block.querySelector('.gen-template-prompt-input');

    expect(suggestions).to.have.length(4);
    suggestions[0].click();
    expect(input.value).to.equal('Dog trainer advertisement');
    expect(document.activeElement).to.equal(input);
  });

  it('loads and distributes 14 templates from the authored TAAS query', async () => {
    const block = await prepareBlock();
    const requestUrl = new URL(fetchedUrl);

    expect(requestUrl.searchParams.get('limit')).to.equal('23');
    expect(requestUrl.searchParams.get('collectionId'))
      .to.equal('urn:aaid:sc:VA6C2:25a82757-01de-4dd9-b0ee-bde51dd3b418');
    expect(requestUrl.searchParams.getAll('filters')).to.include('pages.task.name==resume');
    expect(block.querySelectorAll('.gen-template-column')).to.have.length(5);
    expect(block.querySelectorAll('.gen-template-card')).to.have.length(14);
    expect(block.querySelectorAll('.gen-template-card img[alt=""]')).to.have.length(14);
    expect(block.querySelectorAll('.gen-template-card-square')).to.have.length(7);
    expect(block.querySelectorAll('.gen-template-card-portrait')).to.have.length(7);
  });

  it('loads templates from an authored collection ID', async () => {
    const collectionId = 'urn:aaid:sc:VA6C2:custom-template-collection';
    const block = await prepareBlock({}, collectionId);
    const requestUrl = new URL(fetchedUrl);

    expect(requestUrl.searchParams.get('collectionId')).to.equal(collectionId);
    expect(requestUrl.searchParams.get('limit')).to.equal('23');
    expect(block.querySelectorAll('.gen-template-card')).to.have.length(14);
  });

  it('keeps an empty submission on the page and focuses the prompt', async () => {
    const block = await prepareBlock();
    const form = block.querySelector('.gen-template-prompt-form');
    const input = block.querySelector('.gen-template-prompt-input');

    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));

    expect(document.activeElement).to.equal(input);
  });

  it('preserves reserved characters in the routed prompt', async () => {
    const block = await prepareBlock();
    const form = block.querySelector('.gen-template-prompt-form');
    const input = block.querySelector('.gen-template-prompt-input');
    const originalLocationAssign = window.t_locationAssign;
    const originalTrackingAppender = window.t_getTrackingAppendedURL;
    window.t_getTrackingAppendedURL = (url) => Promise.resolve(url);

    const redirectPromise = new Promise((resolve) => {
      window.t_locationAssign = resolve;
    });
    input.value = 'A + B & #1';
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    const routedUrl = new URL(await redirectPromise);

    window.t_locationAssign = originalLocationAssign;
    window.t_getTrackingAppendedURL = originalTrackingAppender;
    expect(routedUrl.pathname).to.equal('/neural-pixel-editor');
    expect(routedUrl.searchParams.get('entry')).to.equal('create-menu');
    expect(routedUrl.searchParams.get('prompt')).to.equal('A + B & #1');
  });

  it('hardcoded-templates builds columns from authored images without fetching', async () => {
    document.body.innerHTML = fixture;
    const block = document.querySelector('.gen-template-marquee');
    block.classList.add('hardcoded-templates');
    const img = (w, h) => `<picture><img src="/a-${w}x${h}.png" width="${w}" height="${h}"></picture>`;
    block.children[2].innerHTML = [
      `<div>${img(1024, 1536)}${img(4096, 4096)}</div>`,
      `<div>${img(1024, 1536)}</div>`,
      `<div>${img(4096, 4096)}${img(1024, 1536)}</div>`,
      '<div></div>',
      `<div>${img(1024, 1536)}</div>`,
    ].join('');
    await decorate(block);

    expect(fetchedUrl).to.equal('');
    const columns = [...block.querySelectorAll('.gen-template-column')];
    expect(columns.map((c) => c.children.length)).to.deep.equal([2, 1, 2, 1]);
    const cards = [...block.querySelectorAll('.gen-template-card')];
    expect(cards.every((card) => card.classList.contains('gen-template-card-authored'))).to.be.true;
    expect(block.querySelector('.gen-template-card-portrait, .gen-template-card-square')).to.be.null;
    const lcp = columns[2].querySelector('img');
    expect(lcp.loading).to.equal('eager');
    expect(lcp.getAttribute('src')).to.equal('/a-4096x4096.png');
  });
});
