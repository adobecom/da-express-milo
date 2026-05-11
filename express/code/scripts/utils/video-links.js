function isFacebookVideoLink(url) {
  try {
    const { hostname, pathname, searchParams } = new URL(url);
    return /(^|\.)facebook[.]com$/.test(hostname) && (
      (pathname === '/plugins/video.php' && searchParams.has('href'))
      || pathname.includes('/videos/')
    );
  } catch {
    return false;
  }
}

export default function isVideoLink(url) {
  if (!url) return null;
  return url.includes('youtube.com/watch')
      || url.includes('youtu.be/')
      || url.includes('vimeo')
      || isFacebookVideoLink(url)
      || /^https?:[/][/]video[.]tv[.]adobe[.]com/.test(url)
      || /.*\/media_.*(mp4|webm|m3u8)$/.test(new URL(url).pathname);
}
