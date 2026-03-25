/**
 * Server-side binding resolution.
 *
 * A Binding maps a template token (e.g. [[title]]) to a dot-notation path
 * inside each data record, with an optional value transform.
 */
// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------
function resolvePath(obj, path) {
    if (!path)
        return '';
    let current = obj;
    for (const part of path.split('.')) {
        if (current == null || typeof current !== 'object')
            return '';
        current = current[part];
    }
    return current == null ? '' : String(current);
}
function applyTransform(value, transform) {
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
export function resolveDestPattern(pattern, record) {
    return pattern.replace(/\[\[([^\]]+)\]\]/g, (_, inner) => {
        const [dp, tf] = inner.split('|');
        return applyTransform(resolvePath(record, dp.trim()), tf?.trim() ?? 'none');
    });
}
/** Produce the `token → value` fields map for one record — ready to fill into the template. */
export function resolveFields(bindings, record) {
    const fields = {};
    for (const b of bindings) {
        fields[b.token] = applyTransform(resolvePath(record, b.dataPath), b.transform);
    }
    return fields;
}
/** Resolve all records into display preview items. */
export function resolvePreviewItems(records, bindings, destPathPattern) {
    return records.map((record) => {
        const preview = {};
        for (const b of bindings) {
            preview[b.dataPath] = applyTransform(resolvePath(record, b.dataPath), b.transform);
        }
        return { destPath: resolveDestPattern(destPathPattern, record), preview };
    });
}
