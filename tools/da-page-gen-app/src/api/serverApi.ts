import type {
  Binding,
  TemplateResolveResponse,
  ResolvedItem,
  GenerateResultItem,
} from '../types.js';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:3001';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${path} failed: HTTP ${res.status}${text ? ` — ${text}` : ''}`);
  }
  return res.json() as Promise<T>;
}

/** Fetch a template from DA and return its HTML + detected [[...]] tokens. */
export async function resolveTemplate(url: string): Promise<TemplateResolveResponse> {
  return post<TemplateResolveResponse>('/template/resolve', { url });
}

/** Resolve records against bindings for display — no DA writes. */
export async function resolveBindings(
  records: unknown[],
  bindings: Binding[],
  destPathPattern: string,
): Promise<ResolvedItem[]> {
  return post<ResolvedItem[]>('/bindings/resolve', { records, bindings, destPathPattern });
}

/** Full pipeline: raw records + bindings → fill template + write pages to DA. */
export async function generateFromBindings(
  templateSourcePath: string,
  records: unknown[],
  bindings: Binding[],
  destPathPattern: string,
): Promise<GenerateResultItem[]> {
  return post<GenerateResultItem[]>('/generate/from-bindings', {
    templateSourcePath,
    records,
    bindings,
    destPathPattern,
  });
}
