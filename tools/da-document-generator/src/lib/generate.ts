import type { CsvRow, QaResult } from '../types';

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
  const issues: string[] = [];

  if (!row['url_slug']?.trim()) issues.push('Missing url_slug (required for page path)');
  if (!row['title']?.trim()) issues.push('Missing title');
  if (!row['short_title']?.trim()) issues.push('Missing short_title');

  const doc = new DOMParser().parseFromString(html, 'text/html');

  if (!doc.querySelector('title')?.textContent?.trim())
    issues.push('Missing page title');
  if (!doc.querySelector('meta[name="description"]')?.getAttribute('content'))
    issues.push('Missing meta description');
  if (!doc.querySelector('h1')?.textContent?.trim())
    issues.push('Missing H1');

  const hasHero = !!doc.querySelector('.hero') ||
    /(<th[^>]*>|<td[^>]*>)\s*hero\s*(<\/th>|<\/td>)/i.test(html);
  if (!hasHero) issues.push('No hero block detected');

  const unsubstituted = [...html.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]);
  if (unsubstituted.length > 0)
    issues.push(`Unsubstituted placeholders: ${[...new Set(unsubstituted)].join(', ')}`);

  const hasImage = [...doc.querySelectorAll('img')].some(
    (img) => img.getAttribute('src')?.trim(),
  );
  if (!hasImage) issues.push('No images with src found');

  const score = Math.max(0, 100 - issues.length * 20);
  return { pass: issues.length === 0, score, issues };
}
