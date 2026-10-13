/* eslint-env mocha */
import { readFile, sendMouse, setViewport } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../express/code/scripts/utils.js';
import { taggedImage } from './mocks/image-fixtures.js';

setLibs('/test/mocks/libs', { hostname: 'example.com', search: '' });
const { default: decorate } = await import('../../../express/code/blocks/color-image-contrast-checker/color-image-contrast-checker.js');
const { default: headline } = await import('../../../express/code/blocks/color-headline/color-headline.js');
const { createUploadDropzone } = await import('../../../express/code/scripts/color-shared/components/image-upload/image-upload.js');
const { default: attachDrag } = await import('../../../express/code/scripts/color-shared/components/image-upload/attachImageDragHandlers.js');
const { default: loadStrings, PLACEHOLDER_KEY_MAP, loadColorImageContrastUploadPlaceholders } = await import('../../../express/code/scripts/color-shared/i18n/loadColorImageContrastCheckerPlaceholders.js');
const { default: loadUploadStrings, DEFAULT_PLACEHOLDERS: UPLOAD_DEFAULTS } = await import('../../../express/code/scripts/color-shared/i18n/loadImageUploadPlaceholders.js');
const { default: parseContent } = await import('../../../express/code/blocks/color-image-contrast-checker/content.js');
const fixture = await readFile({ path: './mocks/default.html' });
const placeholders = JSON.parse(await readFile({ path: './mocks/placeholders.json' }));
let block;
const metadata = [];

function authorMetadata(values) {
  Object.entries(values).forEach(([name, content]) => {
    const meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    document.head.append(meta);
    metadata.push(meta);
  });
}

async function waitFor(condition) {
  for (let i = 0; i < 300; i += 1) {
    if (condition()) return;
    await new Promise((resolve) => { setTimeout(resolve, 10); });
  }
  throw new Error('Timed out waiting for checker');
}

function mount() {
  const documentFixture = new DOMParser().parseFromString(fixture, 'text/html');
  const nodes = [...documentFixture.body.childNodes].map((node) => node.cloneNode(true));
  document.body.replaceChildren(...nodes);
  block = document.querySelector('.color-image-contrast-checker');
  return block;
}

async function setup(prepare) {
  mount();
  prepare?.(block);
  await headline(document.querySelector('.color-headline'));
  await decorate(block);
  expect(block.dataset.blockStatus).to.equal('loaded');
}

function authorSamples(checker, markup) {
  const row = new DOMParser().parseFromString(
    `<div><div>samples</div><div>${markup}</div></div>`,
    'text/html',
  ).body.firstElementChild;
  checker.append(row);
}

async function imageFile() {
  const canvas = document.createElement('canvas');
  canvas.width = 13;
  canvas.height = 9;
  const context = canvas.getContext('2d');
  context.fillRect(0, 0, 13, 9);
  context.fillStyle = 'white';
  context.fillRect(3, 0, 4, 9);
  const blob = await new Promise((resolve) => { canvas.toBlob(resolve, 'image/png'); });
  return new File([blob], 'authored-test.png', { type: 'image/png' });
}

async function upload(file = null) {
  const input = block.querySelector('input[type="file"]');
  Object.defineProperty(input, 'files', { value: [file || await imageFile()], configurable: true });
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await waitFor(() => block.classList.contains('has-image') && block.getAttribute('aria-busy') === 'false');
}

function chooseSpace(space) {
  block.querySelector('.color-dropdown-trigger').click();
  block.querySelector(`.color-dropdown-option[data-value="${space}"]`).click();
}

