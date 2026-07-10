import { listDirectory, type DaListItem, cat } from './daApi';
import { runBatch, DEFAULT_CONCURRENCY } from '../lib/concurrency';

export interface CrawlError {
  dirPath: string;
  message: string;
}

export interface CrawlResult {
  docs: DaListItem[];
  errors: CrawlError[];
}

/**
 * Recursively lists every document under `rootPath`, walking one folder level at a time
 * with bounded concurrency per level (not an unbounded fan-out — a large tree shouldn't
 * slam the admin API with hundreds of simultaneous requests). A directory that fails to
 * list is recorded in `errors` and skipped; it never silently drops rows from the result.
 */
export async function crawlDirectory(
  rootPath: string,
  opts: { concurrency?: number; extensions?: string[] } = {},
): Promise<CrawlResult> {
  const concurrency = opts.concurrency ?? DEFAULT_CONCURRENCY;
  const extensions = new Set(opts.extensions ?? ['html']);
  const docs: DaListItem[] = [];
  const errors: CrawlError[] = [];

  let frontier = [rootPath];
  while (frontier.length > 0) {
    const nextFrontier: string[] = [];
    await runBatch(frontier, async (dirPath) => {
      try {
        const items = await listDirectory(dirPath);
        for (const item of items) {
          if (item.ext === undefined) {
            nextFrontier.push(item.path);
          } else if (extensions.has(item.ext)) {
            docs.push(item);
          }
        }
      } catch (err) {
        errors.push({ dirPath, message: err instanceof Error ? err.message : String(err) });
      }
    }, concurrency);
    frontier = nextFrontier;
  }

  return { docs, errors };
}

export interface DocFetchError {
  path: string;
  message: string;
}

/**
 * Fetches and parses each doc path with bounded concurrency, discarding the raw HTML as
 * soon as it's been reduced to a summary record `T` — at scale, retaining thousands of
 * full HTML strings in memory is the thing to avoid. A fetch/parse failure for one doc is
 * recorded in `errors` and skipped, not silently dropped.
 */
export async function fetchAndParseDocs<T>(
  docPaths: string[],
  parse: (html: string, path: string) => T,
  opts: { concurrency?: number } = {},
): Promise<{ records: T[]; errors: DocFetchError[] }> {
  const records: T[] = [];
  const errors: DocFetchError[] = [];
  await runBatch(docPaths, async (path) => {
    try {
      const html = await cat(path);
      records.push(parse(html, path));
    } catch (err) {
      errors.push({ path, message: err instanceof Error ? err.message : String(err) });
    }
  }, opts.concurrency ?? DEFAULT_CONCURRENCY);
  return { records, errors };
}
