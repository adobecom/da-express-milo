import type { CsvRow, QaCheck, QaResult } from '../types';

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
