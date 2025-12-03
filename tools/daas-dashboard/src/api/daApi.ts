/**
 * DA (Document Authoring) API Client
 * Basic filesystem navigation for DA CMS
 */

import { getToken } from '../utils'

export const DA_API = 'https://admin.da.live'
export const ORG = 'adobecom'
export const REPO = 'da-express-milo'
export const ROOT = `/${ORG}/${REPO}/drafts/hackathon`

// Preview and Live URLs for status checking
export const LIVE_BASE = `https://main--${REPO}--${ORG}.aem.live`
export const PREVIEW_BASE = `https://main--${REPO}--${ORG}.aem.page`

// ============================================================================
// Types
// ============================================================================

export interface DAFile {
  path: string
  name: string
  ext?: string
}

// ============================================================================
// Core API Functions
// ============================================================================

/**
 * ls - List files and folders in a directory
 * GET /list/{org}/{repo}/path
 * 
 * @example
 * const files = await ls('/adobecom/da-express-milo/drafts/hackathon')
 * files.forEach(file => {
 *   if (isDir(file)) console.log('Directory:', file.name)
 *   else console.log('File:', file.name, file.ext)
 * })
 */
export async function ls(dir: string): Promise<DAFile[]> {
  const token = getToken()
  const headers = { Authorization: `Bearer ${token}` }
  const url = `${DA_API}/list${dir}`
  
  console.log('ls:', url)
  const resp = await fetch(url, { method: 'GET', headers })
  
  if (!resp.ok) {
    const errorText = await resp.text()
    throw new Error(`ls failed: ${resp.status} - ${errorText}`)
  }
  
  return resp.json()
}

/**
 * cat - Read file content
 * GET /source/{org}/{repo}/path
 * 
 * @example
 * const html = await cat('/adobecom/da-express-milo/drafts/hackathon/page.html')
 * console.log(html)
 */
