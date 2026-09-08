import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import {
  captureElementAsImage,
  downloadElementAsImage,
  Html2CanvasLoader,
} from '../../../express/code/scripts/utils/download-utils.js';

function createFakeCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 10;
  canvas.height = 10;
  return canvas;
}

function attachedElement() {
  const el = document.createElement('div');
  el.style.width = '20px';
  el.style.height = '20px';
  document.body.append(el);
  return el;
}

async function expectRejection(promise, messageMatch) {
  try {
    await promise;
    expect.fail('expected promise to reject');
  } catch (error) {
    expect(error.message).to.match(messageMatch);
  }
}

describe('download-utils', () => {
  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
  });

  describe('validation', () => {
    it('throws TypeError synchronously for a non-HTMLElement', () => {
      expect(() => captureElementAsImage('not-an-element')).to.throw(TypeError, /must be an HTMLElement/);
    });

    it('throws for a disconnected element', () => {
      const el = document.createElement('div');
      expect(() => captureElementAsImage(el)).to.throw(/must be attached to the document/);
    });

    it('throws for a zero-size element', () => {
      const el = document.createElement('div');
      el.style.display = 'none';
      document.body.append(el);
      expect(() => captureElementAsImage(el)).to.throw(/zero rendered size/);
    });
  });

  describe('captureElementAsImage happy path', () => {
    it('calls html2canvas with foreignObjectRendering forced false and returns a png Blob', async () => {
      const el = attachedElement();
      const html2canvasStub = sinon.stub().resolves(createFakeCanvas());
      sinon.stub(Html2CanvasLoader, 'load').resolves(html2canvasStub);

      const blob = await captureElementAsImage(el);

      expect(html2canvasStub.calledOnce).to.equal(true);
      const [target, opts] = html2canvasStub.firstCall.args;
      expect(target).to.equal(el);
      expect(opts.foreignObjectRendering).to.equal(false);
      expect(opts.useCORS).to.equal(true);
      expect(opts.backgroundColor).to.equal(null);
      expect(blob.type).to.equal('image/png');
      expect(blob.size).to.be.greaterThan(0);
    });

    it('defaults backgroundColor to white and uses jpeg mime type when format is jpeg', async () => {
      const el = attachedElement();
      const html2canvasStub = sinon.stub().resolves(createFakeCanvas());
      sinon.stub(Html2CanvasLoader, 'load').resolves(html2canvasStub);

      const blob = await captureElementAsImage(el, { format: 'jpeg' });

      const [, opts] = html2canvasStub.firstCall.args;
      expect(opts.backgroundColor).to.equal('#ffffff');
      expect(blob.type).to.equal('image/jpeg');
    });

    it('rejects for an unsupported format before loading html2canvas', async () => {
      const el = attachedElement();
      const loadSpy = sinon.stub(Html2CanvasLoader, 'load').resolves(sinon.stub());

      await expectRejection(captureElementAsImage(el, { format: 'gif' }), /unsupported format/);
      expect(loadSpy.called).to.equal(false);
    });
  });

  describe('loader failure and retry', () => {
    it('rejects when the loader fails, and retries on the next call', async () => {
      const el = attachedElement();
      const loadStub = sinon.stub(Html2CanvasLoader, 'load');
      loadStub.onCall(0).rejects(new Error('network down'));
      loadStub.onCall(1).resolves(sinon.stub().resolves(createFakeCanvas()));

      await expectRejection(captureElementAsImage(el), /network down/);
      const blob = await captureElementAsImage(el);
      expect(blob.size).to.be.greaterThan(0);
    });
  });

  describe('tainted canvas', () => {
    it('rejects with CORS guidance when canvas.toBlob throws SecurityError', async () => {
      const el = attachedElement();
      const canvas = createFakeCanvas();
      canvas.toBlob = () => {
        const err = new Error('tainted');
        err.name = 'SecurityError';
        throw err;
      };
      sinon.stub(Html2CanvasLoader, 'load').resolves(sinon.stub().resolves(canvas));

      await expectRejection(captureElementAsImage(el), /tainted by a cross-origin image/);
    });
  });

  describe('isolate option', () => {
    it('renders a clone rather than the live element, and cleans up afterwards', async () => {
      const el = attachedElement();
      const html2canvasStub = sinon.stub().resolves(createFakeCanvas());
      sinon.stub(Html2CanvasLoader, 'load').resolves(html2canvasStub);

      await captureElementAsImage(el, { isolate: true });

      const [target] = html2canvasStub.firstCall.args;
      expect(target).to.not.equal(el);
      expect(target.isConnected).to.equal(false);
    });

    it('cleans up the offscreen clone even when html2canvas rejects', async () => {
      const el = attachedElement();
      sinon.stub(Html2CanvasLoader, 'load').resolves(sinon.stub().rejects(new Error('render failed')));
      const bodyChildrenBefore = document.body.children.length;

      await expectRejection(captureElementAsImage(el, { isolate: true }), /render failed/);

      expect(document.body.children.length).to.equal(bodyChildrenBefore);
    });
  });

  describe('downloadElementAsImage', () => {
    it('triggers a Blob download with a default timestamped filename', async () => {
      const el = attachedElement();
      sinon.stub(Html2CanvasLoader, 'load').resolves(sinon.stub().resolves(createFakeCanvas()));
      const createObjectURLSpy = sinon.spy(URL, 'createObjectURL');
      const revokeObjectURLSpy = sinon.spy(URL, 'revokeObjectURL');

      const bodyChildrenBefore = document.body.children.length;
      const { filename } = await downloadElementAsImage(el);

      expect(filename).to.match(/^screenshot-\d+\.png$/);
      expect(createObjectURLSpy.calledOnce).to.equal(true);
      expect(revokeObjectURLSpy.calledOnce).to.equal(true);
      expect(document.body.children.length).to.equal(bodyChildrenBefore);
    });

    it('appends the correct extension for a custom filename without one, and respects an existing extension', async () => {
      const el = attachedElement();
      sinon.stub(Html2CanvasLoader, 'load').resolves(sinon.stub().resolves(createFakeCanvas()));

      const withoutExt = await downloadElementAsImage(el, { filename: 'my-card' });
      expect(withoutExt.filename).to.equal('my-card.png');

      const withExt = await downloadElementAsImage(el, { filename: 'my-card.png' });
      expect(withExt.filename).to.equal('my-card.png');
    });

    it('uses a .jpg extension when format is jpeg', async () => {
      const el = attachedElement();
      sinon.stub(Html2CanvasLoader, 'load').resolves(sinon.stub().resolves(createFakeCanvas()));

      const { filename } = await downloadElementAsImage(el, { format: 'jpeg' });
      expect(filename).to.match(/\.jpg$/);
    });
  });
});
