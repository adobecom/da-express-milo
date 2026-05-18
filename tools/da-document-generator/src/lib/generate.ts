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

export function runQa(html: string, row: CsvRow): QaResult {
  const issues: QaIssue[] = [];

  if (!row['url_slug']?.trim())
    issues.push({
      id: 'missing-url-slug',
      label: 'Missing URL slug',
      description: 'The url_slug field is empty in this CSV row.',
      suggestion: 'Add a url_slug value — it determines the output page path.',
    });
  if (!row['title']?.trim())
    issues.push({
      id: 'missing-title',
      label: 'Missing title',
      description: 'The title field is empty in this CSV row.',
      suggestion: 'Add a title value to your CSV.',
    });
  if (!row['short_title']?.trim())
    issues.push({
      id: 'missing-short-title',
      label: 'Missing short title',
      description: 'The short_title field is empty in this CSV row.',
      suggestion: 'Add a short_title value to your CSV.',
    });

  const doc = new DOMParser().parseFromString(html, 'text/html');

  if (!doc.querySelector('title')?.textContent?.trim())
    issues.push({
      id: 'missing-page-title',
      label: 'Missing page title tag',
      description: 'The generated HTML has no <title> element or it is empty.',
      suggestion: 'Ensure the template includes a {{title}} binding inside a <title> tag.',
    });
  if (!doc.querySelector('meta[name="description"]')?.getAttribute('content'))
    issues.push({
      id: 'missing-meta-description',
      label: 'Missing meta description',
      description: 'The generated HTML has no <meta name="description"> with content.',
      suggestion: 'Ensure the template includes a meta description tag bound to a CSV field.',
    });
  if (!doc.querySelector('h1')?.textContent?.trim())
    issues.push({
      id: 'missing-h1',
      label: 'Missing H1 heading',
      description: 'The generated HTML has no <h1> element with text.',
      suggestion: 'Ensure the template includes an <h1> tag with a CSV field binding.',
    });

  const hasHero =
    !!doc.querySelector('.hero') ||
    /(<th[^>]*>|<td[^>]*>)\s*hero\s*(<\/th>|<\/td>)/i.test(html);
  if (!hasHero)
    issues.push({
      id: 'missing-hero',
      label: 'No hero block detected',
      description: 'The generated page has no hero block (.hero class or "hero" table cell).',
      suggestion: 'Ensure the template includes a hero block using the standard DA block structure.',
    });

  const unsubstituted = [...new Set([...html.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]))];
  if (unsubstituted.length > 0)
    issues.push({
      id: 'unsubstituted-placeholders',
      label: 'Unsubstituted placeholders',
      description: `These template placeholders were not replaced: ${unsubstituted.join(', ')}.`,
      suggestion: 'Add the missing CSV columns or fix the placeholder names in the template.',
    });

  const hasImage = [...doc.querySelectorAll('img')].some(
    (img) => img.getAttribute('src')?.trim(),
  );
  if (!hasImage)
    issues.push({
      id: 'missing-image',
      label: 'No images found',
      description: 'The generated HTML has no <img> tags with a src attribute.',
      suggestion: 'Ensure the template includes an image block bound to a CSV image field.',
    });

  const score = Math.max(0, 100 - issues.length * 20);
  return { pass: issues.length === 0, score, issues };
}
