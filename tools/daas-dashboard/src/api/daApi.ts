/**
 * DA (Document Authoring) API Client
 * Basic filesystem navigation for DA CMS
 */

import { getToken } from '../utils'

export const DA_API = 'https://admin.da.live'
export const ORG = 'adobecom'
export const REPO = 'da-express-milo'
export const ROOT = `/${ORG}/${REPO}/drafts/hackathon`

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
 * Get all files recursively from a directory
 * 
 * @example
 * const allFiles = await tree('/adobecom/da-express-milo/drafts/hackathon')
 * console.log('Found', allFiles.length, 'files')
 */
export async function tree(dir: string): Promise<DAFile[]> {
  const allFiles: DAFile[] = []
  const queue = [dir]
  
  while (queue.length > 0) {
    const currentDir = queue.shift()!
    
    try {
      const files = await ls(currentDir)
      allFiles.push(...files)
      
      // Add subdirectories to queue
      const dirs = files.filter(isDir)
      queue.push(...dirs.map(d => d.path))
    } catch (error) {
      console.error(`Failed to list ${currentDir}:`, error)
    }
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
