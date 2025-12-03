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
 * 
 * Note: CORS errors (401 without CORS headers) throw exceptions but still indicate
 * the resource exists - only 404 means it doesn't exist.
 */
export async function checkPageStatus(path: string): Promise<'Published' | 'Previewed' | 'Draft'> {
  // Convert DA path to web path (remove org/repo prefix, keep from /drafts onwards)
  // /adobecom/da-express-milo/drafts/hackathon/page.html -> /drafts/hackathon/page
  const webPath = path.replace(`/${ORG}/${REPO}`, '').replace(/\.html$/, '')
  
  // Check live first (published)
  try {
    const liveUrl = `${LIVE_BASE}${webPath}`
    const liveResp = await fetch(liveUrl, { method: 'HEAD' })
    // Any response except 404 means the page exists on live
    if (liveResp.status !== 404) {
      return 'Published'
    }
  } catch {
    // CORS error likely means page exists but requires auth = Published
    // (404s typically have CORS headers and don't throw)
    return 'Published'
  }
  
  // Check preview
  try {
    const previewUrl = `${PREVIEW_BASE}${webPath}`
    const previewResp = await fetch(previewUrl, { method: 'HEAD' })
    // Any response except 404 means the page exists on preview
    if (previewResp.status !== 404) {
      return 'Previewed'
    }
  } catch {
    // CORS error likely means page exists but requires auth = Previewed
    return 'Previewed'
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
// Publishing API
// ============================================================================

const ADMIN_API = 'https://admin.hlx.page'

export interface PublishResult {
  path: string
  url: string
  success: boolean
  error?: string
}

/**
 * Publish a single page to live
 * POST https://admin.hlx.page/live/{org}/{repo}/main{webPath}
 * 
 * @param path Full DA path like /adobecom/da-express-milo/drafts/hackathon/discover/p2.html
 * @returns Published URL on success
 */
export async function publishPage(path: string): Promise<PublishResult> {
  const token = getToken()
  
  // Convert DA path to web path (remove org/repo prefix)
  // /adobecom/da-express-milo/drafts/hackathon/page.html -> /drafts/hackathon/page
  const webPath = path.replace(`/${ORG}/${REPO}`, '').replace(/\.html$/, '')
  
  const url = `${ADMIN_API}/live/${ORG}/${REPO}/main${webPath}`
  console.log('📤 Publishing:', url)
  
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'x-auth-token': token || ''
      }
    })
    
    if (!resp.ok) {
      const errorText = await resp.text()
      return {
        path,
        url: '',
        success: false,
        error: `${resp.status} - ${errorText}`
      }
    }
    
    // Published URL format: https://main--da-express-milo--adobecom.aem.live{webPath}
    const publishedUrl = `${LIVE_BASE}${webPath}`
    
    return {
      path,
      url: publishedUrl,
      success: true
    }
  } catch (error) {
    return {
      path,
      url: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Bulk publish multiple pages
 * @param paths Array of DA paths to publish
 * @returns Array of publish results
 */
export async function bulkPublish(paths: string[]): Promise<PublishResult[]> {
  console.log(`📤 Bulk publishing ${paths.length} pages...`)
  
  const results = await Promise.all(
    paths.map(path => publishPage(path))
  )
  
  const succeeded = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  console.log(`✅ Published: ${succeeded}, ❌ Failed: ${failed}`)
  
  return results
}

/**
 * Unpublish a single page from live
 * DELETE https://admin.hlx.page/live/{org}/{repo}/main{webPath}
 * 
 * @param path Full DA path like /adobecom/da-express-milo/drafts/hackathon/discover/p2.html
 * @returns Result indicating success or failure
 */
export async function unpublishPage(path: string): Promise<PublishResult> {
  const token = getToken()
  
  // Convert DA path to web path (remove org/repo prefix)
  const webPath = path.replace(`/${ORG}/${REPO}`, '').replace(/\.html$/, '')
  
  const url = `${ADMIN_API}/live/${ORG}/${REPO}/main${webPath}`
  console.log('🗑️ Unpublishing:', url)
  
  try {
    const resp = await fetch(url, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token || ''
      }
    })
    
    if (!resp.ok) {
      const errorText = await resp.text()
      return {
        path,
        url: webPath,
        success: false,
        error: `${resp.status} - ${errorText}`
      }
    }
    
    return {
      path,
      url: webPath,
      success: true
    }
  } catch (error) {
    return {
      path,
      url: webPath,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Bulk unpublish multiple pages
 * @param paths Array of DA paths to unpublish
 * @returns Array of unpublish results
 */
export async function bulkUnpublish(paths: string[]): Promise<PublishResult[]> {
  console.log(`🗑️ Bulk unpublishing ${paths.length} pages...`)
  
  const results = await Promise.all(
    paths.map(path => unpublishPage(path))
  )
  
  const succeeded = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  console.log(`✅ Unpublished: ${succeeded}, ❌ Failed: ${failed}`)
  
  return results
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
