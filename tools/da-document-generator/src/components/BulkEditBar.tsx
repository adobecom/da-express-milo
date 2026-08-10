interface Props {
  selectedCount: number;
  canBackfill: boolean;
  canSubmitGmc: boolean;
  busy: boolean;
  onPreview: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  onBackfill: () => void;
  onEditField: () => void;
  onSubmitGmc: () => void;
  onClearSelection: () => void;
}

export default function BulkEditBar({
  selectedCount,
  canBackfill,
  canSubmitGmc,
  busy,
  onPreview,
  onPublish,
  onUnpublish,
  onDelete,
  onBackfill,
  onEditField,
  onSubmitGmc,
  onClearSelection,
}: Props) {
  const disabled = busy || selectedCount === 0;
  const countLabel = (verb: string) =>
    `${verb} ${selectedCount} document${selectedCount !== 1 ? 's' : ''}`;

  return (
    <div className="flex items-center gap-3 flex-wrap bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
      <span className="text-sm font-medium text-gray-700">{selectedCount} selected</span>
      {selectedCount > 0 && (
        <button
          type="button"
          onClick={onClearSelection}
          className="text-xs text-gray-500 hover:text-gray-700 underline cursor-pointer"
        >
          Clear
        </button>
      )}
      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          disabled={disabled}
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
          disabled={disabled}
          onClick={onPreview}
          className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {countLabel('Preview')}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onPublish}
          className="px-3.5 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {countLabel('Publish')}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onUnpublish}
          className="px-3.5 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {countLabel('Unpublish')}
        </button>
        <button
          type="button"
          disabled={disabled || !canSubmitGmc}
          onClick={onSubmitGmc}
          title={canSubmitGmc ? undefined : 'Select at least one published document to submit to GMC'}
          className="px-3.5 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Submit to GMC
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          className="px-3.5 py-1.5 bg-red-700 text-white text-xs font-medium rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {countLabel('Delete')}
        </button>
      </div>
    </div>
  );
}