describe('Color Image Contrast Checker placeholders and composition', () => {
  before(async () => {
    await Promise.all([
      '/express/code/styles/styles.css',
      '/express/code/scripts/color-shared/components/image-upload/image-upload.css',
      '/express/code/scripts/color-shared/components/image-extract/buildExtractOverlays.css',
      '/express/code/blocks/color-image-contrast-checker/color-image-contrast-checker.css',
    ].map((href) => new Promise((resolve) => {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = href;
      style.addEventListener('load', resolve, { once: true });
      document.head.append(style);
    })));
    document.body.style.margin = '0';
  });

  beforeEach(() => {
    window.placeholders = { ...placeholders };
  });

  afterEach(() => {
    block?.dispatchEvent(new Event('color-image-contrast-checker:destroy'));
    metadata.splice(0).forEach((meta) => meta.remove());
    sinon.restore();
  });

  describe('Extract upload section height contract', () => {
    const styles = [];
    let viewport;

    beforeEach(async () => {
      viewport = { width: window.innerWidth, height: window.innerHeight };
      await Promise.all([
        '/express/code/blocks/color-headline/color-headline.css',
        '/express/code/blocks/color-extract/color-extract.css',
      ].map((href) => new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = reject;
        styles.push(link);
        document.head.append(link);
      })));
    });

    afterEach(async () => {
      styles.splice(0).forEach((style) => style.remove());
      await setViewport(viewport);
    });

    function samplesMarkup() {
      return Array.from({ length: 4 }, (_, index) => (
        `<picture><img alt="Sample ${index}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='5' height='7'/%3E"></picture>`
      )).join('');
    }

    async function extractOracle() {
      const oracle = new DOMParser().parseFromString(
        '<div class="section"><div class="color-extract"><div class="color-extract-inner">'
        + '<div class="color-extract-landing"><div class="color-extract-landing-content">'
        + '</div></div></div></div></div>',
        'text/html',
      ).body.firstElementChild;
      const heading = document.querySelector('.color-headline').cloneNode(true);
      heading.classList.remove('color-image-contrast');
      oracle.prepend(heading);
      const { container } = createUploadDropzone();
      oracle.querySelector('.color-extract-landing-content').append(container);
      document.querySelector('main').append(oracle);
      await headline(heading);
      return oracle;
    }

    function expectCentered(section, wrapper) {
      const bounds = section.getBoundingClientRect();
      const content = wrapper.getBoundingClientRect();
      expect(content.top - bounds.top).to.be.closeTo(bounds.bottom - content.bottom, 0.5);
      expect(getComputedStyle(section).alignItems).to.equal('center');
    }

    function expectContained(section) {
      const bounds = section.getBoundingClientRect();
      expect(section.scrollHeight).to.be.at.most(section.clientHeight + 1);
      expect(section.scrollWidth).to.be.at.most(section.clientWidth + 1);
      section.querySelectorAll('.color-headline h1, .color-headline p, .icc-upload, .icc-sample')
        .forEach((element) => {
          const rect = element.getBoundingClientRect();
          expect(rect.top).to.be.at.least(bounds.top - 0.5);
          expect(rect.bottom).to.be.at.most(bounds.bottom + 0.5);
          expect(rect.left).to.be.at.least(bounds.left - 0.5);
          expect(rect.right).to.be.at.most(bounds.right + 0.5);
        });
    }

    it('matches the actual Extract CSS minimum and centering at the 600px boundary', async () => {
      await setup((checker) => authorSamples(checker, samplesMarkup()));
      const section = block.closest('.section');
      const wrapper = block.parentElement;
      const oracle = await extractOracle();
      const oracleWrapper = oracle.querySelector('.color-extract-marquee-wrapper');
      for (const width of [375, 599, 600, 768, 1440]) {
        await setViewport({ width, height: 1000 });
        const bounds = section.getBoundingClientRect();
        if (width >= 600) {
          expect(getComputedStyle(section).minHeight).to.equal(getComputedStyle(oracle).minHeight);
          expect(getComputedStyle(section).minHeight).to.equal('800px');
          expect(wrapper.getBoundingClientRect().height).to.be.lessThan(800);
          expect(oracleWrapper.getBoundingClientRect().height).to.be.lessThan(800);
          expect(bounds.height).to.equal(oracle.getBoundingClientRect().height);
          expect(bounds.height).to.equal(800);
          expectCentered(section, wrapper);
          expectCentered(oracle, oracleWrapper);
        } else {
          expect(getComputedStyle(section).minHeight).not.to.equal('800px');
          expect(bounds.height).to.be.lessThan(800);
          expect(bounds.height).to.be.closeTo(wrapper.getBoundingClientRect().height, 0.5);
        }
        expectContained(section);
        block.querySelectorAll('.icc-sample img').forEach((image) => {
          expect(image.getBoundingClientRect().height).to.be.closeTo(113.75, 0.05);
        });
      }
    });

    it('grows beyond the minimum for long localized authored headings and body copy without clipping', async () => {
      await setup((checker) => {
        authorSamples(checker, samplesMarkup());
        document.querySelector('.color-headline h1').textContent = 'Prüfen Sie die Farbkontraste Ihres Bildes. '.repeat(30);
        document.querySelector('.color-headline p').textContent = 'Téléchargez une image pour analyser les contrastes et les niveaux accessibles. '.repeat(80);
      });
      const section = block.closest('.section');
      for (const width of [375, 600, 768, 1440]) {
        await setViewport({ width, height: 1000 });
        expect(section.getBoundingClientRect().height).to.be.greaterThan(800);
        expect(getComputedStyle(section).maxHeight).to.equal('none');
        expectContained(section);
        if (width >= 600) expectCentered(section, block.parentElement);
        else expect(getComputedStyle(section).minHeight).not.to.equal('800px');
      }
    });

    it('releases the upload rule in results and closed/open dialogs, restores it on Back, and leaves Extract unchanged', async () => {
      await setup();
      const checker = block;
      const section = block.closest('.section');
      const oracle = await extractOracle();
      const oracleDropzone = oracle.querySelector('.image-upload-dropzone-container');
      const dialog = block.querySelector('dialog');
      const selector = '.section:has(.color-image-contrast-marquee-wrapper > .color-image-contrast-checker:not(.has-image, .icc-dialog))';
      const expectReleased = (extractHeight, dropzoneHeight) => {
        expect(dialog.classList.contains('has-image')).to.equal(false);
        expect(section.matches(selector)).to.equal(false);
        expect(getComputedStyle(section).minHeight).not.to.equal('800px');
        expect(getComputedStyle(section).display).not.to.equal('flex');
        expect(oracle.getBoundingClientRect().height).to.equal(extractHeight);
        expect(oracleDropzone.getBoundingClientRect().height).to.equal(dropzoneHeight);
      };
      for (const width of [768, 1440]) {
        await setViewport({ width, height: 1000 });
        const extractHeight = oracle.getBoundingClientRect().height;
        const dropzoneHeight = oracleDropzone.getBoundingClientRect().height;
        expect(section.matches(selector)).to.equal(true);
        expect(getComputedStyle(section).minHeight).to.equal('800px');
        await upload();
        expect(dialog.open).to.equal(false);
        expectReleased(extractHeight, dropzoneHeight);
        block.querySelector('[data-action="expand"]').click();
        expect(dialog.open).to.equal(true);
        expectReleased(extractHeight, dropzoneHeight);
        dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
        expect(dialog.open).to.equal(false);
        expectReleased(extractHeight, dropzoneHeight);
        block.querySelector('[data-action="expand"]').click();
        window.history.back();
        await waitFor(() => !checker.classList.contains('has-image'));
        expect(dialog.open).to.equal(false);
        expect(section.matches(selector)).to.equal(true);
        expect(getComputedStyle(section).minHeight).to.equal('800px');
        expectCentered(section, block.parentElement);
        expect(oracle.getBoundingClientRect().height).to.equal(extractHeight);
        expect(oracleDropzone.getBoundingClientRect().height).to.equal(dropzoneHeight);
      }
    });
  });

  it('uses the same shared upload placeholder keys and authored checker overrides', async () => {
    window.placeholders['color-image-upload-button'] = 'Author upload label';
    window.placeholders['color-image-contrast-checker-color-space'] = 'Author color space';
    expect((await loadUploadStrings()).uploadButtonText).to.equal('Author upload label');
    expect((await loadStrings()).colorSpace).to.equal('Author color space');
    expect(Object.keys(PLACEHOLDER_KEY_MAP)).to.have.length(45);
    await setup();
    expect(block.querySelector('.image-upload-dropzone-upload-label').textContent)
      .to.equal('Author upload label');
    expect(block.querySelector('.icc-color .icc-help').textContent).to.equal('Author color space');
    expect(block.querySelector('.express-logo')).not.to.exist;
    expect(document.querySelector('.color-image-contrast-marquee-wrapper')).to.exist;
  });

  it('uses authored Adobe RGB metadata without requiring it on existing two-space pages', async () => {
    const key = 'color-image-contrast-checker-adobe-rgb';
    delete window.placeholders[key];
    expect((await loadStrings()).adobeRgb).to.equal(undefined);
    await setup();
    expect(block.querySelectorAll('.color-dropdown-option')).to.have.length(2);
    expect(block.querySelector('[data-value="display-p3"]').textContent).to.equal('Display P3');
    block.dispatchEvent(new Event('color-image-contrast-checker:destroy'));
    authorMetadata({ [key]: 'Authored Adobe RGB label' });
    expect((await loadStrings()).adobeRgb).to.equal('Authored Adobe RGB label');
    await setup();
    expect(block.querySelector('[data-value="adobe-rgb"]').textContent)
      .to.equal('Authored Adobe RGB label');
    window.placeholders[key] = 42;
    let error;
    try {
      await loadStrings();
    } catch (failure) {
      error = failure;
    }
    expect(error.message).to.include(key);
  });

  it('rejects Adobe RGB replacement explicitly when its authored label is missing', async () => {
    delete window.placeholders['color-image-contrast-checker-adobe-rgb'];
    await setup();
    await upload();
    const original = block.querySelector('.icc-frame img').src;
    const revoke = sinon.spy(URL, 'revokeObjectURL');
    const file = await imageFile();
    const input = block.querySelector('input[type="file"]');
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [new File([await taggedImage(file)], 'adobe.png', { type: file.type })],
    });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await waitFor(() => block.getAttribute('aria-busy') === 'false');
    expect(block.querySelector('.icc-frame img').src).to.equal(original);
    expect(block.querySelector('.color-dropdown-trigger').value).to.equal('srgb');
    expect(block.querySelector('[data-action="save"]').disabled).to.equal(false);
    expect(revoke.callCount).to.equal(2);
    await waitFor(() => document.querySelector('sp-toast[variant="negative"]'));
    expect(document.querySelector('sp-toast[variant="negative"]').textContent)
      .to.equal(placeholders['color-image-upload-error']);
  });

  it('automatically selects Adobe RGB for a tagged upload, resets for untagged input, and cleans up both URLs', async () => {
    await setup();
    const file = await imageFile();
    const revoke = sinon.spy(URL, 'revokeObjectURL');
    await upload(new File([await taggedImage(file)], 'adobe.png', { type: file.type }));
    expect(block.querySelector('.color-dropdown-trigger').value).to.equal('adobe-rgb');
    expect(block.querySelector('[data-action="save"]').disabled).to.equal(false);
    expect([block.querySelector('canvas').width, block.querySelector('canvas').height])
      .to.deep.equal([13, 9]);
    await upload(file);
    expect(block.querySelector('.color-dropdown-trigger').value).to.equal('srgb');
    expect(revoke.callCount).to.equal(2);
    await upload(new File([await taggedImage(file)], 'adobe.png', { type: file.type }));
    expect(revoke.callCount).to.equal(3);
    block.dispatchEvent(new Event('color-image-contrast-checker:destroy'));
    expect(revoke.callCount).to.equal(5);
  });

  it('shows the Extract checkerboard only on hover without changing shared consumers', async () => {
    await sendMouse({ type: 'move', position: [0, 0] });
    await setup();
    const container = block.querySelector('.image-upload-dropzone-container');
    const pattern = getComputedStyle(container, '::before');
    expect(pattern.content).to.equal('""');
    expect(pattern.backgroundImage.match(/linear-gradient/g)).to.have.length(4);
    expect(pattern.backgroundImage).to.include('rgb(204, 204, 204)');
    expect(pattern.backgroundSize).to.equal('20px 20px, 20px 20px, 20px 20px, 20px 20px');
    expect(pattern.backgroundPosition).to.equal('0px 0px, 0px 10px, 10px -10px, -10px 0px');
    expect(pattern.opacity).to.equal('0');
    expect(pattern.pointerEvents).to.equal('none');
    expect(pattern.zIndex).to.equal('0');
    expect(pattern.borderRadius).to.equal(getComputedStyle(container).borderRadius);
    expect(getComputedStyle(container.querySelector('.image-upload-dropzone')).zIndex).to.equal('1');
    container.classList.add('highlight', 'is-loading');
    expect(getComputedStyle(container, '::before').backgroundImage).to.equal(pattern.backgroundImage);
    expect(getComputedStyle(container, '::before').opacity).to.equal('0');
    container.classList.remove('highlight', 'is-loading');
    container.querySelector('.image-upload-dropzone').focus();
    expect(getComputedStyle(container, '::before').opacity).to.equal('0');
    container.scrollIntoView();
    const bounds = container.getBoundingClientRect();
    await sendMouse({ type: 'move', position: [Math.round(bounds.x + 10), Math.round(bounds.y + 10)] });
    expect(getComputedStyle(container, '::before').opacity).to.equal('0.15');
    container.classList.add('is-disabled');
    expect(getComputedStyle(container, '::before').opacity).to.equal('0');
    container.classList.remove('is-disabled');
    await sendMouse({ type: 'move', position: [0, 0] });
    expect(getComputedStyle(container, '::before').opacity).to.equal('0');
    const plainUpload = createUploadDropzone();
    document.body.append(plainUpload.container);
    expect(getComputedStyle(plainUpload.container, '::before').content).to.equal('none');
    plainUpload.container.remove();
  });

  it('keeps the upload focus ring concentric with the resting corners across viewports', async () => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    try {
      await setup();
      const container = block.querySelector('.image-upload-dropzone-container');
      const dropzone = container.querySelector('.image-upload-dropzone');
      for (const width of [375, 768, 1440]) {
        await setViewport({ width, height: 1000 });
        dropzone.blur();
        expect(getComputedStyle(container).borderRadius).to.equal('16px');
        expect(getComputedStyle(container, '::after').opacity).to.equal('0');
        dropzone.focus();
        const ring = getComputedStyle(container, '::after');
        expect(ring.opacity).to.equal('1');
        expect(ring.borderRadius).to.equal('20px');
        expect(parseFloat(ring.borderRadius) + parseFloat(ring.top))
          .to.equal(parseFloat(getComputedStyle(container).borderRadius));
        expect(getComputedStyle(dropzone).borderRadius).to.equal('16px');
        expect(getComputedStyle(container, '::before').borderRadius).to.equal('16px');
      }
      const plainUpload = createUploadDropzone();
      document.body.append(plainUpload.container);
      expect(getComputedStyle(plainUpload.container, '::after').borderRadius).to.equal('10px');
      plainUpload.container.remove();
    } finally {
      await setViewport(viewport);
    }
  });

  it('requires placeholders and rejects the earlier UI-string table contract', async () => {
    delete window.placeholders['color-image-contrast-checker-color-space'];
    let error;
    try {
      await loadStrings();
    } catch (failure) {
      error = failure;
    }
    expect(error.message).to.include('color-image-contrast-checker-color-space');
    mount();
    const row = document.createElement('div');
    const key = document.createElement('div');
    const value = document.createElement('div');
    key.textContent = 'save-png';
    value.textContent = 'Not a supported UI-row override';
    row.append(key, value);
    block.append(row);
    expect(() => parseContent(block)).to.throw('Invalid image contrast content row');
  });

  it('requires actual heading semantics, not bold text masquerading as a heading', () => {
    mount();
    document.querySelector('.color-headline h1').replaceWith(document.createElement('strong'));
    expect(() => parseContent(block)).to.throw('Color Headline');
  });

  it('initializes from metadata alone without an external placeholder bundle', async () => {
    window.placeholders = {};
    authorMetadata(placeholders);
    await setup();
    expect(block.querySelector('.image-upload-dropzone-upload-label').textContent)
      .to.equal(placeholders['color-image-upload-button']);
    await upload();
    expect([block.querySelector('canvas').width, block.querySelector('canvas').height])
      .to.deep.equal([13, 9]);
  });

  it('uses external values first and metadata only for missing keys', async () => {
    authorMetadata({
      'color-image-contrast-checker-color-space': 'Metadata space label',
      'color-image-contrast-checker-save-png': 'Metadata save label',
      'color-image-upload-button': 'Metadata upload label',
    });
    delete window.placeholders['color-image-contrast-checker-save-png'];
    expect((await loadStrings()).colorSpace).to.equal('Color space');
    expect((await loadStrings()).savePng).to.equal('Metadata save label');
    window.placeholders['color-image-contrast-checker-color-space'] = '   ';
    expect((await loadStrings()).colorSpace).to.equal('Metadata space label');
    expect((await loadColorImageContrastUploadPlaceholders()).uploadButtonText)
      .to.equal('Upload your image');
    delete window.placeholders['color-image-upload-button'];
    expect((await loadColorImageContrastUploadPlaceholders()).uploadButtonText)
      .to.equal('Metadata upload label');
    expect((await loadUploadStrings()).uploadButtonText).to.equal('Upload your image');
  });

  it('rejects blank and unresolved metadata values instead of exposing keys as text', async () => {
    const key = 'color-image-contrast-checker-color-space';
    delete window.placeholders[key];
    for (const content of ['   ', key, key.replaceAll('-', ' ')]) {
      authorMetadata({ [key]: content });
      let failure;
      try {
        await loadStrings();
      } catch (error) {
        failure = error;
      }
      expect(failure.message).to.include(key);
      metadata.splice(0).forEach((meta) => meta.remove());
    }
  });

  it('retains shared upload defaults when external and metadata values do not resolve', async () => {
    const key = 'color-image-upload-button';
    for (const external of ['   ', key, key.replaceAll('-', ' ')]) {
      window.placeholders = { [key]: external };
      for (const content of [undefined, '   ', key, key.replaceAll('-', ' ')]) {
        if (content !== undefined) authorMetadata({ [key]: content });
        expect(await loadColorImageContrastUploadPlaceholders()).to.deep.equal(UPLOAD_DEFAULTS);
        metadata.splice(0).forEach((meta) => meta.remove());
      }
    }
  });

  it('falls back to valid upload metadata without changing the legacy loader', async () => {
    const key = 'color-image-upload-button';
    authorMetadata({ [key]: 'Metadata upload label' });
    for (const external of ['   ', key, key.replaceAll('-', ' ')]) {
      window.placeholders = { [key]: external };
      expect((await loadColorImageContrastUploadPlaceholders()).uploadButtonText)
        .to.equal('Metadata upload label');
      expect((await loadUploadStrings()).uploadButtonText)
        .to.equal(external === '   ' ? external : UPLOAD_DEFAULTS.uploadButtonText);
    }
    window.placeholders = { [key]: 'External upload label' };
    expect((await loadColorImageContrastUploadPlaceholders()).uploadButtonText)
      .to.equal('External upload label');
  });

  it('preserves invalid nonstring external values rather than hiding them with metadata', async () => {
    const checkerKey = 'color-image-contrast-checker-color-space';
    const uploadKey = 'color-image-upload-button';
    window.placeholders = { ...placeholders, [checkerKey]: 42, [uploadKey]: 42 };
    authorMetadata({
      [checkerKey]: 'Metadata space label',
      [uploadKey]: 'Metadata upload label',
    });
    let failure;
    try {
      await loadStrings();
    } catch (error) {
      failure = error;
    }
    expect(failure.message).to.include(checkerKey);
    expect((await loadColorImageContrastUploadPlaceholders()).uploadButtonText).to.equal(42);
  });

  it('reports placeholder provider failure instead of returning raw keys or default UI text', async () => {
    Object.defineProperty(window.placeholders, 'color-image-contrast-checker-color-space', {
      get() { throw new Error('Simulated placeholder provider failure'); },
    });
    let failure;
    try {
      await loadStrings();
    } catch (error) {
      failure = error;
    }
    expect(failure.message).to.include('Missing image contrast placeholders');
    expect(failure.message).to.include('color-image-contrast-checker-color-space');
  });

  it('omits displayed dimensions in normal and expanded views even with legacy metadata', async () => {
    window.placeholders['color-image-contrast-checker-dimensions'] = 'Hauteur={height}; largeur={width}';
    await setup();
    await upload();
    expect(block.querySelector('.icc-dimensions')).not.to.exist;
    expect(block.textContent).not.to.include('Hauteur=');
    expect([block.querySelector('canvas').width, block.querySelector('canvas').height])
      .to.deep.equal([13, 9]);
    block.querySelector('[data-action="expand"]').click();
    expect(block.querySelector('dialog').open).to.equal(true);
    expect(block.querySelector('dialog .icc-dimensions')).not.to.exist;
    expect(block.querySelector('dialog').textContent).not.to.include('Hauteur=');
  });

  it('preserves legacy Color Headline extract and tools composition', async () => {
    mount();
    const heading = document.querySelector('.color-headline');
    heading.classList.remove('color-image-contrast');
    const extract = document.createElement('div');
    extract.className = 'color-extract';
    block.after(extract);
    await headline(heading);
    expect(heading.closest('.color-extract-marquee-wrapper')).to.exist;
    expect(extract.parentElement).to.equal(heading.parentElement);
    expect(block.closest('.color-extract-marquee-wrapper')).not.to.exist;
    mount();
    const tools = document.querySelector('.color-headline');
    tools.className = 'color-headline tools';
    await headline(tools);
    expect(tools.querySelector('.express-logo')).to.exist;
    expect(tools.closest('.color-image-contrast-marquee-wrapper')).not.to.exist;
  });

  it('keeps the desktop background static and centered with an Extract-style bottom fade, hidden below and in results', async () => {
    const { innerWidth: width, innerHeight: height } = window;
    try {
      await setup((checker) => {
        const row = new DOMParser().parseFromString(
          '<div><div>background</div><div><picture><img alt=""></picture></div></div>',
          'text/html',
        ).body.firstElementChild;
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="800"></svg>';
        row.querySelector('img').src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
        checker.append(row);
      });
      const background = document.querySelector('.color-image-contrast-checker-background');
      const image = background.querySelector('img');
      await image.decode();
      for (const viewportWidth of [375, 899, 900, 1199, 1200, 1440, 1920, 2560]) {
        await setViewport({ width: viewportWidth, height: 900 });
        expect(getComputedStyle(background).display, `background at ${viewportWidth}px`)
          .to.equal(viewportWidth < 1200 ? 'none' : 'block');
        if (viewportWidth >= 1200) {
          const fade = getComputedStyle(background, '::after');
          expect(fade.content).to.equal('""');
          expect(fade.blockSize).to.equal('143px');
          expect(fade.insetBlockEnd).to.equal('0px');
          expect(fade.insetInlineStart).to.equal('0px');
          expect(fade.insetInlineEnd).to.equal('0px');
          expect(fade.backgroundImage)
            .to.equal('linear-gradient(rgba(255, 255, 255, 0) 0%, rgb(255, 255, 255) 80.29%)');
          expect(fade.pointerEvents).to.equal('none');
          expect(fade.zIndex).to.equal('1');
          const imageRect = image.getBoundingClientRect();
          const backgroundRect = background.getBoundingClientRect();
          expect(imageRect.width, `image width at ${viewportWidth}px`).to.equal(2000);
          expect(imageRect.height, `image height at ${viewportWidth}px`).to.equal(800);
          expect(imageRect.left + imageRect.width / 2)
            .to.be.closeTo(backgroundRect.left + backgroundRect.width / 2, 0.5);
          expect(imageRect.top).to.equal(backgroundRect.top);
          expect(getComputedStyle(image).maxInlineSize).to.equal('none');
        }
      }
      await upload();
      expect(background.hidden).to.equal(true);
      expect(getComputedStyle(background).display).to.equal('none');
    } finally {
      await setViewport({ width, height });
    }
  });

  it('loads native pixels and hides only its headline without displaying dimensions', async () => {
    await setup();
    await upload();
    expect(document.querySelector('.color-headline').hidden).to.equal(true);
    expect(block.querySelector('.icc-dimensions')).not.to.exist;
    expect(block.querySelector('canvas').width).to.equal(13);
    expect(block.querySelector('canvas').height).to.equal(9);
    expect(block.querySelector('[data-action="save"]').disabled).to.equal(false);
  });

  it('paints the upload interstitial before reading and analyzing even a small original file', async () => {
    await setup();
    const file = await imageFile();
    const read = file.arrayBuffer.bind(file);
    const overlay = document.querySelector('.icc-overlay.color-extract-loading-overlay');
    let frames = 0;
    let frame;
    let state;
    const countFrames = () => {
      frames += 1;
      frame = requestAnimationFrame(countFrames);
    };
    frame = requestAnimationFrame(countFrames);
    sinon.stub(file, 'arrayBuffer').callsFake(() => {
      state = {
        frames,
        opacity: getComputedStyle(overlay).opacity,
        label: overlay.querySelector('.color-extract-loading-label').textContent,
      };
      return read();
    });
    try {
      await upload(file);
      expect(state.frames).to.be.at.least(2);
      expect(state.opacity).to.equal('1');
      expect(state.label).to.equal(placeholders['color-image-contrast-checker-analyzing-image']);
      expect(getComputedStyle(overlay).opacity).to.equal('0');
      expect(getComputedStyle(overlay).pointerEvents).to.equal('none');
    } finally {
      cancelAnimationFrame(frame);
    }
  });

  it('keeps a pending replacement interstitial above the modal and restores it on close', async () => {
    await setup();
    await upload();
    block.querySelector('[data-action="expand"]').click();
    const dialog = block.querySelector('dialog');
    const file = await imageFile();
    const bytes = await file.arrayBuffer();
    let finish;
    const read = sinon.stub(file, 'arrayBuffer').returns(new Promise((resolve) => { finish = resolve; }));
    const input = block.querySelector('input[type="file"]');
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await waitFor(() => read.called);
    const overlay = document.querySelector('.icc-overlay.color-extract-loading-overlay');
    expect(dialog.contains(overlay)).to.equal(true);
    expect(getComputedStyle(overlay).opacity).to.equal('1');
    expect(document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
      .closest('.color-extract-loading-overlay')).to.equal(overlay);
    expect(block.querySelector('[data-action="save"]').disabled).to.equal(true);
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(dialog.open).to.equal(false);
    expect(overlay.parentElement).to.equal(document.body);
    expect(getComputedStyle(overlay).opacity).to.equal('1');
    finish(bytes);
    await waitFor(() => block.getAttribute('aria-busy') === 'false');
    expect(getComputedStyle(overlay).opacity).to.equal('0');
    expect(block.querySelector('[data-action="save"]').disabled).to.equal(false);
  });

  it('keeps keyboard focus inside the modal when loading disables Save or the color selector', async () => {
    await setup();
    const file = await imageFile();
    await upload(file);
    block.querySelector('[data-action="expand"]').click();
    const checker = block;
    for (const control of [block.querySelector('[data-action="save"]'), block.querySelector('.color-dropdown-trigger')]) {
      control.focus();
      const input = block.querySelector('input[type="file"]');
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change', { bubbles: true }));
      expect(document.activeElement).to.equal(block.querySelector('.icc-comparison'));
      expect(block.querySelector('dialog').open).to.equal(true);
      await waitFor(() => checker.getAttribute('aria-busy') === 'false');
      expect(block.querySelector('dialog').contains(document.activeElement)).to.equal(true);
    }
    const dialog = block.querySelector('dialog');
    block.dispatchEvent(new Event('color-image-contrast-checker:destroy'));
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    expect(dialog.isConnected).to.equal(false);
    expect(document.querySelector('.icc-overlay')).not.to.exist;
  });

  it('does not start reading a superseded upload before the interstitial paints', async () => {
    await setup();
    const first = await imageFile();
    const second = await imageFile();
    const read = sinon.spy(first, 'arrayBuffer');
    const ready = sinon.spy();
    block.addEventListener('color-image-contrast-checker:ready', ready);
    const input = block.querySelector('input[type="file"]');
    for (const file of [first, second]) {
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    await waitFor(() => block.classList.contains('has-image') && block.getAttribute('aria-busy') === 'false');
    expect(read.called).to.equal(false);
    expect(ready.callCount).to.equal(1);
    expect(document.querySelector('.icc-overlay.color-extract-loading-overlay')
      .classList.contains('is-loading')).to.equal(false);
  });

  it('keeps the interstitial visible for the current sample and clears it on failure', async () => {
    await setup((checker) => {
      authorSamples(checker, `
        <a href="/mock/sample-a.png"><picture><img alt="A"></picture></a>
        <a href="/mock/sample-b.png"><picture><img alt="B"></picture></a>
      `);
    });
    const file = await imageFile();
    const fetchSample = sinon.stub(window, 'fetch');
    let releaseFirst;
    let releaseSecond;
    fetchSample.onCall(0).returns(new Promise((resolve) => { releaseFirst = resolve; }));
    fetchSample.onCall(1).returns(new Promise((resolve) => { releaseSecond = resolve; }));
    const samples = [...block.querySelectorAll('.icc-sample')];
    const overlay = document.querySelector('.icc-overlay.color-extract-loading-overlay');
    samples[0].click();
    expect(getComputedStyle(overlay).opacity).to.equal('1');
    samples[1].click();
    expect(fetchSample.firstCall.args[1].signal.aborted).to.equal(true);
    releaseFirst(new Response(file));
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    expect(block.getAttribute('aria-busy')).to.equal('true');
    expect(getComputedStyle(overlay).opacity).to.equal('1');
    releaseSecond(new Response('', { status: 500 }));
    await waitFor(() => block.getAttribute('aria-busy') === 'false');
    expect(getComputedStyle(overlay).opacity).to.equal('0');
    expect(getComputedStyle(overlay).pointerEvents).to.equal('none');
    expect(block.classList.contains('has-image')).to.equal(false);
    expect(samples.map((sample) => sample.getAttribute('aria-pressed')))
      .to.deep.equal(['false', 'false']);
  });

  it('recalculates color space without changing the original image and supports roving zoom keys', async () => {
    await setup();
    await upload();
    const original = block.querySelector('.icc-frame img').src;
    let detail;
    block.addEventListener('color-image-contrast-checker:ready', (event) => { detail = event.detail; });
    for (const space of ['display-p3', 'adobe-rgb', 'srgb']) {
      chooseSpace(space);
      expect(detail.colorSpace).to.equal(space);
      expect(block.querySelector('.icc-frame img').src).to.equal(original);
    }
    const fit = block.querySelector('[data-action="fit"]');
    const saveLabel = block.querySelector('.icc-save > span:not(.icon)');
    expect(getComputedStyle(saveLabel).fontWeight).to.equal('700');
    const fill = block.querySelector('[data-action="fill"]');
    fit.focus();
    fit.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(fill.tabIndex).to.equal(0);
    expect(fit.tabIndex).to.equal(-1);
    expect(fill.getAttribute('aria-pressed')).to.equal('true');
  });

  it('preserves DOM focus order and shows only the noninteractive mini legend in the modal', async () => {
    await setViewport({ width: 1200, height: 900 });
    await setup();
    await upload();
    const controls = () => [...block.querySelector('.icc-panel')
      .querySelectorAll('button,select,[tabindex="0"]')]
      .filter((element) => element.tabIndex >= 0 && element.getClientRects().length)
      .map((element) => element.dataset.action || element.tagName.toLowerCase());
    expect(controls().slice(0, 7)).to.deep.equal([
      'span', 'button', 'replace', 'save', 'expand', 'fit', 'div',
    ]);
    await setViewport({ width: 375, height: 800 });
    await waitFor(() => controls()[0] === 'replace');
    expect(controls().slice(0, 7)).to.deep.equal([
      'replace', 'expand', 'span', 'button', 'fit', 'div', 'save',
    ]);
    block.querySelector('[data-action="expand"]').click();
    const dialog = block.querySelector('dialog');
    expect(dialog.open).to.equal(true);
    expect(dialog.querySelector('.icc-panel').getClientRects()).to.have.length(1);
    expect(dialog.querySelector('.icc-legend').getClientRects()).to.have.length(0);
    expect(dialog.querySelector('.icc-legend-mini').getClientRects()).to.have.length(1);
    expect(dialog.querySelector('.icc-legend-mini').querySelectorAll('button,[tabindex]'))
      .to.have.length(0);
    expect(controls()).to.deep.equal([
      'replace', 'expand', 'span', 'button', 'fit', 'div', 'save',
    ]);
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(dialog.open).to.equal(false);
    expect(document.activeElement.dataset.action).to.equal('expand');
    expect(block.querySelector('.icc-legend-mini').getClientRects()).to.have.length(0);
    expect(block.querySelector('.icc-legend').getClientRects()).to.have.length(1);
  });

  it('uses plain color-space text with an accessible tooltip instead of a button', async () => {
    await setup();
    await upload();
    const text = block.querySelector('.icc-color .icc-help');
    const select = block.querySelector('.color-dropdown-trigger');
    expect(text.tagName).to.equal('SPAN');
    expect(text.matches('button, [role="button"]')).to.equal(false);
    expect(text.classList.contains('color-action-button')).to.equal(false);
    expect(text.textContent).to.equal(placeholders['color-image-contrast-checker-color-space']);
    expect(text.tabIndex).to.equal(0);
    expect(select.getAttribute('aria-labelledby')).to.equal(text.id);
    const tooltip = document.getElementById(text.getAttribute('aria-describedby'));
    expect(tooltip.tagName).to.equal('SP-TOOLTIP');
    expect(tooltip.textContent)
      .to.equal(placeholders['color-image-contrast-checker-color-space-help']);
    block.querySelector('[data-action="expand"]').click();
    expect(block.querySelector('dialog .icc-color .icc-help')).to.equal(text);
    expect(select.getAttribute('aria-labelledby')).to.equal(text.id);
    block.querySelector('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
  });

  it('closes the dropdown before the expanded dialog on Escape and preserves keyboard selection', async () => {
    await setup();
    await upload();
    block.querySelector('[data-action="expand"]').click();
    const dialog = block.querySelector('dialog');
    const trigger = block.querySelector('.color-dropdown-trigger');
    const menu = block.querySelector('.color-dropdown-popover');
    const options = [...menu.querySelectorAll('[role="option"]')];
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(menu.hidden).to.equal(false);
    expect(document.activeElement).to.equal(options[0]);
    options[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).to.equal(options.at(-1));
    options.at(-1).dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape', bubbles: true, cancelable: true,
    }));
    expect(menu.hidden).to.equal(true);
    expect(dialog.open).to.equal(true);
    expect(document.activeElement).to.equal(trigger);
    chooseSpace('display-p3');
    expect(trigger.value).to.equal('display-p3');
    expect(document.activeElement).to.equal(trigger);
    trigger.click();
    const selected = menu.querySelector('[aria-selected="true"]');
    expect(document.activeElement).to.equal(selected);
    selected.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(menu.hidden).to.equal(true);
    expect(document.activeElement).to.equal(trigger);
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(dialog.open).to.equal(false);
    expect(trigger.value).to.equal('display-p3');
  });

  it('closes and disables an open dropdown during modal replacement and releases it on teardown', async () => {
    await setup();
    await upload();
    block.querySelector('[data-action="expand"]').click();
    const trigger = block.querySelector('.color-dropdown-trigger');
    const menu = block.querySelector('.color-dropdown-popover');
    trigger.click();
    const selected = menu.querySelector('[aria-selected="true"]');
    expect(document.activeElement).to.equal(selected);
    const input = block.querySelector('input[type="file"]');
    Object.defineProperty(input, 'files', { value: [await imageFile()], configurable: true });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(trigger.disabled).to.equal(true);
    expect(menu.hidden).to.equal(true);
    expect(document.activeElement).to.equal(block.querySelector('.icc-comparison'));
    expect([...menu.children].every((option) => option.disabled)).to.equal(true);
    await waitFor(() => block.getAttribute('aria-busy') === 'false');
    expect(trigger.disabled).to.equal(false);
    trigger.click();
    block.dispatchEvent(new Event('color-image-contrast-checker:destroy'));
    trigger.click();
    expect(menu.hidden).to.equal(true);
    expect(document.querySelector('dialog[open]')).not.to.exist;
  });

  it('matches the continuous surface and floating view controls across responsive boundaries', async () => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    try {
      await setup();
      await upload();
      for (const width of [320, 375, 599, 600, 699, 700, 768, 899, 900, 1199, 1200, 1440]) {
        await setViewport({ width, height: 1000 });
        const footer = block.querySelector('.icc-footer');
        await waitFor(() => footer.childElementCount === (width >= 700 ? 0 : 1));
        const workspace = block.querySelector('.icc-workspace');
        const surface = block.querySelector('.icc-comparison-row');
        const zoom = block.querySelector('.icc-zoom');
        const fit = block.querySelector('[data-action="fit"]');
        const surfaceBox = surface.getBoundingClientRect();
        const zoomBox = zoom.getBoundingClientRect();
        const cardStyle = getComputedStyle(workspace);
        const contentWidth = workspace.getBoundingClientRect().width
          - 2 * parseFloat(cardStyle.paddingLeft);
        expect(surfaceBox.width).to.be.closeTo(contentWidth, 0.1);
        let ratio = 311 / 200;
        if (width >= 600) ratio = 787 / 513;
        if (width >= 900) ratio = 881 / 516;
        expect(surfaceBox.height).to.be.closeTo(surfaceBox.width / ratio, 0.1);
        expect(getComputedStyle(surface).backgroundColor).to.equal('rgb(243, 243, 243)');
        expect(getComputedStyle(surface).borderRadius).to.equal(width >= 900 ? '8px' : '16px');
        expect(getComputedStyle(surface).outlineColor).to.equal('rgba(82, 88, 228, 0.1)');
        expect(getComputedStyle(surface).overflow).to.equal('visible');
        expect(cardStyle.borderTopWidth).to.equal('0px');
        expect(cardStyle.boxShadow).to.equal(
          'rgba(0, 0, 0, 0.08) 0px 0px 1px 0px, '
          + 'rgba(0, 0, 0, 0.04) 0px 1px 4px 0px, '
          + 'rgba(0, 0, 0, 0.08) 0px 2px 8px 0px',
        );
        expect(zoomBox.left - surfaceBox.left).to.equal(width >= 900 ? 16 : 10);
        expect(zoomBox.top - surfaceBox.top).to.equal(width >= 900 ? 16 : 10);
        expect(zoomBox.width).to.equal(width >= 900 ? 40 : 32);
        expect(zoomBox.height).to.equal(width >= 900 ? 68 : 60);
        expect(getComputedStyle(zoom).position).to.equal('absolute');
        expect(getComputedStyle(zoom).backgroundColor).to.equal('rgba(255, 255, 255, 0.85)');
        expect(fit.getAttribute('aria-pressed')).to.equal('true');
        expect(getComputedStyle(fit).backgroundColor).to.equal('rgb(0, 0, 0)');
        expect(getComputedStyle(fit).color).to.equal('rgb(255, 255, 255)');
        [...zoom.children].forEach((control) => {
          expect(control.getBoundingClientRect().width).to.equal(24);
          expect(control.getBoundingClientRect().height).to.equal(24);
          expect(control.querySelector('.icon').getBoundingClientRect().width).to.equal(16);
          expect(control.querySelector('use').getAttribute('href'))
            .to.include(`icons.svg#${control.dataset.action}`);
        });
        block.querySelectorAll('.icc-frame').forEach((frame) => {
          expect(getComputedStyle(frame).backgroundColor).to.equal('rgba(0, 0, 0, 0)');
          expect(getComputedStyle(frame).overflow).to.equal('auto');
        });
        expect(getComputedStyle(block.querySelector('.icc-footer')).display)
          .to.equal(width >= 700 ? 'none' : 'flex');
        if (width >= 900) {
          expect(block.querySelector('.icc-legend-full').getBoundingClientRect().top)
            .to.equal(workspace.getBoundingClientRect().top);
        }
        expect(document.documentElement.scrollWidth).to.be.at.most(width);
      }
    } finally {
      await setViewport(viewport);
    }
  });

  it('retains contain/cover scaling, view state and correct maximize/minimize icons', async () => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    try {
      await setup();
      await upload();
      const panel = block.querySelector('.icc-panel');
      const frame = block.querySelector('.icc-frame');
      const fit = block.querySelector('[data-action="fit"]');
      const fill = block.querySelector('[data-action="fill"]');
      const expand = block.querySelector('[data-action="expand"]');
      const scaleMatches = (mode) => {
        const scale = (mode === 'fit' ? Math.min : Math.max)(frame.clientWidth / 13, frame.clientHeight / 9);
        return Math.abs(parseFloat(panel.style.getPropertyValue('--icc-image-width')) - 13 * scale)
          < 0.1;
      };
      for (const width of [375, 600, 699, 700, 899, 1440]) {
        await setViewport({ width, height: 1000 });
        fit.click();
        await waitFor(() => scaleMatches('fit'));
        fill.click();
        await waitFor(() => scaleMatches('fill'));
        expect(getComputedStyle(fill).backgroundColor).to.equal('rgb(0, 0, 0)');
        expect(getComputedStyle(fill).color).to.equal('rgb(255, 255, 255)');
        expect(expand.querySelector('use').getAttribute('href')).to.include('icons.svg#expand');
        expand.click();
        await waitFor(() => scaleMatches('fill'));
        expect(expand.querySelector('use').getAttribute('href')).to.include('icons.svg#minimize');
        expect(fill.getAttribute('aria-pressed')).to.equal('true');
        expect(fill.tabIndex).to.equal(0);
        const surface = panel.querySelector('.icc-comparison-row');
        expect(getComputedStyle(surface).borderRadius).to.equal('16px');
        expect(getComputedStyle(panel.querySelector('.icc-workspace')).boxShadow).to.equal('none');
        expect(getComputedStyle(panel.querySelector('.icc-save > span:not(.icon)')).fontWeight)
          .to.equal('700');
        if (width < 700) {
          const mini = panel.querySelector('.icc-legend-mini').getBoundingClientRect();
          expect(mini.top).to.be.closeTo(surface.getBoundingClientRect().bottom + 16, 0.1);
          expect(panel.querySelector('.icc-footer').getBoundingClientRect().top)
            .to.be.closeTo(mini.bottom + 16, 0.1);
        }
        expand.click();
        await waitFor(() => scaleMatches('fill'));
        expect(expand.querySelector('use').getAttribute('href')).to.include('icons.svg#expand');
        expect(document.activeElement).to.equal(expand);
        expect(fill.getAttribute('aria-pressed')).to.equal('true');
      }
    } finally {
      await setViewport(viewport);
    }
  });

  it('avoids image pixels without a side gutter and keeps controls on top when space is too tight', async () => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    try {
      await setup();
      await upload();
      const surface = block.querySelector('.icc-comparison-row');
      const zoom = block.querySelector('.icc-zoom');
      const frame = block.querySelector('.icc-frame');
      const canvas = block.querySelector('canvas');
      const expand = block.querySelector('[data-action="expand"]');
      let reservations = 0;
      for (const width of [375, 768, 1440]) {
        await setViewport({ width, height: 1000 });
        for (const expanded of [false, true]) {
          if (expanded) expand.click();
          block.querySelector('.icc-comparison').focus();
          const style = getComputedStyle(surface);
          const expectedWidth = (surface.getBoundingClientRect().width
            - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
            - parseFloat(getComputedStyle(frame.parentElement).gap)) / 2;
          for (const mode of ['fit', 'fill']) {
            block.querySelector(`[data-action="${mode}"]`).click();
            await waitFor(() => {
              const scale = (mode === 'fit' ? Math.min : Math.max)(frame.clientWidth / canvas.width, frame.clientHeight / canvas.height);
              return Math.abs(canvas.getBoundingClientRect().width - canvas.width * scale) < 0.1;
            });
            expect(frame.getBoundingClientRect().width).to.be.closeTo(expectedWidth, 0.1);
            const toolbar = zoom.getBoundingClientRect();
            for (const pane of block.querySelectorAll('.icc-frame')) {
              const clip = pane.getBoundingClientRect();
              const image = pane.firstElementChild.getBoundingClientRect();
              const overlaps = Math.max(image.left, clip.left) < toolbar.right
                && Math.min(image.right, clip.right) > toolbar.left
                && Math.max(image.top, clip.top) < toolbar.bottom
                && Math.min(image.bottom, clip.bottom) > toolbar.top;
              expect(overlaps, `${width}px ${expanded ? 'expanded' : 'normal'} ${mode}`)
                .to.equal(false);
              expect(getComputedStyle(pane).overflow).to.equal('auto');
              if (surface.style.getPropertyValue('--icc-image-top-inset')) {
                expect(clip.top - toolbar.bottom).to.be.closeTo(8, 0.1);
                reservations += 1;
              }
            }
            if (mode === 'fit') {
              expect(surface.style.getPropertyValue('--icc-image-top-inset')).to.equal('');
            }
          }
          if (expanded) expand.click();
        }
      }
      expect(reservations).to.be.greaterThan(0);
      expect([canvas.width, canvas.height]).to.deep.equal([13, 9]);
      surface.style.blockSize = '75px';
      surface.style.aspectRatio = 'auto';
      block.querySelector('[data-action="fill"]').click();
      await waitFor(() => surface.style.getPropertyValue('--icc-image-top-inset') === '');
      expect(getComputedStyle(zoom).zIndex).to.equal('1');
      expect(getComputedStyle(frame.parentElement).zIndex).to.equal('0');
      zoom.scrollIntoView();
      const button = zoom.firstElementChild.getBoundingClientRect();
      const centerX = button.left + button.width / 2;
      const centerY = button.top + button.height / 2;
      expect(zoom.contains(document.elementFromPoint(centerX, centerY))).to.equal(true);
    } finally {
      await setViewport(viewport);
    }
  });

  it('top-aligns the legend and image card independently of long authored headings', async () => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    try {
      await setup();
      await upload();
      block.querySelector('.icc-copy :is(h1, h2)').textContent = 'Long localized heading '.repeat(12);
      for (const width of [900, 1200, 1440]) {
        await setViewport({ width, height: 1200 });
        const full = block.querySelector('.icc-legend-full');
        expect(full.getBoundingClientRect().top)
          .to.equal(block.querySelector('.icc-workspace').getBoundingClientRect().top);
        expect(getComputedStyle(full).outlineColor).to.equal('rgb(233, 233, 233)');
        expect(getComputedStyle(full).outlineWidth).to.equal('1px');
        expect(getComputedStyle(full).borderRadius).to.equal('16px');
        expect(full.getBoundingClientRect().top)
          .to.be.at.least(block.querySelector('.icc-copy').getBoundingClientRect().bottom + 24);
      }
    } finally {
      await setViewport(viewport);
    }
  });

  it('builds one full legend with accessible statuses, exact swatches and corrected thresholds', async () => {
    await setup();
    await upload();
    const full = block.querySelector('.icc-legend-full');
    const cards = [...full.querySelectorAll('.icc-legend-card')];
    expect(cards).to.have.length(3);
    expect(block.querySelector('.icc-accuracy').parentElement).to.equal(full.parentElement);
    expect(full.querySelector('.icc-accuracy')).not.to.exist;
    const colors = ['rgb(178, 255, 176)', 'rgb(0, 112, 209)', 'rgb(0, 0, 0)'];
    cards.forEach((card, index) => {
      const swatch = card.querySelector('.icc-swatch');
      const style = getComputedStyle(swatch);
      expect(swatch.getAttribute('aria-hidden')).to.equal('true');
      expect(swatch.getBoundingClientRect().width).to.equal(24);
      expect(swatch.getBoundingClientRect().height).to.equal(24);
      expect(style.borderRadius).to.equal('4px');
      expect(style.backgroundColor).to.equal(colors[index]);
      const badge = card.querySelector('.icc-badge');
      expect(badge.textContent).to.equal(['Passes', 'Partial', 'Fails'][index]);
      expect(getComputedStyle(badge).backgroundColor).to.equal('rgb(233, 233, 233)');
      expect(getComputedStyle(badge).fontSize).to.equal('12px');
      expect(getComputedStyle(badge).borderRadius).to.equal('7px');
      expect(badge.getBoundingClientRect().height).to.equal(24);
      const icon = badge.querySelector('.icon');
      expect(icon.getAttribute('aria-hidden')).to.equal('true');
      expect(icon.getBoundingClientRect().width).to.equal(16);
      expect(icon.getBoundingClientRect().height).to.equal(16);
    });
    expect(cards[0].querySelector('use').getAttribute('href')).to.include('icons.svg#passes');
    expect(cards[1].querySelector('img').src).to.include('S2_Icon_AlertTriangle_20_N.svg');
    expect(cards[2].querySelector('use').getAttribute('href')).to.include('icons.svg#fails');
    expect(cards[0].querySelectorAll('.icc-legend-labels p span')[0].textContent)
      .to.equal('≥ 4.5:1 (AAA)');
    expect(cards[0].querySelectorAll('.icc-legend-labels p span')[1].textContent)
      .to.equal('≥ 4.5:1 (AA)');
    expect(cards[1].querySelectorAll('.icc-legend-labels p span')[0].textContent)
      .to.equal('≥ 3:1 (AA)');
    expect(full.textContent).not.to.include('7:1');
    expect(block.querySelector('.icc-accuracy strong').textContent)
      .to.equal('high-resolution PNG files');
    expect(block.querySelector('.icc-accuracy > .icon').getAttribute('aria-hidden'))
      .to.equal('true');
  });

  it('formats legacy comparison operators without changing localized thresholds', async () => {
    window.placeholders['color-image-contrast-checker-green-large'] = '>= 4,5:1 (AAA), grand texte';
    window.placeholders['color-image-contrast-checker-green-small'] = '≥ 4,5:1 (AA), texte courant';
    window.placeholders['color-image-contrast-checker-blue-large'] = '>= 3:1 (AA), grand texte';
    window.placeholders['color-image-contrast-checker-blue-small'] = 'Niveau insuffisant';
    await setup();
    await upload();
    const values = [...block.querySelectorAll('.icc-legend-labels > p > span')]
      .map((value) => value.textContent);
    expect(values).to.deep.equal([
      '≥ 4,5:1 (AAA), grand texte',
      '≥ 4,5:1 (AA), texte courant',
      '≥ 3:1 (AA), grand texte',
      'Niveau insuffisant',
    ]);
    expect(block.querySelector('.icc-legend-full').textContent).not.to.include('>=');
    expect(window.placeholders['color-image-contrast-checker-green-large'])
      .to.equal('>= 4,5:1 (AAA), grand texte');
  });

  it('matches full and mini responsive legend geometry without changing tooltip order', async () => {
    const { innerWidth: width, innerHeight: height } = window;
    try {
      await setup();
      await upload();
      for (const viewportWidth of [375, 768, 1440]) {
        await setViewport({ width: viewportWidth, height: 1000 });
        const full = block.querySelector('.icc-legend-full');
        const cards = [...full.querySelectorAll('.icc-legend-card')];
        const rects = cards.map((card) => card.getBoundingClientRect());
        expect(getComputedStyle(full).padding).to.equal('24px');
        expect(getComputedStyle(full).borderRadius).to.equal('16px');
        expect(getComputedStyle(full.querySelector('h2')).fontSize)
          .to.equal(viewportWidth === 1440 ? '22px' : '20px');
        expect(getComputedStyle(cards[0].querySelector('h3')).fontSize)
          .to.equal(viewportWidth === 1440 ? '18px' : '16px');
        if (viewportWidth === 768) {
          expect(rects[0].top).to.equal(rects[1].top);
          expect(rects[1].top).to.equal(rects[2].top);
          expect(rects[0].right).to.be.at.most(rects[1].left);
          expect(full.getBoundingClientRect().height).to.be.closeTo(178, 0.5);
          expect(cards[0].querySelector('h3').getBoundingClientRect().top)
            .to.equal(cards[1].querySelector('h3').getBoundingClientRect().top);
          const divider = full.querySelector('.icc-legend-divider');
          expect(getComputedStyle(divider, '::after').borderInlineStartWidth).to.equal('1px');
        } else {
          expect(rects[0].bottom).to.equal(rects[1].top);
          expect(rects[1].bottom).to.equal(rects[2].top);
        }
        const rows = [...cards[0].querySelectorAll('.icc-legend-labels p')];
        expect(rows[0].getBoundingClientRect().bottom)
          .to.be.at.most(rows[1].getBoundingClientRect().top);
        rows.forEach((row) => {
          const trigger = row.querySelector('button').getBoundingClientRect();
          const value = row.querySelector('span').getBoundingClientRect();
          expect(value.left - trigger.right).to.be.closeTo(4, 0.1);
          expect(value.top).to.be.lessThan(trigger.bottom);
          expect(getComputedStyle(row).fontSize).to.equal('14px');
        });
        expect(block.querySelectorAll('.icc-legend button')).to.have.length(4);
        block.querySelector('[data-action="expand"]').click();
        const mini = block.querySelector('.icc-legend-mini');
        expect(mini.getBoundingClientRect().height).to.equal(40);
        expect(getComputedStyle(mini).boxShadow)
          .to.equal('rgb(233, 233, 233) 0px 0px 0px 1px inset');
        expect(mini.getBoundingClientRect().width)
          .to.equal({ 375: 343, 768: 341, 1440: 337 }[viewportWidth]);
        expect(mini.getClientRects()).to.have.length(1);
        expect(full.getClientRects()).to.have.length(0);
        expect(block.querySelector('.icc-accuracy').getClientRects()).to.have.length(0);
        expect(mini.querySelectorAll('.icc-swatch')).to.have.length(3);
        expect(mini.querySelectorAll('.icon,button')).to.have.length(0);
        expect([...mini.querySelectorAll('.icc-badge')].map((badge) => badge.textContent))
          .to.deep.equal(['Passes', 'Partial', 'Fails']);
        expect(getComputedStyle(mini.querySelector('h2')).fontSize).to.equal('14px');
        block.querySelector('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
      }
    } finally {
      await setViewport({ width, height });
    }
  });

  it('wraps long localized legend copy and uses vertical tablet fallback without 320px overflow', async () => {
    const { innerWidth: width, innerHeight: height } = window;
    try {
      window.placeholders['color-image-contrast-checker-large-text'] = 'Großer Text mit zusätzlicher Erklärung';
      window.placeholders['color-image-contrast-checker-passes'] = 'Entspricht den Anforderungen';
      window.placeholders['color-image-contrast-checker-green-large'] = '>= 4.5:1 (AAA), zusätzliche lokalisierte Erläuterung';
      await setup();
      await upload();
      for (const viewportWidth of [320, 640, 768, 900]) {
        await setViewport({ width: viewportWidth, height: 1200 });
        const full = block.querySelector('.icc-legend-full');
        const cards = [...full.querySelectorAll('.icc-legend-card')];
        expect(full.scrollWidth).to.be.at.most(full.clientWidth);
        expect(full.scrollHeight).to.be.at.most(full.clientHeight);
        expect(full.textContent).to.include('Entspricht den Anforderungen');
        if (viewportWidth === 640) {
          expect(cards[1].getBoundingClientRect().top)
            .to.be.at.least(cards[0].getBoundingClientRect().bottom);
        }
        block.querySelector('[data-action="expand"]').click();
        const mini = block.querySelector('.icc-legend-mini');
        expect(mini.textContent).to.include('Entspricht den Anforderungen');
        expect(mini.scrollWidth).to.be.at.most(mini.clientWidth);
        expect(mini.scrollHeight).to.be.at.most(mini.clientHeight);
        expect(mini.querySelectorAll('button,[tabindex]')).to.have.length(0);
        block.querySelector('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
      }
    } finally {
      await setViewport({ width, height });
    }
  });

  it('returns to upload on browser Back without losing unrelated history state', async () => {
    await setup();
    window.history.replaceState({ unrelated: 'retained' }, '');
    await upload();
    expect(window.history.state.unrelated).to.equal('retained');
    window.history.back();
    await waitFor(() => !block.classList.contains('has-image'));
    expect(document.querySelector('.color-headline').hidden).to.equal(false);
    expect(window.history.state.unrelated).to.equal('retained');
  });

  it('retains the current image on an invalid replacement and announces failure', async () => {
    await setup();
    await upload();
    const original = block.querySelector('.icc-frame img').src;
    const input = block.querySelector('input[type="file"]');
    Object.defineProperty(input, 'files', {
      configurable: true, value: [new File(['wrong'], 'bad.txt', { type: 'text/plain' })],
    });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await waitFor(() => block.getAttribute('aria-busy') === 'false');
    expect(block.querySelector('.icc-frame img').src).to.equal(original);
    expect(block.classList.contains('has-image')).to.equal(true);
  });

  it('exports a full-resolution PNG named for the selected analysis color space', async () => {
    await setup();
    await upload();
    const createUrl = URL.createObjectURL.bind(URL);
    let exported;
    sinon.stub(URL, 'createObjectURL').callsFake((blob) => {
      exported = blob;
      return createUrl(blob);
    });
    const click = sinon.stub(HTMLAnchorElement.prototype, 'click');
    for (const space of ['srgb', 'display-p3', 'adobe-rgb']) {
      chooseSpace(space);
      const expectedCalls = click.callCount + 1;
      block.querySelector('[data-action="save"]').click();
      await waitFor(() => click.callCount === expectedCalls);
      const bytes = new Uint8Array(await exported.arrayBuffer());
      expect([...bytes.slice(0, 8)]).to.deep.equal([137, 80, 78, 71, 13, 10, 26, 10]);
      const view = new DataView(bytes.buffer);
      expect([view.getUint32(16), view.getUint32(20)]).to.deep.equal([13, 9]);
      expect(click.lastCall.thisValue.download).to.equal(`authored-test-contrast-${space}.png`);
    }
  });

  it('ignores retained upload handlers after destruction and restores its headline', async () => {
    await setup();
    await upload();
    const input = block.querySelector('input[type="file"]');
    block.dispatchEvent(new Event('color-image-contrast-checker:destroy'));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.querySelector('.color-headline').hidden).to.equal(false);
    expect(document.querySelector('.icc-overlay')).not.to.exist;
  });

  it('does not export a stale PNG after another upload supersedes it', async () => {
    await setup();
    await upload();
    let finish;
    const canvas = block.querySelector('canvas');
    const pending = sinon.stub(canvas, 'toBlob').callsFake((callback) => { finish = callback; });
    const click = sinon.stub(HTMLAnchorElement.prototype, 'click');
    block.querySelector('[data-action="save"]').click();
    pending.restore();
    await upload();
    finish(new Blob(['stale output'], { type: 'image/png' }));
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    expect(click.called).to.equal(false);
  });

  it('discards a pending export after a color-space change and names the new analysis correctly', async () => {
    await setup();
    const file = await imageFile();
    await upload(new File([file], 'photograph.v2.PNG', { type: file.type }));
    let finish;
    const canvas = block.querySelector('canvas');
    const pending = sinon.stub(canvas, 'toBlob').callsFake((callback) => { finish = callback; });
    const click = sinon.stub(HTMLAnchorElement.prototype, 'click');
    block.querySelector('[data-action="save"]').click();
    chooseSpace('adobe-rgb');
    pending.restore();
    finish(new Blob(['stale output'], { type: 'image/png' }));
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    expect(click.called).to.equal(false);
    block.querySelector('[data-action="save"]').click();
    await waitFor(() => click.called);
    expect(click.firstCall.thisValue.download).to.equal('photograph.v2-contrast-adobe-rgb.png');
  });

  it('supports redecoration and tears down resources when the whole section is removed', async () => {
    await setup();
    await upload();
    await decorate(block);
    expect(block.classList.contains('has-image')).to.equal(false);
    expect(block.querySelector('.icc-upload')).to.exist;
    const revoke = sinon.spy(URL, 'revokeObjectURL');
    await upload();
    block.closest('.section').remove();
    await waitFor(() => !document.querySelector('.icc-overlay'));
    expect(revoke.called).to.equal(true);
  });

  it('ignores a slow earlier upload after a newer upload succeeds', async () => {
    await setup();
    const file = await imageFile();
    const first = new File([await taggedImage(file)], 'earlier-adobe.png', { type: file.type });
    const bytes = await first.arrayBuffer();
    let finish;
    const read = sinon.stub(first, 'arrayBuffer').returns(new Promise((resolve) => { finish = resolve; }));
    const input = block.querySelector('input[type="file"]');
    Object.defineProperty(input, 'files', { value: [first], configurable: true });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await waitFor(() => read.called);
    const ready = sinon.spy();
    block.addEventListener('color-image-contrast-checker:ready', ready);
    await upload();
    const original = block.querySelector('.icc-frame img').src;
    const revoke = sinon.spy(URL, 'revokeObjectURL');
    finish(bytes);
    await waitFor(() => revoke.called);
    expect(revoke.callCount).to.equal(2);
    expect(ready.callCount).to.equal(1);
    expect(block.querySelector('.icc-frame img').src).to.equal(original);
  });

  it('disables export after context loss and reanalyzes after restoration', async () => {
    await setup();
    await upload();
    const canvas = block.querySelector('canvas');
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    expect(block.querySelector('[data-action="save"]').disabled).to.equal(true);
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    await waitFor(() => !block.querySelector('[data-action="save"]').disabled);
    expect([canvas.width, canvas.height]).to.deep.equal([13, 9]);
  });

  it('recovers the real WebGL context without exporting stale pixels', async () => {
    await setup();
    await upload();
    const canvas = block.querySelector('canvas');
    const extension = canvas.getContext('webgl').getExtension('WEBGL_lose_context');
    expect(extension).to.exist;
    const lost = new Promise((resolve) => {
      canvas.addEventListener('webglcontextlost', resolve, { once: true });
    });
    extension.loseContext();
    await lost;
    expect(block.querySelector('[data-action="save"]').disabled).to.equal(true);
    await new Promise((resolve) => { setTimeout(resolve, 1000); });
    extension.restoreContext();
    await waitFor(() => !block.querySelector('[data-action="save"]').disabled);
    expect([canvas.width, canvas.height]).to.deep.equal([13, 9]);
  }).timeout(8000);

  it('fetches the original sample rather than analyzing its optimized preview', async () => {
    await setup((checker) => {
      authorSamples(checker, `
        <a href="/mock/original.png">
          <picture><img src="/nala/assets/test-image.jpg" alt="Authored sample description"></picture>
        </a>
      `);
    });
    expect(block.querySelector('.icc-sample').getAttribute('aria-label'))
      .to.equal(`${placeholders['color-image-contrast-checker-use-this-image']}: Authored sample description`);
    const original = await imageFile();
    const fetchOriginal = sinon.stub(window, 'fetch').resolves(new Response(original, {
      headers: { 'Content-Type': 'image/png; charset=binary' },
    }));
    block.querySelector('.icc-sample').click();
    await waitFor(() => block.classList.contains('has-image')
      && block.getAttribute('aria-busy') === 'false');
    expect(fetchOriginal.firstCall.args[0]).to.equal(new URL('/mock/original.png', window.location).href);
    expect([block.querySelector('canvas').width, block.querySelector('canvas').height])
      .to.deep.equal([13, 9]);
  });

  it('displays scaled-down unlinked authored pictures without requiring alt text', async () => {
    await setup((checker) => {
      authorSamples(checker, `
        <picture><img src="/nala/assets/test-image.jpg" alt=""></picture>
        <picture><img src="/nala/assets/test-image.jpg"></picture>
      `);
    });
    const samples = [...block.querySelectorAll('.icc-sample')];
    expect(samples).to.have.length(2);
    for (const sample of samples) {
      expect(sample.getAttribute('aria-label'))
        .to.equal(placeholders['color-image-contrast-checker-use-this-image']);
      expect(sample.textContent).to.equal('');
      const image = sample.querySelector('img');
      expect(image.getAttribute('alt')).to.equal('');
      expect(image.draggable).to.equal(false);
      await image.decode();
      expect(image.getBoundingClientRect().width).to.be.greaterThan(0);
      expect(image.getBoundingClientRect().width).to.be.lessThan(image.naturalWidth);
    }
    const original = await imageFile();
    const fetchOriginal = sinon.stub(window, 'fetch').resolves(new Response(original));
    samples[1].click();
    await waitFor(() => block.classList.contains('has-image')
      && block.getAttribute('aria-busy') === 'false');
    expect(fetchOriginal.firstCall.args[0])
      .to.equal(new URL('/nala/assets/test-image.jpg', document.baseURI).href);
    expect(block.querySelector('canvas').width).to.equal(13);
  });

  it('matches Figma sample dimensions and crops authored images without stretching', async () => {
    const { innerWidth: width, innerHeight: height } = window;
    try {
      await setViewport({ width: 375, height: 900 });
      await setup((checker) => {
        checker.style.setProperty('--spacing-80', '6px');
        authorSamples(checker, '<picture><img src="/nala/assets/test-image.jpg"></picture>'.repeat(4));
      });
      const images = [...block.querySelectorAll('.icc-sample img')];
      await Promise.all(images.map((image) => image.decode()));
      for (const viewportWidth of [375, 768, 1440]) {
        await setViewport({ width: viewportWidth, height: 900 });
        expect(getComputedStyle(block.querySelector('.icc-suggestions p')).fontWeight)
          .to.equal('700');
        const list = block.querySelector('.icc-sample-list');
        expect(list.getBoundingClientRect().width).to.equal(343);
        expect(getComputedStyle(list).gap).to.equal('6px');
        images.forEach((image) => {
          const rect = image.getBoundingClientRect();
          expect(rect.width).to.be.closeTo(81.25, 0.05);
          expect(rect.height).to.be.closeTo(113.75, 0.05);
          expect(getComputedStyle(image).objectFit).to.equal('cover');
        });
      }
      await setViewport({ width: 320, height: 900 });
      const listWidth = block.querySelector('.icc-sample-list').getBoundingClientRect().width;
      images.forEach((image) => {
        const rect = image.getBoundingClientRect();
        expect(rect.width).to.be.closeTo((listWidth - 18) / 4, 0.05);
        expect(rect.height / rect.width).to.be.closeTo(7 / 5, 0.01);
      });
    } finally {
      await setViewport({ width, height });
    }
  });

  it('selects only the successfully committed sample before announcing readiness', async () => {
    await setup((checker) => {
      authorSamples(checker, `
        <a href="/mock/sample-a.png"><picture><img alt="A"></picture></a>
        <a href="/mock/sample-b.png"><picture><img alt="B"></picture></a>
      `);
    });
    const samples = [...block.querySelectorAll('.icc-sample')];
    const states = () => samples.map((sample) => sample.getAttribute('aria-pressed'));
    const original = await imageFile();
    let release;
    const fetchSample = sinon.stub(window, 'fetch');
    fetchSample.onFirstCall().returns(new Promise((resolve) => { release = resolve; }));
    fetchSample.onSecondCall().resolves(new Response(original));
    const announcements = [];
    block.addEventListener('color-image-contrast-checker:ready', () => {
      announcements.push(states());
    });
    expect(states()).to.deep.equal(['false', 'false']);
    samples[0].click();
    expect(states()).to.deep.equal(['false', 'false']);
    release(new Response(original));
    await waitFor(() => block.getAttribute('aria-busy') === 'false');
    expect(states()).to.deep.equal(['true', 'false']);
    expect(samples[0].classList.contains('is-selected')).to.equal(true);
    samples[1].click();
    expect(states()).to.deep.equal(['true', 'false']);
    await waitFor(() => block.getAttribute('aria-busy') === 'false');
    expect(states()).to.deep.equal(['false', 'true']);
    expect(samples[0].classList.contains('is-selected')).to.equal(false);
    expect(announcements).to.deep.equal([['true', 'false'], ['false', 'true']]);
  });

  it('retains the committed sample after fetch, decode and rendering failures', async () => {
    await setup((checker) => {
      authorSamples(checker, `
        <a href="/mock/sample-a.png"><picture><img alt="A"></picture></a>
        <a href="/mock/sample-b.png"><picture><img alt="B"></picture></a>
      `);
    });
    const samples = [...block.querySelectorAll('.icc-sample')];
    const original = await imageFile();
    const fetchSample = sinon.stub(window, 'fetch');
    fetchSample.onCall(0).resolves(new Response(original));
    fetchSample.onCall(1).resolves(new Response('', { status: 500 }));
    fetchSample.onCall(2).resolves(new Response(new Blob(['invalid'], { type: 'image/png' })));
    const replacement = document.createElement('canvas');
    replacement.width = 23;
    replacement.height = 17;
    const context = replacement.getContext('2d');
    context.fillStyle = '#f0f';
    context.fillRect(0, 0, replacement.width, replacement.height);
    const replacementBlob = await new Promise((resolve) => {
      replacement.toBlob(resolve, 'image/png');
    });
    fetchSample.onCall(3).resolves(new Response(replacementBlob));
    fetchSample.onCall(4).resolves(new Response(original));
    const announcements = sinon.spy();
    block.addEventListener('color-image-contrast-checker:ready', announcements);
    samples[0].click();
    await waitFor(() => block.getAttribute('aria-busy') === 'false');
    const originalUrl = block.querySelector('.icc-frame img').src;
    const currentBlock = block;
    const canvas = block.querySelector('canvas');
    const exportPng = sinon.spy(canvas, 'toBlob');
    const save = block.querySelector('[data-action="save"]');
    for (let attempt = 0; attempt < 3; attempt += 1) {
      let render;
      if (attempt === 2) {
        const gl = canvas.getContext('webgl');
        render = sinon.stub(gl, 'drawArrays').throws(new Error('analysisError'));
      }
      samples[1].click();
      await waitFor(() => currentBlock.getAttribute('aria-busy') === 'false');
      render?.restore();
      expect(samples.map((sample) => sample.getAttribute('aria-pressed')))
        .to.deep.equal(['true', 'false']);
      expect(block.querySelector('.icc-frame img').src).to.equal(originalUrl);
      expect(save.disabled).to.equal(attempt === 2);
      expect(announcements.callCount).to.equal(1);
    }
    expect([canvas.width, canvas.height]).to.deep.equal([23, 17]);
    save.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(exportPng.called).to.equal(false);
    samples[0].click();
    await waitFor(() => block.getAttribute('aria-busy') === 'false');
    expect([canvas.width, canvas.height]).to.deep.equal([13, 9]);
    expect(save.disabled).to.equal(false);
    expect(announcements.callCount).to.equal(2);
    expect(samples.map((sample) => sample.getAttribute('aria-pressed')))
      .to.deep.equal(['true', 'false']);
  });

  it('preserves selection when the picker is canceled and clears it on custom upload and drop', async () => {
    await setup((checker) => {
      authorSamples(checker, '<a href="/mock/sample.png"><picture><img alt=""></picture></a>');
    });
    const sample = block.querySelector('.icc-sample');
    const original = await imageFile();
    sinon.stub(window, 'fetch').callsFake(async () => new Response(original));
    sample.click();
    await waitFor(() => block.getAttribute('aria-busy') === 'false');
    for (const action of ['fit', 'fill', 'expand', 'expand']) {
      block.querySelector(`[data-action="${action}"]`).click();
      expect(sample.getAttribute('aria-pressed')).to.equal('true');
    }
    const input = block.querySelector('input[type="file"]');
    sinon.stub(input, 'click');
    block.querySelector('[data-action="replace"]').click();
    input.dispatchEvent(new Event('cancel'));
    expect(sample.getAttribute('aria-pressed')).to.equal('true');
    await upload();
    expect(sample.getAttribute('aria-pressed')).to.equal('false');
    sample.click();
    await waitFor(() => block.getAttribute('aria-busy') === 'false');
    const drop = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', {
      value: { files: [original], types: ['Files'] },
    });
    block.querySelector('.image-upload-dropzone').dispatchEvent(drop);
    await waitFor(() => block.getAttribute('aria-busy') === 'false');
    expect(sample.getAttribute('aria-pressed')).to.equal('false');
  });

  it('ignores superseded sample responses while color-space changes preserve the active load', async () => {
    await setup((checker) => {
      authorSamples(checker, `
        <a href="/mock/sample-a.png"><picture><img alt="A"></picture></a>
        <a href="/mock/sample-b.png"><picture><img alt="B"></picture></a>
      `);
    });
    const samples = [...block.querySelectorAll('.icc-sample')];
    const original = await imageFile();
    await upload(original);
    let release;
    const fetchSample = sinon.stub(window, 'fetch');
    fetchSample.onCall(0).returns(new Promise((resolve) => { release = resolve; }));
    fetchSample.onCall(1).resolves(new Response(original));
    samples[0].click();
    samples[1].click();
    // Busy dropdown options must not interrupt the active sample transaction.
    chooseSpace('display-p3');
    await waitFor(() => block.getAttribute('aria-busy') === 'false');
    expect(samples.map((sample) => sample.getAttribute('aria-pressed')))
      .to.deep.equal(['false', 'true']);
    release(new Response(original));
    await new Promise((resolve) => { setTimeout(resolve, 20); });
    expect(samples.map((sample) => sample.getAttribute('aria-pressed')))
      .to.deep.equal(['false', 'true']);
    expect(block.getAttribute('aria-busy')).to.equal('false');
  });

  it('does not commit a stale sample decode after a custom upload or teardown', async () => {
    await setup((checker) => {
      authorSamples(checker, '<a href="/mock/sample.png"><picture><img alt=""></picture></a>');
    });
    const sample = block.querySelector('.icc-sample');
    const original = await imageFile();
    sinon.stub(window, 'fetch').callsFake(async () => new Response(original));
    const { decode } = HTMLImageElement.prototype;
    let release;
    let pendingUrl;
    sinon.stub(HTMLImageElement.prototype, 'decode').callsFake(async function decodeSample() {
      await decode.call(this);
      if (!pendingUrl && this.src.startsWith('blob:')) {
        pendingUrl = this.src;
        await new Promise((resolve) => { release = resolve; });
      }
    });
    const revoke = sinon.spy(URL, 'revokeObjectURL');
    sample.click();
    await waitFor(() => Boolean(release));
    expect(sample.getAttribute('aria-pressed')).to.equal('false');
    await upload(original);
    const originalUrl = block.querySelector('.icc-frame img').src;
    release();
    await waitFor(() => revoke.calledWith(pendingUrl));
    expect(block.querySelector('.icc-frame img').src).to.equal(originalUrl);
    expect(sample.getAttribute('aria-pressed')).to.equal('false');
    expect(block.getAttribute('aria-busy')).to.equal('false');
    pendingUrl = undefined;
    release = null;
    sample.click();
    await waitFor(() => Boolean(release));
    block.dispatchEvent(new Event('color-image-contrast-checker:destroy'));
    release();
    await waitFor(() => revoke.calledWith(pendingUrl));
    expect(sample.getAttribute('aria-pressed')).to.equal('false');
    expect(block.querySelector('.icc-sample')).to.equal(null);
  });

  it('clears committed selection on Back and aborts pending sample work on teardown', async () => {
    await setup((checker) => {
      authorSamples(checker, '<a href="/mock/sample.png"><picture><img alt=""></picture></a>');
    });
    window.history.replaceState({ unrelated: 'retained' }, '');
    const sample = block.querySelector('.icc-sample');
    const original = await imageFile();
    const fetchSample = sinon.stub(window, 'fetch');
    fetchSample.onCall(0).resolves(new Response(original));
    let release;
    fetchSample.onCall(1).returns(new Promise((resolve) => { release = resolve; }));
    let releaseAfterBack;
    fetchSample.onCall(2).returns(new Promise((resolve) => { releaseAfterBack = resolve; }));
    sample.click();
    await waitFor(() => block.getAttribute('aria-busy') === 'false');
    sample.click();
    const pendingSignal = fetchSample.secondCall.args[1].signal;
    window.history.back();
    await waitFor(() => !block.classList.contains('has-image'));
    expect(pendingSignal.aborted).to.equal(true);
    expect(sample.getAttribute('aria-pressed')).to.equal('false');
    expect(sample.classList.contains('is-selected')).to.equal(false);
    release(new Response(original));
    await new Promise((resolve) => { setTimeout(resolve, 20); });
    expect(block.classList.contains('has-image')).to.equal(false);
    sample.click();
    const { signal } = fetchSample.thirdCall.args[1];
    block.dispatchEvent(new Event('color-image-contrast-checker:destroy'));
    expect(signal.aborted).to.equal(true);
    releaseAfterBack(new Response(original));
    await new Promise((resolve) => { setTimeout(resolve, 20); });
    expect(sample.getAttribute('aria-pressed')).to.equal('false');
    expect(block.querySelector('.icc-sample')).to.equal(null);
    expect(block.classList.contains('has-image')).to.equal(false);
  });

  it('draws the selected sample decoration without changing confirmed geometry', async () => {
    await setup((checker) => {
      checker.style.setProperty('--color-gray-250', '#e1e1e1');
      checker.style.setProperty('--color-gray-950', '#131313');
      checker.style.setProperty('--color-white', '#fff');
      checker.style.setProperty('--color-focus-ring-strong', '#4b75ff');
      checker.style.setProperty('--Corner-radius-corner-radius-100', '8px');
      authorSamples(checker, '<picture><img src="/nala/assets/test-image.jpg"></picture>'.repeat(4));
    });
    const sample = block.querySelector('.icc-sample');
    const image = sample.querySelector('img');
    await image.decode();
    const before = image.getBoundingClientRect();
    expect(getComputedStyle(sample, '::after').borderTopColor).to.equal('rgb(225, 225, 225)');
    sample.classList.add('is-selected');
    const after = image.getBoundingClientRect();
    expect([after.width, after.height]).to.deep.equal([before.width, before.height]);
    expect(getComputedStyle(sample).padding).to.equal('0px');
    expect(getComputedStyle(sample).borderTopWidth).to.equal('0px');
    expect(getComputedStyle(sample).borderRadius).to.equal('8px');
    expect(getComputedStyle(sample, '::after').borderTopColor).to.equal('rgb(19, 19, 19)');
    expect(getComputedStyle(sample, '::after').borderTopWidth).to.equal('1px');
    expect(getComputedStyle(sample, '::after').pointerEvents).to.equal('none');
    expect(getComputedStyle(sample, '::after').boxShadow)
      .to.equal('rgb(255, 255, 255) 0px 0px 0px 2px inset');
  });

  it('matches Figma selector widths in results and expanded mobile view', async () => {
    const { innerWidth: width, innerHeight: height } = window;
    try {
      await setup((checker) => {
        checker.style.setProperty('--ax-body-xs-size', '14px');
      });
      await upload();
      const select = block.querySelector('.color-dropdown-trigger');
      for (const [viewportWidth, expectedWidth] of [[375, 224], [768, 208], [1440, 208]]) {
        await setViewport({ width: viewportWidth, height: 900 });
        expect(select.getBoundingClientRect().width).to.equal(expectedWidth);
        expect(select.getBoundingClientRect().height).to.equal(32);
        expect(getComputedStyle(select).fontSize).to.equal('14px');
      }
      await setViewport({ width: 375, height: 900 });
      block.querySelector('[data-action="expand"]').click();
      expect(block.querySelector('dialog').open).to.equal(true);
      expect(select.getBoundingClientRect().width).to.equal(256);
      block.querySelector('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
    } finally {
      await setViewport({ width, height });
    }
  });

  it('fetches original unlinked DA media without resize or format parameters', async () => {
    await setup((checker) => {
      authorSamples(checker, `
        <picture><img data-src="/mock/media_sample.png?width=750&amp;height=600&amp;format=webp&amp;optimize=medium&amp;fit=cover&amp;cache=keep" alt=""></picture>
      `);
    });
    const original = await imageFile();
    const fetchOriginal = sinon.stub(window, 'fetch').resolves(new Response(original));
    block.querySelector('.icc-sample').click();
    await waitFor(() => block.classList.contains('has-image')
      && block.getAttribute('aria-busy') === 'false');
    expect(fetchOriginal.firstCall.args[0])
      .to.equal(new URL('/mock/media_sample.png?cache=keep', document.baseURI).href);
    expect([block.querySelector('canvas').width, block.querySelector('canvas').height])
      .to.deep.equal([13, 9]);
  });
});

