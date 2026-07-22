import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../express/code/scripts/utils.js';
import { getEnvironment } from '../../express/code/libs/services/config.js';
import { ConfigError } from '../../express/code/libs/services/core/Errors.js';

describe('services config', () => {
  it('throws ConfigError when Milo libs are not configured', async () => {
    setLibs(undefined, { hostname: 'example.com', search: '' });

    try {
      await getEnvironment();
      throw new Error('Expected ConfigError to be thrown');
    } catch (error) {
      expect(error).to.be.instanceOf(ConfigError);
      expect(error.code).to.equal('CONFIG_ERROR');
      expect(error.configKey).to.equal('libs');
    }
  });
});
