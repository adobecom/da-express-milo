# Download Plugin

> Client-side file generation and download system for Color Explorer themes and gradients.

## Overview

The Download plugin handles all file generation and download operations entirely in the browser. No server endpoints are involved — files are generated using the Canvas API, SVG string building, and binary ArrayBuffer construction, then downloaded via Blob + URL.createObjectURL + transient anchor elements.

## Features

- **ASE Export** — Adobe Swatch Exchange binary file generation (RGB, CMYK, HSV, LAB)
- **JPEG Export** — Canvas-rendered theme images with swatch cards and branding
- **Pantone JPEG** — Specialized layout for Pantone-branded themes
- **PNG Gradient** — Canvas-rendered linear gradient images
- **SVG Gradient** — XML markup generation for vector gradients
- **Recolor SVG** — Download recolored artwork as SVG
- **Clipboard Export** — Copy theme/gradient code in CSS, SCSS, LESS, or XML format

## Configuration

- **Feature Flag:** `ENABLE_DOWNLOAD`
- **Plugin Type:** Logic-only (`BasePlugin`) — no HTTP/API calls

## Topics

### File Downloads

| Topic | Description |
|-------|-------------|
| `download.file.ase` | Generate and download ASE swatch file |
| `download.file.jpeg` | Generate and download theme JPEG image |
| `download.file.pantoneJpeg` | Generate and download Pantone-branded JPEG |
| `download.file.png` | Generate and download gradient PNG image |
| `download.file.svg` | Generate and download gradient SVG file |
| `download.file.recolorSvg` | Download recolored SVG artwork |

### Code Exports (Clipboard)

| Topic | Description |
|-------|-------------|
| `download.export.css` | Copy theme/gradient as CSS to clipboard |
| `download.export.scss` | Copy theme as SCSS variables to clipboard |
| `download.export.less` | Copy theme as LESS variables to clipboard |
| `download.export.xml` | Copy theme as XML palette to clipboard |

## Action Groups

| Group | Class | Topics |
|-------|-------|--------|
| `file` | `FileDownloadActions` | All `download.file.*` topics |
| `export` | `ExportActions` | All `download.export.*` topics |

## Usage

### Via Provider (Recommended)

```javascript
import { serviceManager } from './services/index.js';

const download = await serviceManager.getProvider('download');

// File downloads
await download.downloadASE(themeData);
await download.downloadJPEG(themeData);
await download.downloadPantoneJPEG(themeData);
await download.downloadPNG(gradientData);
await download.downloadSVG(gradientData);
await download.downloadRecolorSVG({ svgString, name });

// Clipboard exports
await download.exportCSS(themeData);
await download.exportSCSS(themeData);
await download.exportLESS(themeData);
await download.exportXML(themeData);
```

### Via Plugin (Direct)

```javascript
import { serviceManager } from './services/index.js';
import { DownloadTopics } from './plugins/download/topics.js';

const plugin = await serviceManager.loadPlugin('download');
await plugin.dispatch(DownloadTopics.FILE.ASE, themeData);
await plugin.dispatch(DownloadTopics.EXPORT.CSS, themeData);
```

## Data Shapes

### ThemeData (for themes)

```javascript
{
  name: 'My Theme',
  swatches: [
    {
      hex: 'FF5733',           // no # prefix
      rgb: { r: 1.0, g: 0.34, b: 0.2 },  // normalized 0-1
      cmyk: { c: 0, m: 0.66, y: 0.8, k: 0 },
      lab: { l: 0.55, a: 0.68, b: 0.72 },
      pantone: 'PANTONE 185 C',
      isSpotColor: true,
    }
  ],
  colorMode: 'rgb',  // 'rgb' | 'cmyk' | 'hsv' | 'lab'
  assetType: 'theme', // 'theme' | 'gradient'
  order: [0, 1, 2],  // optional swatch reordering
}
```

### GradientData (for gradients)

```javascript
{
  name: 'My Gradient',
  swatches: [
    {
      rgb: { r: 1.0, g: 0.0, b: 0.0 },
      offset: 0,        // gradient stop position 0-1
      midpoint: 0.5,     // gradient midpoint (default 0.5)
    }
  ],
  assetType: 'gradient',
}
```

### RecolorData

```javascript
{
  svgString: '<svg>...</svg>',
  name: 'artwork-name',
}
```

## Asset Type → Available Formats

| Asset Type | File Downloads | Code Exports |
|-----------|---------------|--------------|
| `theme` | ASE, JPEG | CSS, SCSS, LESS, XML |
| `gradient` | PNG, SVG | CSS only |

## Platform Notes

- ASE downloads should be disabled on iOS (ASE files cannot be opened there)
- Clipboard operations require secure context (HTTPS)
- Canvas rendering uses `adobe-clean` font family with sans-serif fallback

## Authentication

The plugin itself does not enforce authentication. Authentication gating should be handled at the UI layer before calling download methods. The recommended pattern is:

1. Check auth state via `AuthStateProvider`
2. If not logged in, persist download intent to `localStorage` and trigger sign-in
3. On sign-in callback, restore and execute the download

## Related Files

- `DownloadPlugin.js` — Main plugin class (extends BasePlugin)
- `topics.js` — Topic definitions
- `constants.js` — Layout specs, sizes, and MIME types
- `actions/DownloadActions.js` — FileDownloadActions and ExportActions groups
- `actions/helpers.js` — Pure utility functions for ASE encoding, canvas rendering, color conversion, and gradient building
- `../../providers/DownloadProvider.js` — Consumer-friendly provider API

---

**Version:** 1.0
**Last Updated:** February 2026