describe('Original-file upload opt-in', () => {
  it('receives the same file from direct selection and drop without the legacy decoder', () => {
    const selected = sinon.spy();
    const dropzone = createUploadDropzone({ onFileSelected: selected });
    const file = new File(['wrong'], 'bad.txt', { type: 'text/plain' });
    dropzone.handleFile(file);
    Object.defineProperty(dropzone.input, 'files', { value: [file], configurable: true });
    dropzone.input.dispatchEvent(new Event('change'));
    const transfer = new DataTransfer();
    transfer.items.add(file);
    dropzone.container.querySelector('.image-upload-dropzone').dispatchEvent(new DragEvent('drop', {
      dataTransfer: transfer, bubbles: true,
    }));
    expect(selected.callCount).to.equal(3);
    selected.getCalls().forEach((call) => expect(call.args[0]).to.equal(file));
    expect(dropzone.container.classList.contains('is-loading')).to.equal(false);
  });

  it('retains legacy validation when the opt-in callback is absent', () => {
    const decoded = sinon.spy();
    const dropzone = createUploadDropzone({ onImageReady: decoded });
    dropzone.handleFile(new File(['wrong'], 'bad.txt', { type: 'text/plain' }));
    expect(decoded.called).to.equal(false);
    expect(dropzone.container.classList.contains('is-loading')).to.equal(false);
  });
});

