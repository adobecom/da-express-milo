import type { Dispatch, SetStateAction } from 'react';
import {
  getToken,
  triggerPreview,
  triggerPublish,
  triggerUnpublish,
  deleteDocument,
  daPathToPreviewUrl,
  daPathToLiveUrl,
} from '../api/daApi';
import { runPageQa } from '../lib/generate';
import { runBatch } from '../lib/concurrency';
import type { RowResult, QaResult } from '../types';

export interface DaDocumentActionsOptions<T extends RowResult> {
  /**
   * Called after a successful delete. Return the row's replacement state (e.g. reset to
   * `{id, path, stage: 'pending'}` if the row should stay visible as not-yet-generated) or
   * `undefined` to remove the row from the list entirely (e.g. the document is just gone).
   */
  afterDelete: (row: T) => T | undefined;
}

export interface DaDocumentActions<T extends RowResult> {
  previewRow: (row: T) => Promise<void>;
  publishRow: (row: T) => Promise<void>;
  unpublishRow: (row: T) => Promise<void>;
  deleteRow: (row: T) => Promise<void>;
  previewBulk: (rows: T[]) => Promise<void>;
  publishBulk: (rows: T[]) => Promise<void>;
  unpublishBulk: (rows: T[]) => Promise<void>;
  deleteBulk: (rows: T[]) => Promise<void>;
}

export function useDaDocumentActions<T extends RowResult>(
  setResults: Dispatch<SetStateAction<T[]>>,
  options: DaDocumentActionsOptions<T>,
): DaDocumentActions<T> {
  function patch(id: string, changes: Partial<T>) {
    setResults((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  }

  async function previewOne(row: T) {
    const token = getToken();
    if (!token) return;
    patch(row.id, { stage: 'previewing' } as Partial<T>);
    try {
      await triggerPreview(row.path, token);
      patch(row.id, { stage: 'previewed', previewUrl: daPathToPreviewUrl(row.path) } as Partial<T>);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      patch(row.id, { stage: 'error', error: msg } as Partial<T>);
    }
  }

  async function publishOne(row: T) {
    const token = getToken();
    if (!token) return;
    patch(row.id, { stage: 'publishing' } as Partial<T>);
    try {
      await triggerPublish(row.path, token);
      const liveUrl = daPathToLiveUrl(row.path);
      let qa: QaResult | undefined;
      try {
        const resp = await fetch(liveUrl);
        const html = await resp.text();
        qa = runPageQa(html);
      } catch {
        // QA fetch failed — page is still published, just no QA data
      }
      patch(row.id, { stage: 'published', liveUrl, qa } as Partial<T>);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      patch(row.id, { stage: 'error', error: msg } as Partial<T>);
    }
  }

  async function unpublishOne(row: T) {
    const token = getToken();
    if (!token) return;
    patch(row.id, { stage: 'unpublishing' } as Partial<T>);
    try {
      await triggerUnpublish(row.path, token);
      patch(row.id, { stage: 'unpublished', liveUrl: undefined } as Partial<T>);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      patch(row.id, { stage: 'error', error: msg } as Partial<T>);
    }
  }

  async function deleteOne(row: T) {
    const token = getToken();
    if (!token) return;
    patch(row.id, { stage: 'deleting' } as Partial<T>);
    try {
      await deleteDocument(row.path, token);
      const replacement = options.afterDelete(row);
      setResults((prev) =>
        replacement
          ? prev.map((r) => (r.id === row.id ? replacement : r))
          : prev.filter((r) => r.id !== row.id),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      patch(row.id, { stage: 'error', error: msg } as Partial<T>);
    }
  }

  return {
    previewRow: previewOne,
    publishRow: publishOne,
    unpublishRow: unpublishOne,
    deleteRow: deleteOne,
    previewBulk: (rows) => runBatch(rows, previewOne),
    publishBulk: (rows) => runBatch(rows, publishOne),
    unpublishBulk: (rows) => runBatch(rows, unpublishOne),
    deleteBulk: (rows) => runBatch(rows, deleteOne),
  };
}
