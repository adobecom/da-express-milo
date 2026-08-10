/**
 * Searchable multi-select country picker modeled on Google Merchant Center's "Select countries"
 * dialog. Used by the GMC submit flow to REPLACE the target markets of one row or a bulk selection:
 * whatever set is saved becomes the row(s)' countries (it both adds and removes). Renders inside the
 * shared Modal, stacking above the parent GMC dialog (default z-[70] over its z-50). A tri-state
 * "All countries" checkbox reflects the whole list, and Save is disabled unless at least one market
 * is selected so a row can never target zero markets.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../ui/Modal';
import { GMC_COUNTRIES } from './gmcCountries';

interface Props {
  title?: string;
  /** Preselected country codes (e.g. the row(s)' current markets). */
  initialSelected: string[];
  onCancel: () => void;
  /** Called with the final chosen codes on Save. Guaranteed length >= 1 (Save is disabled when 0). */
  onSave: (codes: string[]) => void;
  zClassName?: string;
}

export default function CountrySelectDialog({
  title = 'Select countries',
  initialSelected,
  onCancel,
  onSave,
  zClassName = 'z-[70]',
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelected));
  const [query, setQuery] = useState('');
  const allRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GMC_COUNTRIES;
    return GMC_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [query]);

  const allChecked = selected.size === GMC_COUNTRIES.length;
  const someChecked = selected.size > 0 && !allChecked;

  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = someChecked;
  }, [someChecked, allChecked]);

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(GMC_COUNTRIES.map((c) => c.code)));
  }

  return (
    <Modal
      title={title}
      onClose={onCancel}
      size="sm"
      zClassName={zClassName}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave([...selected])}
            disabled={selected.size === 0}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer"
          >
            Save
          </button>
        </>
      }
    >
      <div className="relative">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 1 0 3.4 9.83l3.14 3.13a1 1 0 0 0 1.41-1.41l-3.13-3.14A5.5 5.5 0 0 0 9 3.5ZM5.5 9a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="w-full text-sm border border-gray-300 rounded px-2 py-1 pl-7"
        />
      </div>

      <label className="flex items-center gap-2 text-sm px-1 py-1.5 border-b border-gray-100 hover:bg-gray-50 rounded cursor-pointer">
        <input
          ref={allRef}
          type="checkbox"
          checked={allChecked}
          onChange={toggleAll}
          className="cursor-pointer"
        />
        <span className="font-medium text-gray-900">All countries</span>
      </label>

      <div className="max-h-[20rem] overflow-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 px-1 py-2">No countries match</p>
        ) : (
          filtered.map((c) => (
            <label
              key={c.code}
              className="flex items-center gap-2 text-sm px-1 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(c.code)}
                onChange={() => toggle(c.code)}
                className="cursor-pointer"
              />
              <span className="flex-1 text-gray-900">{c.name}</span>
              <span className="text-gray-400">{c.code}</span>
            </label>
          ))
        )}
      </div>
    </Modal>
  );
}
