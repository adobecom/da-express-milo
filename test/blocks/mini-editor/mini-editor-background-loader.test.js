import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import getCardBackgrounds from '../../../express/code/blocks/mini-editor/mini-editor-background-loader.js';

function validTemplate(id, renditionHref, componentHref) {
  return {
    id,
    status: 'approved',
    customLinks: { branchUrl: 'https://example.com' },
    behaviors: ['still'],
    pages: [{ rendition: { image: { thumbnail: { componentId: 'abc' } } } }],
    _links: {
      'http://ns.adobe.com/adobecloud/rel/rendition': { href: renditionHref },
      'http://ns.adobe.com/adobecloud/rel/component': { href: componentHref },
    },
  };
}

describe('mini-editor-background-loader', () => {
  let fetchStub;

  afterEach(() => {
    fetchStub?.restore();
  });

  describe('static collection (no collectionId)', () => {
    it('returns the bundled static cards without calling fetch', async () => {
      fetchStub = sinon.stub(window, 'fetch');
      const cards = await getCardBackgrounds({ limit: 8, codeRoot: '/express/code' });
      expect(fetchStub.called).to.be.false;
      expect(cards).to.have.length(8);
      cards.forEach((card) => {
        expect(card.id).to.match(/^urn:aaid:sc:VA6C2:/);
        expect(card.bg).to.equal(`/express/code/blocks/mini-editor/img/${card.bg.split('/').pop()}`);
      });
    });

    it('honours the limit and resolves image paths against codeRoot', async () => {
      const cards = await getCardBackgrounds({ limit: 3, codeRoot: '/foo' });
      expect(cards).to.have.length(3);
      expect(cards[0].bg).to.equal('/foo/blocks/mini-editor/img/image1.jpg');
    });

    it('resolves against an empty base when codeRoot is not provided', async () => {
      const cards = await getCardBackgrounds({ limit: 1 });
      expect(cards[0].bg).to.equal('/blocks/mini-editor/img/image1.jpg');
    });

    it('caps at the full static collection size even if limit exceeds it', async () => {
      const cards = await getCardBackgrounds({ limit: 50, codeRoot: '' });
      expect(cards).to.have.length(10);
    });
  });

  describe('dynamic collection (collectionId set)', () => {
    it('fetches templates and maps them to { id, bg } using the thumbnail helper', async () => {
      const items = [
        validTemplate('urn:1', 'https://cdn/rendition/1', 'https://cdn/component/1'),
        validTemplate('urn:2', 'https://cdn/rendition/2', 'https://cdn/component/2'),
      ];
      fetchStub = sinon.stub(window, 'fetch').resolves({ json: async () => ({ items }) });
      const cards = await getCardBackgrounds({ limit: 8, collectionId: 'urn:collection:1' });
      expect(fetchStub.calledOnce).to.be.true;
      const [calledUrl] = fetchStub.firstCall.args;
      expect(calledUrl).to.contain('collectionId=urn:collection:1');
      expect(cards).to.deep.equal([
        { id: 'urn:1', bg: 'https://cdn/rendition/1' },
        { id: 'urn:2', bg: 'https://cdn/rendition/2' },
      ]);
    });

    it('filters out templates that fail validity checks', async () => {
      const items = [
        validTemplate('urn:1', 'https://cdn/rendition/1', 'https://cdn/component/1'),
        { id: 'urn:bad', status: 'pending' },
      ];
      fetchStub = sinon.stub(window, 'fetch').resolves({ json: async () => ({ items }) });
      const cards = await getCardBackgrounds({ limit: 8, collectionId: 'urn:collection:1' });
      expect(cards).to.have.length(1);
      expect(cards[0].id).to.equal('urn:1');
    });

    it('respects limit even when more valid items are returned', async () => {
      const items = [
        validTemplate('urn:1', 'https://cdn/rendition/1', 'https://cdn/component/1'),
        validTemplate('urn:2', 'https://cdn/rendition/2', 'https://cdn/component/2'),
        validTemplate('urn:3', 'https://cdn/rendition/3', 'https://cdn/component/3'),
      ];
      fetchStub = sinon.stub(window, 'fetch').resolves({ json: async () => ({ items }) });
      const cards = await getCardBackgrounds({ limit: 2, collectionId: 'urn:collection:1' });
      expect(cards).to.have.length(2);
    });

    it('returns an empty array when the API returns no items', async () => {
      fetchStub = sinon.stub(window, 'fetch').resolves({ json: async () => ({ items: [] }) });
      const cards = await getCardBackgrounds({ limit: 8, collectionId: 'urn:collection:1' });
      expect(cards).to.deep.equal([]);
    });

    it('returns an empty array when the API response has no items field', async () => {
      fetchStub = sinon.stub(window, 'fetch').resolves({ json: async () => ({}) });
      const cards = await getCardBackgrounds({ limit: 8, collectionId: 'urn:collection:1' });
      expect(cards).to.deep.equal([]);
    });

    it('includes topics in the request when provided', async () => {
      fetchStub = sinon.stub(window, 'fetch').resolves({ json: async () => ({ items: [] }) });
      await getCardBackgrounds({ limit: 8, collectionId: 'urn:collection:1', topics: 'nature' });
      const [calledUrl] = fetchStub.firstCall.args;
      expect(calledUrl).to.contain('filters=topics==nature');
    });
  });
});
