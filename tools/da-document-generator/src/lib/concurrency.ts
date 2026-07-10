export const DEFAULT_CONCURRENCY = 3;

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
