const DA_API = 'https://admin.da.live';
const DA_CONTENT = 'https://content.da.live';
const AEM_ADMIN_API = 'https://admin.hlx.page';
const STORAGE_KEY = 'daas';

/**
 * Get auth token from storage
 * Checks sessionStorage first (SUSI flow), then localStorage (external auth)
 */
function getToken() {
  // Try sessionStorage first (SUSI flow)
  try {
    const sessionData = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
    if (sessionData.authToken) {
      return sessionData.authToken;
    }
  } catch (e) {
    console.warn('DaaS SDK: Error reading from sessionStorage:', e);
  }

  // Fall back to localStorage (external auth like existing IMS)
  try {
    const localData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (localData.authToken) {
      return localData.authToken;
    }
  } catch (e) {
    console.warn('DaaS SDK: Error reading from localStorage:', e);
  }

  return null;
}

export async function postDoc(dest, html) {
  const token = getToken();
  if (!token) {
    console.error('DaaS: No auth token found for DA SDK');
    return { success: false, error: 'No auth token' };
  }

  const headers = { Authorization: `Bearer ${token}` };
  const blob = new Blob([html], { type: 'text/html' });
  const body = new FormData();
  body.append('data', blob);
  const fullpath = `${DA_API}/source${dest}.html`;
  const opts = {
    headers,
    method: 'POST',
    body,
  };

  try {
    const resp = await fetch(fullpath, opts);
    if (!resp.ok) {
      console.error(`DaaS: DA SDK postDoc failed with status ${resp.status}`);
      return { success: false, error: `HTTP ${resp.status}`, status: resp.status };
    }
    return { success: true, status: resp.status };
  } catch (e) {
    console.error('DaaS: DA SDK postDoc error:', e);
    return { success: false, error: e.message };
  }
}

export async function getDoc(dest) {
  const token = getToken();
  if (!token) {
    console.warn('DaaS: No auth token found for DA SDK');
    return null;
  }

  const headers = { Authorization: `Bearer ${token}` };
  const fullpath = `${DA_API}/source${dest}.html`;
  const opts = { headers };

  try {
    const resp = await fetch(fullpath, opts);
    if (!resp.ok) {
      console.warn(`DaaS: DA SDK getDoc failed with status ${resp.status}`);
      return null;
    }
    return resp.text();
  } catch (e) {
    console.error('DaaS: DA SDK getDoc error:', e);
    return null;
  }
}

/**
 * Get the current branch/ref from the AEM URL
 * URL format: https://{ref}--{repo}--{owner}.aem.{page|live}/...
 */
function getRefFromUrl() {
  const { hostname } = window.location;
  if (!hostname.includes('.aem.')) return 'main';

  const hostParts = hostname.split('.aem.')[0].split('--');
  return hostParts.length >= 1 ? hostParts[0] : 'main';
}

/**
 * Preview a document using the AEM Admin API
 * This triggers AEM to render the page so it's ready for viewing
 *
 * @param {string} dest - DA path like /owner/repo/path/to/page
 * @returns {Promise<{success: boolean, error?: string, status?: number}>}
 */
export async function previewDoc(dest) {
  const token = getToken();
  if (!token) {
    console.error('DaaS: No auth token found for preview');
    return { success: false, error: 'No auth token' };
  }

  // Parse the DA path: /owner/repo/path/to/page
  const pathParts = dest.split('/').filter(Boolean);
  if (pathParts.length < 3) {
    console.error('DaaS: Invalid path for preview:', dest);
    return { success: false, error: 'Invalid path format' };
  }

  const [owner, repo, ...restPath] = pathParts;
  const pagePath = restPath.join('/');
  const ref = getRefFromUrl();

  // Build preview API URL: https://admin.hlx.page/preview/{owner}/{repo}/{ref}/{path}
  const previewUrl = `${AEM_ADMIN_API}/preview/${owner}/${repo}/${ref}/${pagePath}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    'x-content-source-authorization': `Bearer ${token}`,
  };

  try {
    const resp = await fetch(previewUrl, {
      method: 'POST',
      headers,
      body: null,
    });

    if (!resp.ok) {
      console.error(`DaaS: Preview failed with status ${resp.status}`);
      return { success: false, error: `HTTP ${resp.status}`, status: resp.status };
    }

    return { success: true, status: resp.status };
  } catch (e) {
    console.error('DaaS: Preview error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Get the hidden folder path for a document's assets
 * For /owner/repo/path/to/page -> /owner/repo/path/to/.page/
 *
 * @param {string} destPath - The destination path of the document
 * @returns {string} - The hidden folder path
 */
export function getHiddenFolderPath(destPath) {
  const parts = destPath.split('/');
  const pageName = parts.pop();
  return `${parts.join('/')}/.${pageName}`;
}

/**
 * Convert a base64 data URL to a Blob
 * @param {string} dataUrl - The data URL (e.g., "data:image/png;base64,...")
 * @returns {Blob} - The binary blob
 */
function dataUrlToBlob(dataUrl) {
  const [header, base64Data] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

  const byteString = atob(base64Data);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  return new Blob([uint8Array], { type: mimeType });
}

/**
 * Upload an image to DA's hidden folder for a document
 *
 * @param {string} destPath - The destination path of the document
 * @param {string} fileName - The file name for the image
 * @param {string} dataUrl - The base64 data URL of the image
 * @returns {Promise<{success: boolean, contentUrl?: string, error?: string}>}
 */
export async function uploadImage(destPath, fileName, dataUrl) {
  const token = getToken();
  if (!token) {
    console.error('DaaS: No auth token found for image upload');
    return { success: false, error: 'No auth token' };
  }

  const hiddenFolder = getHiddenFolderPath(destPath);
  const encodedFileName = encodeURIComponent(fileName);
  const uploadUrl = `${DA_API}/source${hiddenFolder}/${encodedFileName}`;

  // Convert data URL to blob
  const blob = dataUrlToBlob(dataUrl);

  // Create form data
  const formData = new FormData();
  formData.append('data', blob, fileName);

  try {
    const resp = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!resp.ok) {
      console.error(`DaaS: Image upload failed with status ${resp.status}`);
      return { success: false, error: `HTTP ${resp.status}`, status: resp.status };
    }

    // Generate the content URL for the uploaded image
    const contentUrl = `${DA_CONTENT}${hiddenFolder}/${fileName.toLowerCase().replace(/ /g, '%20')}`;

    return { success: true, contentUrl };
  } catch (e) {
    console.error('DaaS: Image upload error:', e);
    return { success: false, error: e.message };
  }
}
