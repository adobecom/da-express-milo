# Spectrum Icons Catalog: Local Build Guide

Use this guide to build and preview the Spectrum icons catalog locally.

## Prerequisites

- Node.js and npm installed
- Repo cloned locally
- Dependencies installed:

```bash
npm install
```

## Build the icons catalog bundle

From repo root:

```bash
npm run build:spectrum:icons-catalog
```

This runs the Spectrum bundler with `ICONS_CATALOG=1` and updates the required files in:

- `express/code/scripts/widgets/spectrum/dist/`

## Run locally (recommended)

Do **not** use `file://` for reliable module loading.
Serve the repo over HTTP:

```bash
python3 -m http.server 8080
```

Then open:

`http://localhost:8080/dev/spectrum-icons-catalog.html`

## Quick verification

- The page should render a Spectrum icon grid
- Search input should filter icon names
- Express Figma icons section should be visible

## Troubleshooting

- Icons not showing:
  - Re-run `npm run build:spectrum:icons-catalog`
  - Hard refresh browser (`Cmd/Ctrl+Shift+R`)
  - Confirm URL is `http://localhost:8080/...`, not `file://...`
- Missing modules/errors:
  - Re-run `npm install`
  - Ensure command is run from repo root

## Add a new Express custom icon (`sp-icon-*`)

Use this when adding a custom icon from Figma to our local Spectrum icon system.

### 1) Export SVG from Figma node

Get file key + node id from Figma URL, then export as SVG:

```bash
TOKEN=$(head -n1 dev/16-figma/token.text | tr -d '\r\n')
FILE_KEY="<FIGMA_FILE_KEY>"
NODE_ID="<NODE_ID_COLON>" # e.g. 1398:255

META=$(curl -sS -H "X-Figma-Token: $TOKEN" \
  "https://api.figma.com/v1/images/$FILE_KEY?ids=$NODE_ID&format=svg")

URL=$(printf '%s' "$META" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);const id=process.argv[1];const u=j.images&&j.images[id];if(!u)process.exit(2);process.stdout.write(u);});" "$NODE_ID")

curl -sS "$URL" -o "express/code/icons/S2_Icon_Express_${NODE_ID/:/_}.svg"
```

### 2) Register icon in loader source

Edit:

- `express/code/scripts/widgets/spectrum/src/icons-express.js`

Add:

- A new icon class extending `ExpressIconBase`
- `defineElement('sp-icon-express-<node-id>', YourClassName)`

Keep the Spectrum-like API:

- `size` attribute (`xxs`, `xs`, `s`, `m`, `l`, `xl`, `xxl`)
- `label` attribute for accessibility
- `fill="currentColor"` so states/colors inherit from context

### 3) Add icon to local catalog page

Edit:

- `dev/spectrum-icons-catalog.html`

Add entry in `EXPRESS_ICONS` with the custom element tag, for example:

```js
{ id: 'sp-icon-express-1398-255', label: 'sp-icon-express-1398-255 (Figma 1398:255)', tag: 'sp-icon-express-1398-255' }
```

### 4) Build

```bash
npm run build:spectrum:icons-catalog
```

This regenerates:

- `express/code/scripts/widgets/spectrum/dist/icons-express.js`

### 5) Test locally

Serve and open catalog:

```bash
python3 -m http.server 8080
```

Open:

- `http://localhost:8080/dev/spectrum-icons-catalog.html`

Verify:

- Icon appears in Express section
- Search finds the icon id/tag
- `size` works (`xxs` to `xxl`)
- Colors/states follow `currentColor` from parent styles
