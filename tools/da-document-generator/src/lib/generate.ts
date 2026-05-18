import type { CsvRow, QaIssue, QaResult } from '../types';

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

export function runGenerationQa(html: string): QaResult {
  const unsubstituted = [...new Set([...html.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]))];
  const issues: QaIssue[] = unsubstituted.length > 0 ? [{
    id: 'unsubstituted-placeholders',
    label: 'Unsubstituted placeholders',
    description: `These template placeholders were not replaced: ${unsubstituted.join(', ')}.`,
  }] : [];
  return { pass: issues.length === 0, issues };
}

export function runPageQa(pageHtml: string): QaResult {
  const issues: QaIssue[] = [];
  const doc = new DOMParser().parseFromString(pageHtml, 'text/html');

  if (!doc.querySelector('title')?.textContent?.trim())
    issues.push({
      id: 'missing-page-title',
      label: 'Missing page title',
      description: 'The page has no <title> element or it is empty.',
    });

  if (!doc.querySelector('meta[name="description"]')?.getAttribute('content'))
    issues.push({
      id: 'missing-meta-description',
      label: 'Missing meta description',
      description: 'The page has no <meta name="description"> with content.',
    });

  if (!doc.querySelector('meta[property="og:image"]')?.getAttribute('content'))
    issues.push({
      id: 'missing-og-image',
      label: 'Missing og:image',
      description: 'The page has no <meta property="og:image"> with content.',
    });

  const unsubstituted = [...new Set([...pageHtml.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]))];
  if (unsubstituted.length > 0)
    issues.push({
      id: 'unsubstituted-placeholders',
      label: 'Unsubstituted placeholders',
      description: `These template placeholders were not replaced: ${unsubstituted.join(', ')}.`,
    });

  return { pass: issues.length === 0, issues };
}
