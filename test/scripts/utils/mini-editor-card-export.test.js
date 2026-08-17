import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import MiniEditorCardExporter from '../../../express/code/scripts/utils/mini-editor-card-export.js';

function createBackgroundUrl() {
  const canvas = document.createElement('canvas');
  canvas.width = 20;
  canvas.height = 10;
  const context = canvas.getContext('2d');
  context.fillStyle = '#00ff00';
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

function createModel() {
  return {
    quote: 'Rendered from the content model',
    author: 'Test Author',
    backgroundUrl: createBackgroundUrl(),
    font: { family: 'sans-serif', style: 'normal', weight: 'normal' },
  };
}

async function readBlobDimensions(blob) {
  const bitmap = await createImageBitmap(blob);
  const dimensions = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dimensions;
}

describe('mini-editor card export', () => {
  afterEach(() => sinon.restore());

  it('renders a 1084x700 PNG through the worker path', async () => {
    if (!MiniEditorCardExporter.supportsWorkerRendering()) return;
    const blob = await MiniEditorCardExporter.createCardBlob(createModel());
    expect(blob.type).to.equal('image/png');
    expect(await readBlobDimensions(blob)).to.deep.equal({ width: 1084, height: 700 });
  });

  it('renders the same PNG dimensions through the direct Canvas fallback', async () => {
    sinon.stub(MiniEditorCardExporter, 'supportsWorkerRendering').returns(false);
    const blob = await MiniEditorCardExporter.createCardBlob(createModel());
    expect(blob.type).to.equal('image/png');
    expect(await readBlobDimensions(blob)).to.deep.equal({ width: 1084, height: 700 });
  });

  it('downloads with a timestamped PNG filename', async () => {
    sinon.stub(MiniEditorCardExporter, 'supportsWorkerRendering').returns(false);
    let filename;
    sinon.stub(HTMLAnchorElement.prototype, 'click').callsFake(function click() {
      filename = this.download;
    });
    const result = await MiniEditorCardExporter.download(createModel());
    expect(result.filename).to.equal(filename);
    expect(filename).to.match(/^screenshot-\d+\.png$/);
  });
});
