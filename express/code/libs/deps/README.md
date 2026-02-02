# Local Lit Fallback

This directory contains a local copy of Milo's `lit-all.min.js` as a **last-resort fallback**.

## Fallback Chain

When loading Lit (used by Spectrum Web Components), the system tries:

1. **Primary: Milo's Origin** - `${getLibs()}/deps/lit-all.min.js`
   - Dynamic based on environment (stage, local, prod)
   - Best option - uses same Lit as rest of Milo

2. **Fallback 1: CDN** - `https://cdn.jsdelivr.net/npm/lit@3.1.0/index.min.js`
   - If Milo is unreachable
   - Public CDN, widely cached

3. **Fallback 2: Local** - `/express/code/libs/deps/lit-all.min.js`
   - If both Milo and CDN fail
   - Ensures the site still works offline/degraded mode

## Files

- **`lit-all.min.js`** (35 KB) - Milo's bundled Lit library
  - Copied from: https://main--milo--adobecom.aem.live/libs/deps/lit-all.min.js
  - Version: Same as Milo's current version
  - Includes: Lit core + directives + decorators

## When to Update

Update this file when:
- Milo updates their Lit version
- Spectrum components require a newer Lit version
- Security vulnerabilities are found in Lit

## How to Update

```bash
cd express/code/libs/deps
curl -L --compressed -s https://main--milo--adobecom.aem.live/libs/deps/lit-all.min.js > lit-all.min.js
```

## Used By

- Color Explorer block (Spectrum tags in modals)
- See: `express/code/blocks/color-explorer/components/s2/loadLit.js`

## Why Not Use CDN Only?

- Milo's version is tested and compatible with Express codebase
- Local copy ensures offline/degraded mode still works
- Consistent with Express/Milo architecture patterns
