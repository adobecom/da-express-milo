interface Props {
  selectedCount: number;
  canBackfill: boolean;
  busy: boolean;
  onPreview: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  onBackfill: () => void;
  onEditField: () => void;
  onClearSelection: () => void;
}

export default function BulkEditBar({
  selectedCount,
  canBackfill,
  busy,
  onPreview,
  onPublish,
  onUnpublish,
  onDelete,
  onBackfill,
  onEditField,
  onClearSelection,
}: Props) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 flex-wrap bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
      <span className="text-sm font-medium text-gray-700">{selectedCount} selected</span>
      <button
        type="button"
        onClick={onClearSelection}
        className="text-xs text-gray-500 hover:text-gray-700 underline cursor-pointer"
      >
        Clear
      </button>
      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          disabled={busy}
          onClick={onEditField}
          className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Edit Field
        </button>
        {canBackfill && (
          <button
            type="button"
            disabled={busy}
            onClick={onBackfill}
            className="px-3.5 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Backfill Metadata
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={onPreview}
          className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Preview
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onPublish}
          className="px-3.5 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Publish
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onUnpublish}
          className="px-3.5 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Unpublish
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="px-3.5 py-1.5 bg-red-700 text-white text-xs font-medium rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
