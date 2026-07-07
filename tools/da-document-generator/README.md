# DA Document Generator

A browser-based tool for bulk-generating DA (Document Authoring) pages from product data and one or more DA document templates.

For a full technical walkthrough of every module and how they interact, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## What it does

1. **Provide product data** — paste Zazzle product IDs directly, or upload a `.csv`/`.xlsx` file. Optionally run **Validate** (confirm each ID resolves to a real Zazzle product) and/or **Hydrate** (fill in missing columns — `title`, `short_title`, `description`, `url_slug`, etc. — from the matching Zazzle product, flagging anything that differs from manually-entered data). Duplicate product IDs/slugs and content issues (title length, casing, encoding, etc.) are surfaced inline. Additional columns beyond the recognized fields are substituted into the template as `{{column_name}}` placeholders.
2. **Confirm routing** — a DA config sheet maps each row's `product_type` to a template path and output directory. Alternatively, check **Override template** to force every selected row through one chosen template/output directory regardless of product type. The tool validates the config sheet, the resolved template's structure, and the output directory before allowing generation.
3. **Select rows and generate** — choose which rows to include, then generate: the tool substitutes placeholders, runs a QA check for leftover placeholders, versions any existing document before overwriting it, and writes the resulting HTML to DA via the admin API.
4. **Preview, publish, unpublish, or delete** — per row or in bulk. Publishing additionally fetches the live page and QA-checks it for a title, meta description, and OG image.

## Usage

### From DA.live (typical)
This is how the tool is used the vast majority of the time. Open it as an app from within DA.live — the DA shell automatically injects an auth token (via `https://da.live/nx/utils/sdk.js`), so no token setup is required.

### Local dev (rare — running outside DA.live)
Only needed if you're running the app standalone, e.g. `npm run dev` opened directly in a plain browser tab rather than embedded in DA.live. In that case there's no DA shell to supply a token automatically, so you must provide one yourself:
```bash
npm install
# Set your DA token
echo "VITE_DA_TOKEN=your_token_here" > .env.local
npm run dev
```

### Build
```bash
npm run build
# Outputs to dist/ — committed to the repo so it can be served via da.live
```

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4
- TanStack Query
