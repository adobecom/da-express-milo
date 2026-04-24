import type { CsvRow } from '../types';

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
