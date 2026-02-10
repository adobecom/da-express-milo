import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import GalleryActions from '../../../../express/code/libs/services/plugins/stock/actions/GalleryActions.js';
import { StockTopics } from '../../../../express/code/libs/services/plugins/stock/topics.js';
import { CURATED_GALLERIES_STOCK } from '../../../../express/code/libs/services/plugins/stock/constants.js';

const mockSearchResult = {
  themes: [{ id: 1, title: 'Wilderness photo' }],
  nb_results: 50,
};

describe('GalleryActions', () => {
  let actions;
  let mockPlugin;

  beforeEach(() => {
    mockPlugin = {
      dispatch: sinon.stub().resolves(mockSearchResult),
    };
    actions = new GalleryActions(mockPlugin);
  });

  afterEach(() => sinon.restore());

  describe('getHandlers - action routing', () => {
    it('should return a handler for every StockTopics.GALLERY topic', () => {
      const handlers = actions.getHandlers();
      const expectedTopics = Object.values(StockTopics.GALLERY);

      expectedTopics.forEach((topic) => {
        expect(handlers).to.have.property(topic).that.is.a('function');
      });
    });

    it('should not contain any unexpected topic keys', () => {
      const handlers = actions.getHandlers();
      const handlerKeys = Object.keys(handlers);
      const expectedTopics = Object.values(StockTopics.GALLERY);

      expect(handlerKeys).to.have.lengthOf(expectedTopics.length);
      handlerKeys.forEach((key) => {
        expect(expectedTopics).to.include(key);
      });
    });
  });

  describe('getCuratedList', () => {
    it('should return an object with themes array', () => {
      const result = actions.getCuratedList();
      expect(result).to.have.property('themes').that.is.an('array');
    });

    it('should return all curated gallery names', () => {
      const result = actions.getCuratedList();
      const titles = result.themes.map((t) => t.title);
      expect(titles).to.deep.equal(CURATED_GALLERIES_STOCK);
    });

    it('should wrap each gallery name in an object with title property', () => {
      const result = actions.getCuratedList();
      result.themes.forEach((theme) => {
        expect(theme).to.have.property('title').that.is.a('string');
      });
    });
  });

  describe('getByName', () => {
    it('should dispatch SEARCH.FILES for a valid curated gallery name', async () => {
      const name = CURATED_GALLERIES_STOCK[0]; // 'Wilderness'
      await actions.getByName({ main: name });

      expect(mockPlugin.dispatch.calledOnce).to.be.true;
      expect(mockPlugin.dispatch.firstCall.args[0]).to.equal(StockTopics.SEARCH.FILES);
    });

    it('should pass criteria with main and query set to gallery name', async () => {
      const name = 'Wilderness';
      await actions.getByName({ main: name });

      const criteria = mockPlugin.dispatch.firstCall.args[1];
      expect(criteria.main).to.equal(name);
      expect(criteria.query).to.equal(name);
    });

    it('should return search results for a valid curated name', async () => {
      const result = await actions.getByName({ main: 'Wilderness' });
      expect(result).to.deep.equal(mockSearchResult);
    });

    it('should return undefined for a non-curated gallery name', async () => {
      const result = await actions.getByName({ main: 'NonExistentGallery' });
      expect(result).to.be.undefined;
      expect(mockPlugin.dispatch.called).to.be.false;
    });

    it('should accept criteria.query as an alias for main', async () => {
      await actions.getByName({ query: 'Flavour' });
      expect(mockPlugin.dispatch.calledOnce).to.be.true;
    });

    it('should return undefined when criteria is empty', async () => {
      const result = await actions.getByName({});
      expect(result).to.be.undefined;
    });

    it('should return undefined when criteria is null', async () => {
      const result = await actions.getByName(null);
      expect(result).to.be.undefined;
    });
  });
});
