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
    suggestion: 'Add the missing CSV columns or fix the placeholder names in the template.',
  }] : [];
  return { pass: issues.length === 0, score: issues.length === 0 ? 100 : 0, issues };
}

export function runPreviewQa(pageHtml: string): QaResult {
  const issues: QaIssue[] = [];
  const doc = new DOMParser().parseFromString(pageHtml, 'text/html');

  if (!doc.querySelector('title')?.textContent?.trim())
    issues.push({
      id: 'missing-page-title',
      label: 'Missing page title tag',
      description: 'The rendered page has no <title> element or it is empty.',
      suggestion: 'Ensure the template includes a {{title}} binding inside a <title> tag.',
    });
  if (!doc.querySelector('meta[name="description"]')?.getAttribute('content'))
    issues.push({
      id: 'missing-meta-description',
      label: 'Missing meta description',
      description: 'The rendered page has no <meta name="description"> with content.',
      suggestion: 'Ensure the template includes a meta description tag bound to a CSV field.',
    });
  if (!doc.querySelector('h1')?.textContent?.trim())
    issues.push({
      id: 'missing-h1',
      label: 'Missing H1 heading',
      description: 'The rendered page has no <h1> element with text.',
      suggestion: 'Ensure the template includes an <h1> tag with a CSV field binding.',
    });

  const hasHero =
    !!doc.querySelector('.hero') ||
    /(<th[^>]*>|<td[^>]*>)\s*hero\s*(<\/th>|<\/td>)/i.test(pageHtml);
  if (!hasHero)
    issues.push({
      id: 'missing-hero',
      label: 'No hero block detected',
      description: 'The rendered page has no hero block (.hero class or "hero" table cell).',
      suggestion: 'Ensure the template includes a hero block using the standard DA block structure.',
    });

  const hasImage = [...doc.querySelectorAll('img')].some(
    (img) => img.getAttribute('src')?.trim(),
  );
  if (!hasImage)
    issues.push({
      id: 'missing-image',
      label: 'No images found',
      description: 'The rendered page has no <img> tags with a src attribute.',
      suggestion: 'Ensure the template includes an image block bound to a CSV image field.',
    });

  const unsubstituted = [...new Set([...pageHtml.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]))];
  if (unsubstituted.length > 0)
    issues.push({
      id: 'unsubstituted-placeholders',
      label: 'Unsubstituted placeholders',
      description: `These template placeholders were not replaced: ${unsubstituted.join(', ')}.`,
      suggestion: 'Add the missing CSV columns or fix the placeholder names in the template.',
    });

  const score = Math.max(0, 100 - issues.length * 20);
  return { pass: issues.length === 0, score, issues };
}
