import type { Transform } from '../types.js';

/**
 * Resolve a dot-notation path into a (potentially nested) object.
 * Returns an empty string if any segment is missing.
 *
 * @example
 * resolvePath({ product: { title: "Foo" } }, "product.title") // "Foo"
 * resolvePath({ items: [{ id: 1 }] }, "items.0.id")           // "1"
 */
export function resolvePath(obj: unknown, path: string): string {
  if (!path) return '';
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return '';
    current = (current as Record<string, unknown>)[part];
  }
  if (current == null) return '';
  return String(current);
}

/** Apply a named transform to a string value. */
export function applyTransform(value: string, transform: Transform): string {
  switch (transform) {
    case 'slug':
      return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    case 'uppercase':
      return value.toUpperCase();
    case 'lowercase':
      return value.toLowerCase();
    default:
      return value;
  }
}

/**
 * Resolve a dest-path pattern that may contain `[[dataPath]]` or `[[dataPath|transform]]` tokens.
 *
 * @example
 * resolveDestPattern("/drafts/pages/[[product.title|slug]]", record)
 * // "/drafts/pages/my-product-title"
 */
export function resolveDestPattern(pattern: string, record: unknown): string {
  return pattern.replace(/\[\[([^\]]+)\]\]/g, (_, inner: string) => {
    const [dataPath, transformName] = inner.split('|') as [string, string | undefined];
    const raw = resolvePath(record, dataPath.trim());
    return applyTransform(raw, (transformName?.trim() as Transform) ?? 'none');
  });
}

/**
 * Enumerate all dot-notation leaf paths in a JSON object (up to `maxDepth`).
 * Used to suggest available data paths in the binding editor.
 */
export function enumeratePaths(obj: unknown, prefix = '', maxDepth = 4): string[] {
  if (maxDepth === 0 || obj == null || typeof obj !== 'object') return prefix ? [prefix] : [];
  const paths: string[] = [];
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value != null && typeof value === 'object' && !Array.isArray(value)) {
      paths.push(...enumeratePaths(value, fullKey, maxDepth - 1));
    } else {
      paths.push(fullKey);
    }
  }
  return paths;
}
