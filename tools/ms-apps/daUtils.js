// eslint-disable-next-line import/no-unresolved
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

(async () => {
  try {
    const { context, token } = await DA_SDK;
    const { repo, path, ref } = context;
    const redirectPath = path.split('/').pop();

    let appHost = 'https://milostudio--milo--adobecom.aem.page';
    switch (ref) {
      case 'stage':
        appHost = 'https://milostudio-stage--milo--adobecom.aem.page';
        break;
      case 'dev':
        appHost = 'https://milostudio-dev--milo--adobecom.aem.page';
        break;
      case 'prod':
      default:
        appHost = 'https://milostudio--milo--adobecom.aem.page';
    }
    window.location.replace(
      `${appHost}/tools/da-apps/ms-apps.html?path=${redirectPath}&tenant=${repo}&ref=${ref}&token=${token}`,
    );
  } catch (error) {
    console.error('Error initializing DA_SDK:', error);
  }
})();
