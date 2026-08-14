/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import DownloadProvider from '../../../express/code/libs/services/providers/DownloadProvider.js';
import { DownloadTopics } from '../../../express/code/libs/services/plugins/download/topics.js';

// A fake plugin whose useAction() returns a spy keyed by topic, so each test
// can assert exactly which arguments the provider forwarded to the action
// layer — this is what silently dropped the `mode` argument for exportXML.
function createFakePlugin() {
  const spies = {};
  const plugin = {
    useAction: (groupName, topic) => {
      spies[topic] = sinon.stub().resolves({ format: topic, output: '', clipboardSuccess: true });
      return spies[topic];
    },
  };
  return { plugin, spies };
}

describe('DownloadProvider — mode forwarding', () => {
  it('exportXML forwards the mode argument to the action layer (regression: used to be dropped)', async () => {
    const { plugin, spies } = createFakePlugin();
    const provider = new DownloadProvider(plugin);
    const themeData = { name: 'Test', swatches: [] };

    await provider.exportXML(themeData, 'HEX');

    expect(spies[DownloadTopics.EXPORT.XML].calledWith(themeData, 'HEX')).to.be.true;
  });

  it('exportCSS/exportSCSS/exportLESS already forwarded mode correctly', async () => {
    const { plugin, spies } = createFakePlugin();
    const provider = new DownloadProvider(plugin);
    const themeData = { name: 'Test', swatches: [] };

    await provider.exportCSS(themeData, 'Lab');
    await provider.exportSCSS(themeData, 'HSB');
    await provider.exportLESS(themeData, 'RGB');

    expect(spies[DownloadTopics.EXPORT.CSS].calledWith(themeData, 'Lab')).to.be.true;
    expect(spies[DownloadTopics.EXPORT.SCSS].calledWith(themeData, 'HSB')).to.be.true;
    expect(spies[DownloadTopics.EXPORT.LESS].calledWith(themeData, 'RGB')).to.be.true;
  });
});
