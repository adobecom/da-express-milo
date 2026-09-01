/**
 * Turn a content-relative file path (e.g. "content/express/pricing.html" or
 * "content/express/discover/index.html") into the live site path EDS serves
 * it at (e.g. "/express/pricing", "/express/discover"). Pure string logic —
 * takes an already-forward-slashed, root-relative path, not a filesystem path.
 */
export function toPagePath(relPath) {
  let p = relPath.replace(/^content\//, '');
  p = p.replace(/\.html$/, '');
  p = p.replace(/(^|\/)index$/, '');
  return `/${p}`.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
}
