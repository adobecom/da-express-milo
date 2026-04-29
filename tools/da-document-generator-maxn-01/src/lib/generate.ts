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

export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function rowToOutputPath(row: CsvRow, outputDir: string): string {
  const slug = row['template_id'] ? toSlug(row['template_id']) : `doc-${row['_id']}`;
  const dir = outputDir.replace(/\/$/, '');
  return `${dir}/${slug}`;
}

export function runQa(html: string, row: CsvRow): QaResult {
  const issues: string[] = [];
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

  // Suppress unused-variable warning — row reserved for future data-completeness checks
  void row;

  const score = Math.max(0, 100 - issues.length * 20);
  return { pass: issues.length === 0, score, issues };
}
