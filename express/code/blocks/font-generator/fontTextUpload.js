const CONTENT_TYPE = 'text/plain; charset=utf-8';
// ACP download link: GET this (with auth) → JSON { href: "<presigned-s3-url>" }.
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

// Cached { isUser, promise }. Service init (SDK load, plus the user's ACP temp-folder
// resolution for signed-in users) is content-independent, so it's done once and reused.
// Keyed by auth state since user/guest use different IMS tokens.
let cachedService = null;

async function initService() {
  const { initUploadService } = await import('../../scripts/upload-service/dist/upload-service.min.es.js');
  return initUploadService({ environment: resolveEnvName() });
}

// Kicks off service init ahead of a CTA click so the click can go straight to the upload.
// Safe to call speculatively; a later uploadFontTextToAcp() reuses or rebuilds the cache.
export function prewarmAcpUpload() {
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

// Uploads glyphString to ACP and returns a reference to carry into Express.
//   Signed-in user → { type: 'user', value: btoa(downloadLinkUrl) } — resolving it needs
//     the user's IMS token, so only the original user can read the content.
//   Guest → { type: 'guest', value: btoa(presignedUrl) } — a public capability URL.
export async function uploadFontTextToAcp(glyphString) {
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
