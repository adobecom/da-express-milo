const CONTENT_TYPE = 'text/plain; charset=utf-8';

const LINK_BLOCK_DOWNLOAD = 'http://ns.adobe.com/adobecloud/rel/download';

function extractLinkHref(links, rel) {
  const link = links?.[rel];
  if (!link) return null;
  const item = Array.isArray(link) ? link[0] : link;
  return item?.href?.replace(/\{[^}]*\}.*$/, '') || null;
}

function resolveEnvName() {
  const { hostname } = window.location;
  if (hostname.includes('localhost') || hostname.includes('.local.')) return 'local';
  if (
    hostname.endsWith('.hlx.page')
    || hostname.endsWith('.hlx.live')
    || hostname.includes('stage')
    || hostname.includes('adobe-stage')
  ) return 'stage';
  return 'prod';
}

let cachedService = null;

async function ensureImsReady() {
  if (window.adobeIMS) return;
  const { getLibs } = await import('../../scripts/utils.js');
  const { loadIms } = await import(`${getLibs()}/utils/utils.js`);
  await loadIms();
}

async function initService() {
  const { initUploadService } = await import('../../scripts/upload-service/dist/upload-service.min.es.js');
  return initUploadService({ environment: resolveEnvName() });
}

export async function prewarmAcpUpload() {
  await ensureImsReady();
  const isUser = window?.adobeIMS?.isSignedInUser?.() ?? false;
  if (cachedService?.isUser === isUser) return cachedService.promise;

  const promise = initService();
  promise.catch(() => {
    if (cachedService?.promise === promise) cachedService = null;
  });
  cachedService = { isUser, promise };
  return promise;
}

async function getUploadService(isUser) {
  if (cachedService?.isUser === isUser) {
    try {
      return await cachedService.promise;
    } catch {
      cachedService = null;
    }
  }
  const uploadService = await initService();
  cachedService = { isUser, promise: Promise.resolve(uploadService) };
  return uploadService;
}

export async function uploadFontTextToAcp(glyphString) {
  await ensureImsReady();
  const blob = new Blob([glyphString], { type: CONTENT_TYPE });
  const isUser = window?.adobeIMS?.isSignedInUser?.() ?? false;
  const uploadService = await getUploadService(isUser);

  const { asset } = await uploadService.uploadAsset({
    file: blob,
    fileName: 'font-generator-text.txt',
    contentType: CONTENT_TYPE,
  });

  if (isUser) {
    const downloadLinkUrl = extractLinkHref(asset.links, LINK_BLOCK_DOWNLOAD);
    if (!downloadLinkUrl) throw new Error('ACP download link missing from asset');
    return { type: 'user', value: btoa(downloadLinkUrl) };
  }

  const presignedUrl = await uploadService.generatePreSignedUrl({ asset });
  return { type: 'guest', value: btoa(presignedUrl) };
}
