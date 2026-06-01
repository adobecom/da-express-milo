// _id is a string so it satisfies the string index signature
export type CsvRow = Record<string, string>;

export interface InputSummary {
  total: number;
  duplicates: number;
  missing: number;
  duplicateTemplateIdRowIds: Set<string>;
  duplicateSlugRowIds: Set<string>;
}

export type TemplateStatus = 'idle' | 'loading' | 'ready' | 'warning' | 'invalid' | 'error';

export interface TemplateState {
  status: TemplateStatus;
  html: string | null;
  sourcePath: string | null;
  outputDir: string | null;
  outputDirValid: boolean | null;
  outputDirError: string | null;
  placeholders: string[];
  issues: string[];
}

export type RowStage =
  | 'pending'
  | 'generating'
  | 'generated'
  | 'qa-fail'
  | 'previewing'
  | 'previewed'
  | 'publishing'
  | 'published'
  | 'unpublishing'
  | 'unpublished'
  | 'deleting'
  | 'error';

export interface QaCheck {
  id: string;
  label: string;
  description: string;
  pass: boolean;
}

export interface QaResult {
  pass: boolean;
  checks: QaCheck[];
}

export interface RowResult {
  id: string;
  path: string;
  stage: RowStage;
  error?: string;
  editUrl?: string;
  previewUrl?: string;
  liveUrl?: string;
  qa?: QaResult;
}
