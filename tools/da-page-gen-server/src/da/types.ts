export interface DAFile {
  path: string;
  name: string;
  /** Undefined for directories, 'html' / 'json' / etc. for files */
  ext?: string;
}

export interface DASourceResponse {
  source?: { editUrl?: string; contentUrl?: string };
  aem?: { previewUrl?: string; liveUrl?: string };
}

export interface HlxStatusResponse {
  live?: { status: number; url?: string; lastModified?: string };
  preview?: { status: number; url?: string; lastModified?: string };
}

export type PageStatus = 'Published' | 'Previewed' | 'Draft';

export interface DAASField {
  key: string;
  type: 'text' | 'image' | 'longtext';
  value: string;
}

export interface DAASPage {
  path: string;
  templatePath: string | null;
  fields: Record<string, DAASField>;
  status: PageStatus;
}

export interface BulkResult {
  path: string;
  success: boolean;
  error?: string;
}

export interface PublishResult extends BulkResult {
  url?: string;
}
