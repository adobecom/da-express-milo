import type { CsvRow, QaCheck, QaResult } from '../types';
import { upsertMetadataBlockOnDoc, serializeDoc } from './metadata';

/** Fields that get a `data-doc-key` DOM marker so Document Manager can edit them surgically. */
export const EDITABLE_FIELD_KEYS = ['title', 'short_title', 'description'] as const;
export type EditableFieldKey = typeof EDITABLE_FIELD_KEYS[number];

export function applyTemplate(templateHtml: string, row: CsvRow): string {
  let html = templateHtml;
  for (const [key, value] of Object.entries(row)) {
    if (key === '_id') continue;
    // replaceAll on a string literal (not regex) handles special chars safely
    html = html.split(`{{${key}}}`).join(value);
  }
  return html;
}

export function rowToOutputPath(row: CsvRow, outputDir: string): string {
  const slug = row['url_slug']?.trim() || `doc-${row['_id']}`;
  return `${outputDir.replace(/\/$/, '')}/${slug}`;
}

/**
 * Tags whichever leaf element currently holds each editable field's exact substituted value
 * with `data-doc-key="<field>"` — annotating whatever the template already produced rather
 * than requiring template authors to add anything. Document Manager's edit-write targets
 * `[data-doc-key="key"]` directly instead of guessing DOM position.
 */
export function tagEditableFieldsOnDoc(doc: Document, values: Partial<Record<string, string>>): void {
  for (const key of EDITABLE_FIELD_KEYS) {
    const value = values[key]?.trim();
    if (!value) continue;
    const el = Array.from(doc.body.querySelectorAll('*')).find(
      (node) => node.children.length === 0 && node.textContent?.trim() === value,
    );
    if (el && !el.hasAttribute('data-doc-key')) el.setAttribute('data-doc-key', key);
  }
}

export function tagEditableFields(html: string, values: Partial<Record<string, string>>): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  tagEditableFieldsOnDoc(doc, values);
  return serializeDoc(doc);
}

/**
 * Runs once per generate, after `applyTemplate`, in a single DOMParser pass: tags the
 * editable fields (see `tagEditableFieldsOnDoc`) and upserts identity/provenance metadata
 * into the document's Metadata block. `generatedBatch` is set/overwritten only by Generate —
 * a Document Manager edit later must never bump it, since it answers "which Generate run
 * produced this templated content," not "when was this doc last touched by anyone."
 */
export function finalizeGeneratedDoc(html: string, row: CsvRow, opts: { generatedBatch: string }): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  tagEditableFieldsOnDoc(doc, row);

  const entries: Record<string, string> = {
    'generated-batch': opts.generatedBatch,
    'last-updated': new Date().toISOString(),
  };
  if (row.product_type?.trim()) entries['product-type'] = row.product_type.trim();
  if (row.product_id?.trim()) entries['product-id'] = row.product_id.trim();
  upsertMetadataBlockOnDoc(doc, entries);

  return serializeDoc(doc);
}

export function runGenerationQa(html: string): QaResult {
  const unsubstituted = [...new Set([...html.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]))];
  const pass = unsubstituted.length === 0;
  const checks: QaCheck[] = [{
    id: 'unsubstituted-placeholders',
    label: 'Placeholder substitution',
    description: pass
      ? 'All template placeholders were successfully replaced.'
      : `These placeholders were not replaced: ${unsubstituted.join(', ')}.`,
    pass,
  }];
  return { pass, checks };
}

export function runPageQa(pageHtml: string): QaResult {
  const doc = new DOMParser().parseFromString(pageHtml, 'text/html');
  const hasTitle = !!doc.querySelector('title')?.textContent?.trim();
  const hasDesc = !!doc.querySelector('meta[name="description"]')?.getAttribute('content');
  const hasOgImage = !!doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
  const unsubstituted = [...new Set([...pageHtml.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]))];

  const checks: QaCheck[] = [
    {
      id: 'missing-page-title',
      label: 'Page title',
      description: hasTitle ? 'The page has a <title> element.' : 'The page has no <title> element or it is empty.',
      pass: hasTitle,
    },
    {
      id: 'missing-meta-description',
      label: 'Meta description',
      description: hasDesc ? 'The page has a <meta name="description"> with content.' : 'The page has no <meta name="description"> with content.',
      pass: hasDesc,
    },
    {
      id: 'missing-og-image',
      label: 'OG image',
      description: hasOgImage ? 'The page has a <meta property="og:image"> with content.' : 'The page has no <meta property="og:image"> with content.',
      pass: hasOgImage,
    },
    {
      id: 'unsubstituted-placeholders',
      label: 'Placeholder substitution',
      description: unsubstituted.length === 0
        ? 'All template placeholders were successfully replaced.'
        : `These placeholders were not replaced: ${unsubstituted.join(', ')}.`,
      pass: unsubstituted.length === 0,
    },
  ];
  return { pass: checks.every((c) => c.pass), checks };
}
