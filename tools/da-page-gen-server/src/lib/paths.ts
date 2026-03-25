import { config } from '../config.js';

/** /drafts/foo  →  /adobecom/da-express-milo/drafts/foo */
export function toSourcePath(webPath: string): string {
  const p = webPath.startsWith('/') ? webPath : `/${webPath}`;
  return `/${config.org}/${config.repo}${p}`;
}

/** /adobecom/da-express-milo/drafts/foo  →  /drafts/foo */
export function toWebPath(sourcePath: string): string {
  const prefix = `/${config.org}/${config.repo}`;
  return sourcePath.startsWith(prefix) ? sourcePath.slice(prefix.length) : sourcePath;
}

/** Strips trailing .html extension if present */
export function stripHtml(path: string): string {
  return path.endsWith('.html') ? path.slice(0, -5) : path;
}

/** Ensures path ends with .html */
export function ensureHtml(path: string): string {
  return path.endsWith('.html') ? path : `${path}.html`;
}

/**
 * Parse an AEM CDN URL to extract org, repo, and pathname.
 * AEM URL format: https://{branch}--{repo}--{org}.aem.page/{path}
 *                 https://{branch}--{repo}--{org}.aem.live/{path}
 * Returns null for non-AEM URLs.
 */
export function parseAemUrl(url: string): { org: string; repo: string; pathname: string } | null {
  try {
    const u = new URL(url);
    const match = u.hostname.match(/^[^.]+--([^.]+)--([^.]+)\.aem\.(page|live)$/);
    if (!match) return null;
    const repo = match[1];
    const org = match[2];
    const pathname = u.pathname.replace(/\/$/, '') || '/';
    return { org, repo, pathname };
  } catch {
    return null;
  }
}

/**
 * Derive the da.live edit URL from a DA source path.
 * /adobecom/da-express-milo/drafts/foo.html → https://da.live/edit#/adobecom/da-express-milo/drafts/foo
 */
export function toEditUrl(sourcePath: string): string {
  return `https://da.live/edit#${stripHtml(sourcePath)}`;
}
