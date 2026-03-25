/**
 * Server-side HTML utilities for DAAS document manipulation.
 *
 * Two filling strategies are supported and can be combined in a single call:
 *  - "placeholder"  — replaces [[key]] tokens in the raw HTML string
 *  - "daas"         — sets content of [data-daas-key="key"] DOM elements
 */
import { JSDOM } from 'jsdom';
// ---------------------------------------------------------------------------
// Placeholder filling  ([[key]] → value)
// ---------------------------------------------------------------------------
/**
 * Replace every `[[key]]` occurrence in the HTML string with its mapped value.
 * Unknown keys are left as-is.
 * @deprecated Prefer `fillTemplate`.
 */
export function fillPlaceholders(html, fields) {
    return Object.entries(fields).reduce((acc, [key, value]) => acc.replaceAll(`[[${key}]]`, value), html);
}
// ---------------------------------------------------------------------------
// DAAS field extraction / update  (data-daas-key DOM attributes)
// ---------------------------------------------------------------------------
/** Extract all DAAS fields from a document */
export function extractDAASFields(html) {
    const { window } = new JSDOM(html);
    const fields = {};
    window.document.querySelectorAll('[data-daas-key]').forEach((el) => {
        const key = el.getAttribute('data-daas-key');
        const type = el.getAttribute('data-daas-type') ?? 'text';
        const value = type === 'image' ? el.src ?? '' : el.textContent ?? '';
        fields[key] = { key, type, value };
    });
    return fields;
}
/** Return the `data-daas-template-path` set on the document body, or null */
export function getTemplatePath(html) {
    const { window } = new JSDOM(html);
    return window.document.body?.getAttribute('data-daas-template-path') ?? null;
}
/**
 * Update a single DAAS field in the HTML and return the updated HTML string.
 * Throws if the field key is not found in the document.
 */
export function updateDAASField(html, fieldKey, newValue) {
    const dom = new JSDOM(html);
    const { document } = dom.window;
    const el = document.querySelector(`[data-daas-key="${fieldKey}"]`);
    if (!el)
        throw new Error(`DAAS field "${fieldKey}" not found in document`);
    const type = el.getAttribute('data-daas-type') ?? 'text';
    if (type === 'image') {
        el.src = newValue;
    }
    else {
        el.textContent = newValue;
    }
    return dom.serialize();
}
/**
 * Apply DAAS field updates from a map and return the updated HTML.
 * Missing keys are silently skipped.
 */
export function applyDAASFields(html, fields) {
    const dom = new JSDOM(html);
    const { document } = dom.window;
    for (const [key, value] of Object.entries(fields)) {
        const el = document.querySelector(`[data-daas-key="${key}"]`);
        if (!el)
            continue;
        const type = el.getAttribute('data-daas-type') ?? 'text';
        if (type === 'image') {
            el.src = value;
        }
        else {
            el.textContent = value;
        }
    }
    return dom.serialize();
}
/**
 * Fill a template in one pass:
 *  1. Replace `[[key]]` tokens with their mapped values (literal string replacement)
 *  2. Set matching data-daas-key element contents
 *
 * `fields` keys are the exact `[[token]]` strings as they appear in the HTML,
 * e.g. `{ "[[title]]": "My Product", "[[description]]": "..." }`
 */
export function fillTemplate(html, fields) {
    const withTokens = Object.entries(fields).reduce((acc, [token, value]) => acc.replaceAll(token, value), html);
    return applyDAASFields(withTokens, fields);
}
// ---------------------------------------------------------------------------
// Placeholder detection
// ---------------------------------------------------------------------------
/**
 * Scan HTML for all `[[...]]` placeholder tokens.
 * Returns a deduplicated array, e.g. `["[[title]]", "[[description]]"]`.
 */
export function detectPlaceholders(html) {
    const found = new Set();
    for (const m of html.matchAll(/\[\[([^\]]+)\]\]/g))
        found.add(`[[${m[1]}]]`);
    return [...found];
}
