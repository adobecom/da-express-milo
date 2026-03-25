/**
 * Server-side binding resolution.
 *
 * A Binding maps a template token (e.g. [[title]]) to a dot-notation path
 * inside each data record, with an optional value transform.
 */

export type Transform = 'none' | 'slug' | 'uppercase' | 'lowercase';

export interface Binding {
  /** Exact token in the template HTML, e.g. `[[title]]` */
  token: string;
  /** Dot-notation path into each data record, e.g. `product.title` */
  dataPath: string;
  transform: Transform;
}

export interface ResolvedPreviewItem {
  destPath: string;
  /** dataPath → resolved+transformed value, for display */
  preview: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function resolvePath(obj: unknown, path: string): string {
  if (!path) return '';
  let current: unknown = obj;
  for (const part of path.split('.')) {
    if (current == null || typeof current !== 'object') return '';
    current = (current as Record<string, unknown>)[part];
  }
  return current == null ? '' : String(current);
}

function applyTransform(value: string, transform: Transform): string {
  switch (transform) {
    case 'slug':
      return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    case 'uppercase': return value.toUpperCase();
    case 'lowercase': return value.toLowerCase();
    default: return value;
  }
}

/** Resolve a dest-path pattern containing `[[dataPath|transform]]` tokens. */
export function resolveDestPattern(pattern: string, record: unknown): string {
  return pattern.replace(/\[\[([^\]]+)\]\]/g, (_, inner: string) => {
    const [dp, tf] = inner.split('|') as [string, string | undefined];
    return applyTransform(resolvePath(record, dp.trim()), (tf?.trim() as Transform) ?? 'none');
  });
}

/** Produce the `token → value` fields map for one record — ready to fill into the template. */
export function resolveFields(bindings: Binding[], record: unknown): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const b of bindings) {
    fields[b.token] = applyTransform(resolvePath(record, b.dataPath), b.transform);
  }
  return fields;
}

/** Resolve all records into display preview items. */
export function resolvePreviewItems(
  records: unknown[],
  bindings: Binding[],
  destPathPattern: string,
): ResolvedPreviewItem[] {
  return records.map((record) => {
    const preview: Record<string, string> = {};
    for (const b of bindings) {
      preview[b.dataPath] = applyTransform(resolvePath(record, b.dataPath), b.transform);
    }
    return { destPath: resolveDestPattern(destPathPattern, record), preview };
  });
}
