/**
 * Test script for DA API
 * Run this to verify the API is working and explore data shapes
 */

import { ls, cat, tree, getAllDocs, isDir, isDoc, ROOT } from './daApi'

export async function testDAApi() {
  console.log('='.repeat(60))
  console.log('🧪 Testing DA API')
  console.log('='.repeat(60))
  console.log('ROOT:', ROOT)
  console.log('')

  try {
    // Test 1: List root directory
    console.log('📁 Test 1: List root directory (ls)')
    console.log('Command: ls(ROOT)')
    const rootFiles = await ls(ROOT)
    console.log(`Found ${rootFiles.length} items in root:`)
    console.log('Raw response shape:')
    console.log(rootFiles)
    console.table(rootFiles.map(f => ({
      name: f.name,
      type: isDir(f) ? 'directory' : 'file',
      ext: f.ext || '-',
      path: f.path
    })))
    console.log('')

    // Test 2: Get all files recursively
    console.log('🌳 Test 2: Get all files recursively (tree)')
    console.log('Command: tree(ROOT)')
    const allFiles = await tree(ROOT)
    console.log(`Found ${allFiles.length} total items:`)
    console.log('Raw response shape (first 5):')
    console.log(allFiles.slice(0, 5))
    
    const dirs = allFiles.filter(isDir)
    const files = allFiles.filter(f => !isDir(f))
    const htmlDocs = allFiles.filter(isDoc)
    
    console.log(`  - Directories: ${dirs.length}`)
    console.log(`  - Files: ${files.length}`)
    console.log(`  - HTML docs: ${htmlDocs.length}`)
    console.log('')
    
    // Show breakdown by extension
    const byExt: Record<string, number> = {}
    files.forEach(f => {
      const ext = f.ext || 'no-ext'
      byExt[ext] = (byExt[ext] || 0) + 1
    })
    console.log('Files by extension:')
    console.table(byExt)
    console.log('')

    // Test 3: Get all HTML documents
    console.log('📄 Test 3: Get all HTML documents (getAllDocs)')
    console.log('Command: getAllDocs(ROOT)')
    const docs = await getAllDocs(ROOT)
    console.log(`Found ${docs.length} HTML documents:`)
    console.log('Raw response shape (first 3):')
    console.log(docs.slice(0, 3))
    docs.slice(0, 10).forEach(doc => {
      console.log(`  - ${doc.path}`)
    })
    if (docs.length > 10) {
      console.log(`  ... and ${docs.length - 10} more`)
    }
    console.log('')

    // Test 4: Read one file
    if (docs.length > 0) {
      console.log('📖 Test 4: Read first document (cat)')
      const firstDoc = docs[0]
      console.log(`Command: cat('${firstDoc.path}')`)
      const content = await cat(firstDoc.path)
      console.log('Raw response shape:')
      console.log(content)
      console.log(`Content length: ${content.length} characters`)
      console.log('First 500 characters:')
      console.log(content.substring(0, 500))
      console.log('...')
      console.log('')
    }

    console.log('='.repeat(60))
    console.log('✅ All tests passed!')
    console.log('='.repeat(60))

    return {
      rootFiles,
      allFiles,
      docs,
      summary: {
        totalItems: allFiles.length,
        directories: dirs.length,
        files: files.length,
        htmlDocs: htmlDocs.length,
        byExtension: byExt
      }
    }
  } catch (error) {
    console.error('='.repeat(60))
    console.error('❌ Test failed!')
    console.error('='.repeat(60))
    console.error('Error:', error)
    console.error('')
    throw error
  }
}

