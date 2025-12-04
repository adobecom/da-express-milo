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

// Edit URL base (for DAAS in-place editing)
export const EDIT_BASE = `https://hackathon--${REPO}--${ORG}.aem.page`

/**
 * Build the edit URL for a DAAS page
 * Opens the template page with query params for same-page preview editing
 * 
 * @param templatePath Full template path like /adobecom/da-express-milo/drafts/hackathon/source-templates/discover-page-v4
 * @param pagePath The page's relative URL path like /discover/p2
 * @returns Full edit URL or null if templatePath is missing
 */
export function buildEditUrl(templatePath: string | null, pagePath: string): string | null {
  if (!templatePath) return null
  
  // Remove org/repo prefix from template path
  // /adobecom/da-express-milo/drafts/hackathon/source-templates/discover-page-v4 
  // -> /drafts/hackathon/source-templates/discover-page-v4
  const cleanTemplatePath = templatePath
    .replace(`/${ORG}/${REPO}`, '')
    .replace(/\.html$/, '')
  
  // Build the full page path (relative to ROOT)
  const fullPagePath = `/drafts/hackathon${pagePath}`
  
  const params = new URLSearchParams({
    env: 'prod',
    samepagepreview: 'true',
    'daas-page-path': fullPagePath
  })
  
  return `${EDIT_BASE}${cleanTemplatePath}?${params.toString()}`
}

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

/**
 * postDoc - Write HTML content to a document
 * POST /source/{org}/{repo}/path.html
 * 
 * @example
 * await postDoc('/adobecom/da-express-milo/drafts/hackathon/page', '<html>...</html>')
 */
export async function postDoc(dest: string, html: string): Promise<void> {
  const token = getToken()
  const headers = { Authorization: `Bearer ${token}` }
  
  const blob = new Blob([html], { type: 'text/html' })
  const body = new FormData()
  body.append('data', blob)
  
  // Ensure .html extension
  const fullpath = `${DA_API}/source${dest}${dest.endsWith('.html') ? '' : '.html'}`
  
  console.log('postDoc:', fullpath)
  const resp = await fetch(fullpath, {
    headers,
    method: 'POST',
    body,
  })
  
  if (!resp.ok) {
    const errorText = await resp.text()
    throw new Error(`postDoc failed: ${resp.status} - ${errorText}`)
  }
  
  console.log('postDoc success:', resp.status)
}

/**
 * Update a DAAS field value in an HTML document
 * Fetches the document, updates the field, and saves it back
 * 
 * @param path Full DA path to the document
 * @param fieldKey The data-daas-key to update
 * @param newValue The new value for the field
 */
export async function updateDAASField(path: string, fieldKey: string, newValue: string): Promise<void> {
  // Fetch current HTML
  const html = await cat(path)
  
  // Parse and update
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  const element = doc.querySelector(`[data-daas-key="${fieldKey}"]`)
  if (!element) {
    throw new Error(`Field "${fieldKey}" not found in document`)
  }
  
  const fieldType = element.getAttribute('data-daas-type') || 'text'
  
  if (fieldType === 'image' && element.tagName === 'IMG') {
    (element as HTMLImageElement).src = newValue
  } else {
    element.textContent = newValue
  }
  
  // Serialize back to HTML
  const updatedHtml = doc.documentElement.outerHTML
  
  // Save - remove .html extension as postDoc adds it
  const destPath = path.replace(/\.html$/, '')
  await postDoc(destPath, updatedHtml)
}

/**
 * Bulk update a field across multiple pages
 * 
 * @param paths Array of DA paths
 * @param fieldKey The data-daas-key to update
 * @param newValue The new value for the field
 */
