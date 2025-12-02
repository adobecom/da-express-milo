import { savePagesData } from './utils'
import initialData from './data/pages-data.json'

/**
 * Helper function to upload the initial pages-data.json to the CMS
 * Run this once to initialize the data file at /drafts/vhargrave/pages-data.json
 */
export async function uploadInitialData() {
  try {
    console.log('Uploading initial data to CMS...')
    const response = await savePagesData(initialData as any)
    
    if (response.ok) {
      console.log('✅ Successfully uploaded initial data to /drafts/vhargrave/pages-data.json')
      return true
    } else {
      console.error('❌ Failed to upload initial data:', response.status, response.statusText)
      return false
    }
  } catch (error) {
    console.error('❌ Error uploading initial data:', error)
    return false
  }
}

// Expose globally for easy console access
if (typeof window !== 'undefined') {
  (window as any).uploadInitialData = uploadInitialData
}