export async function cat(filePath: string): Promise<string> {
  const token = getToken()
  const headers = { Authorization: `Bearer ${token}` }
  const url = `${DA_API}/source${filePath}`
  
  console.log('cat:', url)
  const resp = await fetch(url, { method: 'GET', headers })
  
  if (!resp.ok) {
    const errorText = await resp.text()
    throw new Error(`cat failed: ${resp.status} - ${errorText}`)
  }
  
  return resp.text()
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a file is a directory (directories have no extension)
 */
export function isDir(file: DAFile): boolean {
  return !file.ext
}

/**
 * Check if a file is an HTML document
 */
export function isDoc(file: DAFile): boolean {
  return file.ext === 'html'
}

/**
 * Get all files recursively from a directory (parallelized)
 * 
 * @example
 * const allFiles = await tree('/adobecom/da-express-milo/drafts/hackathon')
 * console.log('Found', allFiles.length, 'files')
 */
export async function tree(dir: string): Promise<DAFile[]> {
  const allFiles: DAFile[] = []
  let currentLevel = [dir]
  
  // Process directories level by level, parallelizing within each level
  while (currentLevel.length > 0) {
    console.log(`📂 Processing ${currentLevel.length} directories in parallel...`)
    
    // Fetch all directories in current level in parallel
    const results = await Promise.all(
      currentLevel.map(async (currentDir) => {
        try {
          const files = await ls(currentDir)
          return { files, error: null }
        } catch (error) {
          console.error(`Failed to list ${currentDir}:`, error)
          return { files: [] as DAFile[], error }
        }
      })
    )
    
    // Collect files and find next level of directories
    const nextLevel: string[] = []
    for (const { files } of results) {
      allFiles.push(...files)
      const dirs = files.filter(isDir)
      nextLevel.push(...dirs.map(d => d.path))
    }
    
    currentLevel = nextLevel
  }
  
  return allFiles
}

/**
 * Get all HTML documents recursively
 * 
 * @example
 * const docs = await getAllDocs('/adobecom/da-express-milo/drafts/hackathon')
 * console.log('Found', docs.length, 'HTML files')
 */
export async function getAllDocs(dir: string): Promise<DAFile[]> {
  const allFiles = await tree(dir)
  return allFiles.filter(isDoc)
}

export function parseBodyText(bodyText: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(bodyText, 'text/html');
}

export function isGeneratedByDAAS(doc: Document): boolean {
  if (doc?.body?.getAttribute('data-daas-template-path')) return true;
  return false;
}

export function getTemplatePath(doc: Document): string | null {
  return doc?.body?.getAttribute('data-daas-template-path') || null;
}

/**
 * Check if a page is published, previewed, or draft
 * Makes HEAD requests to live and preview URLs
 */
export async function checkPageStatus(path: string): Promise<'Published' | 'Previewed' | 'Draft'> {
  // Convert DA path to web path (remove org/repo prefix, keep from /drafts onwards)
  // /adobecom/da-express-milo/drafts/hackathon/page.html -> /drafts/hackathon/page
  const webPath = path.replace(`/${ORG}/${REPO}`, '').replace(/\.html$/, '')
  
  try {
    // Check live first (published)
    const liveUrl = `${LIVE_BASE}${webPath}`
    const liveResp = await fetch(liveUrl, { method: 'HEAD' })
    if (liveResp.ok) {
      return 'Published'
    }
  } catch {
    // Live check failed, continue to preview
  }
  
  try {
    // Check preview
    const previewUrl = `${PREVIEW_BASE}${webPath}`
    const previewResp = await fetch(previewUrl, { method: 'HEAD' })
    if (previewResp.ok) {
      return 'Previewed'
    }
  } catch {
    // Preview check failed
  }
  
  return 'Draft'
}

/**
 * Extract all DAAS fields from a document
 * Fields are elements with data-daas-key attribute
 */
export interface DAASField {
  key: string
  type: string
  value: string
}

export function extractDAASFields(doc: Document): Record<string, DAASField> {
  const fields: Record<string, DAASField> = {}
  const elements = doc.querySelectorAll('[data-daas-key]')
  
  elements.forEach(el => {
    const key = el.getAttribute('data-daas-key')
    const type = el.getAttribute('data-daas-type') || 'text'
    
    // For images, get the src attribute; for others, get textContent
    let value = ''
    if (type === 'image' && el.tagName === 'IMG') {
      value = (el as HTMLImageElement).src || ''
    } else {
      value = el.textContent?.trim() || ''
    }
    
    if (key) {
      fields[key] = { key, type, value }
    }
  })
  
  return fields
}

// ============================================================================
// DAAS Page Loading
// ============================================================================

export interface DAASPage {
  id: string
  url: string
  path: string
  template: string
  lastUpdate: string
  generated: string
  status: 'Published' | 'Previewed' | 'Draft'
  fields: Record<string, DAASField>
}

/**
 * Load all DAAS-generated pages from the ROOT directory
 * This finds all HTML files and filters to only those with data-daas-template-path
 */
export async function loadDAASPages(): Promise<DAASPage[]> {
  console.log('🔄 Loading DAAS pages from:', ROOT)
  
  const allDocs = await getAllDocs(ROOT)
  console.log(`📄 Found ${allDocs.length} HTML documents, fetching in parallel...`)
  
  // Fetch all documents in parallel
  const results = await Promise.all(
    allDocs.map(async (file) => {
      try {
        const content = await cat(file.path)
        return { file, content, error: null }
      } catch (error) {
        console.warn(`⚠️ Failed to fetch ${file.path}:`, error)
        return { file, content: null, error }
      }
    })
  )
  
  // First pass: identify DAAS pages and extract metadata
  interface PendingPage {
    file: DAFile
    displayUrl: string
    templateName: string
    fields: Record<string, DAASField>
  }
  const pendingPages: PendingPage[] = []
  
  for (const { file, content } of results) {
    if (!content) continue
    
    try {
      const doc = parseBodyText(content)
      
      if (isGeneratedByDAAS(doc)) {
        const templatePath = getTemplatePath(doc)
        const templateName = templatePath 
          ? templatePath.split('/').pop()?.replace('.html', '') || 'unknown'
          : 'unknown'
        
        let displayUrl = file.path.startsWith(ROOT) 
          ? file.path.slice(ROOT.length) 
          : file.path
        displayUrl = displayUrl.replace(/\.html$/, '')
        
        const fields = extractDAASFields(doc)
        
        pendingPages.push({ file, displayUrl, templateName, fields })
        if (templateName === 'discover-page-v4') console.log(content);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to process ${file.path}:`, error)
    }
  }
  
  console.log(`🔍 Checking status for ${pendingPages.length} DAAS pages in parallel...`)
  
  // Second pass: check status for all DAAS pages in parallel
  const pagesWithStatus = await Promise.all(
    pendingPages.map(async ({ file, displayUrl, templateName, fields }) => {
      const status = await checkPageStatus(file.path)
      
      return {
        id: file.path,
        url: displayUrl,
        path: file.path,
        template: templateName,
        lastUpdate: new Date().toISOString().split('T')[0],
        generated: new Date().toISOString().split('T')[0],
        status,
        fields
      } as DAASPage
    })
  )
  
  console.log(`✅ Found ${pagesWithStatus.length} DAAS-generated pages`)
  return pagesWithStatus
}
