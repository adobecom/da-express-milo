import { useState, KeyboardEvent } from 'react';
import { SearchIntent, INTENT_LABELS } from '../types.ts';

interface Props {
  brief: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: SearchIntent;
  targetFeature: string;
  onPrimaryChange: (v: string) => void;
  onSecondaryChange: (v: string[]) => void;
  onIntentChange: (v: SearchIntent) => void;
  onFeatureChange: (v: string) => void;
}

const FIREFLY_FEATURES = [
  'Text to Character',
  'Text to Image',
  'Generative Fill',
  'Image Fill',
  'Background Remover',
  'Text Effects',
  'Generative Expand',
  'Recolor',
  'Sketch to Image',
];

export function SeoInputs({
  brief,
  primaryKeyword,
  secondaryKeywords,
  searchIntent,
  targetFeature,
  onPrimaryChange,
  onSecondaryChange,
  onIntentChange,
  onFeatureChange,
}: Props) {
  const [tagInput, setTagInput] = useState('');
  const [loadingField, setLoadingField] = useState<string | null>(null);

  const hasBrief = brief.trim().length > 20;

  const generateFromBrief = (field: string, delay = 900) => {
    if (!hasBrief) return;
    setLoadingField(field);
    setTimeout(() => {
      if (field === 'primary') {
        onPrimaryChange('anime character generator');
      } else if (field === 'secondary') {
        onSecondaryChange(['anime girl generator', 'ai anime creator', 'anime avatar maker', 'anime art generator']);
      } else if (field === 'intent') {
        onIntentChange('create');
      } else if (field === 'feature') {
        onFeatureChange('Text to Character');
      }
      setLoadingField(null);
    }, delay);
  };

  const addTag = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed && !secondaryKeywords.includes(trimmed)) {
      onSecondaryChange([...secondaryKeywords, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (index: number) => {
    onSecondaryChange(secondaryKeywords.filter((_, i) => i !== index));
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && secondaryKeywords.length > 0) {
      onSecondaryChange(secondaryKeywords.slice(0, -1));
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Keyword */}
      <div className="space-y-1.5">
        <FieldHeader
          label="Primary Keyword"
          required
          hasBrief={hasBrief}
          isLoading={loadingField === 'primary'}
          onGenerate={() => generateFromBrief('primary')}
        />
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={primaryKeyword}
            onChange={(e) => onPrimaryChange(e.target.value)}
            placeholder="e.g. ai image upscaler"
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
              loadingField === 'primary' ? 'bg-violet-50 border-violet-200 animate-pulse' : 'bg-white border-slate-200'
            }`}
          />
        </div>
      </div>

      {/* Secondary Keywords */}
      <div className="space-y-1.5">
        <FieldHeader
          label="Secondary Keywords"
          hint="optional — supporting terms for this page"
          hasBrief={hasBrief}
          isLoading={loadingField === 'secondary'}
          onGenerate={() => generateFromBrief('secondary', 1000)}
        />
        <div
          className={`min-h-[44px] px-3 py-2 rounded-xl border flex flex-wrap gap-1.5 cursor-text focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all ${
            loadingField === 'secondary' ? 'bg-violet-50 border-violet-200 animate-pulse' : 'bg-white border-slate-200'
          }`}
          onClick={() => document.getElementById('tag-input')?.focus()}
        >
          {secondaryKeywords.map((kw, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200"
            >
              {kw}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(i);
                }}
                className="hover:text-indigo-900 transition-colors"
              >
                <XSmallIcon />
              </button>
            </span>
          ))}
          <input
            id="tag-input"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => tagInput && addTag(tagInput)}
            placeholder={secondaryKeywords.length === 0 ? 'Type and press Enter to add...' : ''}
            className="flex-1 min-w-[140px] text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent py-0.5"
          />
        </div>
        <p className="text-xs text-slate-400">These become the LSI keywords woven into the page content.</p>
      </div>

      {/* Search Intent */}
      <div className="space-y-1.5">
        <FieldHeader
          label="Search Intent"
          hasBrief={hasBrief}
          isLoading={loadingField === 'intent'}
          onGenerate={() => generateFromBrief('intent', 700)}
          generateLabel="Detect from brief"
        />
        <div className="flex gap-2">
          {(Object.entries(INTENT_LABELS) as [Exclude<SearchIntent, ''>, string][]).map(([value, label]) => (
            <button
              key={value}
              onClick={() => onIntentChange(value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                searchIntent === value
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              {value === 'create' && <CreateIcon selected={searchIntent === value} />}
              {value === 'edit' && <EditIcon selected={searchIntent === value} />}
              {value === 'transform' && <TransformIcon selected={searchIntent === value} />}
              {label}
            </button>
          ))}
        </div>
        {searchIntent && (
          <p className="text-xs text-slate-500 fade-in">
            {searchIntent === 'create' && 'Content will center on "make", "build", "generate" action verbs.'}
            {searchIntent === 'edit' && 'Content will center on "modify", "adjust", "change" action verbs.'}
            {searchIntent === 'transform' && 'Content will center on "convert", "turn into", "change style" patterns.'}
          </p>
        )}
      </div>

      {/* Target Feature */}
      <div className="space-y-1.5">
        <FieldHeader
          label="Target Firefly Feature"
          hint="maps content to the product capability"
          hasBrief={hasBrief}
          isLoading={loadingField === 'feature'}
          onGenerate={() => generateFromBrief('feature', 750)}
          generateLabel="Detect from brief"
        />
        <div className="relative">
          <select
            value={targetFeature}
            onChange={(e) => onFeatureChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer transition-shadow"
          >
            <option value="">Select a feature...</option>
            {FIREFLY_FEATURES.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <ChevronIcon />
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldHeader({
  label,
  hint,
  required,
  hasBrief,
  isLoading,
  onGenerate,
  generateLabel = 'Generate from brief',
}: {
  label: string;
  hint?: string;
  required?: boolean;
  hasBrief: boolean;
  isLoading: boolean;
  onGenerate: () => void;
  generateLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        {required && <span className="text-xs text-red-500">required</span>}
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      <button
        onClick={onGenerate}
        disabled={!hasBrief || isLoading}
        title={!hasBrief ? 'Add a brief first' : generateLabel}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? <SpinnerSmall /> : <SparkleSmall />}
        {isLoading ? 'Generating...' : generateLabel}
      </button>
    </div>
  );
}

function SparkleSmall() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 3l1.9 5.1 5.1 1.9-5.1 1.9L12 17l-1.9-5.1L5 9.9l5.1-1.9z" />
    </svg>
  );
}

function SpinnerSmall() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function XSmallIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CreateIcon({ selected }: { selected: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={selected ? 'white' : 'currentColor'} strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function EditIcon({ selected }: { selected: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={selected ? 'white' : 'currentColor'} strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />
    </svg>
  );
}

function TransformIcon({ selected }: { selected: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={selected ? 'white' : 'currentColor'} strokeWidth="2">
      <path d="M7 16V4m0 0L3 8m4-4 4 4" />
      <path d="M17 8v12m0 0 4-4m-4 4-4-4" />
    </svg>
  );
}
