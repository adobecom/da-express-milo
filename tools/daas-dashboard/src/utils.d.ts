export const DA_API: string;
export const ORG: string;
export const REPO: string;
export const ROOT: string;
export const DATA_PATH: string;

export function getToken(): string | undefined;
export function setToken(token: string): void;

export function isDir(file: any): boolean;
export function isDoc(file: any): boolean;

export function throwFetchErr(res: Response): Promise<never>;

export function ls(dir: string): Promise<any[]>;
export function cat(file: string): Promise<any>;
export function getDocs(dir: string): Promise<Array<{ path: string; text: string }>>;
export function postDoc(dest: string, html: string): Promise<Response>;

export function generateHtmlFromTemplate(templateHtml: string, fieldValues: Record<string, any>): string;

export function loadPagesData(): Promise<{ pages: any[]; fieldValues: Record<string, any> }>;
export function savePagesData(data: { pages: any[]; fieldValues: Record<string, any> }): Promise<Response>;
export function updatePageUrl(pageId: string, newUrl: string): Promise<{ success: boolean; page: any }>;
