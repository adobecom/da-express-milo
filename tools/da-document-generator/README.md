# DA Document Generator

A browser-based tool for bulk-generating DA (Document Authoring) pages from a CSV data file and an existing DA document template.

## What it does

1. **Upload CSV** — provide a spreadsheet where each row represents a page to create. Required columns: `url_slug`, `title`, `short_title`. Additional columns are substituted into the template as `{{column_name}}` placeholders.
2. **Confirm template** — enter a DA document path (or da.live URL). The tool fetches the template, validates its structure, and reports any missing placeholders or structural issues.
3. **Generate** — for each CSV row, the tool substitutes placeholders, runs a QA check, writes the resulting HTML document to DA via the admin API, and optionally triggers preview/publish.

## Usage

### Local dev
```bash
npm install
# Set your DA token
echo "VITE_DA_TOKEN=your_token_here" > .env.local
npm run dev
```

### From DA.live
Open the tool from DA.live — the token is injected automatically via the DA shell.

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
