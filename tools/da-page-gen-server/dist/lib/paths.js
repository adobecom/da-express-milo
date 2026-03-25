import { config } from '../config.js';
/** /drafts/foo  →  /adobecom/da-express-milo/drafts/foo */
export function toSourcePath(webPath) {
    const p = webPath.startsWith('/') ? webPath : `/${webPath}`;
    return `/${config.org}/${config.repo}${p}`;
}
/** /adobecom/da-express-milo/drafts/foo  →  /drafts/foo */
export function toWebPath(sourcePath) {
    const prefix = `/${config.org}/${config.repo}`;
    return sourcePath.startsWith(prefix) ? sourcePath.slice(prefix.length) : sourcePath;
}
/** Strips trailing .html extension if present */
export function stripHtml(path) {
    return path.endsWith('.html') ? path.slice(0, -5) : path;
}
/** Ensures path ends with .html */
export function ensureHtml(path) {
    return path.endsWith('.html') ? path : `${path}.html`;
}
