import { useState } from 'react';

interface Props {
  value?: string;
  editable: boolean;
  onSave: (value: string) => Promise<void>;
  /** Tooltip shown on the value when it isn't editable. */
  notEditableTitle?: string;
  placeholder?: string;
}

/**
 * Inline click-to-edit text cell: shows the value (or a placeholder), swaps to an input on click,
 * commits on blur/Enter, cancels on Escape, and surfaces a save error inline. shared by the
 * Document Manager table and the GMC submit dialog's error table so the edit behavior lives once.
 */
export default function EditableTextCell({
  value,
  editable,
  onSave,
  notEditableTitle = 'Not editable — backfill or regenerate to enable editing',
  placeholder = 'Click to edit',
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editable) {
    return (
      <span className="text-gray-400 whitespace-nowrap" title={notEditableTitle}>
        {value ?? '—'}
      </span>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value ?? '');
          setError(null);
          setEditing(true);
        }}
        className="text-left whitespace-nowrap hover:bg-blue-50 rounded px-1 -mx-1 cursor-text"
      >
        {value || <span className="text-gray-300">{placeholder}</span>}
      </button>
    );
  }

  async function commit() {
    if (draft === (value ?? '')) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-0.5">
      <input
        autoFocus
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void commit();
          }
          if (e.key === 'Escape') {
            setEditing(false);
            setDraft(value ?? '');
            setError(null);
          }
        }}
        className="w-full border border-blue-300 rounded px-1 py-0.5 text-xs"
      />
      {error && <span className="text-red-600 text-[10px]">{error}</span>}
    </div>
  );
}