export async function bulkUpdateField(
  paths: string[], 
  fieldKey: string, 
  newValue: string
): Promise<{ success: number; failed: number }> {
  console.log(`📝 Bulk updating field "${fieldKey}" on ${paths.length} pages...`)
  
  const results = await Promise.all(
    paths.map(async (path) => {
      try {
        await updateDAASField(path, fieldKey, newValue)
        return { success: true }
      } catch (error) {
        console.error(`Failed to update ${path}:`, error)
        return { success: false }
      }
    })
  )
  
  const success = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  console.log(`✅ Updated: ${success}, ❌ Failed: ${failed}`)
  
  return { success, failed }
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
 * AEM Status API Response
 * @see https://www.aem.live/docs/admin.html#tag/status/operation/getStatus
 */
interface StatusResponse {
  live?: {
    status: number
    url?: string
    lastModified?: string
  }
  preview?: {
    status: number
    url?: string
    lastModified?: string
  }
}

/**
 * Check page status using the AEM Admin API
 * Safe read-only operation that returns publish/preview status
 * 
 * @see https://www.aem.live/docs/admin.html#tag/status/operation/getStatus
 */
export async function checkPageStatus(path: string): Promise<'Published' | 'Previewed' | 'Draft'> {
  // Convert DA path to web path
  // /adobecom/da-express-milo/drafts/hackathon/page.html -> /drafts/hackathon/page
  const webPath = path.replace(`/${ORG}/${REPO}`, '').replace(/\.html$/, '')
  
  try {
    const token = getToken()
    const headers = { Authorization: `Bearer ${token}` }
    
    // Use the official AEM Admin API status endpoint
    // Format: /status/{org}/{site}/{ref}/{path}
    const statusUrl = `https://admin.hlx.page/status/${ORG}/${REPO}/main${webPath}`
    
    const response = await fetch(statusUrl, { headers })
    
    if (!response.ok) {
      // 404 or other error means it's a Draft
      return 'Draft'
    }
    
    const data = await response.json() as StatusResponse
    
    // Check if live is published (status 200)
    if (data.live?.status === 200) {
      return 'Published'
    }
    
    // Check if preview exists (status 200)
    if (data.preview?.status === 200) {
      return 'Previewed'
    }
    
    return 'Draft'
  } catch {
    // If API call fails, assume Draft
    return 'Draft'
  }
}

/**
 * Batch check status for multiple pages
 * Returns a map of path -> status
 * Uses the official AEM Admin API (safe read-only operation)
 * 
 * @see https://www.aem.live/docs/admin.html#tag/status/operation/getStatus
 */
export async function batchCheckStatus(paths: string[]): Promise<Map<string, 'Published' | 'Previewed' | 'Draft'>> {
  console.log(`📊 Checking status for ${paths.length} pages using AEM Admin API...`)
  
  const results = await Promise.all(
    paths.map(async (path) => {
      const status = await checkPageStatus(path)
      return [path, status] as const
    })
  )
  
  const statusMap = new Map(results)
  
  const published = Array.from(statusMap.values()).filter(s => s === 'Published').length
  const previewed = Array.from(statusMap.values()).filter(s => s === 'Previewed').length
  const draft = Array.from(statusMap.values()).filter(s => s === 'Draft').length
  
  console.log(`✅ Status check complete: ${published} Published, ${previewed} Previewed, ${draft} Draft`)
  
  return statusMap
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
  templatePath: string | null  // Full path to the template (for edit URLs)
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
  console.log(`📄 Found ${allDocs.length} HTML documents, fetching content...`)
  
  // Fetch all documents (content only, status will be checked on-demand)
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
  
  console.log(`✅ Processed ${results.filter(r => r.content).length} documents`)
  
  // Process all pages: identify DAAS pages and extract metadata (status defaults to Draft)
  interface PendingPage {
    file: DAFile
    displayUrl: string
    templateName: string
    templatePath: string | null
    fields: Record<string, DAASField>
    status: 'Published' | 'Previewed' | 'Draft'
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
        
        // Default status to Draft - will be checked on-demand for visible pages
        pendingPages.push({ file, displayUrl, templateName, templatePath, fields, status: 'Draft' })
      }
    } catch (error) {
      console.warn(`⚠️ Failed to process ${file.path}:`, error)
    }
  }
  
  console.log(`✅ Found ${pendingPages.length} DAAS-generated pages`)
  
  // Build final pages array (status defaulted to Draft, can be refreshed on-demand)
  const pages = pendingPages.map(({ file, displayUrl, templateName, templatePath, fields, status }) => ({
    id: file.path,
    url: displayUrl,
    path: file.path,
    template: templateName,
    templatePath,
    lastUpdate: new Date().toISOString().split('T')[0],
    generated: new Date().toISOString().split('T')[0],
    status,
    fields
  } as DAASPage))
  
  console.log(`💡 Use batchCheckStatus() to check publish status for visible pages`)
  return pages
}
