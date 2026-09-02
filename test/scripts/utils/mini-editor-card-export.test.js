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

// Locate the PNG pHYs chunk and read its pixels-per-metre + unit fields.
async function readPngResolution(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  for (let i = 8; i < bytes.length - 12; i += 1) {
    const isPhys = bytes[i] === 0x70 && bytes[i + 1] === 0x48
      && bytes[i + 2] === 0x59 && bytes[i + 3] === 0x73;
    if (isPhys) {
      const view = new DataView(bytes.buffer, i + 4, 9);
      return { ppuX: view.getUint32(0), ppuY: view.getUint32(4), unit: view.getUint8(8) };
    }
  }
  return undefined;
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

  it('embeds a 96-DPI pHYs resolution chunk in the PNG', async () => {
    sinon.stub(MiniEditorCardExporter, 'supportsWorkerRendering').returns(false);
    const blob = await MiniEditorCardExporter.createCardBlob(createModel());
    // 96 dpi = round(96 / 0.0254) = 3780 pixels per metre, unit 1 (metre).
    expect(await readPngResolution(blob)).to.deep.equal({ ppuX: 3780, ppuY: 3780, unit: 1 });
  });

  it('sizes the canvas to the background native dimensions when the model carries them', async () => {
    sinon.stub(MiniEditorCardExporter, 'supportsWorkerRendering').returns(false);
    const model = {
      ...createModel(),
      backgroundFullUrl: createBackgroundUrl(),
      backgroundWidth: 800,
      backgroundHeight: 450,
    };
    const blob = await MiniEditorCardExporter.createCardBlob(model);
    expect(await readBlobDimensions(blob)).to.deep.equal({ width: 800, height: 450 });
  });

  it('downloads with a stable PNG filename', async () => {
    sinon.stub(MiniEditorCardExporter, 'supportsWorkerRendering').returns(false);
    let filename;
    sinon.stub(HTMLAnchorElement.prototype, 'click').callsFake(function click() {
      filename = this.download;
    });
    const result = await MiniEditorCardExporter.download(createModel());
    expect(result.filename).to.equal(filename);
    expect(filename).to.equal('download.png');
  });
});
