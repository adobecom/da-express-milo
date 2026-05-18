// _id is a string so it satisfies the string index signature
export type CsvRow = Record<string, string>;

export interface InputSummary {
  total: number;
  duplicates: number;
  missing: number;
}

export type TemplateStatus = 'idle' | 'loading' | 'ready' | 'warning' | 'invalid' | 'error';

export interface TemplateState {
  status: TemplateStatus;
  html: string | null;
  sourcePath: string | null;
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
  | 'error';

export interface QaIssue {
  id: string;
  label: string;
  description: string;
}

export interface QaResult {
  pass: boolean;
  issues: QaIssue[];
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
