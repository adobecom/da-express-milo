#!/usr/bin/env node
/**
 * Build a kitchen-sink demo page for a block by extracting that block's authored
 * subtree(s) from an existing authored page (e.g. a nala draft) and wrapping
 * them in the DA page skeleton. Optionally uploads the result to
 * docs/library/kitchen-sink/<block>.html.
 *
 * Extraction keeps only the target block (balanced <div> matching), so a
 * multi-block test page yields a clean, block-focused kitchen-sink page.
 *
 * Usage:
 *   DA_TOKEN=$(da-auth-helper token) node make-kitchen-sink.mjs \
 *     --block discovery-table \
 *     --source /adobecom/da-express-milo/drafts/nala/blocks/discovery-table/discovery-table.html \
 *     [--org adobecom] [--repo da-express-milo] [--out <file>] [--upload]
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const arg = (n, fb) => {
  const i = process.argv.indexOf(n);
  if (i === -1) return fb;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
};

const block = arg('--block');
const source = arg('--source');
const org = arg('--org', 'adobecom');
const repo = arg('--repo', 'da-express-milo');
const outFile = arg('--out', `.qa-screendiff/kitchen-sink/${block}.html`);
const doUpload = arg('--upload', false) === true;
const token = process.env.DA_TOKEN;

if (!block || !source || !token) {
  process.stderr.write('Need --block, --source and env DA_TOKEN.\n');
  process.exit(1);
}

// Pull one block subtree starting at `start`, matching <div>…</div> depth.
function balancedDiv(html, start) {
  const tagRe = /<\/?div\b[^>]*>/g;
  tagRe.lastIndex = start;
  let depth = 0;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = tagRe.exec(html)) !== null) {
    if (m[0].startsWith('</')) {
      depth -= 1;
      if (depth === 0) return html.slice(start, m.index + m[0].length);
    } else {
      depth += 1;
    }
  }
  return null;
}

// All subtrees whose opening div's FIRST class token is exactly `block`.
function extractBlockInstances(html, name) {
  const out = [];
  const openRe = new RegExp(`<div class="${name}( [^"]*)?"`, 'g');
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = openRe.exec(html)) !== null) {
    const sub = balancedDiv(html, m.index);
    if (sub) out.push(sub);
  }
  return out;
}

const res = await fetch(`https://admin.da.live/source${source}`, {
  headers: { Authorization: `Bearer ${token}` },
});
if (!res.ok) { process.stderr.write(`source fetch failed: ${res.status}\n`); process.exit(1); }
let html = await res.text();
if (html.trimStart().startsWith('"')) { try { html = JSON.parse(html); } catch { /* raw */ } }

const instances = extractBlockInstances(html, block);
if (instances.length === 0) {
  process.stderr.write(`No <div class="${block}"> found in source ${source}\n`);
  process.exit(1);
}

// Each instance in its own section div.
const body = instances.map((h) => `      <div>${h}</div>`).join('\n');
const page = `<body>
  <header></header>
  <main>
${body}
  </main>
  <footer></footer>
</body>
`;

mkdirSync(path.dirname(outFile), { recursive: true });
writeFileSync(outFile, page);
process.stdout.write(`${block}: extracted ${instances.length} instance(s) → ${outFile}\n`);

if (doUpload) {
  const dest = `/${org}/${repo}/docs/library/kitchen-sink/${block}.html`;
  const form = new FormData();
  form.append('data', new Blob([page], { type: 'text/html' }));
  const up = await fetch(`https://admin.da.live/source${dest}`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
  });
  process.stdout.write(`  upload ${dest} → ${up.status}${up.ok ? ' ✓' : ' ✗'}\n`);
  if (up.ok) {
    process.stdout.write(`  edit:    https://da.live/edit#${dest.replace(/\.html$/, '')}\n`);
    process.stdout.write(`  preview: https://main--${repo}--${org}.aem.page/docs/library/kitchen-sink/${block}\n`);
  }
}
