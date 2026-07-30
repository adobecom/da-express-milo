export const DEFAULT_CONCURRENCY = 3;

// Higher bound for the Document Manager scan (crawl + per-doc source fetch). Tunable:
// peak in-flight ≈ CRAWL_CONCURRENCY + STATUS_CONCURRENCY while fetch and status overlap.
export const CRAWL_CONCURRENCY = 6;

// The AEM admin status API (admin.hlx.page) rate-limits harder than DA's source API, so
// status checks run at a gentler concurrency and retry on 429 (see checkPageStatus).
export const STATUS_CONCURRENCY = 4;

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function runBatch<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  concurrency: number = DEFAULT_CONCURRENCY,
): Promise<void> {
  const queue = [...items];
  let idx = 0;
  async function worker() {
    while (idx < queue.length) {
      await fn(queue[idx++]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
}
