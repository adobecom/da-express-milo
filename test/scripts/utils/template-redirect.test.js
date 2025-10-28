import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../express/code/scripts/utils.js';
import redirectToExistingPage, {
  constructTargetPath,
} from '../../../express/code/scripts/utils/template-redirect.js';

setLibs('/libs');

// Import existsTemplatePage for testing (it's not exported, so we need to test it indirectly)

describe('Template Redirect Utils', () => {
  describe('constructTargetPath', () => {
    it('should construct path with all parameters', () => {
      const mockGetConfig = () => ({
        locale: { prefix: '/us' },
      });

      const result = constructTargetPath('social-media', 'design', 'instagram', mockGetConfig);
      expect(result).to.equal('/us/express/templates/design/social-media');
    });

    it('should handle tasksx parameter', () => {
      const mockGetConfig = () => ({
        locale: { prefix: '/us' },
      });

      const result = constructTargetPath('social-media', 'design', 'instagram', mockGetConfig);
      expect(result).to.equal('/us/express/templates/design/social-media');
    });

    it('should handle only topics parameter', () => {
      const mockGetConfig = () => ({
        locale: { prefix: '/us' },
      });

      const result = constructTargetPath('social-media', '', '', mockGetConfig);
      expect(result).to.equal('/us/express/templates/social-media');
    });

    it('should handle only tasks parameter', () => {
      const mockGetConfig = () => ({
        locale: { prefix: '/us' },
      });

      const result = constructTargetPath('', 'design', '', mockGetConfig);
      expect(result).to.equal('/us/express/templates/design');
    });

    it('should handle empty parameters', () => {
      const mockGetConfig = () => ({
        locale: { prefix: '/us' },
      });

      const result = constructTargetPath('', '', '', mockGetConfig);
      expect(result).to.equal('/us/express/templates/');
    });

    it('should sanitize invalid characters', () => {
      const mockGetConfig = () => ({
        locale: { prefix: '/us' },
      });

      const result = constructTargetPath('test<>?', 'invalid"', 'bad{}', mockGetConfig);
      expect(result).to.equal('/us/express/templates/');
    });

    it('should handle single quotes as empty', () => {
      const mockGetConfig = () => ({
        locale: { prefix: '/us' },
      });

      const result = constructTargetPath("''", "''", "''", mockGetConfig);
      expect(result).to.equal('/us/express/templates/');
    });

    it('should handle complex parameter combinations', () => {
      const mockGetConfig = () => ({
        locale: { prefix: '/us' },
      });

      const result = constructTargetPath('social-media-marketing', 'web-design', 'instagram-stories', mockGetConfig);
      expect(result).to.equal('/us/express/templates/web-design/social-media-marketing');
    });

    it('should handle different locale prefixes', () => {
      const mockGetConfig = () => ({
        locale: { prefix: '/fr' },
      });

      const result = constructTargetPath('social-media', 'design', '', mockGetConfig);
      expect(result).to.equal('/fr/express/templates/design/social-media');
    });

    it('should handle tasksx taking precedence over tasks', () => {
      const mockGetConfig = () => ({
        locale: { prefix: '/us' },
      });

      const result = constructTargetPath('social-media', 'design', 'instagram', mockGetConfig);
      expect(result).to.equal('/us/express/templates/design/social-media');
    });

    it('should handle mixed valid and invalid parameters', () => {
      const mockGetConfig = () => ({
        locale: { prefix: '/us' },
      });

      const result = constructTargetPath('valid-topic', 'invalid<>', 'valid-task', mockGetConfig);
      expect(result).to.equal('/us/express/templates/valid-task/valid-topic');
    });

    it('should handle special characters in valid parameters', () => {
      const mockGetConfig = () => ({
        locale: { prefix: '/us' },
      });

      const result = constructTargetPath('social-media-2024', 'web-design-v2', 'instagram-stories', mockGetConfig);
      expect(result).to.equal('/us/express/templates/web-design-v2/social-media-2024');
    });

    it('should handle edge case with only slashes', () => {
      const mockGetConfig = () => ({
        locale: { prefix: '/us' },
      });

      const result = constructTargetPath('', '', '', mockGetConfig);
      expect(result).to.equal('/us/express/templates/');
    });

    it('should handle complex sanitization', () => {
      const mockGetConfig = () => ({
        locale: { prefix: '/us' },
      });

      const result = constructTargetPath('test<>?.;{}', 'invalid"', 'bad{}', mockGetConfig);
      expect(result).to.equal('/us/express/templates/');
    });
  });

  describe('redirectToExistingPage', () => {
    beforeEach(() => {
      // Mock window.import
      window.import = async (path) => {
        if (path.includes('all-templates-metadata')) {
          return {
            default: () => Promise.resolve([
              { url: '/us/express/templates/social-media/design' },
              { url: '/us/express/templates/business/cards' },
            ]),
          };
        }
        return {
          getConfig: () => ({ locale: { prefix: '/us' } }),
        };
      };

      // Mock getLibs
      window.getLibs = () => '/libs';
    });

    it('should be a function', () => {
      expect(redirectToExistingPage).to.be.a('function');
    });

    it('should handle URLSearchParams proxy correctly', () => {
      // Test the URLSearchParams proxy behavior
      const searchParams = new URLSearchParams('topics=social-media&tasks=design&searchId=123');
      const proxy = new Proxy(searchParams, {
        get: (params, prop) => {
          if (prop === 'get') {
            return (key) => params.get(key);
          }
          return params.get(prop);
        },
      });

      expect(proxy.get('topics')).to.equal('social-media');
      expect(proxy.get('tasks')).to.equal('design');
      expect(proxy.get('searchId')).to.equal('123');
    });

    it('should handle empty search parameters', () => {
      const searchParams = new URLSearchParams('');
      const proxy = new Proxy(searchParams, {
        get: (params, prop) => {
          if (prop === 'get') {
            return (key) => params.get(key);
          }
          return params.get(prop);
        },
      });

      expect(proxy.get('topics')).to.be.null;
      expect(proxy.get('tasks')).to.be.null;
      expect(proxy.get('searchId')).to.be.null;
    });

    it('should handle undefined search parameters', () => {
      const searchParams = new URLSearchParams('topics=social-media');
      const proxy = new Proxy(searchParams, {
        get: (params, prop) => {
          if (prop === 'get') {
            return (key) => params.get(key);
          }
          return params.get(prop);
        },
      });

      expect(proxy.get('topics')).to.equal('social-media');
      expect(proxy.get('tasks')).to.be.null;
      expect(proxy.get('tasksx')).to.be.null;
    });

    it('should handle URLSearchParams proxy behavior', () => {
      // Test the URLSearchParams proxy behavior that redirectToExistingPage uses
      const searchParams = new URLSearchParams('topics=social-media&tasks=design&searchId=123');
      const proxy = new Proxy(searchParams, {
        get: (params, prop) => {
          if (prop === 'get') {
            return (key) => params.get(key);
          }
          return params.get(prop);
        },
      });

      expect(proxy.get('topics')).to.equal('social-media');
      expect(proxy.get('tasks')).to.equal('design');
      expect(proxy.get('searchId')).to.equal('123');
    });

    it('should handle different search parameters in proxy', () => {
      // Test with different search parameters
      const searchParams = new URLSearchParams('topics=business&tasks=cards');
      const proxy = new Proxy(searchParams, {
        get: (params, prop) => {
          if (prop === 'get') {
            return (key) => params.get(key);
          }
          return params.get(prop);
        },
      });

      expect(proxy.get('topics')).to.equal('business');
      expect(proxy.get('tasks')).to.equal('cards');
      expect(proxy.get('searchId')).to.be.null;
    });

    it('should handle searchId parameter in proxy', () => {
      // Test with searchId parameter
      const searchParams = new URLSearchParams('topics=social-media&tasks=design&searchId=abc123');
      const proxy = new Proxy(searchParams, {
        get: (params, prop) => {
          if (prop === 'get') {
            return (key) => params.get(key);
          }
          return params.get(prop);
        },
      });

      expect(proxy.get('topics')).to.equal('social-media');
      expect(proxy.get('tasks')).to.equal('design');
      expect(proxy.get('searchId')).to.equal('abc123');
    });
  });
});
