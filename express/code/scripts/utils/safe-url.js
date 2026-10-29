const SAFE_INLINE_IMAGE_DATA_URL =
  /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/i;

function getSafeUrl(src, { allowInlineImageDataUrl = false } = {}) {
  let url;
  try {
    url = new URL(src, window.location.href);
  } catch {
    return null;
  }

  if (url.protocol === 'http:' || url.protocol === 'https:') {
    return url;
  }

  if (allowInlineImageDataUrl && SAFE_INLINE_IMAGE_DATA_URL.test(src)) {
    return url;
  }

  return null;
}

export default getSafeUrl;
