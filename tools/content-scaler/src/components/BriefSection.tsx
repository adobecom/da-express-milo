import { useState } from 'react';
import { SAMPLE_BRIEF } from '../types.ts';

interface Props {
  brief: string;
  onChange: (brief: string) => void;
}

export function BriefSection({ brief, onChange }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);

  const handleAiGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      onChange(SAMPLE_BRIEF);
      setIsGenerating(false);
    }, 1600);
  };

  const handlePolish = () => {
    if (!brief.trim()) return;
    setIsPolishing(true);
    setTimeout(() => {
      onChange(SAMPLE_BRIEF);
      setIsPolishing(false);
    }, 1200);
  };

  const hasContent = brief.trim().length > 0;

  return (
    <div className="space-y-3">
      <div className="relative">
        {isGenerating ? (
          <div className="w-full h-36 rounded-xl border border-slate-200 shimmer" />
        ) : (
          <textarea
            value={brief}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Describe the angle for this supporting page...\n\ne.g. 'Targeting "anime girl generator" \u2014 users specifically looking for female anime characters. Should cover customization options for hair, outfit, and art style.'`}
            rows={6}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none leading-relaxed transition-shadow"
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleAiGenerate}
          disabled={isGenerating || isPolishing}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {isGenerating ? <SpinnerIcon /> : <SparkleIcon />}
          {isGenerating ? 'Generating...' : 'AI Generate'}
        </button>

        <button
          onClick={handlePolish}
          disabled={!hasContent || isPolishing || isGenerating}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {isPolishing ? <SpinnerIcon /> : <PolishIcon />}
          {isPolishing ? 'Polishing...' : 'Polish'}
        </button>

        {hasContent && !isGenerating && (
          <span className="ml-auto text-xs text-slate-400">{brief.length} chars</span>
        )}
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 3l1.9 5.1 5.1 1.9-5.1 1.9L12 17l-1.9-5.1L5 9.9l5.1-1.9z" />
      <path d="M5 3l.8 2.2L8 6l-2.2.8L5 9l-.8-2.2L2 6l2.2-.8z" />
    </svg>
  );
}

function PolishIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
