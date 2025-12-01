// Type declarations for utils.js

export const DA_API: string;
export const ORG: string;
export const REPO: string;
export const ROOT: string;

export function getToken(): string | undefined;
export function setToken(token: string): void;

interface FileItem {
  path: string;
  ext?: string;
  // Add other file properties as needed
}

export function isDir(file: FileItem): boolean;
export function isDoc(file: FileItem): boolean;

export function throwFetchErr(res: Response): Promise<never>;

export function ls(dir: string): Promise<FileItem[]>;

export function cat(file: string): Promise<string | any>;

export function parseBodyText(bodyText: string): Document;

interface CreateTagOptions {
  parent?: HTMLElement;
}

type HTMLContent = 
  | HTMLElement 
  | SVGElement 
  | DocumentFragment 
  | string 
  | Array<HTMLElement | SVGElement | DocumentFragment>;

export function createTag<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes?: Record<string, string>,
  html?: HTMLContent,
  options?: CreateTagOptions
): HTMLElementTagNameMap[K];

export function block2Table(block: HTMLElement): HTMLTableElement;

interface DocData {
  path: string;
  text: string;
}

export function body2Row(data: DocData): HTMLDivElement;

export function getDocs(dir: string): Promise<DocData[]>;