describe('Shared page drag lifecycle', () => {
  let detach;
  let selected;
  let dropzone;
  let dragLayer;
  let loadingLayer;
  let transfer;

  beforeEach(() => {
    document.body.replaceChildren();
    block = document.createElement('div');
    selected = sinon.spy();
    dropzone = createUploadDropzone({ onFileSelected: selected });
    block.append(dropzone.container);
    dragLayer = document.createElement('div');
    loadingLayer = document.createElement('div');
    document.body.append(block, dragLayer, loadingLayer);
    sinon.stub(block, 'getBoundingClientRect').returns({ top: 0, bottom: 100 });
    detach = attachDrag(block, dropzone, dragLayer, loadingLayer);
    transfer = new DataTransfer();
    transfer.items.add(new File(['test'], 'test.png', { type: 'image/png' }));
  });

  afterEach(() => {
    detach();
    sinon.restore();
  });

  const dragEvent = (type, dataTransfer) => new DragEvent(type, {
    bubbles: true, cancelable: true, dataTransfer,
  });

  it('processes page drops and direct dropzone drops exactly once each', () => {
    block.dispatchEvent(dragEvent('drop', transfer));
    dropzone.container.querySelector('.image-upload-dropzone')
      .dispatchEvent(dragEvent('drop', transfer));
    expect(selected.callCount).to.equal(2);
  });

  it('synchronizes overlays and clears dragging on blur and cleanup', async () => {
    block.dispatchEvent(dragEvent('dragenter', transfer));
    await waitFor(() => dragLayer.classList.contains('is-dragging'));
    block.classList.add('is-loading');
    await waitFor(() => loadingLayer.classList.contains('is-loading'));
    window.dispatchEvent(new Event('blur'));
    expect(block.classList.contains('is-dragging')).to.equal(false);
    block.dispatchEvent(dragEvent('dragenter', transfer));
    detach();
    expect(block.classList.contains('is-dragging')).to.equal(false);
    expect(dragLayer.isConnected).to.equal(false);
    block.dispatchEvent(dragEvent('drop', transfer));
    expect(selected.called).to.equal(false);
  });

  it('suppresses page drag while the picker is open and outside the viewport', () => {
    dropzone.input.addEventListener('click', (event) => event.preventDefault(), { once: true });
    dropzone.input.dispatchEvent(new MouseEvent('click', { cancelable: true }));
    block.dispatchEvent(dragEvent('dragenter', transfer));
    expect(block.classList.contains('is-dragging')).to.equal(false);
    block.dispatchEvent(dragEvent('drop', transfer));
    expect(selected.called).to.equal(false);
    window.dispatchEvent(new Event('focus'));
    block.getBoundingClientRect.returns({ top: -200, bottom: -100 });
    block.dispatchEvent(dragEvent('drop', transfer));
    expect(selected.called).to.equal(false);
  });
});
