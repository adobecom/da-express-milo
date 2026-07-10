export function serializeDoc(doc: Document): string {
  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
}

export function readMetadataBlockFromDoc(doc: Document): Record<string, string> {
  const block = doc.querySelector('div.metadata');
  if (!block) return {};
  const out: Record<string, string> = {};
  for (const row of Array.from(block.children)) {
    const key = row.children[0]?.textContent?.trim().toLowerCase();
    const value = row.children[1]?.textContent?.trim();
    if (key) out[key] = value ?? '';
  }
  return out;
}

export function readMetadataBlock(html: string): Record<string, string> {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return readMetadataBlockFromDoc(doc);
}

/**
 * Upserts `entries` into the authored EDS Metadata block (`div.metadata`, containing
 * `key | value` row-divs). Updates matching rows in place and only appends/creates what's
 * missing, so an existing block (e.g. one already carrying description/og:image) isn't
 * clobbered.
 */
export function upsertMetadataBlockOnDoc(doc: Document, entries: Record<string, string>): void {
  let block = doc.querySelector('div.metadata');
  if (!block) {
    block = doc.createElement('div');
    block.className = 'metadata';
    const section = doc.createElement('div');
    section.appendChild(block);
    (doc.querySelector('main') ?? doc.body).appendChild(section);
  }
  for (const [key, value] of Object.entries(entries)) {
    const existingRow = Array.from(block.children).find(
      (row) => row.children[0]?.textContent?.trim().toLowerCase() === key.toLowerCase(),
    );
    if (existingRow?.children[1]) {
      existingRow.children[1].textContent = value;
    } else {
      const row = doc.createElement('div');
      const k = doc.createElement('div');
      k.textContent = key;
      const v = doc.createElement('div');
      v.textContent = value;
      row.append(k, v);
      block.appendChild(row);
    }
  }
}

export function upsertMetadataBlock(html: string, entries: Record<string, string>): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  upsertMetadataBlockOnDoc(doc, entries);
  return serializeDoc(doc);
}
