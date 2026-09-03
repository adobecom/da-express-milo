import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import trackMiniEditorExport from '../../../express/code/scripts/utils/mini-editor-analytics.js';

describe('mini-editor analytics', () => {
  let trackStub;

  beforeEach(() => {
    trackStub = sinon.stub();
    // eslint-disable-next-line no-underscore-dangle
    window._satellite = { track: trackStub };
  });

  afterEach(() => {
    // eslint-disable-next-line no-underscore-dangle
    delete window._satellite;
    sinon.restore();
  });

  it('sends the existing sdm payload and an attached-format custom array', () => {
    trackMiniEditorExport({
      exportMethod: 'copy-clipboard',
      uiLocation: 'seo-discover-page-collapsible-row',
    });

    expect(trackStub.calledOnce).to.be.true;
    const [eventName, payload] = trackStub.firstCall.args;
    expect(eventName).to.equal('event');
    // eslint-disable-next-line no-underscore-dangle
    expect(payload.data._adobe_corpnew.sdm.event).to.deep.equal({
      pagename: 'export-project-complete-unauth',
      url: window.location.href,
    });
    // eslint-disable-next-line no-underscore-dangle
    expect(payload.data._adobe_corpnew.sdm.custom).to.deep.equal({
      export_method: 'copy-clipboard',
      ui: {
        location: 'seo-discover-page-collapsible-row',
      },
    });
    // eslint-disable-next-line no-underscore-dangle
    expect(payload.data._adobe_corpnew.custom).to.deep.equal([
      {
        propertyName: 'event.pagename',
        propertyValue: 'export-project-complete-unauth',
        propertyType: 'string',
      },
      {
        propertyName: 'event.url',
        propertyValue: window.location.href,
        propertyType: 'string',
      },
      {
        propertyName: 'event.workflow',
        propertyValue: 'export',
        propertyType: 'string',
      },
      {
        propertyName: 'event.type',
        propertyValue: 'success',
        propertyType: 'string',
      },
      {
        propertyName: 'event.subtype',
        propertyValue: 'export-project',
        propertyType: 'string',
      },
      {
        propertyName: 'event.category',
        propertyValue: 'WEB',
        propertyType: 'string',
      },
      {
        propertyName: 'event.subcategory',
        propertyValue: 'document',
        propertyType: 'string',
      },
      {
        propertyName: 'custom.export_method',
        propertyValue: 'copy-clipboard',
        propertyType: 'string',
      },
      {
        propertyName: 'custom.ui.location',
        propertyValue: 'seo-discover-page-collapsible-row',
        propertyType: 'string',
      },
    ]);
  });

  it('does not track when no export method is provided', () => {
    trackMiniEditorExport();
    expect(trackStub.called).to.be.false;
  });
});
