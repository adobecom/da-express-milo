import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../express/code/scripts/utils.js';
import loadShareMenuPlaceholders, {
  SHARE_MENU_PLACEHOLDERS,
} from '../../../express/code/scripts/widgets/share-menu-widget/placeholders.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

describe('share-menu-widget placeholders', () => {
  afterEach(() => {
    delete window.placeholders;
  });

  it('uses correctly cased fallbacks when placeholders are unresolved', async () => {
    const strings = await loadShareMenuPlaceholders({
      heading: { key: 'mini-editor-share-image', fallback: 'Share image' },
      whatsapp: SHARE_MENU_PLACEHOLDERS.whatsapp,
      moreOptions: SHARE_MENU_PLACEHOLDERS.moreOptions,
    });

    expect(strings).to.deep.equal({
      heading: 'Share image',
      whatsapp: 'WhatsApp',
      moreOptions: 'More options',
    });
  });

  it('loads caller and component placeholders in one component-owned lookup', async () => {
    window.placeholders = {
      'mini-editor-share-image': 'Partager une image',
      'share-menu-copy': 'Copier',
    };

    const strings = await loadShareMenuPlaceholders({
      heading: { key: 'mini-editor-share-image', fallback: 'Share image' },
      copy: SHARE_MENU_PLACEHOLDERS.copy,
    });

    expect(strings.heading).to.equal('Partager une image');
    expect(strings.copy).to.equal('Copier');
  });
});
