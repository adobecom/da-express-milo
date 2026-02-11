import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import RedirectActions from '../../../../plugins/stock/actions/RedirectActions.js';
import { StockTopics } from '../../../../plugins/stock/topics.js';
import { ValidationError } from '../../../../core/Errors.js';

async function expectValidationError(fn, extraAssertions = () => {}) {
  try {
    await fn();
    expect.fail('Should have thrown');
  } catch (err) {
    expect(err).to.be.instanceOf(ValidationError);
    extraAssertions(err);
  }
}

describe('RedirectActions', () => {
  let actions;
  let mockPlugin;

  beforeEach(() => {
    mockPlugin = {
      endpoints: {
        redirect: 'https://stock.adobe.com',
        contributor: '/contributor',
      },
    };
    actions = new RedirectActions(mockPlugin);
  });

  afterEach(() => sinon.restore());

  describe('getHandlers - action routing', () => {
    it('should return a handler for every StockTopics.REDIRECT topic', () => {
      const handlers = actions.getHandlers();
      const expectedTopics = Object.values(StockTopics.REDIRECT);

      expectedTopics.forEach((topic) => {
        expect(handlers).to.have.property(topic).that.is.a('function');
      });
    });

    it('should not contain any unexpected topic keys', () => {
      const handlers = actions.getHandlers();
      const handlerKeys = Object.keys(handlers);
      const expectedTopics = Object.values(StockTopics.REDIRECT);

      expect(handlerKeys).to.have.lengthOf(expectedTopics.length);
      handlerKeys.forEach((key) => {
        expect(expectedTopics).to.include(key);
      });
    });
  });

  describe('getFileUrl', () => {
    it('should return correct URL for a numeric file ID', () => {
      const url = actions.getFileUrl(123456);
      expect(url).to.equal('https://stock.adobe.com/images/id/123456');
    });

    it('should return correct URL for a string file ID', () => {
      const url = actions.getFileUrl('789');
      expect(url).to.equal('https://stock.adobe.com/images/id/789');
    });

    it('should use default base when endpoints.redirect is missing', () => {
      mockPlugin.endpoints = {};
      const url = actions.getFileUrl(123);
      expect(url).to.equal('https://stock.adobe.com/images/id/123');
    });

    // Validation
    [
      { label: 'undefined', input: undefined },
      { label: 'null', input: null },
      { label: 'empty string', input: '' },
    ].forEach(({ label, input }) => {
      it(`should throw ValidationError for ${label} fileId`, () => {
        expectValidationError(() => actions.getFileUrl(input));
      });
    });

    it('should set correct error metadata on ValidationError', () => {
      expectValidationError(
        () => actions.getFileUrl(undefined),
        (err) => {
          expect(err.field).to.equal('fileId');
          expect(err.serviceName).to.equal('Stock');
          expect(err.topic).to.equal('REDIRECT.GET_FILE_URL');
        },
      );
    });
  });

  describe('getContributorUrl', () => {
    it('should return correct URL for a numeric creator ID', () => {
      const url = actions.getContributorUrl(42);
      expect(url).to.equal('https://stock.adobe.com/contributor/42');
    });

    it('should return correct URL for a string creator ID', () => {
      const url = actions.getContributorUrl('99');
      expect(url).to.equal('https://stock.adobe.com/contributor/99');
    });

    it('should use default base when endpoints.redirect is missing', () => {
      mockPlugin.endpoints = {};
      const url = actions.getContributorUrl(42);
      expect(url).to.equal('https://stock.adobe.com/contributor/42');
    });

    it('should use default contributor path when endpoints.contributor is missing', () => {
      delete mockPlugin.endpoints.contributor;
      const url = actions.getContributorUrl(42);
      expect(url).to.equal('https://stock.adobe.com/contributor/42');
    });

    // Validation
    [
      { label: 'undefined', input: undefined },
      { label: 'null', input: null },
      { label: 'empty string', input: '' },
    ].forEach(({ label, input }) => {
      it(`should throw ValidationError for ${label} creatorId`, () => {
        expectValidationError(() => actions.getContributorUrl(input));
      });
    });

    it('should set correct error metadata on ValidationError', () => {
      expectValidationError(
        () => actions.getContributorUrl(undefined),
        (err) => {
          expect(err.field).to.equal('creatorId');
          expect(err.serviceName).to.equal('Stock');
          expect(err.topic).to.equal('REDIRECT.GET_CONTRIBUTOR_URL');
        },
      );
    });
  });
});
