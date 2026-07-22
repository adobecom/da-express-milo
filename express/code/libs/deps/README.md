# Lit Library Dependencies

## Files

- `lit.js` - Browser-safe re-export wrapper
- `lit-all.min.js` - Bundled Lit library (35 KB)

## Purpose

Provides Lit library for Brad's Web Components in a Franklin-compatible way.

## Architecture

Franklin cannot resolve bare specifiers like `import { html } from 'lit'` without a bundler or import map.

**Solution:**
- Bundle Lit into `lit-all.min.js` (self-contained)
- Use `lit.js` as a re-export wrapper
- All imports use relative paths
- No build step needed

## Usage

Lit components import from this file:

```javascript
import { LitElement, html } from '../../../deps/lit.js';
```

## Loading Flow

```
Block (color-explore.js)
  ↓
Renderer (createStripsRenderer.js)
  ↓
Adapter (litComponentAdapters.js)
  ↓ Dynamic import()
Lit Component (color-palette/index.js)
  ↓ Static import
deps/lit.js (this file)
  ↓ Re-export
deps/lit-all.min.js (bundled Lit)
```

## Source

Copied from `color-poc` branch.
