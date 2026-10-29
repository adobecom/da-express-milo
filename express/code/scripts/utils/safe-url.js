function getSafeUrl(src) {
  let url;
  try {
    url = new URL(src, window.location.href);
  } catch {
    return null;
  }

  if (url.protocol === 'http:' || url.protocol === 'https:') {
    return url.href;
  }

  return null;
}

export default getSafeUrl;