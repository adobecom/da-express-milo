// Browser-safe Lit re-exports for Express Milo.
// Uses a locally bundled copy to avoid bare specifiers like "lit",
// which the Franklin runtime cannot resolve without a bundler/import map.
export * from './lit-all.min.js';
export { html, css, LitElement, classMap } from './lit-all.min.js';
